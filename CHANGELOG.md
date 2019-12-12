## 1.10.2

- deprecates `attrs`
- no longer deprecating `decodeArray` due to usage frequency

## 1.10.0

- new way to extend type to a class: `Model`
- deprecates the old way `extend`

## 1.9.0

- supports `enumSchema`
- supports registering with `CasterBuilder`
- renames `Builder` to `ClassBuilder`

## 1.8.0

- supports union types
- supports null type

So we can express the type `string | null`

## 1.7.3

- export `Int` branded type

## 1.7.0

- supports `GenericType`
- deprecates `decodeArray`
- unifies to single API `decode(type: string | GenericType, ...)`

## 1.6.0

- supports `Builder` to convert the outcome with a constructor

## 1.5.0

- supports `attrs` mount point for custom values

## 1.4.0

- export test compiler
- integrate common types
  - Date
  - Latitude
  - Longitude
  - NonEmptyString

## 1.3.0

- add `casters` to constructor

## 1.2.0

- integrate with `requestAndCast<T>(args)` macro

## 1.1.0

- decode() decodeArray() now return `T | undefined` and accepts optional `ErrorHandler`

## 1.0.0

- build io-ts codec solution from runtime.Schema, i.e. metadata of (subset of) native TypeScript interface
- supports
  - primitive types (number, string, boolean)
  - interfaces & classes
  - literal types
  - array types
  - optional fields
- NOT supporting
  - generic types (not sure if we really need this)
  - union types (for JSON schema is better to not have that flexibility)
