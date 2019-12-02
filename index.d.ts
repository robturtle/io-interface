import * as t from 'io-ts';
import { runtime } from 'ts-transformer-interface';
import { ICaster } from 'ts-transformer-decoder-cast';
/** @since 1.0.0 */
export { runtime } from 'ts-transformer-interface';
/** @since 1.0.0 */
export declare function schema<T extends object>(): runtime.Schema;
/** @since 1.0.0 */
export interface Caster<T = any> extends t.Type<T> {}
/** @since 1.0.0 */
export interface Casters {
  [type: string]: Caster;
}
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
export declare const ATTRS_KEYWORD = 'attrs';
/** @since 1.0.0 */
export declare class Decoder implements ICaster {
  /** @since 1.0.0 */
  readonly casters: Casters;
  private todos;
  private resolves;
  private withAttributes;
  /** @since 1.3.0 */
  constructor(schemas?: runtime.Schema[], casters?: Casters);
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
