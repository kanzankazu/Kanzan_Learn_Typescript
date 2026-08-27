# 🔷 Kanzan Learn TypeScript — Zero to Hero

A structured TypeScript learning repo from zero to production-ready. Built as a step-by-step roadmap from JavaScript essentials all the way to advanced TypeScript patterns.

> Best for: web beginners, JavaScript developers leveling up to TypeScript, or mobile developers (Android/Flutter) expanding into web/fullstack.

---

## 📋 Roadmap

| Phase | Topic | Key Concepts | Duration |
|-------|-------|--------------|----------|
| Phase 0 | JavaScript Essentials | Variables, functions, closures, promises, ES6+ syntax | 1–2 weeks |
| Phase 1 | TypeScript Fundamentals | Basic types, type annotations, interfaces, type vs interface | 2–3 weeks |
| Phase 2 | TypeScript Intermediate | Classes, generics, union/intersection types, type narrowing | 2–3 weeks |
| Phase 3 | Utility Types & Mapped Types | Partial, Required, Pick, Omit, Record, conditional types | 2 weeks |
| Phase 4 | Node.js & Module System | tsconfig.json, ESM vs CommonJS, declaration files (.d.ts) | 2 weeks |
| Phase 5 | Advanced TypeScript | Decorators, infer, advanced generics, design patterns | 2–3 weeks |
| Phase 6 | Real Ecosystem | TypeScript + React, Express, testing (Jest/Vitest) | ongoing |

---

## 📁 Project Structure

```
src/
├── phase-0/     # JavaScript Essentials
├── phase-1/     # TS Fundamentals
├── phase-2/     # TS Intermediate
├── phase-3/     # Utility & Mapped Types
├── phase-4/     # Node.js & Module System
├── phase-5/     # Advanced TypeScript
└── phase-6/     # Real Ecosystem
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm / pnpm

### Install
```bash
npm install
```

### Run a TypeScript file directly
```bash
npx ts-node src/phase-1/01_basic_types.ts
```

### Compile to JS
```bash
npx tsc
```

### Watch mode
```bash
npx tsc --watch
```

---

## 🛠 Tech Stack

- **TypeScript** — primary language
- **ts-node** — run TS files without compiling
- **Node.js** — runtime

---

## 📖 How Files Are Organized

Each file inside `src/phase-*/` is a standalone exercise for one topic. Files are numbered to follow the learning order:
- `01_basic_types.ts`
- `02_functions.ts`
- `03_interfaces.ts`

---

## 👤 Author

**Faisal Bahri** — Android Developer expanding into TypeScript & Web.
