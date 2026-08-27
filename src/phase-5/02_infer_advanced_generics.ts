// ============================================================
// Phase 5 — 02: Infer & Advanced Generics
// ============================================================
// Topics: infer keyword deep dive, variadic tuple types,
//         recursive generics, builder pattern, query builder,
//         higher-kinded types simulation
// Run: npx ts-node src/phase-5/02_infer_advanced_generics.ts
// ============================================================

// ----------------------------------------------------------
// 1. infer — extract types from within other types
// ----------------------------------------------------------

// Extract return type
type ReturnType2<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract first argument type
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

// Extract Promise value
type Awaited2<T> = T extends Promise<infer U> ? Awaited2<U> : T;

// Extract array element
type ArrayElement<T> = T extends (infer E)[] ? E : never;

// Extract constructor parameter types
type CtorParams<T> = T extends new (...args: infer P) => any ? P : never;

// Extract instance type from constructor
type Instance<T> = T extends new (...args: any[]) => infer I ? I : never;

// Extract function that returns T from any wrapper
type UnwrapFn<T> = T extends () => infer R ? R : T;

// Tests
type Fn = (a: string, b: number) => boolean;
type R  = ReturnType2<Fn>;       // boolean
type F  = FirstArg<Fn>;          // string
type AW = Awaited2<Promise<Promise<string>>>; // string
type EL = ArrayElement<number[]>; // number

console.log("infer demo — types verified at compile time ✅");

// ----------------------------------------------------------
// 2. Variadic tuple types (TypeScript 4.0+)
// ----------------------------------------------------------

type Concat<A extends any[], B extends any[]> = [...A, ...B];
type Prepend<T, Arr extends any[]>            = [T, ...Arr];
type Append<Arr extends any[], T>             = [...Arr, T];
type Head<T extends any[]>  = T extends [infer H, ...any[]] ? H : never;
type Tail<T extends any[]>  = T extends [any, ...infer R]   ? R : never;
type Last<T extends any[]>  = T extends [...any[], infer L]  ? L : never;
type Init<T extends any[]>  = T extends [...infer I, any]    ? I : never;
type Length<T extends any[]> = T["length"];
type Reverse<T extends any[]> = T extends [infer F, ...infer R] ? [...Reverse<R>, F] : [];

type AB = Concat<[string, number], [boolean, Date]>; // [string, number, boolean, Date]
type Pre = Prepend<string, [number, boolean]>;         // [string, number, boolean]
type H = Head<[1, 2, 3]>;    // 1
type Ta = Tail<[1, 2, 3]>;   // [2, 3]
type La = Last<[1, 2, 3]>;   // 3
type In = Init<[1, 2, 3]>;   // [1, 2]
type Le = Length<[1, 2, 3]>; // 3
type Rev = Reverse<[1, 2, 3]>; // [3, 2, 1]

// ----------------------------------------------------------
// 3. Function composition with variadic types
// ----------------------------------------------------------

// pipe: compose functions left to right
function pipe<A>(a: A): A;
function pipe<A, B>(a: A, ab: (a: A) => B): B;
function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
function pipe(value: unknown, ...fns: Function[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}

const result = pipe(
  "  hello world  ",
  (s: string)  => s.trim(),
  (s: string)  => s.toUpperCase(),
  (s: string)  => s.split(" "),
  (a: string[]) => a.join("-"),
);
console.log("pipe result:", result); // HELLO-WORLD

// ----------------------------------------------------------
// 4. Fluent builder pattern with method chaining
// ----------------------------------------------------------

type BuilderStep<T, Built extends Partial<T>> = {
  [K in Exclude<keyof T, keyof Built>]: (
    value: T[K],
  ) => BuilderStep<T, Built & Pick<T, K>>;
} & (keyof T extends keyof Built ? { build(): T } : {});

// Simpler, more practical builder
class RequestBuilder {
  private config: {
    method?: string;
    url?:    string;
    headers: Record<string, string>;
    body?:   unknown;
    timeout: number;
  } = { headers: {}, timeout: 5000 };

  method(m: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"): this {
    this.config.method = m;
    return this;
  }

  url(u: string): this {
    this.config.url = u;
    return this;
  }

  header(key: string, value: string): this {
    this.config.headers[key] = value;
    return this;
  }

  body(data: unknown): this {
    this.config.body = data;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  bearer(token: string): this {
    return this.header("Authorization", `Bearer ${token}`);
  }

  json(): this {
    return this.header("Content-Type", "application/json");
  }

  build(): typeof this.config & { method: string; url: string } {
    if (!this.config.method) throw new Error("method is required");
    if (!this.config.url)    throw new Error("url is required");
    return this.config as typeof this.config & { method: string; url: string };
  }
}

const request = new RequestBuilder()
  .method("POST")
  .url("/api/users")
  .json()
  .bearer("my-token")
  .body({ name: "Alice", email: "a@b.com" })
  .timeout(3000)
  .build();

console.log("\nRequest built:", JSON.stringify(request, null, 2));

// ----------------------------------------------------------
// 5. Type-safe query builder
// ----------------------------------------------------------

type OrderDirection = "ASC" | "DESC";
type Operator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN";

interface WhereClause<T> {
  field:    keyof T;
  op:       Operator;
  value:    unknown;
}

interface OrderClause<T> {
  field: keyof T;
  dir:   OrderDirection;
}

class QueryBuilder<T extends object> {
  private _table:   string = "";
  private _select:  (keyof T)[] = [];
  private _where:   WhereClause<T>[] = [];
  private _order:   OrderClause<T>[] = [];
  private _limit?:  number;
  private _offset?: number;

  from(table: string): this {
    this._table = table;
    return this;
  }

  select<K extends keyof T>(...fields: K[]): this {
    this._select = [...this._select, ...fields];
    return this;
  }

  where(field: keyof T, op: Operator, value: unknown): this {
    this._where.push({ field, op, value });
    return this;
  }

  orderBy(field: keyof T, dir: OrderDirection = "ASC"): this {
    this._order.push({ field, dir });
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  offset(n: number): this {
    this._offset = n;
    return this;
  }

  toSQL(): string {
    const sel = this._select.length > 0
      ? this._select.map(String).join(", ")
      : "*";

    let sql = `SELECT ${sel} FROM ${this._table}`;

    if (this._where.length > 0) {
      const conds = this._where.map(w => {
        const val = typeof w.value === "string" ? `'${w.value}'` : String(w.value);
        return `${String(w.field)} ${w.op} ${val}`;
      });
      sql += ` WHERE ${conds.join(" AND ")}`;
    }

    if (this._order.length > 0) {
      const orders = this._order.map(o => `${String(o.field)} ${o.dir}`);
      sql += ` ORDER BY ${orders.join(", ")}`;
    }

    if (this._limit  !== undefined) sql += ` LIMIT ${this._limit}`;
    if (this._offset !== undefined) sql += ` OFFSET ${this._offset}`;

    return sql;
  }
}

interface UserRow {
  id:       number;
  name:     string;
  email:    string;
  role:     string;
  isActive: boolean;
  age:      number;
}

const query = new QueryBuilder<UserRow>()
  .from("users")
  .select("id", "name", "email", "role")
  .where("isActive", "=", true)
  .where("age", ">=", 18)
  .orderBy("name", "ASC")
  .orderBy("id", "DESC")
  .limit(10)
  .offset(20)
  .toSQL();

console.log("\nGenerated SQL:");
console.log(query);

// ----------------------------------------------------------
// 6. Recursive generic types
// ----------------------------------------------------------

// JSON-safe type
type JSONValue =
  | string | number | boolean | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Deep merge two objects
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]:
    K extends keyof U
      ? K extends keyof T
        ? T[K] extends object
          ? U[K] extends object
            ? DeepMerge<T[K], U[K]>
            : U[K]
          : U[K]
        : U[K]
      : K extends keyof T ? T[K] : never;
};

// Flatten nested object keys into dot-notation paths
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPaths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
    : `${Prefix}${K}`;
}[keyof T & string];

interface Config {
  server:   { host: string; port: number };
  database: { url: string; pool: number };
}

type ConfigPaths = DotPaths<Config>;
// "server" | "database" | "server.host" | "server.port" | "database.url" | "database.pool"

// ----------------------------------------------------------
// 7. Higher-kinded types simulation
// ----------------------------------------------------------

// TypeScript doesn't have HKT natively, but we can simulate them
// using interface extension (the "encoding" pattern)

interface HKT {
  readonly _type: unknown;
}

type Apply<F extends HKT, A> = F extends { readonly _type: unknown }
  ? (F & { readonly _type: A })["_type"]
  : never;

// Define a Functor interface using HKT encoding
interface Functor<F extends HKT> {
  map<A, B>(fa: Apply<F, A>, f: (a: A) => B): Apply<F, B>;
}

console.log("\nAdvanced generics demo complete ✅");

export {};
