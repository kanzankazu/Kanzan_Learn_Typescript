// ============================================================
// Phase 2 — 02: Generics
// ============================================================
// Topics: generic functions, generic classes, constraints,
//         keyof, default type params, utility type preview
// Run: npx ts-node src/phase-2/02_generics.ts
// ============================================================

// ----------------------------------------------------------
// 1. Generic functions — type placeholder <T>
// ----------------------------------------------------------
// Without generics — loses type info
function identityAny(value: any): any { return value; }

// With generics — type is preserved
function identity<T>(value: T): T { return value; }

const s = identity("hello");   // TypeScript knows: string
const n = identity(42);        // TypeScript knows: number
const b = identity(true);      // TypeScript knows: boolean

// Explicit type argument (usually inferred)
const explicit = identity<string[]>(["a", "b"]);
console.log(s.toUpperCase());  // HELLO — ✅ string methods available
console.log(n.toFixed(2));     // 42.00 — ✅ number methods available

// ----------------------------------------------------------
// 2. Multiple type parameters
// ----------------------------------------------------------
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

function swap<T, U>(pair: [T, U]): [U, T] {
  return [pair[1], pair[0]];
}

function mapPair<T, U, R>(pair: [T, U], fn: (a: T, b: U) => R): R {
  return fn(pair[0], pair[1]);
}

const p = pair("age", 28);               // [string, number]
const swapped = swap(p);                 // [number, string]
const combined = mapPair(p, (k, v) => `${k}=${v}`); // "age=28"

console.log(p, swapped, combined);

// ----------------------------------------------------------
// 3. Generic with arrays
// ----------------------------------------------------------
function first<T>(array: T[]): T | undefined {
  return array[0];
}

function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

function take<T>(array: T[], n: number): T[] {
  return array.slice(0, n);
}

function zip<T, U>(a: T[], b: U[]): [T, U][] {
  return a.map((item, i) => [item, b[i]] as [T, U]);
}

console.log(first([1, 2, 3]));       // 1
console.log(last(["a", "b", "c"]));  // "c"
console.log(take([10, 20, 30, 40], 2)); // [10, 20]
console.log(zip([1, 2, 3], ["a", "b", "c"])); // [[1,"a"],[2,"b"],[3,"c"]]

// ----------------------------------------------------------
// 4. Generic constraints — limit what T can be
// ----------------------------------------------------------

// Constraint: T must have a .length property
interface HasLength { length: number; }

function logLength<T extends HasLength>(item: T): T {
  console.log(`length: ${item.length}`);
  return item;
}

logLength("hello");          // ✅ string has .length
logLength([1, 2, 3]);        // ✅ array has .length
logLength({ length: 10 });   // ✅ any object with .length
// logLength(42);            // ❌ number has no .length

// Constraint: keyof — T must be a key of U
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Faisal", age: 28, city: "Jakarta" };
console.log(getProperty(user, "name")); // "Faisal"
console.log(getProperty(user, "age"));  // 28
// getProperty(user, "salary"); // ❌ 'salary' is not a key of user

// Constraint: T extends object
function clone<T extends object>(obj: T): T {
  return { ...obj };
}
const cloned = clone({ a: 1, b: 2 });
console.log(cloned); // { a: 1, b: 2 }

// ----------------------------------------------------------
// 5. Generic classes
// ----------------------------------------------------------
class Stack<T> {
  private items: T[] = [];

  push(item: T): void    { this.items.push(item); }
  pop(): T | undefined   { return this.items.pop(); }
  peek(): T | undefined  { return this.items[this.items.length - 1]; }
  isEmpty(): boolean     { return this.items.length === 0; }
  get size(): number     { return this.items.length; }
  toArray(): T[]         { return [...this.items]; }
}

const numStack = new Stack<number>();
numStack.push(1); numStack.push(2); numStack.push(3);
console.log(numStack.peek());   // 3
console.log(numStack.pop());    // 3
console.log(numStack.size);     // 2

class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void   { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  front(): T | undefined   { return this.items[0]; }
  isEmpty(): boolean       { return this.items.length === 0; }
  get size(): number       { return this.items.length; }
}

const strQueue = new Queue<string>();
strQueue.enqueue("first"); strQueue.enqueue("second"); strQueue.enqueue("third");
console.log(strQueue.dequeue()); // "first"
console.log(strQueue.front());   // "second"

// ----------------------------------------------------------
// 6. Generic interfaces
// ----------------------------------------------------------
interface Repository<T, ID = number> {
  findById(id: ID): T | undefined;
  findAll(): T[];
  save(entity: T): T;
  delete(id: ID): boolean;
  count(): number;
}

interface Transformer<Input, Output> {
  transform(input: Input): Output;
}

interface Validator<T> {
  validate(value: T): { valid: boolean; errors: string[] };
}

// ----------------------------------------------------------
// 7. Generic default type parameters
// ----------------------------------------------------------
class Result<T, E = Error> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: E | null,
  ) {}

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(value, null);
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(null, error);
  }

  isOk(): boolean    { return this._error === null; }
  isFail(): boolean  { return this._error !== null; }

  getValue(): T {
    if (this._value === null) throw new Error("Result has no value");
    return this._value;
  }

  getError(): E {
    if (this._error === null) throw new Error("Result has no error");
    return this._error;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isOk()) return Result.ok<U, E>(fn(this.getValue()));
    return Result.fail<U, E>(this.getError());
  }
}

const ok     = Result.ok(42);
const failed = Result.fail(new Error("Something went wrong"));

console.log(ok.isOk(), ok.getValue());         // true 42
console.log(failed.isFail(), failed.getError().message); // true "Something went wrong"

const doubled = ok.map(n => n * 2);
console.log(doubled.getValue()); // 84

// ----------------------------------------------------------
// 8. Conditional + generic utility preview
// ----------------------------------------------------------
// These are built-in TypeScript utility types — all use generics internally

type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends keyof any, V> = { [P in K]: V };

interface UserModel {
  id:    number;
  name:  string;
  email: string;
  age?:  number;
}

type PartialUser   = MyPartial<UserModel>;   // all optional
type ReadonlyUser  = MyReadonly<UserModel>;  // all readonly
type UserNameEmail = MyPick<UserModel, "name" | "email">; // { name, email }
type RoleMap       = MyRecord<"admin" | "user" | "guest", boolean>; // { admin: bool, ... }

const roleMap: RoleMap = { admin: true, user: true, guest: false };
console.log(roleMap);

export {};
