import { Either } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { runtime } from 'ts-transformer-interface';
export interface Caster<T = any> extends t.Type<T> {}
export interface Casters {
  [type: string]: Caster;
}
export declare class Decoder {
  readonly casters: Casters;
  readonly arrayCasters: Casters;
  constructor(schemas: runtime.Schema[]);
  decode<T>(typeName: string, data: unknown): Either<t.Errors, T>;
  decodeArray<T>(typeName: string, data: unknown): Either<t.Errors, T[]>;
  registerSchema(spec: runtime.Schema): void;
  private getCaster;
  private getArrayCaster;
  private buildCasters;
  private buildTypeCaster;
}
