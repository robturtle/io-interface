import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';

/** @since 1.4.0 */
export { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';

export interface LatitudeB {
  readonly Latitude: unique symbol;
}
/** @since 1.4.0 */
export type Latitude = number & t.Brand<LatitudeB>;
export const Latitude = t.brand(
  t.number,
  (n): n is number & t.Brand<LatitudeB> => n >= -90 && n <= 90,
  'Latitude',
);

export interface LongitudeB {
  readonly Longitude: unique symbol;
}
/** @since 1.4.0 */
export type Longitude = number & t.Brand<LongitudeB>;
export const Longitude = t.brand(
  t.number,
  (n): n is number & t.Brand<LongitudeB> => n >= -180 && n <= 180,
  'Longitude',
);

/** @since 1.4.0 */
export const casters = {
  Date: DateFromISOString,
  Latitude: Latitude,
  Longitude: Longitude,
  NonEmptyString: NonEmptyString,
};
