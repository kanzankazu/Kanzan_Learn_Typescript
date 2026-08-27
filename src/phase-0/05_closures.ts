// ============================================================
// Phase 0 — 05: Closures
// ============================================================
// Topics: scope chain, closures, practical patterns, memory
// Run: npx ts-node src/phase-0/05_closures.ts
// ============================================================

// ----------------------------------------------------------
// 1. What is a closure?
// ----------------------------------------------------------
// A closure is a function that "remembers" its surrounding scope
// even after the outer function has finished executing.

function makeGreeter(greeting: string) {
  // 'greeting' lives in makeGreeter's scope
  return function (name: string): string {
    // inner function closes over 'greeting' — it remembers it
    return `${greeting}, ${name}!`;
  };
}

const sayHello = makeGreeter("Hello");
const sayHi    = makeGreeter("Hi");

console.log(sayHello("Alice")); // Hello, Alice!
console.log(sayHi("Bob"));     // Hi, Bob!
// makeGreeter has returned, but 'greeting' is still accessible

// ----------------------------------------------------------
// 2. Counter — closure as private state
// ----------------------------------------------------------
function makeCounter(initial: number = 0) {
  let count = initial; // private — not accessible from outside

  return {
    increment(): number { return ++count; },
    decrement(): number { return --count; },
    reset():    void    { count = initial; },
    getCount(): number  { return count; }
  };
}

const counter = makeCounter(10);
console.log(counter.increment()); // 11
console.log(counter.increment()); // 12
console.log(counter.decrement()); // 11
counter.reset();
console.log(counter.getCount()); // 10

// Each call to makeCounter creates an independent closure
const counter2 = makeCounter(0);
counter2.increment();
console.log(counter.getCount()); // 10 — unaffected
console.log(counter2.getCount()); // 1 — independent

// ----------------------------------------------------------
// 3. Memoization — caching expensive results with closures
// ----------------------------------------------------------
function memoize<T extends unknown[], R>(fn: (...args: T) => R): (...args: T) => R {
  const cache = new Map<string, R>();

  return (...args: T): R => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(`[cache hit] key=${key}`);
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

function slowAdd(a: number, b: number): number {
  // Simulate expensive computation
  return a + b;
}

const fastAdd = memoize(slowAdd);
console.log(fastAdd(2, 3)); // computed: 5
console.log(fastAdd(2, 3)); // [cache hit]: 5
console.log(fastAdd(4, 5)); // computed: 9

// ----------------------------------------------------------
// 4. Partial application — fix some arguments
// ----------------------------------------------------------
function multiply(a: number, b: number): number {
  return a * b;
}

function partial<T extends unknown[], R>(
  fn: (...args: T) => R,
  ...presetArgs: Partial<T>
): (...remainingArgs: unknown[]) => R {
  return (...remainingArgs: unknown[]) =>
    fn(...([...presetArgs, ...remainingArgs] as T));
}

const double = partial(multiply, 2);
const triple = partial(multiply, 3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
console.log(double(10)); // 20

// ----------------------------------------------------------
// 5. Module pattern — encapsulate state with closures
// ----------------------------------------------------------
const bankAccount = (() => {
  // Private state — not accessible from outside
  let balance = 0;
  const transactions: { type: string; amount: number }[] = [];

  // Public API
  return {
    deposit(amount: number): void {
      if (amount <= 0) throw new Error("Deposit must be positive");
      balance += amount;
      transactions.push({ type: "deposit", amount });
    },
    withdraw(amount: number): void {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      transactions.push({ type: "withdrawal", amount });
    },
    getBalance(): number {
      return balance;
    },
    getHistory(): typeof transactions {
      return [...transactions]; // return a copy — not the original
    }
  };
})();

bankAccount.deposit(1000);
bankAccount.deposit(500);
bankAccount.withdraw(200);
console.log(bankAccount.getBalance()); // 1300
console.log(bankAccount.getHistory()); // all 3 transactions

// ----------------------------------------------------------
// 6. Common pitfall: closures in loops
// ----------------------------------------------------------
// ❌ Classic var bug — all callbacks share the same 'i'
const buggy: (() => number)[] = [];
for (var i = 0; i < 3; i++) {
  buggy.push(() => i); // captures reference to 'i', not the value
}
console.log(buggy.map(fn => fn())); // [3, 3, 3] — all same!

// ✅ Fix 1: use let — each iteration gets its own 'i'
const fixed1: (() => number)[] = [];
for (let j = 0; j < 3; j++) {
  fixed1.push(() => j);
}
console.log(fixed1.map(fn => fn())); // [0, 1, 2] ✅

// ✅ Fix 2: use IIFE to capture current value
const fixed2: (() => number)[] = [];
for (var k = 0; k < 3; k++) {
  fixed2.push(((capturedK: number) => () => capturedK)(k));
}
console.log(fixed2.map(fn => fn())); // [0, 1, 2] ✅

export {};
