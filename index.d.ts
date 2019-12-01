import * as t from 'io-ts';
import { runtime } from 'ts-transformer-interface';
/** @since 1.0.0 */
export { runtime } from 'ts-transformer-interface';
/** @since 1.0.2 */
export { isRight } from 'fp-ts/lib/Either';
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
  /** @since 1.1.0 */
  decode<T>(typeName: string, data: unknown, onError?: (errors: string[]) => void): T | undefined;
  /** @since 1.1.0 */
  decodeArray<T>(
    typeName: string,
    data: unknown,
    onError?: (errors: string[]) => void,
  ): T[] | undefined;
  private processResult;
  /** @since 1.0.0 */
  registerSchema(spec: runtime.Schema): void;
  private buildCaster;
  private checkRegistry;
  private getCaster;
  private getArrayCaster;
  private buildCasters;
  private buildTypeCaster;
  private errors;
}
