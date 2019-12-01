# io-interface

`io-interface` auto generates runtime validation solutions from TypeScript native interfaces. It's main purpose is to validate JSON data from a web API but you can use it to validate any external data.

```typescript
// src/app/models/user.ts
// Step 1. define an interface
export interface User {
  name: string;
  title?: string;
  age: number;
  recentOrders: Order[];
}

// src/app/services/decoder.service.ts
// Step 2. add `schema<User>()` to the manifest to register
import { schema, Decoder } from 'io-interface';

const schemas = [
  //...
  schema<User>(),
];

export const decoder = new Decoder(schemas);

// src/app/users/user.service.ts
// Step 3. use `decode()` and `decodeArray()` to do the validation/conversion.
class UserService {
  async getUser(id): User | undefined {
    const json = await fetch('GET', `/users/${id}`);
    return decoder.decode<User>('User', json, console.error);
  }

  async getUsers(): User[] | undefined {
    const json = await fetch('GET', '/users');
    return decoder.decodeArray<User>('User', json, console.error);
  }
}
```

## Motivation

Validating data coming from an external system is always good. Image you found a powerful runtime validation library [io-ts](https://github.com/gcanti/io-ts) and want to adopt it to your project, but the concern is all the team members have to learn this new library and understand how it works. This would slow down the developing pace. And in many cases we don't want this slowdown.

So here comes the encapsulation. The goal is the rest of the team need to learn nearly nothing to use this facility and the minimum code changes are required to adopt it. For other developers they can still simply use a native TypeScript interface to represent the data model from web API. And use one-liner to auto-generate the validation solution.

You can check out [this Angular repo](https://github.com/robturtle/io-interface-demo) as a demo project.

## Limitations

Since its main purpose is for JSON validation, only a subset of interface syntax is supported here. The fields of an interface must of type:

1. Primitive types: `number`, `string`, `boolean`
2. Other acceptable interfaces
3. Classes
4. Literal types (i.e. `interface Address { pos: { lat: number; lng: number; } }`, here `Address.pos` is a literal type)
5. Array type of 1-4

Also

1. The fields in the interface can be marked optional
2. Generic types are NOT supported
3. Union types are NOT supported (Thinking this as an approach to enforce the certainty of an API)
4. `null`, `any`, `unknown` are illegal.

### You need declare schemas in topological order

Right now there's no depedency resolver implemented. So for example you have these interfaces:

```typescript
interface LatLng {
  lat: number;
  lng: number;
}

interface Order {
  price: number;
  pos: LatLng;
}
```

You must declare `LatLng`'s schema before `Order`:

```typescript
const schemas = [
  //...
  schema<LatLng>(), // MUST come first
  schema<Order>(),
];
```

But don't worry to much about this, if you declare them in a wrong order, you will receive a error from the library.

### Assign decoders to classes

It's very often we're passing `Date` in JSON, and `Date` is a class instead of an interface in TypeScript.

```typescript
interface Order {
  date: Date;
}
```

We have to manually create a decoder for a class. Luckly the decoder for `Date` is already implemented in [io-ts-types](https://gcanti.github.io/io-ts-types/modules/DateFromISOString.ts.html). What we need to do is to provide it as classDecoders as the second constructor argument:

```typescript
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

const decoder = new Decoder([shema<Order>()], {
  Date: DateFromISOString,
});
```

It's equivalent to:

```typescript
const decoder = new Decoder();
decoder.casters.Date = DateFromISOString;
decoder.registerSchema(schema<Order>());
```

## Installation

### Setup ts-patch

1. `npm install -D ts-patch`

2. add "postinstall" script to `package.json` to auto-patch the compiler after `npm install`

   ```json
   {
     "scripts": {
       "postinstall": "ts-patch install"
     }
   }
   ```

3. `npm install -D io-interface`

4. add transformer to `tsconfig.json`

   ```json
   {
     "compilerOptions": {
       "plugins": [{ "transform": "io-interface/transform-interface" }]
     }
   }
   ```

To verify the setup, try compile this file.

```typescript
import { schema } from 'io-interface';

interface Order {
  price: number;
  date: Date;
  note?: string;
  pricelines: number[];
}
const OrderSchema = schema<Order>();
console.log(OrderSchema);
```

You should see the console message like this:

![image](https://user-images.githubusercontent.com/3524125/69911372-66148400-13cf-11ea-84f7-b9a7c84f79ee.png)

### [Angular] A DecoderService

The example code is as follows.

```typescript
import { Injectable } from '@angular/core';
import { Decoder, schema } from 'io-interface';
import { BadTodo } from '../models/bad-todo';
import { Todo } from '../models/todo';

@Injectable({
  providedIn: 'root',
})
export class DecoderService {
  readonly schemas = [schema<Todo>(), schema<BadTodo>()];

  readonly dec = new Decoder(this.schemas);

  decode<T>(typeName: string, data: unknown): T | undefined {
    return this.dec.decode<T>(typeName, data, console.error);
  }

  decodeArray<T>(typeName: string, data: unknown): T[] | undefined {
    return this.dec.decodeArray<T>(typeName, data, console.error);
  }
}
```

Just replace `console.error` with a real error handler in your project.

## Daily usage

### 1. define an interface

```typescript
// src/app/models/todo.ts
export interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
```

### 2. register the type to DecoderService's schemas

```typescript
// src/app/services/decoder.service.ts
readonly schemas = [schema<Todo>()];
```

### 3. Use DecoderService to convert the data

```typescript
// src/app/services/todo.service.ts
  getTodo(): Observable<Todo> {
    return this.http.get('https://jsonplaceholder.typicode.com/todos/1').pipe(
      map(json => this.dec.decode<Todo>('Todo', json)),
      filter(todo => !!todo),
    );
  }
```

## Can we do better?

As you can see from the signature `decode<Todo>('Todo', json)`, `Todo` repeats twice. But for native TypeScript this is needed because the type parameter is for static environment and method parameter is for runtime environment. I don't find a very good solution here but I created a [specific TypeScript transformer](https://www.npmjs.com/package/ts-transformer-decoder-cast) to expand a macro such as `decode<Todo>(json)` to `decode<Todo>('Todo', json)`. Since TypeScript will never populate the interface information to runtime so I guess this would be the easiest way to reduce the duplication.

Because I didn't find any decent macro system for TypeScript so this macro implementation is very specific and not configurable. It replaces:

```typescript
requestAndCast<User>(...args);
```

To:

```typescript
request(...args, (decoder, data, onError) => decoder.decode('User', data, onError));
```

So if you want use this ensure you declares such methods.

### Installation

To enable this, install `transform-request` to tsconfig plugins:

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "io-interface/transform-interface" },
      { "transform": "io-interface/transform-request" } // <--- add this
    ]
  }
}
```

And here's an example implementation.

```typescript
type DecoderCallback<T> = (
  c: Decoder,
  data: unknown,
  onError: (e: string[]) => void,
) => T | undefined;

class ApiService {
  // use it in your codebase
  requestAndCast<T>(options: ApiOptions): T {
    throw new Error(`macro failed to expand, 
    check your tsconfig and ensure "io-interface/transform-request" is enabled`);
  }

  // do not call it directly, transformer will call it
  request<T>(
    options: ApiOptions,
    cb: (c: Decoder, data: unknown, e?: DecoderCallback<T>) => T | undefined,
  ) {
    // do the real work here
  }
}
```

## Error handling

![image](https://user-images.githubusercontent.com/3524125/69911276-eb973480-13cd-11ea-89a2-31692ba81702.png)
