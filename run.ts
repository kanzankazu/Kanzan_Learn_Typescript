#!/usr/bin/env ts-node
// ============================================================
// TypeScript Zero to Hero — Interactive Runner
// ============================================================
// Run this file to browse and execute any learning file.
//
// Usage:
//   npx ts-node run.ts              → interactive menu
//   npx ts-node run.ts 0 1          → run phase-0, file index 1
//   npx ts-node run.ts --list       → list all files
// ============================================================

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as readline from "readline";

// ----------------------------------------------------------
// File registry
// ----------------------------------------------------------
interface LearningFile {
  phase:       number;
  label:       string;
  file:        string;
  description: string;
  isProject:   boolean;
  interactive: boolean; // requires stdin input
}

const FILES: LearningFile[] = [
  // Phase 0
  { phase: 0, label: "01_variables",          file: "src/phase-0/01_variables.ts",          description: "var / let / const, scope, hoisting, TDZ",           isProject: false, interactive: false },
  { phase: 0, label: "02_data_types",         file: "src/phase-0/02_data_types.ts",         description: "Primitives, typeof, coercion, falsy values",         isProject: false, interactive: false },
  { phase: 0, label: "03_functions",          file: "src/phase-0/03_functions.ts",          description: "Declaration, expression, arrow, this binding",       isProject: false, interactive: false },
  { phase: 0, label: "04_objects_arrays",     file: "src/phase-0/04_objects_arrays.ts",     description: "Destructuring, spread, rest, array methods",         isProject: false, interactive: false },
  { phase: 0, label: "05_closures",           file: "src/phase-0/05_closures.ts",           description: "Scope chain, memoize, partial, module pattern",      isProject: false, interactive: false },
  { phase: 0, label: "06_promises_async",     file: "src/phase-0/06_promises_async.ts",     description: "Promise, async/await, all/allSettled/race",           isProject: false, interactive: false },
  { phase: 0, label: "07_modules",            file: "src/phase-0/07_modules.ts",            description: "Named/default export, re-export, dynamic import",    isProject: false, interactive: false },
  { phase: 0, label: "mini — Todo CLI",       file: "src/phase-0/mini_project_todo_cli.ts", description: "Interactive Todo CLI (add/list/done/remove)",         isProject: true,  interactive: true  },
  // Phase 1
  { phase: 1, label: "01_basic_types",        file: "src/phase-1/01_basic_types.ts",        description: "Primitives, any, unknown, void, never, assertions",  isProject: false, interactive: false },
  { phase: 1, label: "02_type_alias",         file: "src/phase-1/02_type_alias.ts",         description: "Type alias, union, intersection, recursive types",   isProject: false, interactive: false },
  { phase: 1, label: "03_interfaces",         file: "src/phase-1/03_interfaces.ts",         description: "Interface, extend, implements, merging",             isProject: false, interactive: false },
  { phase: 1, label: "04_functions",          file: "src/phase-1/04_functions.ts",          description: "Typed params/returns, overloads, void vs never",     isProject: false, interactive: false },
  { phase: 1, label: "05_arrays_tuples",      file: "src/phase-1/05_arrays_tuples.ts",      description: "Typed arrays, readonly, named tuples",               isProject: false, interactive: false },
  { phase: 1, label: "06_enums",              file: "src/phase-1/06_enums.ts",              description: "Numeric, string, const enum, exhaustive switch",     isProject: false, interactive: false },
  { phase: 1, label: "07_type_vs_interface",  file: "src/phase-1/07_type_vs_interface.ts",  description: "Full comparison + decision guide",                   isProject: false, interactive: false },
  { phase: 1, label: "mini — Todo API",       file: "src/phase-1/mini_project_todo_api.ts", description: "Type-safe in-memory CRUD with Result<T>",            isProject: true,  interactive: false },
  // Phase 2
  { phase: 2, label: "01_classes",            file: "src/phase-2/01_classes.ts",            description: "Access modifiers, abstract, static, getter/setter",  isProject: false, interactive: false },
  { phase: 2, label: "02_generics",           file: "src/phase-2/02_generics.ts",           description: "Generic functions/classes, constraints, keyof",      isProject: false, interactive: false },
  { phase: 2, label: "03_union_intersection", file: "src/phase-2/03_union_intersection.ts", description: "Union, intersection, discriminated union",           isProject: false, interactive: false },
  { phase: 2, label: "04_type_narrowing",     file: "src/phase-2/04_type_narrowing.ts",     description: "typeof, instanceof, in, type guards",                isProject: false, interactive: false },
  { phase: 2, label: "mini — Data Store",     file: "src/phase-2/mini_project_data_store.ts","description": "Generic Repository, UserRepo, ProductRepo",       isProject: true,  interactive: false },
  // Phase 3
  { phase: 3, label: "01_utility_types",      file: "src/phase-3/01_utility_types.ts",      description: "Partial, Required, Pick, Omit, Record, ReturnType…", isProject: false, interactive: false },
  { phase: 3, label: "02_mapped_types",       file: "src/phase-3/02_mapped_types.ts",       description: "Custom mapped types, key remapping, filter by type", isProject: false, interactive: false },
  { phase: 3, label: "03_template_literals",  file: "src/phase-3/03_template_literal_types.ts","description": "Dynamic string types, CSS props, event emitter", isProject: false, interactive: false },
  { phase: 3, label: "04_conditional_types",  file: "src/phase-3/04_conditional_types.ts",  description: "infer, distributive, recursive, DeepPartial",        isProject: false, interactive: false },
  { phase: 3, label: "mini — Form Builder",   file: "src/phase-3/mini_project_form_builder.ts","description": "Type-safe form with schema + validation",        isProject: true,  interactive: false },
  // Phase 4
  { phase: 4, label: "01_tsconfig",           file: "src/phase-4/01_tsconfig.ts",           description: "tsconfig.json field reference + demos",              isProject: false, interactive: false },
  { phase: 4, label: "02_module_system",      file: "src/phase-4/02_module_system.ts",      description: "Named/default/re-exports, ESM vs CJS, barrel files", isProject: false, interactive: false },
  { phase: 4, label: "03_declaration_files",  file: "src/phase-4/03_declaration_files.ts",  description: ".d.ts, declare module, global augmentation",         isProject: false, interactive: false },
  { phase: 4, label: "mini — CLI Tool",       file: "src/phase-4/mini_project_cli_tool.ts", description: "Type-safe CLI with flag parser + subcommands",       isProject: true,  interactive: false },
  // Phase 5
  { phase: 5, label: "01_decorators",         file: "src/phase-5/01_decorators.ts",         description: "Class/method/property/parameter decorators",         isProject: false, interactive: false },
  { phase: 5, label: "02_infer_generics",     file: "src/phase-5/02_infer_advanced_generics.ts","description": "infer, variadic tuples, pipe, query builder",  isProject: false, interactive: false },
  { phase: 5, label: "03_design_patterns",    file: "src/phase-5/03_design_patterns.ts",    description: "EventEmitter, Strategy, Observer, Command, Proxy",   isProject: false, interactive: false },
  { phase: 5, label: "mini — Mini ORM",       file: "src/phase-5/mini_project_mini_orm.ts", description: "@Table/@Column decorators, generic Model, query builder",isProject: true,  interactive: false },
  // Phase 6
  { phase: 6, label: "01_react_patterns",     file: "src/phase-6/01_typescript_react.ts",   description: "Props, hooks, custom hooks, generic components",     isProject: false, interactive: false },
  { phase: 6, label: "02_express_patterns",   file: "src/phase-6/02_typescript_express.ts", description: "Typed req/res, middleware, error handler",           isProject: false, interactive: false },
  { phase: 6, label: "03_testing_patterns",   file: "src/phase-6/03_typescript_testing.ts", description: "Typed mocks, test factories, spy utilities",         isProject: false, interactive: false },
  { phase: 6, label: "mini — REST API",       file: "src/phase-6/mini_project_rest_api.ts", description: "Full REST API server (runs on port 3000)",           isProject: true,  interactive: false },
];

const PHASE_NAMES: Record<number, string> = {
  0: "JavaScript Essentials",
  1: "TypeScript Fundamentals",
  2: "TypeScript Intermediate",
  3: "Utility Types & Mapped Types",
  4: "Node.js & Module System",
  5: "Advanced TypeScript",
  6: "Real Ecosystem (React, Express, Testing)",
};

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const BLUE   = "\x1b[34m";

function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

function printHeader(): void {
  console.clear();
  console.log(colorize("╔══════════════════════════════════════════════════╗", CYAN));
  console.log(colorize("║   TypeScript Zero to Hero — Interactive Runner   ║", CYAN));
  console.log(colorize("╚══════════════════════════════════════════════════╝", CYAN));
  console.log();
}

function listAll(): void {
  printHeader();
  let currentPhase = -1;
  FILES.forEach((f, i) => {
    if (f.phase !== currentPhase) {
      currentPhase = f.phase;
      console.log(colorize(`\n  Phase ${f.phase}: ${PHASE_NAMES[f.phase]}`, BOLD + YELLOW));
    }
    const idx    = String(i + 1).padStart(2, " ");
    const label  = f.label.padEnd(24, " ");
    const proj   = f.isProject ? colorize(" [project]", GREEN) : "";
    const inter  = f.interactive ? colorize(" [interactive]", BLUE) : "";
    console.log(`  ${colorize(idx, DIM)}.  ${label}  ${DIM}${f.description}${RESET}${proj}${inter}`);
  });
  console.log();
}

function runFile(entry: LearningFile): void {
  console.log(colorize(`\n▶  Running: ${entry.file}`, CYAN));
  console.log(colorize(`   ${entry.description}`, DIM));
  console.log(colorize("─".repeat(52), DIM));
  try {
    execSync(`npx ts-node ${entry.file}`, { stdio: "inherit" });
    console.log(colorize("\n✅  Done", GREEN));
  } catch {
    console.log(colorize("\n❌  Exited with error", RED));
  }
}

function runPhase(phase: number): void {
  const phaseFiles = FILES.filter(f => f.phase === phase && !f.interactive);
  if (phaseFiles.length === 0) {
    console.log(colorize(`No runnable files in phase ${phase}`, RED));
    return;
  }
  console.log(colorize(`\n▶  Running all Phase ${phase} files`, CYAN));
  phaseFiles.forEach(runFile);
}

// ----------------------------------------------------------
// CLI args mode
// ----------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes("--list") || args.includes("-l")) {
  listAll();
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
${colorize("TypeScript Zero to Hero — Runner", BOLD + CYAN)}

${colorize("Usage:", BOLD)}
  npx ts-node run.ts                  Interactive menu
  npx ts-node run.ts --list           List all available files
  npx ts-node run.ts --phase 2        Run all files in phase 2
  npx ts-node run.ts --file 17        Run file by list number
  npx ts-node run.ts --all            Run all non-interactive files
  npx ts-node run.ts --help           Show this help

${colorize("Examples:", BOLD)}
  npx ts-node run.ts --phase 1
  npx ts-node run.ts --file 5
  npx ts-node run.ts --all
`);
  process.exit(0);
}

if (args.includes("--all")) {
  printHeader();
  FILES.filter(f => !f.interactive).forEach(runFile);
  process.exit(0);
}

const phaseArg = args.indexOf("--phase");
if (phaseArg !== -1) {
  const phase = parseInt(args[phaseArg + 1] ?? "");
  if (isNaN(phase)) { console.log(colorize("Invalid phase number", RED)); process.exit(1); }
  runPhase(phase);
  process.exit(0);
}

const fileArg = args.indexOf("--file");
if (fileArg !== -1) {
  const idx = parseInt(args[fileArg + 1] ?? "") - 1;
  if (isNaN(idx) || idx < 0 || idx >= FILES.length) {
    console.log(colorize(`Invalid file index (1–${FILES.length})`, RED)); process.exit(1);
  }
  runFile(FILES[idx]);
  process.exit(0);
}

// ----------------------------------------------------------
// Interactive menu mode
// ----------------------------------------------------------
async function interactiveMenu(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> =>
    new Promise(resolve => rl.question(q, resolve));

  while (true) {
    listAll();
    console.log(colorize("Commands:", BOLD));
    console.log("  [number]     Run file by number (e.g. 5)");
    console.log("  p[number]    Run entire phase (e.g. p2)");
    console.log("  all          Run all non-interactive files");
    console.log("  q / quit     Exit");
    console.log();

    const input = (await ask(colorize("› ", CYAN))).trim().toLowerCase();

    if (input === "q" || input === "quit" || input === "exit") {
      rl.close();
      console.log(colorize("\nBye! Keep learning TypeScript 🔷\n", CYAN));
      process.exit(0);
    }

    if (input === "all") {
      FILES.filter(f => !f.interactive).forEach(runFile);
      await ask(colorize("\nPress Enter to continue...", DIM));
      continue;
    }

    if (input.startsWith("p")) {
      const phase = parseInt(input.slice(1));
      if (!isNaN(phase)) {
        runPhase(phase);
        await ask(colorize("\nPress Enter to continue...", DIM));
        continue;
      }
    }

    const idx = parseInt(input) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < FILES.length) {
      const entry = FILES[idx];
      if (entry.interactive) {
        console.log(colorize(`\n⚠  This file is interactive — launching in current terminal\n`, YELLOW));
      }
      runFile(entry);
      await ask(colorize("\nPress Enter to continue...", DIM));
      continue;
    }

    console.log(colorize(`\nUnknown command: "${input}"`, RED));
    await new Promise(r => setTimeout(r, 800));
  }
}

interactiveMenu();
