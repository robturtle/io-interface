<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/io-interface" title="View this project on NPM"><img src="https://img.shields.io/npm/v/io-interface.svg" alt="NPM version" /></a></span>

<!-- /BADGES -->

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
const user: User | undefined = decoder.decode<User>('User', json, console.error);
const users: User[] | undefined = decoder.decodeArray<User>('User', json, console.error);
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
5. Union types
6. `null` type
7. Array type of 1-5

Also

1. The fields in the interface CAN be marked as optional.
2. `any`, `unknown` are illegal.
3. Recursive types are NOT supported.
4. Intersection types are NOT supported YET.
5. Generic types supporting are experimental and for now you need to manually create factory method for it.

### You need declare schemas in topological order

Right now there's no dependency resolver implemented. So for example you have these interfaces:

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

But don't worry too much about this, if you declare them in a wrong order, you will receive a error from the library.

### Assign casters to classes

It's very often we're passing `Date` in JSON, and `Date` is a class instead of an interface in TypeScript.

```typescript
interface Order {
  date: Date;
}
```

We have to manually create a caster for a class. Luckily the decoder for `Date` is already implemented in [io-ts-types](https://gcanti.github.io/io-ts-types/modules/DateFromISOString.ts.html). What we need to do is to just incluce into the 2nd argument.

```typescript
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

const decoder = new Decoder([schema<Order>()], {
  Date: DateFromISOString,
});
```

It's equivalent to:

```typescript
const decoder = new Decoder();
decoder.casters.Date = DateFromISOString;
decoder.register(schema<Order>());
```

### Builtin types

In [types.ts](types.ts) you can found some common types and its casters:

```typescript
/** @since 1.7.3 */
export const casters = {
  Date: DateFromISOString,
  Int: t.Int,
  Latitude: Latitude,
  Longitude: Longitude,
  NonEmptyString: NonEmptyString,
};
```

### Enum types

You can easily register an enum using `enumSchema`

```typescript
import { enumSchema } from 'io-interface';

enum Status {
  Pending = 'pending',
  Complete = 'complete',
}

decoder.register(enumSchema('Status', Status));
const status = decoder.decode<Status>('Status', 'pending');
```

### Attach custom values

Sometimes you want attach some custom values onto the object. You can do it via the magical attribute `attrs`. If a field of the interface is named `attrs`, it will bypass the validation and be assigned as an empty object. So you should declare all fields inside `attrs` as **optional** since they're empty from the data source in the first place.

```typescript
interface Compound {
  lat: number;
  lng: number;
  attrs: {
    // it will be an empty object after decoding
    marker?: google.maps.Marker; // mark it as optional
  };
}

// ...
api.requestAndCast<Compound>(url).subscribe(compound => {
  // here: compound.attrs === {}
});

// ...

// after some biz logic ...
compound.attrs.marker = new google.maps.Marker();
// ...
```

So we have clear vision that which of the fields are from the data source and which of them are added later on.

But please do **NOT** use this feature to do name mapping like:

```typescript
// do NOT do this!!!
interface Order {
  user_uid: string;
  attrs: {
    userUid: string;
  };
}
```

This feature is only used to attach new values. Tasks like name mapping should live inside a middleware. And feature request for this is welcomed (but without guarantee that it will be implemented soon).

### Extending the interface

The Decoder can convert the outcome to an instance if you register with a `Builder` object:

```typescript
decoder.register({
  schema: schema<IGuest>(),
  constructor: Guest,
  className: 'Guest',
});

const guest = decoder.decode<Guest>('Guest', data);

// the above line is equivalent to
const iGuest = decoder.decode<IGuest>('IGuest', data);
const guest = new Guest(iGuest);
```

You may subclass `Model<T>` to extend the interface:

```typescript
import { extend } from 'io-interface';

interface IUser {
  firstName: string;
  lastName: string;
}

interface User extends IUser {}
class User {
  get name(): string {
    return `${user.firstName} ${user.lastName}`;
  },
}

decoder.register({
  schema: schema<IUser>(),
  constructor: User,
  className: 'User',
});

const user = decoder.decode<User>('User', { firstName: 'Yang', lastName: 'Liu' });

console.log(user.name);
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

## [Optional] can we DRY it more?

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
  async requestAndCast<T>(options: ApiOptions): T {
    throw new Error(`macro failed to expand,
    check your tsconfig and ensure "io-interface/transform-request" is enabled`);
  }

  // do not call it directly, transformer will call it
  async request<T>(
    options: ApiOptions,
    cb: (c: Decoder, data: unknown, e?: DecoderCallback<T>) => T | undefined,
  ) {
    const data: Object = await fetch(options);
    const casted: T = cb(c, data, console.error);
    return casted;
  }
}
```

## Error handling

If encoding failed, `decode()` or `decodeArray()` will can an onError callback with signature: `string[] => void` where the argument is an array of error messages. Here's the screenshot of such error messages:

![image](https://user-images.githubusercontent.com/3524125/69911276-eb973480-13cd-11ea-89a2-31692ba81702.png)
