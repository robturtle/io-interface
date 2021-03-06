import { Decoder, runtime, schema, extend, enumSchema, Model } from '..';
import { casters, Latitude, Longitude, Int, NonEmptyString } from '../types';
import * as t from 'io-ts';

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

function test<T>(name: string, type: string, json: unknown, raise: boolean = true) {
  const res = dec.decode<T>(type, json, e => {
    if (raise) {
      throw e;
    } else {
      console.error(e);
    }
  });
  if (res) {
    const equals = JSON.stringify(res) === JSON.stringify(json);
    if (equals) {
      console.log(name, 'passed');
    } else {
      console.log('DECODER NOT CAST CORRECTLY!');
      console.log('expected:', json);
      console.log('actual', res);
      throw new Error('test failed');
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
test<User>('error example:', 'User', bad1, false);
test<UserB>('error example 2:', 'UserB', bad1, false);

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
  throw new Error('NAME CONFLICT NOT WORKING!');
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
  throw new Error('RECURSIVE DETECTION NOT WORKING!');
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
  throw new Error('TOPOLOGICAL OUT OF ORDER NOT WORKING!');
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
  throw new Error('EMPTY DETECTION NOT WORKING!');
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
    throw new Error(`SPECIAL DETECTION (${s.name}) NOT WORKING!`);
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
  throw new Error('macro expand decode NOT WORKING!');
}

const users: User[] = api.requestAndCast<User[]>([good1]);
const eq4 = JSON.stringify(users) === JSON.stringify([good1]);
if (eq4) {
  console.log('macro expand decodeArray: passed');
} else {
  throw new Error('macro expand decodeArray NOT WORKING!');
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
  pages: Int;
  lat: Latitude;
  lng: Longitude;
  note: NonEmptyString;
}
const tryBuiltinsSchema = schema<TryBuiltins>();
dec.register(tryBuiltinsSchema);
const good6 = {
  lat: 80,
  lng: 107,
  pages: 33,
  note: 'less sugar, no ice',
  date: '2019-12-02T02:03:06.783Z',
};
test('builtin casters', 'TryBuiltins', good6);

const decoded: TryBuiltins = api.requestAndCast<TryBuiltins>(good6);
if (typeof decoded.lat !== 'number') {
  throw new Error('lat is not a number');
}
if (typeof decoded.note != 'string') {
  throw new Error('note is not a string');
}
if (!(decoded.date instanceof Date)) {
  throw new Error('date is not a Date');
}
if (typeof decoded.pages !== 'number') {
  throw new Error('pages is not a number');
}

const bad2 = {
  lat: 10000,
  lng: '107',
  note: '',
  date: '19 Dec 25th',
};
test('builtin error example', 'TryBuiltins', bad2, false);

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
const decoded13 = dec.decode<WithAttrs>('WithAttrs', good13, e => {
  throw e;
});
console.log('decoded.name should be sth:', decoded13 && decoded13.name);
console.log('decoded.attrs should be {}:', JSON.stringify(decoded13 && decoded13.attrs));
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
  constructor: Guest,
});

const good14 = { firstName: 'Yang', lastName: 'Liu' };

const guest: Guest | undefined = dec.decode<Guest>('Guest', good14);
if (guest) {
  console.log(`guest's name: ${guest.name}`);
} else {
  throw new Error('builder NOT WORKING!!!');
}

test('builder', 'Guest', good14);

// extend function
interface ICustomer {
  firstName: string;
  lastName: string;
}

// const Customer = extend<ICustomer>()(cus => ({
//   get fullName(): string {
//     return `${cus.firstName} ${cus.lastName}`;
//   },
// }));

// type Customer = InstanceType<typeof Customer>;
interface Customer extends ICustomer {}
class Customer extends Model<ICustomer> {
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

dec.register({
  schema: schema<ICustomer>(),
  className: 'Customer',
  constructor: Customer,
});

const good15 = { firstName: 'Yang', lastName: 'Liu' };

const cus: Customer | undefined = dec.decode('Customer', good15, e => {
  throw e;
});

if (cus) {
  console.log('extend function:', JSON.stringify(cus, null, 2));
  console.log('extend function: get fullName():', cus.fullName);
} else {
  throw new Error('extend function NOT WORKING!!!');
}

const cus2: Customer = api.requestAndCast<Customer>(good15);
console.log('extend function from requestAndCast:', JSON.stringify(cus2, null, 2));

// nested constructor
interface ICompany {
  name: string;
  customer: Customer;
}

interface Company extends ICompany {}
class Company extends Model<ICompany> {
  get boss(): string {
    return this.name;
  }
}

dec.register({
  schema: schema<ICompany>(),
  className: 'Company',
  constructor: Company,
});

const good37 = {
  name: 'Good Inc',
  customer: {
    firstName: 'Yang',
    lastName: 'Liu',
  },
};

const company: Company | undefined = dec.decode<Company>('Company', good37, e => {
  throw e;
});
if (company) {
  console.log('nested constructor passed', JSON.stringify(company, null, 2));
} else {
  throw new Error('nested constructor NOT WORKING!!!');
}

const bad37 = {
  name: 'Bad Inc',
  customer: {
    first_name: 'Yang',
    lastName: 'Liu',
  },
};
test('constructor error example:', 'Company', bad37, false);

// nested Array
const good188: User[][] = [[good1]];
const decoded188 = dec.decode(
  { type: 'Array', arg: { type: 'Array', arg: 'User' } },
  good188,
  e => {
    throw e;
  },
);
if (JSON.stringify(good188) !== JSON.stringify(decoded188)) {
  throw new Error('nested Array NOT WORKING!!!');
}

// union type
console.log('union types');
interface House {
  owner: Customer | null;
}
dec.register(schema<House>());

const house = {
  owner: {
    firstName: 'Yang',
    lastName: 'Liu',
  },
};

const decodedHouse = dec.decode('House', house, e => {
  throw e;
});
if (!decodedHouse) {
  throw new Error('Union type NOT WORKING!');
} else {
  console.log(decodedHouse);
}

const house2 = { owner: null };
const decodedHouse2 = dec.decode('House', house2, e => {
  throw e;
});
if (!decodedHouse2) {
  throw new Error('Union type (with null) NOT WORKING!');
} else {
  console.log(decodedHouse2);
}
console.log('-'.repeat(40));

// CasterBuilder
const BinaryStr = new t.Type(
  'BinaryStr',
  (x: unknown): x is number => x === 1 || x === 0,
  (x, context) => {
    if (x === '1') {
      return t.success(1);
    } else if (x === '0') {
      return t.success(0);
    } else {
      return t.failure(x, context);
    }
  },
  x => x.toString(),
);

dec.register({ typeName: 'BinaryStr', caster: BinaryStr });

const d = dec.decode('BinaryStr', '1', e => {
  throw e;
});
if (d) {
  console.log('CasterBuilder', d);
}

// enum
enum OrderStatus {
  Pending = 'pending',
  Complete = 'complete',
}

dec.register(enumSchema('OrderStatus', OrderStatus));

const st = 'pending';
test('enumSchema', 'OrderStatus', st);

const st2 = 'pendding';
test('enumSchema error example', 'OrderStatus', st2, false);

// should not use validate in pipe, should just rerun it
interface IDay {
  date: Date | null;
}
interface Day extends IDay {}
class Day extends Model<IDay> {
  get d() {
    return this.date;
  }
}

dec.register({
  schema: schema<IDay>(),
  className: 'Day',
  constructor: Day,
});

const day = dec.decode<Day>('Day', { date: '2019-11-21T20:44:23.007Z' });
if (day) {
  console.log('pipe works!');
} else {
  throw new Error('pipe NOT WORKING!');
}
