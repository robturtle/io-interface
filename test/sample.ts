import { schema, Decoder, runtime } from '../index';
import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

interface Location {
  lat: number;
  lng: number;
}

namespace google {
  export namespace maps {
    export interface Marker {
      value: string;
    }
  }
}

interface User {
  name: string; // required primitive
  title?: string; // optional primitive
  houses: string[]; // required array
  location: Location; // type reference
  previousLocations?: Location[]; // optional type reference array
  marker: google.maps.Marker; // scoped type
}

interface Special {
  null: null;
  any: any;
  unknown: unknown;
}

const schemas = [schema<Location>(), schema<google.maps.Marker>(), schema<User>()];

const dec = new Decoder(schemas);

function test(name: string, json: unknown) {
  const res = dec.decode<User>('User', json);
  if (isRight(res)) {
    console.log(name, JSON.stringify(res.right) === JSON.stringify(good1));
  } else {
    console.log(name, PathReporter.report(res));
  }
}

const good1: User = {
  name: 'Yang',
  title: 'Life Hacker',
  houses: ['1111 Mission St'],
  location: {
    lat: 0,
    lng: 37,
  },
  marker: {
    value: 'marker',
  },
};
test('good1', good1);

const bad1 = {
  name: 123,
  Title: 'Life Hacker',
  houses: '1111 Mission St',
  location: '0/37',
};
test('bad1', bad1);

// name conflicts
const duplicatedSchema: runtime.Schema = {
  name: 'User',
  props: [
    {
      name: 'value',
      type: 'string',
      optional: false,
    },
  ],
};

let notWorking = false;
try {
  new Decoder([...schemas, duplicatedSchema]);
  notWorking = true;
} catch (e) {
  console.log('type name conflict:', e.message);
}
if (notWorking) {
  throw new Error('name conflicts not caught');
}
