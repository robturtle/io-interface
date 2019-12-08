import { Decoder, runtime, schema } from '..';
import { casters, Latitude, Longitude, NonEmptyString } from '../types';

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

// this is simply to test if i use internal '[required]' or '[optional]'
// type names would it conflicts to other definitions
interface UserB {
  name?: string;
  title: string;
}

const schemas = [schema<Location>(), schema<google.maps.Marker>(), schema<User>(), schema<UserB>()];

const dec = new Decoder(schemas, casters);
console.log(dec);

function test<T>(name: string, type: string, json: unknown) {
  const res = dec.decode<T>(type, json, errors => console.error(name, errors));
  if (res) {
    const equals = JSON.stringify(res) === JSON.stringify(json);
    if (equals) {
      console.log(name, 'passed');
    } else {
      console.log('DECODER NOT CAST CORRECTLY!');
      console.log('expected:', json);
      console.log('actual', res);
    }
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
  title: true,
  houses: '1111 Mission St',
  location: '0/37',
};
test<User>('error example:', 'User', bad1);
test<UserB>('error example 2:', 'UserB', bad1);

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
dec.register(schema<LatLng>());
dec.register(schema<ServiceOrder>());

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

// literal type
interface WithLiteralType {
  price: number;
  position: {
    lat: number;
    lng: number;
  };
}
const withLiteralTypeSchema = schema<WithLiteralType>();
dec.register(withLiteralTypeSchema);
const good2: WithLiteralType = {
  price: 30,
  position: {
    lat: 0,
    lng: 0,
  },
};

test('literal type', 'WithLiteralType', good2);

// requestAndCast macro
type DecoderCallback<T> = (
  dec: Decoder,
  data: unknown,
  onError?: (errors: string[]) => void,
) => T | undefined;

class ApiService {
  request<T>(url: any, cb: DecoderCallback<T>) {
    const data = url; // mock data fetching
    const converted = cb(dec, data, errors => {
      console.error('decoder error caught', errors);
    });
    return converted;
  }

  requestAndCast<T>(url: any): T {
    throw new Error('test compiler should replace this method call to request()');
  }
}

const api = new ApiService();

const user: User = api.requestAndCast<User>(good1);
const eq3 = JSON.stringify(user) === JSON.stringify(good1);
if (eq3) {
  console.log('macro expand decode: passed');
} else {
  console.error('macro expand decode NOT WORKING!');
}

const users: User[] = api.requestAndCast<User[]>([good1]);
const eq4 = JSON.stringify(users) === JSON.stringify([good1]);
if (eq4) {
  console.log('macro expand decodeArray: passed');
} else {
  console.error('macro expand decodeArray NOT WORKING!');
}

const badUser: User = api.requestAndCast<User>({ statusCode: 401 });
if (badUser === undefined) {
  console.log('error handling: passed');
}
console.log('-'.repeat(40));

// class casters
interface Shift {
  clockIn: Date;
}
dec.register(schema<Shift>());
test('class casters', 'Shift', { clockIn: new Date().toISOString() });

// builtin casters
Object.assign(dec.casters, casters);

interface TryBuiltins {
  date: Date;
  lat: Latitude;
  lng: Longitude;
  note: NonEmptyString;
}
const tryBuiltinsSchema = schema<TryBuiltins>();
dec.register(tryBuiltinsSchema);
const good6 = {
  lat: 80,
  lng: 107,
  note: 'less sugar, no ice',
  date: '2019-12-02T02:03:06.783Z',
};
test('builtin casters', 'TryBuiltins', good6);

const decoded: TryBuiltins = api.requestAndCast<TryBuiltins>(good6);
console.log('decoded.lat:', typeof decoded.lat);
console.log('decoded.note:', typeof decoded.note);
console.log('decoded.date instanceof Date', decoded.date instanceof Date);

const bad2 = {
  lat: 10000,
  lng: '107',
  note: '',
  date: '19 Dec 25th',
};
test('builtin error example', 'TryBuiltins', bad2);

// attrs
namespace google {
  export namespace maps {
    export class Icon {} // do not register this coz it's not from the backend
  }
}
interface WithAttrs {
  name: string;
  attrs: {
    marker: google.maps.Icon;
  };
}
dec.register(schema<WithAttrs>());
const good13 = {
  name: 'sth',
};
console.log('With attrs:');
const decoded13 = dec.decode<WithAttrs>('WithAttrs', good13, console.error);
console.log('decoded.name should be sth:', decoded13?.name);
console.log('decoded.attrs should be {}:', JSON.stringify(decoded13?.attrs));
console.log('-'.repeat(40));

// builder
interface IGuest {
  firstName: string;
  lastName: string;
}

class Guest implements IGuest {
  firstName: string;
  lastName: string;

  constructor(guest: IGuest) {
    this.firstName = guest.firstName;
    this.lastName = guest.lastName;
  }

  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

dec.register({
  schema: schema<IGuest>(),
  className: 'Guest',
  useClass: Guest,
});

const good14 = { firstName: 'Yang', lastName: 'Liu' };

const guest: Guest | undefined = dec.decode<Guest>('Guest', good14);
if (guest) {
  console.log(`guest's name: ${guest.name}`);
} else {
  console.error('builder NOT WORKING!!!');
}

test('builder', 'Guest', good14);
