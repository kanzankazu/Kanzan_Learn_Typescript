// ============================================================
// Phase 4 — 01: tsconfig.json Deep Dive
// ============================================================
// This file explains every important tsconfig.json option
// with runnable demos where applicable.
//
// Run: npx ts-node src/phase-4/01_tsconfig.ts
// ============================================================

// ----------------------------------------------------------
// SECTION A: The tsconfig.json file itself (reference)
// ----------------------------------------------------------
// Below is a well-annotated tsconfig.json for a Node.js project.
// Read the comments — each option is explained.
//
// {
//   "compilerOptions": {
//
//     // ── OUTPUT TARGET ──────────────────────────────────
//     "target": "ES2020",
//     // The JavaScript version TypeScript compiles TO.
//     // ES2020 supports: optional chaining ?., nullish coalescing ??,
//     // BigInt, Promise.allSettled, globalThis.
//     // Use ES2022 for class fields & top-level await.
//     // Older targets = more polyfills needed.
//
//     // ── MODULE SYSTEM ──────────────────────────────────
//     "module": "commonjs",
//     // Output module format. Options:
//     //   "commonjs"  — require/module.exports  (Node.js default)
//     //   "ESNext"    — import/export           (modern bundlers: Vite, esbuild)
//     //   "NodeNext"  — Node.js native ESM (requires .mjs or "type":"module")
//     //   "None"      — no module system (single file scripts)
//
//     "moduleResolution": "node",
//     // How TypeScript finds imported files.
//     //   "node"     — mimics Node.js require() resolution (for commonjs)
//     //   "bundler"  — for Vite/esbuild (TypeScript 5.0+)
//     //   "NodeNext" — for Node.js native ESM
//
//     // ── LIBRARY TYPES ──────────────────────────────────
//     "lib": ["ES2020"],
//     // Type definitions to include. Add "DOM" for browser APIs.
//     // Examples:
//     //   ["ES2020"]         — Node.js (no DOM)
//     //   ["ES2020", "DOM"]  — Browser / fullstack
//     //   ["ES2020", "DOM", "DOM.Iterable"] — with iterable collections
//
//     // ── OUTPUT PATHS ───────────────────────────────────
//     "outDir": "./dist",
//     // Where compiled JS files go. Keep source in src/, output in dist/.
//
//     "rootDir": "./src",
//     // The root of your source files. TypeScript mirrors this structure in outDir.
//
//     "baseUrl": ".",
//     // Required for path aliases. Makes all imports relative to this directory.
//
//     "paths": {
//       "@/*":           ["src/*"],
//       "@utils/*":      ["src/utils/*"],
//       "@components/*": ["src/components/*"]
//     },
//     // Path aliases. import { fn } from "@utils/date" → src/utils/date.ts
//     // NOTE: paths only affect type checking. For runtime, use a bundler plugin
//     // or tsconfig-paths with ts-node.
//
//     // ── STRICT MODE ────────────────────────────────────
//     "strict": true,
//     // Enables ALL strict checks at once. Equivalent to:
//     //   "noImplicitAny": true,          — error if type can't be inferred
//     //   "strictNullChecks": true,       — null/undefined are separate types
//     //   "strictFunctionTypes": true,    — stricter function parameter checking
//     //   "strictBindCallApply": true,    — bind/call/apply are type-checked
//     //   "strictPropertyInitialization": true, — class props must be set in constructor
//     //   "noImplicitThis": true,         — 'this' must have explicit type
//     //   "alwaysStrict": true,           — emits "use strict" in all files
//
//     // ── QUALITY CHECKS ─────────────────────────────────
//     "noUnusedLocals": true,
//     // Error when a local variable is declared but never used.
//
//     "noUnusedParameters": true,
//     // Error when a function parameter is never used.
//     // Workaround: prefix unused params with _ (e.g., _event)
//
//     "noImplicitReturns": true,
//     // Error when a function can return without a value in some branches.
//
//     "noFallthroughCasesInSwitch": true,
//     // Error when a switch case falls through to the next case without break/return.
//
//     "exactOptionalPropertyTypes": true,
//     // Distinguishes between { a?: string } and { a?: string | undefined }
//     // More strict — opt in when you're ready.
//
//     // ── EMIT OPTIONS ───────────────────────────────────
//     "declaration": true,
//     // Generate .d.ts files alongside .js files. Required for publishing libraries.
//
//     "declarationMap": true,
//     // Generate .d.ts.map files — enables "Go to Definition" to jump to .ts source.
//
//     "sourceMap": true,
//     // Generate .js.map files — enables debugging original TS in browser/Node.js.
//
//     "removeComments": false,
//     // Strip comments from emitted JS. Keep false for libraries (docs!).
//
//     "noEmit": false,
//     // If true, TypeScript type-checks but emits NO files.
//     // Useful with a bundler that handles compilation (e.g., esbuild, swc).
//
//     // ── INTEROP ────────────────────────────────────────
//     "esModuleInterop": true,
//     // Allows: import React from "react" (instead of import * as React)
//     // Generates helper code for CommonJS default imports.
//     // ALWAYS enable this — it's standard practice.
//
//     "allowSyntheticDefaultImports": true,
//     // Required when esModuleInterop is true. Allows default imports
//     // from modules that don't have a default export.
//
//     "resolveJsonModule": true,
//     // Allows: import config from "./config.json"
//     // TypeScript will infer the exact type from the JSON file.
//
//     "allowJs": false,
//     // Allow .js files in the compilation.
//     // Useful when migrating a JS project to TypeScript gradually.
//
//     "checkJs": false,
//     // Type-check .js files (requires allowJs: true).
//
//     // ── MISC ───────────────────────────────────────────
//     "skipLibCheck": true,
//     // Skip type checking of .d.ts files in node_modules.
//     // Speeds up compilation. Generally safe — lib authors should fix their types.
//
//     "forceConsistentCasingInFileNames": true,
//     // Error on inconsistent file name casing: import "./User" vs import "./user"
//     // Critical on case-sensitive filesystems (Linux, CI/CD).
//
//     "experimentalDecorators": true,
//     // Enable decorator syntax (@Component, @Injectable).
//     // Required for: Angular, NestJS, TypeORM, MobX.
//     // Note: Stage 3 decorators (TC39) use a different config.
//
//     "emitDecoratorMetadata": true,
//     // Emit type metadata for decorators (used by NestJS DI, TypeORM).
//     // Requires: reflect-metadata package.
//
//     "isolatedModules": true,
//     // Ensure each file can be transpiled independently.
//     // Required by esbuild, SWC, and other single-file transpilers.
//   },
//
//   "include": ["src/**/*"],
//   // Which files to include. Globs supported.
//
//   "exclude": ["node_modules", "dist", "**/*.test.ts"],
//   // Which files to exclude. node_modules is excluded by default.
//
//   "references": [
//     { "path": "./packages/shared" }
//   ]
//   // Project references — for monorepo setups with multiple tsconfigs.
// }

// ----------------------------------------------------------
// SECTION B: Runnable demos of key behaviors
// ----------------------------------------------------------

// ── 1. strictNullChecks effect ──────────────────────────
function withoutNullCheck(name: string | null): string {
  // Without strict: no error, but crashes at runtime if name is null
  // With strict:    TypeScript forces you to handle null
  if (name === null) return "Anonymous";
  return name.toUpperCase(); // TS knows name is string here
}
console.log(withoutNullCheck("Alice")); // ALICE
console.log(withoutNullCheck(null));    // Anonymous

// ── 2. noImplicitAny effect ─────────────────────────────
// Without noImplicitAny:
//   function process(data) { ... }  ← data is implicitly 'any'
// With noImplicitAny (via strict):
//   Must annotate: function process(data: unknown) { ... }

function processData(data: unknown): string {
  if (typeof data === "string") return data.toUpperCase();
  if (typeof data === "number") return data.toFixed(2);
  return String(data);
}
console.log(processData("hello")); // HELLO
console.log(processData(3.14));    // 3.14

// ── 3. resolveJsonModule demo ───────────────────────────
// With "resolveJsonModule": true you can do:
//   import packageJson from "../package.json";
//   console.log(packageJson.version); // TypeScript knows the shape!
//
// Without it: TS error "Cannot find module '../package.json'"

// ── 4. paths alias demo ─────────────────────────────────
// With paths configured:
//   import { formatDate } from "@utils/date";
// Instead of:
//   import { formatDate } from "../../utils/date";
//
// For runtime resolution with ts-node, add to package.json:
//   "scripts": { "dev": "ts-node -r tsconfig-paths/register src/index.ts" }

// ── 5. declaration output ───────────────────────────────
// Running: npx tsc
// Generates in dist/:
//   01_tsconfig.js      ← compiled JavaScript
//   01_tsconfig.d.ts    ← type declarations (with "declaration": true)
//   01_tsconfig.js.map  ← source map (with "sourceMap": true)

// ── 6. Target differences ───────────────────────────────
// With "target": "ES5"   → async/await compiles to state machines
// With "target": "ES2017" → async/await stays as-is (native support)
// With "target": "ES2020" → optional chaining ?. and ?? stay as-is

const user = { profile: null as { name: string } | null };
const name = user.profile?.name ?? "Guest"; // stays as-is in ES2020+
console.log("Target demo:", name); // Guest

// ── 7. Multiple tsconfig files (common pattern) ─────────
// tsconfig.json          ← base config (shared settings)
// tsconfig.build.json    ← production build (includes: src, exclude: tests)
// tsconfig.test.json     ← test config (includes: src + tests)
//
// Example tsconfig.build.json:
// {
//   "extends": "./tsconfig.json",
//   "include": ["src/**/*"],
//   "exclude": ["**/*.test.ts", "**/*.spec.ts"]
// }

console.log("\ntsconfig.json deep dive complete ✅");
console.log("Key takeaways:");
console.log("  • Always use strict: true");
console.log("  • Use esModuleInterop: true for compatibility");
console.log("  • Use paths for cleaner imports");
console.log("  • Use declaration: true when building a library");

export {};
