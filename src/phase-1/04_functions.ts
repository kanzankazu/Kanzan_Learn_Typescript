// ============================================================
// Phase 1 — 04: Typed Functions
// ============================================================
// Topics: parameter types, return types, optional/default/rest,
//         function type aliases, overloads, void vs never,
//         generic functions (preview)
// Run: npx ts-node src/phase-1/04_functions.ts
// ============================================================

// ----------------------------------------------------------
// 1. Basic parameter & return type annotations
// ----------------------------------------------------------
function add(a: number, b: number): number {
  return a + b;
}

function greet(name: string): string {
  return `Hello, ${name}!`;
}

function isEven(n: number): boolean {
  return n % 2 === 0;
}

console.log(add(2, 3));      // 5
console.log(greet("Faisal")); // Hello, Faisal!
console.log(isEven(4));      // true

// ----------------------------------------------------------
// 2. Optional parameters — must come AFTER required ones
// ----------------------------------------------------------
function createTag(tag: string, content: string, className?: string): string {
  const cls = className ? ` class="${className}"` : "";
  return `<${tag}${cls}>${content}</${tag}>`;
}

console.log(createTag("p", "Hello"));               // <p>Hello</p>
console.log(createTag("p", "Hello", "text-bold"));  // <p class="text-bold">Hello</p>

// ----------------------------------------------------------
// 3. Default parameters — has a fallback value if not provided
// ----------------------------------------------------------
function repeat(str: string, times: number = 3, separator: string = ""): string {
  return Array(times).fill(str).join(separator);
}

console.log(repeat("ab"));           // ababab
console.log(repeat("ab", 2));        // abab
console.log(repeat("ab", 4, "-"));   // ab-ab-ab-ab

// ----------------------------------------------------------
// 4. Rest parameters — collect remaining args as array
// ----------------------------------------------------------
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

function buildPath(base: string, ...segments: string[]): string {
  return [base, ...segments].join("/");
}

console.log(sum(1, 2, 3, 4, 5));                          // 15
console.log(buildPath("/api", "users", "42", "profile"));  // /api/users/42/profile

// ----------------------------------------------------------
// 5. Function type aliases
// ----------------------------------------------------------
type Predicate<T>      = (value: T) => boolean;
type Transformer<T, R> = (value: T) => R;
type Callback<T>       = (error: Error | null, result: T | null) => void;
type EventHandler      = (event: Event) => void;

// Using the type aliases
const isPositive:  Predicate<number>         = n => n > 0;
const toUpperCase: Transformer<string, string> = s => s.toUpperCase();
const double:      Transformer<number, number> = n => n * 2;

console.log(isPositive(-5));       // false
console.log(toUpperCase("hello")); // HELLO
console.log(double(7));            // 14

// Higher-order functions using type aliases
function filter<T>(array: T[], predicate: Predicate<T>): T[] {
  return array.filter(predicate);
}

function map<T, R>(array: T[], transformer: Transformer<T, R>): R[] {
  return array.map(transformer);
}

const nums = [-3, -1, 0, 2, 5, 8];
console.log(filter(nums, isPositive));  // [2, 5, 8]
console.log(map(nums, double));         // [-6, -2, 0, 4, 10, 16]

// ----------------------------------------------------------
// 6. void — function with no meaningful return value
// ----------------------------------------------------------
function logError(message: string): void {
  console.error(`[ERROR] ${message}`);
  // No return value — TypeScript enforces this
}

// void in callbacks — when return value is ignored
type Timer = (callback: () => void, ms: number) => void;

// Note: A function typed as () => void CAN return a value
// The return value is just ignored by the caller
const arr: number[] = [];
const push: () => void = () => arr.push(1); // push() returns number, but void ignores it
push();

// ----------------------------------------------------------
// 7. never — function that never returns normally
// ----------------------------------------------------------
function fail(message: string): never {
  throw new Error(message);
}

function assertNonNull<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    return fail(`${name} must not be null or undefined`);
  }
  return value; // TypeScript knows value is T here
}

const maybeNull: string | null = "hello";
const definiteString = assertNonNull(maybeNull, "myVar");
console.log(definiteString.toUpperCase()); // HELLO

// ----------------------------------------------------------
// 8. Function overloads — multiple call signatures
// ----------------------------------------------------------
// Overloads define how the function CAN be called
function format(value: number): string;
function format(value: string): string;
function format(value: Date): string;
// Implementation signature (not visible to callers)
function format(value: number | string | Date): string {
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "string") return value.trim().toUpperCase();
  return value.toLocaleDateString("en-US");
}

console.log(format(3.14159));         // "3.14"
console.log(format("  hello  "));     // "HELLO"
console.log(format(new Date()));      // e.g. "12/25/2024"

// More practical overload example — browser pattern (comment for Node.js env)
// function createElement(tag: "input"): HTMLInputElement;
// function createElement(tag: "div"): HTMLDivElement;
// function createElement(tag: "span"): HTMLSpanElement;
// function createElement(tag: string): HTMLElement {
//   return document.createElement(tag); // browser-only API
// }
// const input = createElement("input"); // typed as HTMLInputElement ✅

// ----------------------------------------------------------
// 9. Arrow function types
// ----------------------------------------------------------
// Inline type annotation
const multiply = (a: number, b: number): number => a * b;

// Type alias first, then assign
type BinaryOp = (a: number, b: number) => number;
const divide: BinaryOp  = (a, b) => a / b;
const modulo: BinaryOp  = (a, b) => a % b;

console.log(divide(10, 3));  // 3.333...
console.log(modulo(10, 3));  // 1

// ----------------------------------------------------------
// 10. Callback types & error-first pattern
// ----------------------------------------------------------
type NodeCallback<T> = (error: Error | null, result: T | null) => void;

function readData(id: number, callback: NodeCallback<string>): void {
  setTimeout(() => {
    if (id <= 0) {
      callback(new Error("Invalid ID"), null);
    } else {
      callback(null, `Data for ID ${id}`);
    }
  }, 10);
}

readData(1, (err, data) => {
  if (err) { console.error("Error:", err.message); return; }
  console.log("Got:", data);
});

readData(-1, (err, data) => {
  if (err) { console.error("Error:", err.message); return; }
  console.log("Got:", data);
});

export {};
