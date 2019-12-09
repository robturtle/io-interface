import { Either, isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { runtime } from 'ts-transformer-interface';
import { ICaster } from 'ts-transformer-decoder-cast';

/** @since 1.0.0 */
export { runtime } from 'ts-transformer-interface';

/** @since 1.0.0 */
export function schema<T extends object>(): runtime.Schema {
  throw new Error(
    `tsc did not expand this macro! Ensure you setup tsconfig plugins section correctly!`,
  );
}

/** @since 1.0.0 */
export interface Caster<T = any> extends t.Type<T> {}

/** @since 1.0.0 */
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

/**
 * Use this to attach additional values to the interface
 * other than the original source.
 *
 * You should mark all fields inside attrs as optional since
 * they are not defined from the data source.
 *
 * The Decoder will think it as "any" and assign an empty
 * object to it.
 * @since 1.5.0
 * @example
 * interface User {
 *   name: string;
 *   attrs: {
 *     marker?: google.maps.Marker
 *   }
 * }
 */
export const ATTRS_KEYWORD = 'attrs';

/** @since 1.6.0 */
export interface Builder {
  schema: runtime.Schema;
  constructor: new (...args: any[]) => any;
  className: string;
}

/**
 * Extends type T with mixin U.
 * @since 1.6.0
 * @example
 * interface IUser {
 *   firstName: string;
 *   lastName: string;
 * }
 *
 * const User = extend<IUser>()({
 *   get fullName(): string {
 *     return `${this.firstName} ${this.lastName}`;
 *   }
 * });
 *
 * type User = InstanceType<typeof User>;
 */
export function extend<T extends object>() {
  return <U>(mixin: (self: T) => U) => {
    const impl = class {
      constructor(data: T) {
        Object.assign(this, data, mixin(data));
      }
    };
    return (impl as any) as new (data: T) => T & U;
  };
}

function isBuilder(o: any): o is Builder {
  return ['schema', 'className', 'constructor'].every(k => k in o);
}

/** @since 1.0.0 */
export class Decoder implements ICaster {
  /** @since 1.0.0 */
  readonly casters: Casters = {};

  /** @since 1.7.0*/
  readonly factories: { [name: string]: (caster: Caster) => Caster } = {
    Array: t.array,
  };

  /** @since 1.6.0 */
  readonly constructors: { [clazz: string]: Builder } = {};

  private todos: { [name: string]: boolean } = {};
  private resolves: { [name: string]: boolean } = {};
  private withAttributes: { [name: string]: boolean } = {};

  /** @since 1.6.0 */
  constructor(schemas: Array<runtime.Schema | Builder> = [], casters: Casters = {}) {
    Object.assign(this.casters, casters);
    schemas.forEach(s => {
      if (isBuilder(s)) {
        this.todos[s.schema.name] = true;
        this.todos[s.className] = true;
      } else {
        this.todos[s.name] = true;
      }
    });
    schemas.forEach(s => this.register(s));
  }

  /** @since 1.1.0 */
  decode<T>(typeName: string, data: unknown, onError?: (errors: string[]) => void): T | undefined {
    return this.processResult(this.getCaster<T>(typeName), typeName, data, onError);
  }

  /** @since 1.7.0 */
  decodeF<T>(
    factoryName: string,
    typeName: string,
    data: unknown,
    onError?: (errors: string[]) => void,
  ): T | undefined {
    const factory = this.factories[factoryName];
    if (!factory) {
      throw new Error(`factory '${factoryName}' not registered`);
    }
    const caster = factory(this.getCaster(typeName));
    return this.processResult(caster, typeName, data, onError);
  }

  /** @since 1.1.0 */
  decodeArray<T>(
    typeName: string,
    data: unknown,
    onError?: (errors: string[]) => void,
  ): T[] | undefined {
    return this.decodeF<T[]>('Array', typeName, data, onError);
  }

  private processResult<T>(
    caster: Caster<T>,
    typeName: string,
    data: unknown,
    onError?: (errors: string[]) => void,
  ): T | undefined {
    const result = caster.decode(data);
    if (isRight(result)) {
      const encoded = caster.encode(result.right);
      if (typeName in this.withAttributes) {
        (encoded as any).attrs = {};
      }
      return encoded;
    } else if (onError) {
      onError(this.errors(result));
    }
  }

  /** @since 1.6.0 */
  register(spec: runtime.Schema | Builder) {
    if (isBuilder(spec)) {
      this.registerBuilder(spec);
    } else {
      this.registerSchema(spec);
    }
  }

  private registerSchema(spec: runtime.Schema) {
    const name = spec.name;
    if (name in this.resolves) {
      throw new Error(`type '${name}' already registered`);
    }
    this.resolves[name] = false;
    this.casters[name] = this.buildCaster(spec.props, name);
    this.resolves[name] = true;
  }

  private buildCaster(props: runtime.Property[], name?: string): Caster {
    if (name && props.some(p => p.name === ATTRS_KEYWORD)) {
      this.withAttributes[name] = true;
    }
    const required = props.filter(p => !p.optional);
    const optional = props.filter(p => p.optional);
    if (required.length > 0 && optional.length > 0) {
      return t.intersection(
        [
          t.type(this.buildCasters(required, name), '[required]'),
          t.partial(this.buildCasters(optional, name), '[optional]'),
        ],
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

  private registerBuilder(spec: Builder) {
    this.registerSchema(spec.schema);
    const name = spec.className;
    if (name in this.resolves) {
      throw new Error(`type '${name}' already registered`);
    }
    this.resolves[name] = false;
    this.casters[name] = this.buildConstructor(spec);
    this.resolves[name] = true;
  }

  private buildConstructor(spec: Builder) {
    const schemaCaster = this.getCaster(spec.schema.name);
    const constructor = spec.constructor;
    return schemaCaster.pipe(
      new t.Type(
        spec.className,
        (input: unknown): input is InstanceType<typeof constructor> => schemaCaster.is(input),
        (input, context) => schemaCaster.validate(input, context),
        (input: unknown) => new constructor(input),
      ),
    );
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
      if (p.name === ATTRS_KEYWORD) {
        return t.undefined;
      }
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

  private errors(result: Either<t.Errors, any>): string[] {
    return PathReporter.report(result);
  }
}
