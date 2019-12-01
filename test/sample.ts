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

const schemas = [schema<Location>(), schema<google.maps.Marker>(), schema<User>()];

const dec = new Decoder(schemas);

function test<T>(name: string, type: string, json: unknown) {
  const res = dec.decode<T>(type, json);
  if (isRight(res)) {
    const equals = JSON.stringify(res.right) === JSON.stringify(json);
    if (equals) {
      console.log(name, 'passed');
    } else {
      console.log('DECODER NOT CAST CORRECTLY!');
      console.log('expected:', json);
      console.log('actual', res.right);
    }
  } else {
    console.log(name, PathReporter.report(res));
  }
  console.log('-'.repeat(40));
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
test<User>('good1', 'User', good1);

const bad1 = {
  name: 123,
  Title: 'Life Hacker',
  houses: '1111 Mission St',
  location: '0/37',
};
test<User>('error example:', 'User', bad1);

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

try {
  new Decoder([...schemas, duplicatedSchema]);
  console.log('NAME CONFLICT NOT WORKING!');
} catch (e) {
  console.log('type name conflict:', e.message);
}
console.log('-'.repeat(40));

// recursive interface
interface Tree {
  value: number;
  left?: Tree;
  right?: Tree;
}
const TreeSchema = schema<Tree>();

try {
  new Decoder([TreeSchema]);
  console.log('RECURSIVE DETECTION NOT WORKING!');
} catch (e) {
  console.log('recursive detection:', e.message);
}
console.log('-'.repeat(40));

// topological out of order
interface LatLng {
  lat: number;
  lng: number;
}

interface Order {
  price: number;
  position: LatLng;
}

const schemasOutOfOrder = [schema<Order>(), schema<LatLng>()];

try {
  new Decoder(schemasOutOfOrder);
  console.log('TOPOLOGICAL OUT OF ORDER NOT WORKING!');
} catch (e) {
  if (!(e as Error).message.match(/depends/)) {
    console.log('TOPOLOGICAL OUT OF ORDER NOT WORKING!');
  }
  console.log('topological out of order:', e.message);
}
console.log('-'.repeat(40));

// empty interface
interface Nothing {}
const nothingSchema = schema<Nothing>();

try {
  new Decoder([nothingSchema]);
  console.log('EMPTY DETECTION NOT WORKING!');
} catch (e) {
  if (!(e as Error).message.match(/empty/)) {
    console.log('EMPTY DETECTION NOT WORKING!');
  }
  console.log('empty detection:', e.message);
}
console.log('-'.repeat(40));

// extends interface
interface ServiceOrder extends Order {}
dec.registerSchema(schema<LatLng>());
dec.registerSchema(schema<ServiceOrder>());

const serviceOrder: ServiceOrder = {
  position: { lat: 0, lng: 0 },
  price: 3,
};
test<ServiceOrder>('extended interface', 'ServiceOrder', serviceOrder);

// special types
interface WithNull {
  null: null;
}

interface WithAny {
  any: any;
}

interface WithUnknown {
  unknown: unknown;
}

[schema<WithNull>(), schema<WithAny>(), schema<WithUnknown>()].forEach(s => {
  try {
    new Decoder([s]);
    console.log(`SPECIAL DETECTION (${s.name}) NOT WORKING!`);
  } catch (e) {
    console.log('special types: ', e.message);
  }
  console.log('-'.repeat(40));
});
