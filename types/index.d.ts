import * as t from 'io-ts';
/** @since 1.4.0 */
export { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
export interface LatitudeB {
  readonly Latitude: unique symbol;
}
/** @since 1.4.0 */
export declare type Latitude = number & t.Brand<LatitudeB>;
export declare const Latitude: t.BrandC<t.NumberC, LatitudeB>;
export interface LongitudeB {
  readonly Longitude: unique symbol;
}
/** @since 1.4.0 */
export declare type Longitude = number & t.Brand<LongitudeB>;
export declare const Longitude: t.BrandC<t.NumberC, LongitudeB>;
/** @since 1.4.0 */
export declare const casters: {
  Date: import('io-ts-types/lib/DateFromISOString').DateFromISOStringC;
  Latitude: t.BrandC<t.NumberC, LatitudeB>;
  Longitude: t.BrandC<t.NumberC, LongitudeB>;
  NonEmptyString: import('io-ts-types/lib/NonEmptyString').NonEmptyStringC;
};
