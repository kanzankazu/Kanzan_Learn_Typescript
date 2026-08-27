# 🔷 Kanzan Learn TypeScript — Zero to Hero

Repo belajar TypeScript dari nol sampai production-ready. Disusun berdasarkan roadmap bertahap, mulai dari JavaScript essentials sampai advanced TypeScript patterns.

> Cocok untuk: pemula web, JS developer yang mau naik level, atau mobile developer (Android/Flutter) yang expand ke web/fullstack.

---

## 📋 Roadmap

| Phase | Topik | Estimasi |
|-------|-------|----------|
| Phase 0 | JavaScript Essentials | 1–2 minggu |
| Phase 1 | TypeScript Fundamentals | 2–3 minggu |
| Phase 2 | TypeScript Intermediate | 2–3 minggu |
| Phase 3 | Utility Types & Mapped Types | 2 minggu |
| Phase 4 | Node.js & Module System | 2 minggu |
| Phase 5 | Advanced TypeScript | 2–3 minggu |
| Phase 6 | Real Ecosystem (React, Express, Testing) | ongoing |

Detail tiap phase ada di [`doc/PANDUAN_ZERO_TO_HERO_TYPESCRIPT.md`](doc/PANDUAN_ZERO_TO_HERO_TYPESCRIPT.md) *(local only, di-exclude dari repo)*.

---

## 📁 Struktur Folder

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

## 🚀 Cara Jalankan

### Prerequisites
- Node.js ≥ 18
- npm / pnpm

### Install
```bash
npm install
```

### Run file TypeScript langsung
```bash
npx ts-node src/phase-1/basics.ts
```

### Compile ke JS
```bash
npx tsc
```

### Watch mode
```bash
npx tsc --watch
```

---

## 🛠 Tech Stack

- **TypeScript** — bahasa utama
- **ts-node** — run TS langsung tanpa compile
- **Node.js** — runtime

---

## 📖 Catatan Belajar

Setiap file di `src/phase-*/` adalah latihan mandiri per topik. Nama file mengikuti topik yang dipelajari, contoh:
- `01_basic_types.ts`
- `02_functions.ts`
- `03_interfaces.ts`

---

## 👤 Author

**Faisal Bahri** — Android Developer yang lagi expand ke TypeScript/Web.
