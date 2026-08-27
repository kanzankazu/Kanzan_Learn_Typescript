// ============================================================
// Phase 4 — 02: Module System
// ============================================================
// Topics: named exports, default exports, re-exports,
//         barrel files, dynamic import, ESM vs CommonJS,
//         type-only imports, circular dependency patterns
// Run: npx ts-node src/phase-4/02_module_system.ts
// ============================================================

// ----------------------------------------------------------
// 1. Named exports — multiple per file, import by exact name
// ----------------------------------------------------------

// math.ts would look like:
export function add(a: number, b: number): number { return a + b; }
export function subtract(a: number, b: number): number { return a - b; }
export function multiply(a: number, b: number): number { return a * b; }
export function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}
export const PI = 3.14159265358979;
export const E  = 2.71828182845904;

// Consumer:
// import { add, PI } from "./math";
// import { add as sum, PI } from "./math";  // rename on import
// import * as math from "./math";           // import all as namespace
//   math.add(1, 2)
//   math.PI

console.log("add(3, 4):", add(3, 4));         // 7
console.log("multiply(3, 4):", multiply(3, 4)); // 12

// ----------------------------------------------------------
// 2. Default export — one per file, import with any name
// ----------------------------------------------------------

class Logger {
  constructor(private prefix: string) {}
  log(msg: string):   void { console.log(`[${this.prefix}] ${msg}`); }
  warn(msg: string):  void { console.warn(`[${this.prefix}] WARN: ${msg}`); }
  error(msg: string): void { console.error(`[${this.prefix}] ERROR: ${msg}`); }
}
export default Logger;

// Consumer:
// import Logger from "./logger";        // ← any name works
// import AppLogger from "./logger";     // same module, different alias
// import Logger, { add } from "./mixed"; // default + named together

const logger = new Logger("Phase4");
logger.log("Module system demo started");

// ----------------------------------------------------------
// 3. Re-exports — aggregate into a single entry point
// ----------------------------------------------------------

// This pattern (barrel file) is common in src/index.ts:
//
// export { add, subtract, PI }    from "./math";
// export { default as Logger }    from "./logger";
// export * from "./utils";         // re-export everything
// export * as validators from "./validators"; // namespace re-export
//
// Consumer only needs ONE import path:
// import { add, Logger, formatDate } from "./index";

// ----------------------------------------------------------
// 4. ESM vs CommonJS — side by side
// ----------------------------------------------------------

// ── CommonJS (Node.js traditional) ─────────────────────
//
// Synchronous, loads at require() call time
//
//   // Importing
//   const fs = require("fs");
//   const { readFile } = require("fs");
//   const myModule = require("./my-module");
//
//   // Exporting
//   module.exports = { myFunction, MyClass };
//   module.exports.helper = helperFn;
//   module.exports = MyClass;   // default-style
//
//   // Checking if run directly
//   if (require.main === module) { main(); }

// ── ES Modules (modern standard) ───────────────────────
//
// Asynchronous, statically analyzed, tree-shakeable
//
//   // Importing
//   import fs from "fs";
//   import { readFile } from "fs";
//   import * as path from "path";
//   import type { User } from "./types"; // type-only — erased at compile
//
//   // Exporting
//   export { myFunction, MyClass };
//   export default MyClass;
//   export const PI = 3.14;
//
//   // Check if entry point (ESM equivalent)
//   import { fileURLToPath } from "url";
//   if (process.argv[1] === fileURLToPath(import.meta.url)) { main(); }

// Key differences:
// ┌─────────────────────┬─────────────────────┬─────────────────────┐
// │ Feature             │ CommonJS             │ ESM                 │
// ├─────────────────────┼─────────────────────┼─────────────────────┤
// │ Load time           │ Synchronous          │ Asynchronous        │
// │ Tree shaking        │ ❌ Cannot             │ ✅ Supported         │
// │ Circular deps       │ Partial support      │ Live bindings       │
// │ Dynamic import      │ require() always     │ import() async      │
// │ Top-level await     │ ❌ Not supported      │ ✅ Supported         │
// │ __dirname           │ ✅ Available          │ ❌ Use import.meta   │
// │ File extension      │ .cjs or default      │ .mjs or type:module │
// └─────────────────────┴─────────────────────┴─────────────────────┘

// ----------------------------------------------------------
// 5. Type-only imports (TypeScript 3.8+)
// ----------------------------------------------------------

// Use when you ONLY need the type, not the value.
// The import is completely erased at compile time.

// import type { User } from "./user.model";
// import type { Repository } from "./repository";
// export type { User, Repository };

// Why use it?
// ① Avoids accidental runtime dependency on type-only files
// ② Required by esbuild/SWC (isolatedModules: true)
// ③ Clearer intent — reader knows this import has no side effects
// ④ Prevents circular dependency issues in some cases

// ----------------------------------------------------------
// 6. Dynamic import — lazy loading
// ----------------------------------------------------------

async function loadModuleOnDemand() {
  // ✅ Dynamic import — only loads when called
  // Useful for: code splitting, conditional loading, reducing startup time
  const { add: dynamicAdd } = await import("./02_module_system");

  // The module is loaded asynchronously
  console.log("Dynamic import result:", dynamicAdd(10, 20)); // 30
}

// loadModuleOnDemand(); // uncomment to test

// In browsers/bundlers: modules are split into separate chunks
// In Node.js: file is read from disk on demand

// ----------------------------------------------------------
// 7. Barrel files — index.ts pattern
// ----------------------------------------------------------

// Project structure:
// src/
// ├── models/
// │   ├── user.ts         export interface User { ... }
// │   ├── product.ts      export interface Product { ... }
// │   └── index.ts        ← BARREL FILE
// │       export * from "./user";
// │       export * from "./product";
// │
// └── app.ts
//     import { User, Product } from "./models"; ← clean single import

// ----------------------------------------------------------
// 8. Module augmentation — extend existing module types
// ----------------------------------------------------------

// Extend Express Request to add custom properties:
// declare module "express" {
//   interface Request {
//     user?: { id: number; role: string };
//     requestId: string;
//   }
// }
//
// Extend global process.env:
// declare namespace NodeJS {
//   interface ProcessEnv {
//     NODE_ENV: "development" | "staging" | "production";
//     DATABASE_URL: string;
//     JWT_SECRET: string;
//     PORT?: string;
//   }
// }

// ----------------------------------------------------------
// 9. Circular dependency — how to handle
// ----------------------------------------------------------

// ❌ Problem: A imports B, B imports A
// This can cause "undefined" at runtime in CommonJS

// ✅ Solution 1: Extract shared types to a third file C
//   A → C, B → C  (no circular)

// ✅ Solution 2: Use type-only imports for the circular part
//   import type { SomeType } from "./moduleA"; // type-only: no runtime value

// ✅ Solution 3: Use dependency injection
//   Instead of importing B in A, pass B as a parameter

// ----------------------------------------------------------
// 10. __dirname / __filename in ESM
// ----------------------------------------------------------

// CommonJS (available by default):
//   console.log(__dirname);  // absolute path to current directory
//   console.log(__filename); // absolute path to current file

// ESM (manual):
//   import { fileURLToPath } from "url";
//   import { dirname } from "path";
//   const __filename = fileURLToPath(import.meta.url);
//   const __dirname  = dirname(__filename);

// With ts-node and CommonJS (our setup), __dirname works:
console.log("Current directory:", __dirname);
console.log("Current file:", __filename);

logger.log("Module system demo complete ✅");

export {};
