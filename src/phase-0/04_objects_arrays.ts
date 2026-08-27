// ============================================================
// Phase 0 — 04: Objects & Arrays
// ============================================================
// Topics: object/array methods, destructuring, spread, rest
// Run: npx ts-node src/phase-0/04_objects_arrays.ts
// ============================================================

// ----------------------------------------------------------
// 1. Object basics
// ----------------------------------------------------------
const user = {
  id: 1,
  name: "Alice",
  age: 25,
  address: {
    city: "Jakarta",
    zip: "10110"
  }
};

// Access
console.log(user.name);           // "Alice"
console.log(user["age"]);         // 25
console.log(user.address.city);   // "Jakarta"

// Dynamic key access
const key = "name";
console.log(user[key as keyof typeof user]); // "Alice"

// ----------------------------------------------------------
// 2. Object destructuring
// ----------------------------------------------------------
const { name, age } = user;
console.log(name, age); // Alice 25

// Rename while destructuring
const { name: userName, age: userAge } = user;
console.log(userName, userAge); // Alice 25

// Default value
const { id, role = "member" } = user as typeof user & { role?: string };
console.log(id, role); // 1 member

// Nested destructuring
const { address: { city, zip } } = user;
console.log(city, zip); // Jakarta 10110

// Rest in object
const { name: n, ...rest } = user;
console.log(n);    // Alice
console.log(rest); // { id: 1, age: 25, address: {...} }

// ----------------------------------------------------------
// 3. Object spread
// ----------------------------------------------------------
const defaults = { theme: "light", lang: "en", fontSize: 14 };
const userPrefs = { lang: "id", fontSize: 16 };

// Later properties override earlier ones
const merged = { ...defaults, ...userPrefs };
console.log(merged); // { theme: "light", lang: "id", fontSize: 16 }

// Shallow copy
const original = { a: 1, nested: { b: 2 } };
const copy = { ...original };
copy.a = 99;
copy.nested.b = 99; // ⚠️ mutates original.nested — spread is shallow!
console.log(original.a);        // 1 ✅ primitive is copied
console.log(original.nested.b); // 99 ⚠️ reference is shared

// ----------------------------------------------------------
// 4. Array basics & common methods
// ----------------------------------------------------------
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map — transform each element, returns new array
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// filter — keep elements that pass the test
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4, 6, 8, 10]

// reduce — accumulate to a single value
const total = numbers.reduce((acc, n) => acc + n, 0);
console.log(total); // 55

// find — first element that matches
const firstOver5 = numbers.find(n => n > 5);
console.log(firstOver5); // 6

// findIndex
const idx = numbers.findIndex(n => n > 5);
console.log(idx); // 5

// some / every
console.log(numbers.some(n => n > 9));   // true — at least one
console.log(numbers.every(n => n > 0));  // true — all pass

// includes
console.log(numbers.includes(5)); // true

// flat & flatMap
const nested = [[1, 2], [3, 4], [5]];
console.log(nested.flat()); // [1, 2, 3, 4, 5]
console.log(numbers.flatMap(n => [n, n * 2]).slice(0, 6)); // [1, 2, 2, 4, 3, 6]

// ----------------------------------------------------------
// 5. Array destructuring
// ----------------------------------------------------------
const [first, second, ...remaining] = numbers;
console.log(first, second);    // 1 2
console.log(remaining.length); // 8

// Skip elements
const [, , third] = numbers;
console.log(third); // 3

// Swap variables
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1

// ----------------------------------------------------------
// 6. Array spread
// ----------------------------------------------------------
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];
console.log(combined); // [1, 2, 3, 4, 5, 6]

// Clone array (shallow)
const cloned = [...arr1];
cloned.push(99);
console.log(arr1);    // [1, 2, 3] — original unchanged
console.log(cloned);  // [1, 2, 3, 99]

// Spread into function args
function addThree(x: number, y: number, z: number): number {
  return x + y + z;
}
const args = [10, 20, 30] as const;
console.log(addThree(...args)); // 60

// ----------------------------------------------------------
// 7. Chaining array methods
// ----------------------------------------------------------
const products = [
  { name: "Laptop", price: 1200, inStock: true },
  { name: "Mouse", price: 25, inStock: false },
  { name: "Keyboard", price: 80, inStock: true },
  { name: "Monitor", price: 400, inStock: true },
  { name: "Headset", price: 60, inStock: false },
];

const affordableInStock = products
  .filter(p => p.inStock)
  .filter(p => p.price < 500)
  .map(p => p.name)
  .sort();

console.log(affordableInStock); // ["Keyboard", "Monitor"]

export {};
