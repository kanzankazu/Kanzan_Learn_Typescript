// ============================================================
// Phase 2 — 03: Union & Intersection Types
// ============================================================
// Topics: union, intersection, discriminated union,
//         string literal union, template literal union,
//         exhaustive handling
// Run: npx ts-node src/phase-2/03_union_intersection.ts
// ============================================================

// ----------------------------------------------------------
// 1. Union types — value can be ONE of several types
// ----------------------------------------------------------
type StringOrNumber = string | number;
type ID = string | number;

function format(value: StringOrNumber): string {
  if (typeof value === "string") return value.trim().toUpperCase();
  return value.toFixed(2);
}
console.log(format("  hello  ")); // "HELLO"
console.log(format(3.14));        // "3.14"

// Union with null/undefined — explicit nullable
type MaybeString = string | null | undefined;

function safeToUpper(value: MaybeString): string {
  return value?.toUpperCase() ?? "(no value)";
}
console.log(safeToUpper("hello")); // "HELLO"
console.log(safeToUpper(null));    // "(no value)"
console.log(safeToUpper(undefined)); // "(no value)"

// ----------------------------------------------------------
// 2. String literal union — acts like a type-safe string enum
// ----------------------------------------------------------
type Direction   = "north" | "south" | "east" | "west";
type HttpMethod  = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type LogLevel    = "debug" | "info" | "warn" | "error";
type Environment = "development" | "staging" | "production";

function log(level: LogLevel, message: string): void {
  const prefix: Record<LogLevel, string> = {
    debug: "🔍",
    info:  "ℹ️",
    warn:  "⚠️",
    error: "❌",
  };
  console.log(`${prefix[level]} [${level.toUpperCase()}] ${message}`);
}

log("info",  "Server started");
log("warn",  "Memory usage high");
log("error", "Unhandled exception");
// log("verbose", "..."); // ❌ not in LogLevel

// ----------------------------------------------------------
// 3. Intersection types — combine ALL properties
// ----------------------------------------------------------
type Timestamped = { createdAt: Date; updatedAt: Date };
type SoftDeletable = { deletedAt: Date | null };
type HasId = { id: number };

type BaseEntity = HasId & Timestamped & SoftDeletable;

type User = BaseEntity & {
  name:  string;
  email: string;
  role:  "admin" | "user";
};

type Product = BaseEntity & {
  name:   string;
  price:  number;
  stock:  number;
};

function printEntity(entity: BaseEntity): void {
  console.log(`#${entity.id} created ${entity.createdAt.toLocaleDateString()}`);
}

const user: User = {
  id: 1, name: "Alice", email: "a@b.com", role: "admin",
  createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
};
printEntity(user); // works because User extends BaseEntity

// ----------------------------------------------------------
// 4. Discriminated Union — the most powerful pattern
// ----------------------------------------------------------
// Each member has a common "discriminant" field with a unique literal value.
// TypeScript uses this field to narrow the type in switch/if.

type LoadingState = { status: "loading" };
type SuccessState<T> = { status: "success"; data: T };
type ErrorState = { status: "error"; message: string; code: number };

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "loading":
      return "Loading...";
    case "success":
      return `Data: ${JSON.stringify(state.data)}`; // TS knows state.data exists
    case "error":
      return `Error ${state.code}: ${state.message}`; // TS knows state.code & message
    // No default needed — all cases covered (exhaustive)
  }
}

const loading: AsyncState<string[]> = { status: "loading" };
const success: AsyncState<string[]> = { status: "success", data: ["a", "b"] };
const error:   AsyncState<string[]> = { status: "error", message: "Not found", code: 404 };

console.log(renderState(loading)); // Loading...
console.log(renderState(success)); // Data: ["a","b"]
console.log(renderState(error));   // Error 404: Not found

// ----------------------------------------------------------
// 5. Discriminated union — shapes example
// ----------------------------------------------------------
type Circle    = { kind: "circle";    radius: number };
type Rectangle = { kind: "rectangle"; width: number; height: number };
type Triangle  = { kind: "triangle";  base: number; height: number };

type Shape = Circle | Rectangle | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":    return Math.PI * shape.radius ** 2;
    case "rectangle": return shape.width * shape.height;
    case "triangle":  return 0.5 * shape.base * shape.height;
    default: {
      const _exhaustive: never = shape; // will error if Shape has unhandled case
      throw new Error(`Unknown shape: ${_exhaustive}`);
    }
  }
}

const shapes: Shape[] = [
  { kind: "circle", radius: 5 },
  { kind: "rectangle", width: 4, height: 6 },
  { kind: "triangle", base: 3, height: 8 },
];
shapes.forEach(s => console.log(`${s.kind}: area = ${getArea(s).toFixed(2)}`));

// ----------------------------------------------------------
// 6. Discriminated union — action/reducer pattern (like Redux)
// ----------------------------------------------------------
type CounterState = { count: number; lastAction: string };

type IncrementAction  = { type: "INCREMENT"; by?: number };
type DecrementAction  = { type: "DECREMENT"; by?: number };
type ResetAction      = { type: "RESET" };
type SetAction        = { type: "SET"; value: number };

type CounterAction = IncrementAction | DecrementAction | ResetAction | SetAction;

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + (action.by ?? 1), lastAction: "INCREMENT" };
    case "DECREMENT":
      return { count: state.count - (action.by ?? 1), lastAction: "DECREMENT" };
    case "RESET":
      return { count: 0, lastAction: "RESET" };
    case "SET":
      return { count: action.value, lastAction: "SET" };
  }
}

let counterState: CounterState = { count: 0, lastAction: "INIT" };
counterState = counterReducer(counterState, { type: "INCREMENT" });
counterState = counterReducer(counterState, { type: "INCREMENT", by: 5 });
counterState = counterReducer(counterState, { type: "DECREMENT", by: 2 });
console.log(counterState); // { count: 4, lastAction: "DECREMENT" }
counterState = counterReducer(counterState, { type: "RESET" });
console.log(counterState); // { count: 0, lastAction: "RESET" }

// ----------------------------------------------------------
// 7. Union narrowing with 'in' operator
// ----------------------------------------------------------
interface AdminUser { role: "admin"; adminLevel: number; permissions: string[] }
interface RegularUser { role: "user"; email: string }
interface GuestUser { role: "guest" }

type AnyUser = AdminUser | RegularUser | GuestUser;

function getUserInfo(user: AnyUser): string {
  if ("adminLevel" in user) {
    return `Admin (level ${user.adminLevel}), permissions: ${user.permissions.join(", ")}`;
  }
  if ("email" in user) {
    return `User: ${user.email}`;
  }
  return "Guest user";
}

console.log(getUserInfo({ role: "admin", adminLevel: 3, permissions: ["read", "write", "delete"] }));
console.log(getUserInfo({ role: "user", email: "bob@mail.com" }));
console.log(getUserInfo({ role: "guest" }));

export {};
