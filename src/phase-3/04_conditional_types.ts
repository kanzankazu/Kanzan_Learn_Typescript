// ============================================================
// Phase 3 — 04: Conditional Types
// ============================================================
// Topics: basic conditional, infer keyword, distributive types,
//         recursive conditional types, practical patterns
// Run: npx ts-node src/phase-3/04_conditional_types.ts
// ============================================================

// ----------------------------------------------------------
// 1. Basic conditional type
// ----------------------------------------------------------
// Syntax: T extends U ? TrueType : FalseType
// Reads: "if T is assignable to U, then TrueType, else FalseType"

type IsString<T>  = T extends string  ? true : false;
type IsArray<T>   = T extends any[]   ? true : false;
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsArray<string[]>;  // true
type D = IsArray<string>;    // false
type E = IsFunction<() => void>; // true

// Non-nullable check
type IsNonNullable<T> = T extends null | undefined ? false : true;
type F = IsNonNullable<string>;           // true
type G = IsNonNullable<string | null>;    // boolean (distributive)
type H = IsNonNullable<null>;             // false

// ----------------------------------------------------------
// 2. Conditional type with infer — extract inner types
// ----------------------------------------------------------
// 'infer R' declares a new type variable R to be "inferred" from the matched type

// Extract return type of a function
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract parameter types
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

// Extract element type from array
type ElementType<T> = T extends (infer E)[] ? E : never;

// Extract resolved value from Promise
type Awaited2<T> = T extends Promise<infer U> ? Awaited2<U> : T; // recursive!

// Extract first element type from tuple
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;

// Extract rest of tuple
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

// Extract last element type
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

// Tests
type AddReturn    = MyReturnType<(a: number, b: number) => number>; // number
type AddParams    = MyParameters<(a: number, b: number) => number>; // [number, number]
type NumElement   = ElementType<number[]>;   // number
type StrElement   = ElementType<string[][]>; // string[]
type ResolvedStr  = Awaited2<Promise<Promise<string>>>;  // string
type TupleHead    = Head<[string, number, boolean]>;     // string
type TupleTail    = Tail<[string, number, boolean]>;     // [number, boolean]
type TupleLast    = Last<[string, number, boolean]>;     // boolean

// ----------------------------------------------------------
// 3. Distributive conditional types
// ----------------------------------------------------------
// When T is a BARE type parameter (not wrapped), conditional types distribute over unions
// T extends U ? X : Y  with T = A | B  becomes  (A extends U ? X : Y) | (B extends U ? X : Y)

type ToArray<T> = T extends any ? T[] : never;
type Distributed = ToArray<string | number>; // string[] | number[]  ← distributed!

// To prevent distribution: wrap T in a tuple
type ToArrayNonDistributive<T> = [T] extends [any] ? T[] : never;
type NonDist = ToArrayNonDistributive<string | number>; // (string | number)[]  ← NOT distributed

// Practical: filter union members
type NonNullable2<T> = T extends null | undefined ? never : T;
type Filtered = NonNullable2<string | number | null | undefined>; // string | number

// Extract only function types from a union
type FunctionTypes<T> = T extends (...args: any[]) => any ? T : never;
type OnlyFns = FunctionTypes<string | number | (() => void) | ((x: number) => string)>;
// (() => void) | ((x: number) => string)

// ----------------------------------------------------------
// 4. Recursive conditional types
// ----------------------------------------------------------
// DeepPartial — make all nested properties optional
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// DeepReadonly — make all nested properties readonly
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// DeepRequired — make all nested properties required
type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

// Flatten array type recursively
type FlatArray<T> = T extends (infer U)[]
  ? U extends any[] ? FlatArray<U> : U
  : T;

type Flattened = FlatArray<number[][][]>; // number

// ----------------------------------------------------------
// 5. Practical patterns
// ----------------------------------------------------------

// UnwrapPromise — get the value type inside a Promise
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

// PromiseValue — same, more readable name
type PromiseValue<T extends Promise<unknown>> = T extends Promise<infer V> ? V : never;

// Overloaded function return type
type OverloadedReturn<T> =
  T extends { (...args: any[]): infer R; (...args: any[]): any } ? R :
  T extends { (...args: any[]): infer R } ? R :
  never;

// If type
type If<Condition extends boolean, Then, Else> = Condition extends true ? Then : Else;

type IsAdmin = true;
type AdminView  = If<IsAdmin, { canDelete: boolean }, Record<string, never>>;
// { canDelete: boolean }

// ----------------------------------------------------------
// 6. Conditional types in action — type-safe API response handler
// ----------------------------------------------------------
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error";   message: string }
  | { status: "empty" };

// Extract data type from ApiResponse
type ResponseData<T> = T extends ApiResponse<infer D> ? D : never;

type UserResponse = ApiResponse<{ id: number; name: string }>;
type UserData = ResponseData<UserResponse>; // { id: number; name: string }

function handleResponse<T>(response: ApiResponse<T>): T | null {
  if (response.status === "success") return response.data;
  if (response.status === "error")   console.error(response.message);
  return null;
}

const res1: ApiResponse<string[]> = { status: "success", data: ["a", "b"] };
const res2: ApiResponse<string[]> = { status: "error", message: "Not found" };

console.log(handleResponse(res1)); // ["a", "b"]
console.log(handleResponse(res2)); // null

// ----------------------------------------------------------
// 7. Type equality check
// ----------------------------------------------------------
// Checks if two types are exactly equal (not just assignable)
type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2)
    ? true
    : false;

type Test1 = Equals<string, string>;        // true
type Test2 = Equals<string, number>;        // false
type Test3 = Equals<string | number, string | number>; // true
type Test4 = Equals<{ a: string }, { a: string }>; // true

// ----------------------------------------------------------
// 8. Demo: DeepPartial applied to a nested config
// ----------------------------------------------------------
interface ServerConfig {
  host:     string;
  port:     number;
  ssl: {
    enabled: boolean;
    cert:    string;
    key:     string;
  };
  limits: {
    maxConnections: number;
    timeout:        number;
  };
}

type PartialServerConfig = DeepPartial<ServerConfig>;

// Only provide the parts you want to override
const override: PartialServerConfig = {
  port: 8080,
  ssl: { enabled: true }, // cert and key are optional
};

function mergeConfig(base: ServerConfig, override: DeepPartial<ServerConfig>): ServerConfig {
  return {
    ...base,
    ...override,
    ssl:    { ...base.ssl,    ...(override.ssl    ?? {}) },
    limits: { ...base.limits, ...(override.limits ?? {}) },
  };
}

const baseConfig: ServerConfig = {
  host: "localhost", port: 3000,
  ssl: { enabled: false, cert: "", key: "" },
  limits: { maxConnections: 100, timeout: 30000 },
};

const finalConfig = mergeConfig(baseConfig, override);
console.log("Final config:", finalConfig);

export {};
