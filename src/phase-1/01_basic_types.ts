// ============================================================
// Phase 1 — 01: Basic Types
// ============================================================
// Topics: primitive types, type annotations, inference,
//         any, unknown, void, never, object, type assertions
// Run: npx ts-node src/phase-1/01_basic_types.ts
// ============================================================

// ----------------------------------------------------------
// 1. Primitive types with explicit annotations
// ----------------------------------------------------------
const firstName: string  = "Faisal";
const age:       number  = 28;
const isActive:  boolean = true;
const nothing:   null    = null;
const notSet:    undefined = undefined;

console.log(firstName, age, isActive, nothing, notSet);

// ----------------------------------------------------------
// 2. Type inference — TypeScript figures it out automatically
// ----------------------------------------------------------
const city    = "Jakarta";   // inferred: string
const score   = 100;         // inferred: number
const isDone  = false;       // inferred: boolean
const items   = [1, 2, 3];  // inferred: number[]
const profile = { name: "Alice", age: 25 }; // inferred: { name: string; age: number }

// TypeScript will flag this as an error:
// city = 42; // ❌ Type 'number' is not assignable to type 'string'

// ----------------------------------------------------------
// 3. any — opt out of type checking (use sparingly)
// ----------------------------------------------------------
let flexible: any = "hello";
flexible = 42;       // ✅ allowed
flexible = true;     // ✅ allowed
flexible = { a: 1 }; // ✅ allowed
flexible.nonExistent.deeply.nested; // ✅ no error — but crashes at runtime!

// When to use any:
// - Migrating JS → TS gradually
// - Third-party libs with no types
// - Truly dynamic data (parse JSON from unknown source, temporarily)

// ----------------------------------------------------------
// 4. unknown — type-safe alternative to any
// ----------------------------------------------------------
let data: unknown = "could be anything";
data = 42;
data = { name: "Bob" };

// ❌ Cannot use unknown without narrowing first
// console.log(data.name); // Error: Object is of type 'unknown'
// console.log(data.toFixed(2)); // Error

// ✅ Must narrow the type before using
if (typeof data === "string") {
  console.log(data.toUpperCase()); // now TypeScript knows it's a string
}
if (typeof data === "number") {
  console.log(data.toFixed(2));
}
if (data !== null && typeof data === "object" && "name" in data) {
  console.log((data as { name: string }).name);
}

// unknown vs any summary:
// - any:     skip type checking completely — dangerous
// - unknown: must check the type before using — safe

// ----------------------------------------------------------
// 5. void — for functions that don't return a value
// ----------------------------------------------------------
function logMessage(msg: string): void {
  console.log(msg);
  // return; or return undefined; both OK
  // return "something"; // ❌ Error — void functions shouldn't return a value
}
logMessage("Hello from void function");

// void variable — rarely useful
let nothing2: void = undefined; // only undefined is assignable to void

// ----------------------------------------------------------
// 6. never — for code that never completes normally
// ----------------------------------------------------------

// Case 1: function that always throws
function throwError(message: string): never {
  throw new Error(message);
  // Code after throw is unreachable — TypeScript knows this
}

// Case 2: function with infinite loop
function infiniteLoop(): never {
  while (true) {
    // runs forever
  }
}

// Case 3: exhaustive check — never is reached if all cases are handled
type Direction = "north" | "south" | "east" | "west";

function handleDirection(dir: Direction): string {
  switch (dir) {
    case "north": return "Going north";
    case "south": return "Going south";
    case "east":  return "Going east";
    case "west":  return "Going west";
    default: {
      // If all cases are covered, 'dir' is never here
      // If you add a new Direction and forget to handle it, TypeScript will error
      const exhausted: never = dir;
      throw new Error(`Unhandled direction: ${exhausted}`);
    }
  }
}
console.log(handleDirection("north")); // Going north

// ----------------------------------------------------------
// 7. object type
// ----------------------------------------------------------
// 'object' type — anything that is not a primitive
let obj: object = { name: "Alice" };
obj = [1, 2, 3]; // ✅ arrays are objects
obj = () => {};  // ✅ functions are objects
// obj = 42;     // ❌ number is a primitive

// More useful: object type literal
let user: { name: string; age: number } = { name: "Bob", age: 30 };
// user = { name: "Charlie" }; // ❌ missing 'age'

// Record type for dynamic keys
let config: Record<string, unknown> = {};
config["host"] = "localhost";
config["port"] = 3000;
console.log(config);

// ----------------------------------------------------------
// 8. Type assertions — "trust me, I know what this is"
// ----------------------------------------------------------
const input = document.getElementById("username"); // HTMLElement | null
// TypeScript doesn't know it's specifically an HTMLInputElement

// as syntax (preferred)
const inputElement = input as HTMLInputElement;

// angle-bracket syntax (not allowed in JSX/TSX)
// const inputElement2 = <HTMLInputElement>input;

// Non-null assertion — tells TS "this is definitely not null"
const definitelyElement = input!; // use with caution
// If input is actually null at runtime, this will crash

// Double assertion — only when you truly need to
const forceTyped = "hello" as unknown as number; // ⚠️ unsafe

// ----------------------------------------------------------
// 9. Literal types — exact values as types
// ----------------------------------------------------------
const exactString: "hello" = "hello";
// const wrong: "hello" = "world"; // ❌ Type '"world"' is not assignable to type '"hello"'

type Theme = "light" | "dark";
let currentTheme: Theme = "light";
currentTheme = "dark"; // ✅
// currentTheme = "blue"; // ❌

type HttpStatus = 200 | 201 | 400 | 404 | 500;
function handleStatus(status: HttpStatus): void {
  console.log("Status:", status);
}
handleStatus(200); // ✅
// handleStatus(999); // ❌

// ----------------------------------------------------------
// 10. Type widening vs narrowing
// ----------------------------------------------------------
// Widening: TS infers a broader type from a value
let mutable = "hello"; // inferred as string (wide) — can be reassigned to any string
const immutable = "hello"; // inferred as "hello" (narrow/literal) — const can't change

// Use 'as const' to prevent widening
const config2 = { host: "localhost", port: 3000 } as const;
// config2.host = "example.com"; // ❌ readonly

export {};
