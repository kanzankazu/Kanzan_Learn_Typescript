// ============================================================
// Phase 0 — Mini Project: Todo List CLI
// ============================================================
// A command-line Todo app using plain JavaScript concepts.
// Demonstrates: objects, arrays, closures, functions, modules.
//
// Run: npx ts-node src/phase-0/mini_project_todo_cli.ts
// ============================================================

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ----------------------------------------------------------
// Data model (plain object — no TypeScript types yet)
// ----------------------------------------------------------
interface Todo {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "done";
  createdAt: string;
}

// ----------------------------------------------------------
// Persistence — save/load from JSON file
// ----------------------------------------------------------
const DATA_FILE = path.join(__dirname, "todos.json");

function loadTodos(): Todo[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), "utf-8");
}

// ----------------------------------------------------------
// Todo operations (pure functions)
// ----------------------------------------------------------
function generateId(todos: Todo[]): number {
  return todos.length === 0 ? 1 : Math.max(...todos.map(t => t.id)) + 1;
}

function addTodo(todos: Todo[], title: string): Todo[] {
  const newTodo: Todo = {
    id: generateId(todos),
    title: title.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  return [...todos, newTodo];
}

function removeTodo(todos: Todo[], id: number): Todo[] {
  return todos.filter(t => t.id !== id);
}

function updateStatus(todos: Todo[], id: number, status: Todo["status"]): Todo[] {
  return todos.map(t => t.id === id ? { ...t, status } : t);
}

function filterTodos(todos: Todo[], filter: "all" | "pending" | "in_progress" | "done"): Todo[] {
  if (filter === "all") return todos;
  return todos.filter(t => t.status === filter);
}

// ----------------------------------------------------------
// Display helpers
// ----------------------------------------------------------
const STATUS_ICON: Record<Todo["status"], string> = {
  pending:     "[ ]",
  in_progress: "[~]",
  done:        "[✓]",
};

function printTodo(todo: Todo): void {
  console.log(`  ${STATUS_ICON[todo.status]} #${todo.id} ${todo.title}`);
}

function printTodos(todos: Todo[], filter: "all" | "pending" | "in_progress" | "done" = "all"): void {
  const filtered = filterTodos(todos, filter);
  const label = filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1);

  console.log(`\n── ${label} Todos (${filtered.length}) ──`);
  if (filtered.length === 0) {
    console.log("  (empty)");
  } else {
    filtered.forEach(printTodo);
  }

  const summary = {
    total:       todos.length,
    pending:     todos.filter(t => t.status === "pending").length,
    in_progress: todos.filter(t => t.status === "in_progress").length,
    done:        todos.filter(t => t.status === "done").length,
  };
  console.log(`\n  Summary: ${summary.pending} pending | ${summary.in_progress} in progress | ${summary.done} done\n`);
}

function printHelp(): void {
  console.log(`
Commands:
  add <title>         Add a new todo
  list [filter]       List todos (filter: all | pending | in_progress | done)
  start <id>          Mark todo as in_progress
  done <id>           Mark todo as done
  remove <id>         Remove a todo
  clear               Remove all completed todos
  help                Show this help
  exit                Quit
`);
}

// ----------------------------------------------------------
// Command processor
// ----------------------------------------------------------
function processCommand(input: string, todos: Todo[]): Todo[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "add": {
      const title = args.join(" ");
      if (!title) { console.log("Usage: add <title>"); return todos; }
      const updated = addTodo(todos, title);
      const added = updated[updated.length - 1];
      console.log(`✅ Added: #${added.id} "${added.title}"`);
      return updated;
    }

    case "list": {
      const filter = (args[0] as Todo["status"] | "all") || "all";
      const valid = ["all", "pending", "in_progress", "done"];
      if (!valid.includes(filter)) {
        console.log(`Invalid filter. Use: ${valid.join(" | ")}`);
        return todos;
      }
      printTodos(todos, filter);
      return todos;
    }

    case "start": {
      const id = parseInt(args[0] ?? "", 10);
      if (isNaN(id)) { console.log("Usage: start <id>"); return todos; }
      if (!todos.find(t => t.id === id)) { console.log(`Todo #${id} not found`); return todos; }
      console.log(`🔄 Started: #${id}`);
      return updateStatus(todos, id, "in_progress");
    }

    case "done": {
      const id = parseInt(args[0] ?? "", 10);
      if (isNaN(id)) { console.log("Usage: done <id>"); return todos; }
      if (!todos.find(t => t.id === id)) { console.log(`Todo #${id} not found`); return todos; }
      console.log(`✅ Completed: #${id}`);
      return updateStatus(todos, id, "done");
    }

    case "remove": {
      const id = parseInt(args[0] ?? "", 10);
      if (isNaN(id)) { console.log("Usage: remove <id>"); return todos; }
      if (!todos.find(t => t.id === id)) { console.log(`Todo #${id} not found`); return todos; }
      console.log(`🗑  Removed: #${id}`);
      return removeTodo(todos, id);
    }

    case "clear": {
      const before = todos.length;
      const updated = todos.filter(t => t.status !== "done");
      console.log(`🧹 Cleared ${before - updated.length} completed todos`);
      return updated;
    }

    case "help":
      printHelp();
      return todos;

    case "":
    case undefined:
      return todos;

    default:
      console.log(`Unknown command: "${cmd}". Type "help" for usage.`);
      return todos;
  }
}

// ----------------------------------------------------------
// Main REPL loop
// ----------------------------------------------------------
function main() {
  let todos = loadTodos();

  console.log("📋 Todo CLI — Phase 0 Mini Project");
  console.log(`Loaded ${todos.length} existing todos. Type "help" for commands.\n`);
  printTodos(todos);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "todo> ",
  });

  rl.prompt();

  rl.on("line", (line) => {
    const trimmed = line.trim();

    if (trimmed === "exit" || trimmed === "quit") {
      saveTodos(todos);
      console.log("👋 Saved & exiting.");
      rl.close();
      return;
    }

    todos = processCommand(trimmed, todos);
    saveTodos(todos);
    rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}

main();
