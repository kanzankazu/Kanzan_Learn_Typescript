// ============================================================
// Phase 0 — 07: Modules
// ============================================================
// Topics: named exports, default exports, re-exports, dynamic import
// Run: npx ts-node src/phase-0/07_modules.ts
// ============================================================
// NOTE: This file demonstrates MODULE PATTERNS by example.
// Real multi-file modules would be split across separate files.
// ============================================================

// ----------------------------------------------------------
// 1. Named exports — multiple per file, imported by name
// ----------------------------------------------------------

// In a real file: math.ts
export function addNumbers(a: number, b: number): number { return a + b; }
export function subtractNumbers(a: number, b: number): number { return a - b; }
export const PI = 3.14159;

// In consumer file:
// import { addNumbers, PI } from "./math";
// import { addNumbers as add } from "./math"; // rename on import

// ----------------------------------------------------------
// 2. Default export — one per file, imported with any name
// ----------------------------------------------------------

// In a real file: logger.ts
class Logger {
  private prefix: string;
  constructor(prefix: string) { this.prefix = prefix; }
  log(msg: string): void { console.log(`[${this.prefix}] ${msg}`); }
  error(msg: string): void { console.error(`[${this.prefix}] ERROR: ${msg}`); }
}

export default Logger;

// In consumer file:
// import Logger from "./logger";       // can use any name
// import MyLogger from "./logger";     // same thing, different alias
// import Logger, { addNumbers } from "./mixed"; // default + named together

// ----------------------------------------------------------
// 3. Re-exports — aggregate multiple modules into one index
// ----------------------------------------------------------

// Pattern for index.ts barrel files:
// export { addNumbers, PI } from "./math";
// export { default as Logger } from "./logger";
// export * from "./utils"; // re-export everything

// Consumer only needs one import:
// import { addNumbers, Logger } from "./index";

// ----------------------------------------------------------
// 4. CommonJS vs ESM syntax
// ----------------------------------------------------------

// CommonJS (Node.js legacy, .cjs files):
//   const fs = require("fs");
//   const { readFile } = require("fs");
//   module.exports = { myFunc };
//   module.exports.default = MyClass;

// ES Modules (modern, .mjs or "type":"module" in package.json):
//   import fs from "fs";
//   import { readFile } from "fs";
//   export { myFunc };
//   export default MyClass;

// TypeScript always uses ESM syntax — compiled to CJS by default (tsconfig module: "commonjs")

// ----------------------------------------------------------
// 5. Dynamic import — lazy loading
// ----------------------------------------------------------
async function loadModuleLazily() {
  // Import only when needed — useful for code splitting
  // const { default: Logger } = await import("./logger");
  // const logger = new Logger("Lazy");
  // logger.log("Module loaded lazily");
  console.log("Dynamic import pattern — use: const mod = await import('./path')");
}
loadModuleLazily();

// ----------------------------------------------------------
// 6. Module resolution — how TypeScript finds files
// ----------------------------------------------------------
// Given: import { fn } from "./utils"
// TypeScript looks for (in order):
//   1. ./utils.ts
//   2. ./utils.tsx
//   3. ./utils.d.ts
//   4. ./utils/index.ts
//   5. ./utils/index.tsx
//   6. ./utils/index.d.ts

// For node_modules: import { fn } from "lodash"
//   Looks in node_modules/lodash, then node_modules/@types/lodash

// ----------------------------------------------------------
// 7. Path aliases (configured in tsconfig.json)
// ----------------------------------------------------------
// tsconfig.json:
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": {
//       "@/*": ["src/*"],
//       "@utils/*": ["src/utils/*"]
//     }
//   }
// }

// Usage:
// import { formatDate } from "@utils/date"; // instead of "../../../utils/date"

// ----------------------------------------------------------
// 8. Type-only imports (TypeScript 3.8+)
// ----------------------------------------------------------
// Use when you only need the type, not the runtime value
// import type { User } from "./types";
// export type { User };

// This ensures the import is erased at compile time — no runtime cost
// Useful when:
// - The imported symbol is only a type/interface
// - You want to avoid circular dependency issues
// - Building a library and marking peer dependencies

// ----------------------------------------------------------
// Demo: using the Logger class defined above
// ----------------------------------------------------------
const logger = new Logger("Phase0");
logger.log("Modules demo complete");
logger.log(`addNumbers(2, 3) = ${addNumbers(2, 3)}`);
logger.log(`PI = ${PI}`);

export {};
