// ============================================================
// Phase 0 — 03: Functions
// ============================================================
// Topics: declaration, expression, arrow, this binding, IIFE
// Run: npx ts-node src/phase-0/03_functions.ts
// ============================================================

// ----------------------------------------------------------
// 1. Function declaration — hoisted, callable before declaration
// ----------------------------------------------------------
console.log(add(2, 3)); // ✅ 5 — works because it's hoisted

function add(a: number, b: number): number {
  return a + b;
}

// ----------------------------------------------------------
// 2. Function expression — NOT hoisted
// ----------------------------------------------------------
// console.log(multiply(2, 3)); // ❌ ReferenceError — not hoisted
const multiply = function (a: number, b: number): number {
  return a * b;
};
console.log(multiply(2, 3)); // 6

// Named function expression (useful for recursion / stack traces)
const factorial = function fact(n: number): number {
  return n <= 1 ? 1 : n * fact(n - 1);
};
console.log(factorial(5)); // 120

// ----------------------------------------------------------
// 3. Arrow functions — concise, no own 'this'
// ----------------------------------------------------------
const square = (n: number): number => n * n;
const greet = (name: string): string => `Hello, ${name}!`;
const doNothing = (): void => { /* no return */ };

// Multi-line arrow
const divide = (a: number, b: number): number => {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
};

console.log(square(4));       // 16
console.log(greet("Faisal")); // Hello, Faisal!
console.log(divide(10, 2));   // 5

// ----------------------------------------------------------
// 4. Default & optional parameters
// ----------------------------------------------------------
function createUser(name: string, role: string = "member", age?: number): string {
  const ageInfo = age !== undefined ? `, age: ${age}` : "";
  return `${name} (${role}${ageInfo})`;
}

console.log(createUser("Alice"));              // Alice (member)
console.log(createUser("Bob", "admin"));       // Bob (admin)
console.log(createUser("Charlie", "owner", 30)); // Charlie (owner, age: 30)

// ----------------------------------------------------------
// 5. Rest parameters — gather remaining args into an array
// ----------------------------------------------------------
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

console.log(sum(1, 2, 3));       // 6
console.log(sum(10, 20, 30, 40)); // 100

function logAll(label: string, ...values: unknown[]): void {
  console.log(`[${label}]`, ...values);
}
logAll("DEBUG", "message", 42, true); // [DEBUG] message 42 true

// ----------------------------------------------------------
// 6. 'this' binding — the most confusing part of JS
// ----------------------------------------------------------

// Regular function — 'this' is determined by how it's CALLED
const timer = {
  count: 0,
  // ❌ Arrow function as method — 'this' is NOT the object
  startArrow: () => {
    // 'this' here is the enclosing scope (module scope), not 'timer'
    console.log("Arrow this:", typeof (globalThis as Record<string, unknown>).count); // undefined
  },
  // ✅ Regular function as method — 'this' IS the object
  startRegular() {
    this.count++;
    console.log("Regular this.count:", this.count); // 1
  }
};
timer.startArrow();
timer.startRegular();

// 'this' lost when method is extracted
const extracted = timer.startRegular;
// extracted(); // would log NaN or throw in strict mode — 'this' is undefined

// Fix with bind
const bound = timer.startRegular.bind(timer);
bound(); // ✅ this.count is now 2

// Arrow functions INHERIT 'this' from surrounding scope — useful in class methods
class Counter {
  count = 0;

  startWithArrow() {
    // Arrow preserves 'this' from startWithArrow's context
    const tick = () => {
      this.count++; // ✅ 'this' is the Counter instance
    };
    tick();
    tick();
    console.log("Counter:", this.count); // 2
  }
}
new Counter().startWithArrow();

// ----------------------------------------------------------
// 7. Higher-order functions — functions that take/return functions
// ----------------------------------------------------------
// Takes a function as argument
function applyTwice(fn: (x: number) => number, value: number): number {
  return fn(fn(value));
}
console.log(applyTwice(x => x * 2, 3)); // 12 — (3*2)*2

// Returns a function (factory / closure)
function makeMultiplier(factor: number): (n: number) => number {
  return (n) => n * factor; // 'factor' is captured via closure
}
const triple = makeMultiplier(3);
const double = makeMultiplier(2);
console.log(triple(7)); // 21
console.log(double(7)); // 14

// ----------------------------------------------------------
// 8. IIFE — Immediately Invoked Function Expression
// ----------------------------------------------------------
const result = (() => {
  const x = 10;
  const y = 20;
  return x + y;
})();
console.log("IIFE result:", result); // 30

export {};
