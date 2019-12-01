import { Either } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { runtime } from 'ts-transformer-interface';
export { runtime } from 'ts-transformer-interface';
/** @since 1.0.0 */
export declare function schema<T extends object>(): runtime.Schema;
/** @since 1.0.0 */
export interface Caster<T = any> extends t.Type<T> {}
/** @since 1.0.0 */
export interface Casters {
  [type: string]: Caster;
}
/** @since 1.0.0 */
export declare class Decoder {
  /** @since 1.0.0 */
  readonly casters: Casters;
  private todos;
  private resolves;
  constructor(schemas?: runtime.Schema[]);
  /** @since 1.0.0 */
  static errors(result: Either<t.Errors, any>): string[];
  /** @since 1.0.0 */
  decode<T>(typeName: string, data: unknown): Either<t.Errors, T>;
  /** @since 1.0.0 */
  decodeArray<T>(typeName: string, data: unknown): Either<t.Errors, T[]>;
  /** @since 1.0.0 */
  registerSchema(spec: runtime.Schema): void;
  private buildCaster;
  private checkRegistry;
  private getCaster;
  private getArrayCaster;
  private buildCasters;
  private buildTypeCaster;
}
