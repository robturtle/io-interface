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