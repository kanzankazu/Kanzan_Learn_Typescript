// ============================================================
// Phase 2 — 04: Type Narrowing & Type Guards
// ============================================================
// Topics: typeof, instanceof, in, equality, truthiness,
//         custom type guards (type predicates),
//         assertion functions, exhaustive checks
// Run: npx ts-node src/phase-2/04_type_narrowing.ts
// ============================================================

// ----------------------------------------------------------
// 1. typeof narrowing
// ----------------------------------------------------------
function processValue(value: string | number | boolean | null | undefined): string {
  if (typeof value === "string")    return `string: "${value.toUpperCase()}"`;
  if (typeof value === "number")    return `number: ${value.toFixed(2)}`;
  if (typeof value === "boolean")   return `boolean: ${value ? "yes" : "no"}`;
  if (typeof value === "undefined") return "undefined";
  return "null"; // only null remains
}

console.log(processValue("hello"));    // string: "HELLO"
console.log(processValue(3.14159));    // number: 3.14
console.log(processValue(true));       // boolean: yes
console.log(processValue(null));       // null
console.log(processValue(undefined)); // undefined

// ----------------------------------------------------------
// 2. instanceof narrowing — for class instances
// ----------------------------------------------------------
class NetworkError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function handleError(err: unknown): string {
  if (err instanceof NetworkError) {
    return `Network error ${err.statusCode}: ${err.message}`;
  }
  if (err instanceof ValidationError) {
    return `Validation error on '${err.field}': ${err.message}`;
  }
  if (err instanceof Error) {
    return `General error: ${err.message}`;
  }
  return `Unknown error: ${String(err)}`;
}

console.log(handleError(new NetworkError(404, "Not Found")));
console.log(handleError(new ValidationError("email", "Invalid format")));
console.log(handleError(new Error("Something went wrong")));
console.log(handleError("just a string error"));

// ----------------------------------------------------------
// 3. in operator narrowing — check if property exists
// ----------------------------------------------------------
interface Cat  { meow(): void; indoor: boolean }
interface Bird { chirp(): void; canFly: boolean }
interface Fish { swim(): void; waterType: "fresh" | "salt" }

type Pet = Cat | Bird | Fish;

function makePetSound(pet: Pet): void {
  if ("meow" in pet)  { pet.meow();  return; }
  if ("chirp" in pet) { pet.chirp(); return; }
  pet.swim();
}

const myCat:  Cat  = { meow: () => console.log("Meow!"), indoor: true };
const myBird: Bird = { chirp: () => console.log("Tweet!"), canFly: true };
const myFish: Fish = { swim: () => console.log("Splash~"), waterType: "fresh" };

makePetSound(myCat);
makePetSound(myBird);
makePetSound(myFish);

// ----------------------------------------------------------
// 4. Equality narrowing — === and ==
// ----------------------------------------------------------
function compare(a: string | number, b: string | number): string {
  if (a === b) {
    // When a === b and both could be string | number,
    // TypeScript narrows both to the shared type
    return `Both equal: ${a}`;
  }
  return `Different: ${a} vs ${b}`;
}

function processId(id: string | null | undefined): string {
  if (id == null) {
    // == null catches BOTH null and undefined
    return "No ID provided";
  }
  return id.toUpperCase(); // TypeScript knows id is string here
}

console.log(compare(42, 42));          // Both equal: 42
console.log(compare("x", "y"));       // Different: x vs y
console.log(processId("abc-123"));     // ABC-123
console.log(processId(null));          // No ID provided
console.log(processId(undefined));     // No ID provided

// ----------------------------------------------------------
// 5. Truthiness narrowing
// ----------------------------------------------------------
function printLength(value: string | null | undefined | number[]): void {
  if (value) {
    // value is narrowed to string | number[] (truthy = not null/undefined/""/[])
    console.log(`Length: ${value.length}`);
  } else {
    console.log("No value or empty");
  }
}

printLength("hello");    // Length: 5
printLength([1, 2, 3]);  // Length: 3
printLength(null);       // No value or empty
printLength("");         // No value or empty
printLength(undefined);  // No value or empty

// ----------------------------------------------------------
// 6. Custom type guards — type predicates
// ----------------------------------------------------------
// Syntax: value is Type — tells TypeScript "if this returns true, value IS that type"

interface Square   { kind: "square";   side: number }
interface Hexagon  { kind: "hexagon";  side: number }
type Polygon = Square | Hexagon;

function isSquare(shape: Polygon): shape is Square {
  return shape.kind === "square";
}

function isHexagon(shape: Polygon): shape is Hexagon {
  return shape.kind === "hexagon";
}

const shapes: Polygon[] = [
  { kind: "square", side: 5 },
  { kind: "hexagon", side: 3 },
  { kind: "square", side: 8 },
];

const squares  = shapes.filter(isSquare);  // Square[]
const hexagons = shapes.filter(isHexagon); // Hexagon[]
console.log(`Squares: ${squares.length}, Hexagons: ${hexagons.length}`);

// More complex type guard
interface ApiUser    { type: "api";    id: number; token: string }
interface LocalUser  { type: "local";  id: number; sessionId: string }
interface GuestUser2 { type: "guest";  tempId: string }

type AppUser = ApiUser | LocalUser | GuestUser2;

function isAuthenticatedUser(user: AppUser): user is ApiUser | LocalUser {
  return user.type === "api" || user.type === "local";
}

function getUserId(user: AppUser): string {
  if (isAuthenticatedUser(user)) {
    return `#${user.id}`; // TS knows user has .id
  }
  return user.tempId; // TS knows user is GuestUser2
}

console.log(getUserId({ type: "api",   id: 1, token: "tok123" }));   // #1
console.log(getUserId({ type: "local", id: 2, sessionId: "ses456" })); // #2
console.log(getUserId({ type: "guest", tempId: "tmp789" }));           // tmp789

// ----------------------------------------------------------
// 7. Assertion functions — throws if type is wrong
// ----------------------------------------------------------
function assertIsString(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected ${name} to be a string, got ${typeof value}`);
  }
}

function assertNonNull<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} must not be null or undefined`);
  }
}

const rawInput: unknown = "user@example.com";
assertIsString(rawInput, "email");
console.log(rawInput.toLowerCase()); // TS knows it's string after assertion

// ----------------------------------------------------------
// 8. Exhaustive check — never type as safety net
// ----------------------------------------------------------
type TrafficLight = "red" | "yellow" | "green";

function getAction(light: TrafficLight): string {
  switch (light) {
    case "red":    return "Stop";
    case "yellow": return "Caution";
    case "green":  return "Go";
    default: {
      // If someone adds "blue" to TrafficLight and forgets to handle it,
      // TypeScript will error here because "blue" is not assignable to never
      const _impossible: never = light;
      throw new Error(`Unhandled traffic light: ${_impossible}`);
    }
  }
}

console.log(getAction("red"));    // Stop
console.log(getAction("green"));  // Go

// ----------------------------------------------------------
// 9. Narrowing with Array.isArray
// ----------------------------------------------------------
function formatInput(input: string | string[]): string {
  if (Array.isArray(input)) {
    return input.join(", ");
  }
  return input; // narrowed to string
}

console.log(formatInput("hello"));           // hello
console.log(formatInput(["a", "b", "c"]));   // a, b, c

export {};
