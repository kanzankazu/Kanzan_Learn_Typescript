# Contributing to Kanzan Learn TypeScript

Thanks for your interest in contributing! This is a learning repository, so contributions that help others learn are especially welcome.

---

## What You Can Contribute

- **Fix typos or errors** in code comments or documentation
- **Improve explanations** — clearer comments, better examples
- **Add mini projects** for a phase (follow the existing pattern)
- **Report bugs** — broken code examples, incorrect behavior
- **Suggest topics** — missing concepts, useful additions to a phase

---

## Ground Rules

- Keep code beginner-friendly — **comment everything**, explain the "why"
- Match the existing code style (TypeScript strict mode, full type annotations)
- One pull request per concern — don't mix multiple unrelated changes
- English for code and comments; discussion in any language is fine

---

## Setup for Development

```bash
# Fork & clone
git clone https://github.com/<your-username>/Kanzan_Learn_Typescript.git
cd Kanzan_Learn_Typescript

# Install dependencies
npm install

# Run the interactive runner to verify everything works
npx ts-node run.ts

# Or run a specific file
npx ts-node src/phase-1/01_basic_types.ts
```

---

## Workflow

1. Fork this repository
2. Create a branch: `git checkout -b fix/typo-phase2` or `feat/add-phase3-example`
3. Make your changes
4. Run the file and verify nothing is broken: `npx ts-node <your-file.ts>`
5. Commit with a clear message (see below)
6. Push and open a Pull Request

---

## Commit Message Format

```
type: short description

Examples:
fix: correct generic example in phase2
feat: add mini project for phase3 form builder
docs: improve README quick start section
chore: update tsconfig
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

---

## Pull Request Checklist

Before submitting, please make sure:

- [ ] Code runs without errors (`npx ts-node <file.ts>`)
- [ ] Type annotations are present on all function parameters and return types
- [ ] Comments explain the concept, not just what the code does
- [ ] No secrets or `.env` files are included
- [ ] PR description explains what changed and why

---

## Reporting Issues

Use the issue templates in `.github/ISSUE_TEMPLATE/`. Please include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Node.js version and OS

---

## Questions?

Open a GitHub Discussion or reach out via email: **kanzankazu46@gmail.com**
