// ============================================================
// Phase 4 — 03: Declaration Files (.d.ts)
// ============================================================
// Topics: what .d.ts files are, writing declarations,
//         declare module, declare global, DefinitelyTyped,
//         global augmentation, ambient modules
// Run: npx ts-node src/phase-4/03_declaration_files.ts
// ============================================================

// ----------------------------------------------------------
// 1. What are .d.ts files?
// ----------------------------------------------------------
// Declaration files (.d.ts) describe the TYPE SHAPE of existing JavaScript code.
// They contain NO runtime code — only type declarations.
// TypeScript uses them to type-check code that uses the described module.
//
// You'll encounter them in 3 scenarios:
//   A. Auto-generated from your own TypeScript ("declaration": true in tsconfig)
//   B. Shipped with a npm package that's already written in TypeScript
//   C. Installed from @types/* for packages written in JavaScript

// ----------------------------------------------------------
// 2. Example: what a .d.ts looks like
// ----------------------------------------------------------
//
// Imagine a JavaScript library "calc-lib" with no TypeScript support.
// You'd write: src/types/calc-lib.d.ts
//
// declare module "calc-lib" {
//   // Functions
//   export function add(a: number, b: number): number;
//   export function subtract(a: number, b: number): number;
//
//   // Constants
//   export const VERSION: string;
//
//   // Types
//   export type Operation = "add" | "subtract" | "multiply" | "divide";
//
//   // Interfaces
//   export interface CalcOptions {
//     precision?: number;
//     rounding?:  "up" | "down" | "nearest";
//   }
//
//   // Class
//   export class Calculator {
//     constructor(options?: CalcOptions);
//     compute(op: Operation, a: number, b: number): number;
//   }
//
//   // Default export
//   export default Calculator;
// }

// ----------------------------------------------------------
// 3. declare module — type an untyped JS library
// ----------------------------------------------------------
//
// File: src/types/legacy-auth.d.ts
//
// declare module "legacy-auth" {
//   export function login(username: string, password: string): Promise<{
//     token: string;
//     expiresAt: number;
//   }>;
//
//   export function logout(token: string): Promise<void>;
//
//   export function verify(token: string): { userId: number; role: string } | null;
// }
//
// Now TypeScript understands the library:
// import { login, verify } from "legacy-auth";
// const session = await login("user", "pass"); // session.token is string ✅

// ----------------------------------------------------------
// 4. declare global — add to global scope
// ----------------------------------------------------------
//
// Useful for:
//   - Global utilities injected by a framework
//   - Browser globals (window.myLib)
//   - Node.js globals (__appConfig, logger, etc.)
//
// File: src/types/globals.d.ts
//
// declare global {
//   // Add property to Window object
//   interface Window {
//     __APP_CONFIG__: {
//       apiUrl:    string;
//       version:   string;
//       featureFlags: Record<string, boolean>;
//     };
//     gtag?: (...args: unknown[]) => void; // Google Analytics
//   }
//
//   // Add global function/variable (without window. prefix)
//   var __DEV__: boolean;
//   function sleep(ms: number): Promise<void>;
//
//   // Extend NodeJS namespace
//   namespace NodeJS {
//     interface ProcessEnv {
//       NODE_ENV: "development" | "staging" | "production";
//       DATABASE_URL: string;
//       JWT_SECRET:   string;
//       PORT?:        string;
//       REDIS_URL?:   string;
//     }
//   }
// }
//
// export {}; // IMPORTANT: makes this file a module (required for declare global)

// ----------------------------------------------------------
// 5. Augmenting third-party types (declaration merging)
// ----------------------------------------------------------
//
// Extend Express Request to carry authenticated user:
//
// File: src/types/express.d.ts
//
// import "express";
//
// declare module "express" {
//   interface Request {
//     user?: {
//       id:    number;
//       email: string;
//       role:  "admin" | "user";
//     };
//     requestId: string;
//     startTime: number;
//   }
// }
//
// Now in your middleware:
// app.use((req, res, next) => {
//   req.requestId = crypto.randomUUID(); // ✅ TypeScript knows this field
//   next();
// });

// ----------------------------------------------------------
// 6. Ambient declarations — typing non-module JS
// ----------------------------------------------------------
//
// For global scripts (non-module JS loaded via <script> in browser):
//
// File: src/types/jquery.d.ts (simplified)
//
// declare function $(selector: string): {
//   hide(): void;
//   show(): void;
//   on(event: string, handler: () => void): void;
//   val(): string;
//   val(newValue: string): void;
// };
//
// declare namespace $ {
//   function ajax(options: { url: string; success: (data: unknown) => void }): void;
// }

// ----------------------------------------------------------
// 7. DefinitelyTyped — @types/* packages
// ----------------------------------------------------------
//
// When a JS library doesn't ship TypeScript types, the community
// maintains type definitions at https://github.com/DefinitelyTyped/DefinitelyTyped
//
// Install types for a package:
//   npm install -D @types/node     # Node.js built-ins
//   npm install -D @types/express  # Express framework
//   npm install -D @types/lodash   # Lodash
//
// TypeScript auto-discovers @types/* packages — no config needed.
//
// Packages that SHIP their own types (no @types needed):
//   - TypeScript itself
//   - Most modern packages: zod, axios, prisma, trpc, vitest, etc.
//   - Look for "types" or "typings" field in package.json

// ----------------------------------------------------------
// 8. auto-generated .d.ts from your code (with "declaration": true)
// ----------------------------------------------------------
//
// Given this TypeScript file:
//
// // src/utils/date.ts
// export function formatDate(date: Date, locale = "en-US"): string {
//   return date.toLocaleDateString(locale);
// }
//
// Running `npx tsc` generates:
//
// // dist/utils/date.d.ts
// export declare function formatDate(date: Date, locale?: string): string;
//
// // dist/utils/date.js
// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.formatDate = void 0;
// function formatDate(date, locale = "en-US") {
//   return date.toLocaleDateString(locale);
// }
// exports.formatDate = formatDate;

// ----------------------------------------------------------
// 9. Practical: type-safe environment variables
// ----------------------------------------------------------

// Create src/types/env.d.ts with this content:
//
// declare namespace NodeJS {
//   interface ProcessEnv {
//     readonly NODE_ENV:     "development" | "staging" | "production";
//     readonly DATABASE_URL: string;
//     readonly JWT_SECRET:   string;
//     readonly PORT?:        string;
//     readonly CORS_ORIGIN?: string;
//   }
// }

// Then in your code:
function getPort(): number {
  const port = process.env.PORT; // TypeScript knows PORT is string | undefined
  return port ? parseInt(port, 10) : 3000;
}
console.log("Port:", getPort());

function getEnvironment(): string {
  return process.env.NODE_ENV ?? "development";
}
console.log("Environment:", getEnvironment());

// ----------------------------------------------------------
// 10. Module type declarations — file type assertions
// ----------------------------------------------------------
//
// Tell TypeScript how to handle non-standard file imports:
//
// File: src/types/assets.d.ts
//
// // CSS Modules
// declare module "*.module.css" {
//   const classes: Record<string, string>;
//   export default classes;
// }
//
// // SVG as React component (with SVGR)
// declare module "*.svg" {
//   import React from "react";
//   export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
//   const src: string;
//   export default src;
// }
//
// // Image files
// declare module "*.png" { const src: string; export default src; }
// declare module "*.jpg" { const src: string; export default src; }
// declare module "*.webp" { const src: string; export default src; }
//
// // JSON (usually not needed with resolveJsonModule: true)
// declare module "*.json" { const value: unknown; export default value; }

console.log("\nDeclaration files (.d.ts) deep dive complete ✅");
console.log("Key takeaways:");
console.log("  • .d.ts files are TYPE-ONLY — no runtime code");
console.log("  • Use declare module to type untyped JS libs");
console.log("  • Use declare global to extend Window/ProcessEnv");
console.log("  • Install @types/* for community-maintained JS types");
console.log("  • Set declaration: true to auto-generate .d.ts from your TS");

export {};
