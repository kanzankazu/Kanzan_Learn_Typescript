// ============================================================
// Phase 0 — 01: Variables (var / let / const)
// ============================================================
// Topics: var vs let vs const, scope, hoisting, temporal dead zone
// Run: npx ts-node src/phase-0/01_variables.ts
// ============================================================

// ----------------------------------------------------------
// 1. var — function-scoped, hoisted, re-declarable (avoid)
// ----------------------------------------------------------
function demoVar() {
  console.log(x); // undefined — var is hoisted (declaration only, not value)
  var x = 10;
  console.log(x); // 10

  if (true) {
    var x = 99; // same variable — var ignores block scope
    console.log(x); // 99
  }
  console.log(x); // 99 — still 99, var leaked out of the if-block
}
demoVar();

// ----------------------------------------------------------
// 2. let — block-scoped, hoisted but NOT initialized (TDZ)
// ----------------------------------------------------------
function demoLet() {
  // console.log(y); // ❌ ReferenceError: Cannot access 'y' before initialization
  let y = 10;
  console.log(y); // 10

  if (true) {
    let y = 99; // different variable — block-scoped
    console.log(y); // 99
  }
  console.log(y); // 10 — original y unchanged
}
demoLet();

// ----------------------------------------------------------
// 3. const — block-scoped, must be initialized, cannot be reassigned
// ----------------------------------------------------------
function demoConst() {
  const PI = 3.14159;
  // PI = 3; // ❌ TypeError: Assignment to constant variable

  // const with objects — the reference is const, not the content
  const user = { name: "Alice", age: 25 };
  user.name = "Bob"; // ✅ mutating properties is allowed
  // user = {}; // ❌ reassigning the variable itself is not allowed
  console.log(user); // { name: "Bob", age: 25 }

  // const with arrays
  const nums = [1, 2, 3];
  nums.push(4); // ✅ mutating the array is allowed
  // nums = []; // ❌ not allowed
  console.log(nums); // [1, 2, 3, 4]
}
demoConst();

// ----------------------------------------------------------
// 4. Scope comparison
// ----------------------------------------------------------
// Global scope
const globalVar = "I am global";

function outerScope() {
  const outerVar = "I am outer";

  function innerScope() {
    const innerVar = "I am inner";
    console.log(globalVar); // ✅ accessible
    console.log(outerVar);  // ✅ accessible (closure)
    console.log(innerVar);  // ✅ accessible
  }

  innerScope();
  // console.log(innerVar); // ❌ not accessible — block-scoped to innerScope
}
outerScope();

// ----------------------------------------------------------
// 5. Loop scope difference
// ----------------------------------------------------------
// var in loop — all callbacks share the SAME i
const varFunctions: (() => void)[] = [];
for (var i = 0; i < 3; i++) {
  varFunctions.push(() => console.log("var i:", i));
}
varFunctions.forEach(fn => fn()); // prints 3, 3, 3 — all share final i

// let in loop — each iteration gets its OWN i
const letFunctions: (() => void)[] = [];
for (let j = 0; j < 3; j++) {
  letFunctions.push(() => console.log("let j:", j));
}
letFunctions.forEach(fn => fn()); // prints 0, 1, 2 ✅

// ----------------------------------------------------------
// 6. Best practices
// ----------------------------------------------------------
// ✅ Use const by default
// ✅ Use let when you need to reassign
// ❌ Avoid var — confusing scoping behavior

export {}; // make this a module to avoid global scope conflicts
