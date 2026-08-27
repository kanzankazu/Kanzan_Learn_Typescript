// ============================================================
// Phase 1 — Mini Project: Type-Safe Todo API
// ============================================================
// An in-memory Todo CRUD API demonstrating Phase 1 concepts:
// interfaces, type aliases, enums, typed functions, generics preview.
//
// Run: npx ts-node src/phase-1/mini_project_todo_api.ts
// ============================================================

// ----------------------------------------------------------
// Domain types — using interface & enum
// ----------------------------------------------------------
enum TodoStatus {
  Pending    = "PENDING",
  InProgress = "IN_PROGRESS",
  Done       = "DONE",
  Cancelled  = "CANCELLED",
}

enum Priority {
  Low    = "LOW",
  Medium = "MEDIUM",
  High   = "HIGH",
}

interface Todo {
  readonly id:    number;
  title:          string;
  description?:   string;
  status:         TodoStatus;
  priority:       Priority;
  tags:           string[];
  readonly createdAt: Date;
  updatedAt:      Date;
  dueDate?:       Date;
}

// ----------------------------------------------------------
// DTO types — what callers pass in
// ----------------------------------------------------------
type CreateTodoDto = {
  title:        string;
  description?: string;
  priority?:    Priority;
  tags?:        string[];
  dueDate?:     Date;
};

type UpdateTodoDto = Partial<{
  title:       string;
  description: string;
  status:      TodoStatus;
  priority:    Priority;
  tags:        string[];
  dueDate:     Date;
}>;

type TodoFilter = {
  status?:   TodoStatus;
  priority?: Priority;
  tag?:      string;
  search?:   string;
};

// ----------------------------------------------------------
// Result type — typed error handling without exceptions
// ----------------------------------------------------------
type Result<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

function failure<T>(error: string): Result<T> {
  return { ok: false, error };
}

// ----------------------------------------------------------
// TodoRepository — in-memory CRUD
// ----------------------------------------------------------
interface TodoRepository {
  findById(id: number):             Result<Todo>;
  findAll(filter?: TodoFilter):     Todo[];
  create(dto: CreateTodoDto):       Result<Todo>;
  update(id: number, dto: UpdateTodoDto): Result<Todo>;
  delete(id: number):               Result<void>;
  count(filter?: TodoFilter):       number;
}

class InMemoryTodoRepository implements TodoRepository {
  private todos: Map<number, Todo> = new Map();
  private nextId = 1;

  findById(id: number): Result<Todo> {
    const todo = this.todos.get(id);
    if (!todo) return failure(`Todo with id=${id} not found`);
    return success(todo);
  }

  findAll(filter?: TodoFilter): Todo[] {
    let results = [...this.todos.values()];

    if (filter?.status) {
      results = results.filter(t => t.status === filter.status);
    }
    if (filter?.priority) {
      results = results.filter(t => t.priority === filter.priority);
    }
    if (filter?.tag) {
      results = results.filter(t => t.tags.includes(filter.tag!));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  create(dto: CreateTodoDto): Result<Todo> {
    if (!dto.title.trim()) {
      return failure("Title cannot be empty");
    }

    const now  = new Date();
    const todo: Todo = {
      id:          this.nextId++,
      title:       dto.title.trim(),
      description: dto.description,
      status:      TodoStatus.Pending,
      priority:    dto.priority ?? Priority.Medium,
      tags:        dto.tags    ?? [],
      createdAt:   now,
      updatedAt:   now,
      dueDate:     dto.dueDate,
    };

    this.todos.set(todo.id, todo);
    return success(todo);
  }

  update(id: number, dto: UpdateTodoDto): Result<Todo> {
    const existing = this.todos.get(id);
    if (!existing) return failure(`Todo with id=${id} not found`);

    if (dto.title !== undefined && !dto.title.trim()) {
      return failure("Title cannot be empty");
    }

    const updated: Todo = {
      ...existing,
      ...dto,
      title:     dto.title?.trim() ?? existing.title,
      updatedAt: new Date(),
    };

    this.todos.set(id, updated);
    return success(updated);
  }

  delete(id: number): Result<void> {
    if (!this.todos.has(id)) return failure(`Todo with id=${id} not found`);
    this.todos.delete(id);
    return success(undefined);
  }

  count(filter?: TodoFilter): number {
    return this.findAll(filter).length;
  }
}

// ----------------------------------------------------------
// TodoService — business logic layer
// ----------------------------------------------------------
class TodoService {
  constructor(private readonly repo: TodoRepository) {}

  createTodo(dto: CreateTodoDto): Result<Todo> {
    return this.repo.create(dto);
  }

  getTodo(id: number): Result<Todo> {
    return this.repo.findById(id);
  }

  listTodos(filter?: TodoFilter): Todo[] {
    return this.repo.findAll(filter);
  }

  startTodo(id: number): Result<Todo> {
    const result = this.repo.findById(id);
    if (!result.ok) return result;

    if (result.data.status === TodoStatus.Done) {
      return failure("Cannot start an already completed todo");
    }
    if (result.data.status === TodoStatus.Cancelled) {
      return failure("Cannot start a cancelled todo");
    }
    return this.repo.update(id, { status: TodoStatus.InProgress });
  }

  completeTodo(id: number): Result<Todo> {
    const result = this.repo.findById(id);
    if (!result.ok) return result;

    if (result.data.status === TodoStatus.Cancelled) {
      return failure("Cannot complete a cancelled todo");
    }
    return this.repo.update(id, { status: TodoStatus.Done });
  }

  cancelTodo(id: number): Result<Todo> {
    const result = this.repo.findById(id);
    if (!result.ok) return result;

    if (result.data.status === TodoStatus.Done) {
      return failure("Cannot cancel an already completed todo");
    }
    return this.repo.update(id, { status: TodoStatus.Cancelled });
  }

  getStats(): Record<TodoStatus, number> {
    return {
      [TodoStatus.Pending]:    this.repo.count({ status: TodoStatus.Pending }),
      [TodoStatus.InProgress]: this.repo.count({ status: TodoStatus.InProgress }),
      [TodoStatus.Done]:       this.repo.count({ status: TodoStatus.Done }),
      [TodoStatus.Cancelled]:  this.repo.count({ status: TodoStatus.Cancelled }),
    };
  }
}

// ----------------------------------------------------------
// Demo — run through the API
// ----------------------------------------------------------
function printResult<T>(label: string, result: Result<T>): void {
  if (result.ok) {
    const data = result.data;
    if (data && typeof data === "object" && "title" in (data as object)) {
      const todo = data as unknown as Todo;
      console.log(`✅ ${label}: #${todo.id} "${todo.title}" [${todo.status}]`);
    } else {
      console.log(`✅ ${label}: ${JSON.stringify(data)}`);
    }
  } else {
    console.log(`❌ ${label}: ${result.error}`);
  }
}

function main() {
  const service = new TodoService(new InMemoryTodoRepository());

  console.log("=== Creating todos ===");
  const r1 = service.createTodo({ title: "Learn TypeScript basics",   priority: Priority.High,   tags: ["learning", "ts"] });
  const r2 = service.createTodo({ title: "Build a CLI tool",          priority: Priority.Medium, tags: ["project", "ts"] });
  const r3 = service.createTodo({ title: "Read TypeScript docs",      priority: Priority.Low,    tags: ["learning"] });
  const r4 = service.createTodo({ title: "Set up ESLint",             priority: Priority.Low,    tags: ["tooling"] });
  const r5 = service.createTodo({ title: "",                          priority: Priority.High }); // ❌ should fail

  printResult("Create 1", r1);
  printResult("Create 2", r2);
  printResult("Create 3", r3);
  printResult("Create 4", r4);
  printResult("Create empty (should fail)", r5);

  console.log("\n=== Updating status ===");
  printResult("Start #1",    service.startTodo(1));
  printResult("Complete #1", service.completeTodo(1));
  printResult("Start #2",    service.startTodo(2));
  printResult("Cancel #3",   service.cancelTodo(3));
  printResult("Start #1 again (should fail)", service.startTodo(1)); // already done
  printResult("Cancel done (should fail)",    service.cancelTodo(1));

  console.log("\n=== Filtering todos ===");
  const pending = service.listTodos({ status: TodoStatus.Pending });
  console.log(`Pending: ${pending.map(t => `#${t.id}`).join(", ")}`);

  const learning = service.listTodos({ tag: "learning" });
  console.log(`Tagged 'learning': ${learning.map(t => `#${t.id} ${t.title}`).join(", ")}`);

  const search = service.listTodos({ search: "cli" });
  console.log(`Search 'cli': ${search.map(t => t.title).join(", ")}`);

  console.log("\n=== Stats ===");
  const stats = service.getStats();
  Object.entries(stats).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log("\n=== Error cases ===");
  printResult("Get #999 (not found)", service.getTodo(999));
  printResult("Start #999 (not found)", service.startTodo(999));
}

main();
