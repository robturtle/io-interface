## 1.4.0

- export test compiler

## 1.3.0

- add `classCasters` to constructor

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
