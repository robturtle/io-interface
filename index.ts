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
  t.union([t.null, t.string, ReferenceTypeC, ArrayTypeC, ParameterizedTypeC, GenericTypeC]),
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

export class Decoder {
  readonly casters: Casters = {};

  constructor(schemas: runtime.Schema[] = []) {
    schemas.forEach(s => this.registerSchema(s));
  }

  static errors(result: Either<t.Errors, any>): string[] {
    return PathReporter.report(result);
  }

  modelNames(): string[] {
    return Object.keys(this.casters);
  }

  decode<T>(typeName: string, data: unknown): Either<t.Errors, T> {
    return this.getCaster<T>(typeName).decode(data);
  }

  decodeArray<T>(typeName: string, data: unknown): Either<t.Errors, T[]> {
    return this.getArrayCaster<T>(typeName).decode(data);
  }

  registerSchema(spec: runtime.Schema) {
    const name = spec.name;
    const required = spec.props.filter(p => !p.optional);
    const optional = spec.props.filter(p => p.optional);
    if (required.length > 0 && optional.length > 0) {
      this.casters[name] = t.intersection(
        [t.type(this.buildCasters(name, required)), t.partial(this.buildCasters(name, optional))],
        name,
      );
    } else if (required.length > 0) {
      this.casters[name] = t.type(this.buildCasters(name, required), name);
    } else {
      this.casters[name] = t.partial(this.buildCasters(name, optional), name);
    }
  }

  private getCaster<T>(typeName: string): Caster<T> {
    if (!(typeName in this.casters)) {
      throw new Error(`decoder for '${typeName}' not registered`);
    }
    return this.casters[typeName];
  }

  private getArrayCaster<T>(typeName: string): Caster<T[]> {
    if (!(typeName in this.casters)) {
      throw new Error(`decoder for '${typeName}[]' not registered`);
    }
    return t.array(this.casters[typeName]);
  }

  private buildCasters(name: string, props: runtime.Property[]): Casters {
    const casters: Casters = {};
    props.forEach(p => {
      let caster;
      try {
        caster = this.buildTypeCaster(p.type);
      } catch (e) {
        throw new Error(`${name}.${p.name}: ${e.message}`);
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
    switch (type) {
      case 'string':
        return t.string;
      case 'number':
        return t.number;
      case 'boolean':
        return t.boolean;
      default:
        throw new Error(`illegal decoder type '${JSON.stringify(type)}'`);
    }
  }
}
