// ============================================================
// Phase 5 — 03: Design Patterns with TypeScript
// ============================================================
// Topics: type-safe Event Emitter, Observer, Strategy,
//         Builder, Repository, Proxy, Command pattern
// Run: npx ts-node src/phase-5/03_design_patterns.ts
// ============================================================

// ----------------------------------------------------------
// 1. Type-safe Event Emitter
// ----------------------------------------------------------

type EventMap = Record<string, unknown>;

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<
    keyof Events,
    Set<(data: Events[keyof Events]) => void>
  >();

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as (data: Events[keyof Events]) => void);
    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  once<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    const wrapper = (data: Events[K]) => {
      listener(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    this.listeners.get(event)?.delete(listener as (data: Events[keyof Events]) => void);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Usage
type AppEvents = {
  userCreated:  { id: number; name: string; email: string };
  userDeleted:  { id: number };
  orderPlaced:  { orderId: string; total: number; userId: number };
  loginAttempt: { email: string; success: boolean; ip: string };
};

const events = new TypedEventEmitter<AppEvents>();

const unsub = events.on("userCreated", ({ id, name }) => {
  console.log(`[EVENT] User created: #${id} ${name}`);
});

events.on("orderPlaced", ({ orderId, total }) => {
  console.log(`[EVENT] Order placed: ${orderId} — $${total}`);
});

events.once("loginAttempt", ({ email, success }) => {
  console.log(`[EVENT] Login attempt by ${email}: ${success ? "✅" : "❌"}`);
});

events.emit("userCreated",  { id: 1, name: "Alice", email: "a@b.com" });
events.emit("orderPlaced",  { orderId: "ORD-001", total: 149.99, userId: 1 });
events.emit("loginAttempt", { email: "a@b.com", success: true, ip: "127.0.0.1" });
events.emit("loginAttempt", { email: "a@b.com", success: false, ip: "1.2.3.4" }); // once = ignored

unsub(); // unsubscribe userCreated listener
events.emit("userCreated", { id: 2, name: "Bob", email: "b@c.com" }); // no output

// ----------------------------------------------------------
// 2. Strategy Pattern — swappable algorithms
// ----------------------------------------------------------

interface SortStrategy<T> {
  sort(data: T[], compareFn: (a: T, b: T) => number): T[];
}

class BubbleSort<T> implements SortStrategy<T> {
  sort(data: T[], compareFn: (a: T, b: T) => number): T[] {
    const arr = [...data];
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (compareFn(arr[j], arr[j + 1]) > 0) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
    return arr;
  }
}

class NativeSort<T> implements SortStrategy<T> {
  sort(data: T[], compareFn: (a: T, b: T) => number): T[] {
    return [...data].sort(compareFn);
  }
}

class DataSorter<T> {
  constructor(private strategy: SortStrategy<T>) {}

  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
  }

  sort(data: T[], compareFn: (a: T, b: T) => number): T[] {
    return this.strategy.sort(data, compareFn);
  }
}

const nums = [64, 34, 25, 12, 22, 11, 90];
const sorter = new DataSorter(new BubbleSort<number>());
console.log("\nBubble sort:", sorter.sort(nums, (a, b) => a - b));

sorter.setStrategy(new NativeSort<number>());
console.log("Native sort:", sorter.sort(nums, (a, b) => b - a)); // descending

// ----------------------------------------------------------
// 3. Observer Pattern — reactive state
// ----------------------------------------------------------

type Observer<T> = (value: T, prev: T) => void;

class Observable2<T> {
  private observers: Set<Observer<T>> = new Set();
  private _value: T;

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T { return this._value; }

  set value(newVal: T) {
    if (newVal === this._value) return;
    const prev = this._value;
    this._value = newVal;
    this.observers.forEach(obs => obs(newVal, prev));
  }

  subscribe(observer: Observer<T>): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // Derived observable — map + auto-update
  map<U>(fn: (value: T) => U): Observable2<U> {
    const derived = new Observable2(fn(this._value));
    this.subscribe(v => { derived.value = fn(v); });
    return derived;
  }
}

const count$ = new Observable2(0);
const doubled$ = count$.map(n => n * 2);
const label$   = count$.map(n => `Count is ${n}`);

const unsubCount = count$.subscribe((val, prev) => {
  console.log(`\n[OBS] count: ${prev} → ${val}`);
});
doubled$.subscribe(v => console.log(`[OBS] doubled: ${v}`));
label$.subscribe(v   => console.log(`[OBS] label: "${v}"`));

count$.value = 1;
count$.value = 5;
count$.value = 5; // no change — no notification
unsubCount();
count$.value = 10; // count$ unsubscribed, doubled$ and label$ still update

// ----------------------------------------------------------
// 4. Command Pattern — encapsulate actions with undo
// ----------------------------------------------------------

interface Command2 {
  execute(): void;
  undo(): void;
  description: string;
}

class CommandHistory {
  private history:  Command2[] = [];
  private redoStack: Command2[] = [];

  execute(cmd: Command2): void {
    cmd.execute();
    this.history.push(cmd);
    this.redoStack = []; // clear redo on new action
    console.log(`[CMD] Executed: ${cmd.description}`);
  }

  undo(): void {
    const cmd = this.history.pop();
    if (!cmd) { console.log("[CMD] Nothing to undo"); return; }
    cmd.undo();
    this.redoStack.push(cmd);
    console.log(`[CMD] Undone: ${cmd.description}`);
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) { console.log("[CMD] Nothing to redo"); return; }
    cmd.execute();
    this.history.push(cmd);
    console.log(`[CMD] Redone: ${cmd.description}`);
  }
}

// Text editor commands
class TextDocument {
  content = "";
  insert(text: string, pos: number) {
    this.content = this.content.slice(0, pos) + text + this.content.slice(pos);
  }
  delete(pos: number, len: number) {
    this.content = this.content.slice(0, pos) + this.content.slice(pos + len);
  }
}

function makeInsertCommand(doc: TextDocument, text: string, pos: number): Command2 {
  return {
    description: `Insert "${text}" at ${pos}`,
    execute: () => doc.insert(text, pos),
    undo:    () => doc.delete(pos, text.length),
  };
}

function makeDeleteCommand(doc: TextDocument, pos: number, len: number): Command2 {
  const deleted = { text: "" };
  return {
    description: `Delete ${len} chars at ${pos}`,
    execute: () => {
      deleted.text = doc.content.slice(pos, pos + len);
      doc.delete(pos, len);
    },
    undo: () => doc.insert(deleted.text, pos),
  };
}

console.log("\nCommand pattern (text editor):");
const doc     = new TextDocument();
const history = new CommandHistory();

history.execute(makeInsertCommand(doc, "Hello", 0));
console.log("Content:", doc.content);  // Hello

history.execute(makeInsertCommand(doc, " World", 5));
console.log("Content:", doc.content);  // Hello World

history.execute(makeDeleteCommand(doc, 5, 6)); // delete " World"
console.log("Content:", doc.content);  // Hello

history.undo(); // restore " World"
console.log("After undo:", doc.content);  // Hello World

history.undo(); // undo insert " World"
console.log("After undo:", doc.content);  // Hello

history.redo(); // redo insert " World"
console.log("After redo:", doc.content);  // Hello World

// ----------------------------------------------------------
// 5. Proxy Pattern — transparent wrapping
// ----------------------------------------------------------

interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  invalidate(key: string): void;
}

class MemoryCache<T> implements Cache<T> {
  private store = new Map<string, { value: T; expiresAt: number | null }>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

// Caching proxy for any async data source
function createCachedFetcher<T>(
  fetcher: (key: string) => Promise<T>,
  cache: Cache<T>,
  ttlMs: number = 60_000,
): (key: string) => Promise<T> {
  return async (key: string): Promise<T> => {
    const cached = cache.get(key);
    if (cached !== undefined) {
      console.log(`[CACHE] HIT: ${key}`);
      return cached;
    }
    console.log(`[CACHE] MISS: ${key} — fetching...`);
    const value = await fetcher(key);
    cache.set(key, value, ttlMs);
    return value;
  };
}

async function demoCache() {
  const cache = new MemoryCache<string>();
  const fetchUser = createCachedFetcher(
    async (id: string) => `User#${id}`,
    cache,
  );

  await fetchUser("1"); // MISS
  await fetchUser("2"); // MISS
  await fetchUser("1"); // HIT
  await fetchUser("2"); // HIT
}
demoCache();

export {};
