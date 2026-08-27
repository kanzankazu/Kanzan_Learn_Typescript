// ============================================================
// Phase 0 — 02: Data Types
// ============================================================
// Topics: primitives, typeof, type coercion, equality
// Run: npx ts-node src/phase-0/02_data_types.ts
// ============================================================

// ----------------------------------------------------------
// 1. The 7 primitive types in JavaScript
// ----------------------------------------------------------
const str: string = "Hello, TypeScript";
const num: number = 42;
const float: number = 3.14;
const bool: boolean = true;
const nothing: null = null;
const notDefined: undefined = undefined;
const sym: symbol = Symbol("id");
const big: bigint = 9007199254740991n; // use 'n' suffix for BigInt

console.log(typeof str);        // "string"
console.log(typeof num);        // "number"
console.log(typeof bool);       // "boolean"
console.log(typeof nothing);    // "object" ← JS quirk! null is not an object
console.log(typeof notDefined); // "undefined"
console.log(typeof sym);        // "symbol"
console.log(typeof big);        // "bigint"

// ----------------------------------------------------------
// 2. Special numeric values
// ----------------------------------------------------------
console.log(1 / 0);         // Infinity
console.log(-1 / 0);        // -Infinity
console.log(0 / 0);         // NaN
console.log(typeof NaN);    // "number" ← another JS quirk
console.log(NaN === NaN);   // false — NaN is never equal to itself
console.log(Number.isNaN(NaN)); // true — use this instead of === NaN

// Number limits
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991

// ----------------------------------------------------------
// 3. String methods (commonly used)
// ----------------------------------------------------------
const greeting = "  Hello, World!  ";
console.log(greeting.trim());           // "Hello, World!"
console.log(greeting.toLowerCase());    // "  hello, world!  "
console.log(greeting.toUpperCase());    // "  HELLO, WORLD!  "
console.log(greeting.includes("World")); // true
console.log(greeting.replace("World", "TypeScript")); // "  Hello, TypeScript!  "
console.log("Alice,Bob,Charlie".split(",")); // ["Alice", "Bob", "Charlie"]

// Template literals
const name = "Faisal";
const age = 28;
console.log(`My name is ${name} and I am ${age} years old.`);
console.log(`2 + 2 = ${2 + 2}`); // expressions work inside ${}

// ----------------------------------------------------------
// 4. Type coercion — implicit conversions (dangerous!)
// ----------------------------------------------------------
// Loose equality (==) triggers coercion — AVOID
console.log(0 == false);   // true ← coercion
console.log("" == false);  // true ← coercion
console.log(null == undefined); // true ← special case
console.log(1 == "1");     // true ← coercion

// Strict equality (===) — no coercion — USE THIS
console.log(0 === false);   // false ✅
console.log("" === false);  // false ✅
console.log(null === undefined); // false ✅
console.log(1 === "1");     // false ✅

// String + number coercion
console.log("5" + 3);   // "53" — number coerced to string
console.log("5" - 3);   // 2   — string coerced to number
console.log("5" * "3"); // 15  — both coerced to number

// ----------------------------------------------------------
// 5. Explicit type conversion
// ----------------------------------------------------------
// To number
console.log(Number("42"));     // 42
console.log(Number("3.14"));   // 3.14
console.log(Number(""));       // 0
console.log(Number("hello"));  // NaN
console.log(parseInt("42px")); // 42 — stops at first non-numeric char
console.log(parseFloat("3.14em")); // 3.14

// To string
console.log(String(42));       // "42"
console.log(String(true));     // "true"
console.log(String(null));     // "null"
console.log((42).toString());  // "42"
console.log((255).toString(16)); // "ff" — hex

// To boolean
console.log(Boolean(0));         // false
console.log(Boolean(""));        // false
console.log(Boolean(null));      // false
console.log(Boolean(undefined)); // false
console.log(Boolean(NaN));       // false
// Everything else is truthy:
console.log(Boolean(1));         // true
console.log(Boolean("hello"));   // true
console.log(Boolean([]));        // true — empty array is truthy!
console.log(Boolean({}));        // true — empty object is truthy!

// ----------------------------------------------------------
// 6. Falsy values — memorize these 6
// ----------------------------------------------------------
const falsyValues = [0, "", null, undefined, NaN, false];
falsyValues.forEach(v => console.log(`${String(v)} is falsy: ${!v}`));

// ----------------------------------------------------------
// 7. null vs undefined
// ----------------------------------------------------------
let declared: string | undefined; // declared but not assigned → undefined
let explicit: string | null = null; // explicitly set to "no value"

console.log(declared);  // undefined
console.log(explicit);  // null

// Nullish coalescing — use default when null or undefined
const value = null;
console.log(value ?? "default"); // "default"
console.log(0 ?? "default");     // 0 — 0 is NOT null/undefined
console.log(0 || "default");     // "default" — || treats 0 as falsy (dangerous)

export {};
