import { Either } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { runtime } from 'ts-transformer-interface';

export { runtime } from 'ts-transformer-interface';

export function schema<T extends object>(): runtime.Schema {
  throw new Error(
    `tsc did not expand this macro! Ensure you setup tsconfig plugins section correctly!`,
  );
}

export interface Caster<T = any> extends t.Type<T> {}

export interface Casters {
  [type: string]: Caster;
}

const TypeC: t.Type<runtime.Type> = t.recursion('TypeC', () =>
  t.union([
    t.null,
    t.string,
    ReferenceTypeC,
    ArrayTypeC,
    ParameterizedTypeC,
    GenericTypeC,
    LiteralTypeC,
  ]),
);

const ReferenceTypeC: t.Type<runtime.ReferenceType> = t.type({
  referenceName: t.string,
});

const ArrayTypeC: t.Type<runtime.ArrayType> = t.type({
  arrayElementType: TypeC,
});

const GenericTypeC: t.Type<runtime.GenericType> = t.type({
  genericParameterName: t.string,
  genericParameterType: TypeC,
});

const ParameterizedTypeC: t.Type<runtime.ParameterizedType> = t.type({
  selfType: t.string,
  typeArgumentType: TypeC,
});

const PropertyC: t.Type<runtime.Property> = t.type({
  name: t.string,
  type: TypeC,
  optional: t.boolean,
});

const LiteralTypeC: t.Type<runtime.LiteralType> = t.type({
  props: t.array(PropertyC),
});

export class Decoder {
  readonly casters: Casters = {};

  private todos: { [name: string]: boolean } = {};
  private resolves: { [name: string]: boolean } = {};

  constructor(schemas: runtime.Schema[] = []) {
    schemas.forEach(s => (this.todos[s.name] = true));
    schemas.forEach(s => this.registerSchema(s));
  }

  static errors(result: Either<t.Errors, any>): string[] {
    return PathReporter.report(result);
  }

  decode<T>(typeName: string, data: unknown): Either<t.Errors, T> {
    return this.getCaster<T>(typeName).decode(data);
  }

  decodeArray<T>(typeName: string, data: unknown): Either<t.Errors, T[]> {
    return this.getArrayCaster<T>(typeName).decode(data);
  }

  registerSchema(spec: runtime.Schema) {
    const name = spec.name;
    if (name in this.resolves) {
      throw new Error(`type '${name}' already registered`);
    }
    this.resolves[name] = false;
    this.casters[name] = this.buildCaster(spec.props, name);
    this.resolves[name] = true;
  }

  private buildCaster(props: runtime.Property[], name?: string): Caster {
    const required = props.filter(p => !p.optional);
    const optional = props.filter(p => p.optional);
    if (required.length > 0 && optional.length > 0) {
      return t.intersection(
        [t.type(this.buildCasters(required, name)), t.partial(this.buildCasters(optional, name))],
        name,
      );
    } else if (required.length > 0) {
      return t.type(this.buildCasters(required, name), name);
    } else if (optional.length > 0) {
      return t.partial(this.buildCasters(optional, name), name);
    } else {
      throw new Error(`type '${name || '<LITERAL>'}' is an empty interface which is not supported`);
    }
  }

  private checkRegistry(typeName: string) {
    if (!(typeName in this.casters)) {
      if (this.resolves[typeName] === false) {
        throw new Error(`recursive definition not supported`);
      } else if (this.todos[typeName]) {
        throw new Error(
          `depends on ${typeName} but it's not registered yet. (try to move '${typeName}' before this type)`,
        );
      } else {
        throw new Error(`decoder for '${typeName}' not registered`);
      }
    }
  }

  private getCaster<T>(typeName: string): Caster<T> {
    this.checkRegistry(typeName);
    return this.casters[typeName];
  }

  private getArrayCaster<T>(typeName: string): Caster<T[]> {
    this.checkRegistry(typeName);
    return t.array(this.casters[typeName]);
  }

  private buildCasters(props: runtime.Property[], name?: string): Casters {
    const casters: Casters = {};
    props.forEach(p => {
      let caster;
      try {
        caster = this.buildTypeCaster(p.type);
      } catch (e) {
        throw new Error(`${name || '<LITERAL>'}.${p.name}: ${e.message}`);
      }
      casters[p.name] = caster;
    });
    return casters;
  }

  private buildTypeCaster(type: runtime.Type): Caster {
    if (ArrayTypeC.is(type)) {
      return t.array(this.buildTypeCaster(type.arrayElementType));
    }
    if (ReferenceTypeC.is(type)) {
      return this.getCaster(type.referenceName);
    }
    if (LiteralTypeC.is(type)) {
      return t.type(this.buildCasters(type.props));
    }
    switch (type) {
      case 'string':
        return t.string;
      case 'number':
        return t.number;
      case 'boolean':
        return t.boolean;
      default:
        throw new Error(`illegal decoder type ${JSON.stringify(type)}`);
    }
  }
}
