# io-interface

**TODO**: description

You can check out [this repo](https://github.com/robturtle/io-interface-demo) as a demo project.

## Setup ts-patch

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

interface order {
  price: number;
  date: Date;
  note?: string;
  pricelines: number[];
}
const orderschema = schema<order>();
console.log(orderschema);
```

You should see the console message like this:

![image](https://user-images.githubusercontent.com/3524125/69911372-66148400-13cf-11ea-84f7-b9a7c84f79ee.png)

## Create a DecoderService

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

As you can see from the signature `decode<Todo>('Todo', json)`, `Todo` repeats twice. But for native TypeScript this is needed because the type parameter is for static environment and method parameter is for runtime environment. I don't find a very good solution here but I created a specific TypeScript transformer to expand a macro such as `decode<Todo>(json)` to `decode<Todo>('Todo', json)`. The solution will not shared here but you get the idea. Since TypeScript will never populate the interface information to runtime so I guess this would be the easiest way to reduce the duplication.

## Error handling

![image](https://user-images.githubusercontent.com/3524125/69911276-eb973480-13cd-11ea-89a2-31692ba81702.png)
