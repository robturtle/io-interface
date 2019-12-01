import { Either } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { runtime } from 'ts-transformer-interface';
export { runtime } from 'ts-transformer-interface';
export declare function schema<T extends object>(): runtime.Schema;
export interface Caster<T = any> extends t.Type<T> {}
export interface Casters {
  [type: string]: Caster;
}
export declare class Decoder {
  readonly casters: Casters;
  private todos;
  private resolves;
  constructor(schemas?: runtime.Schema[]);
  static errors(result: Either<t.Errors, any>): string[];
  decode<T>(typeName: string, data: unknown): Either<t.Errors, T>;
  decodeArray<T>(typeName: string, data: unknown): Either<t.Errors, T[]>;
  registerSchema(spec: runtime.Schema): void;
  private buildCaster;
  private checkRegistry;
  private getCaster;
  private getArrayCaster;
  private buildCasters;
  private buildTypeCaster;
}
