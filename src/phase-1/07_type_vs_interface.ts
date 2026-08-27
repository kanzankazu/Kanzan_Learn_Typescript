// ============================================================
// Phase 1 — 07: Type vs Interface
// ============================================================
// Topics: similarities, key differences, when to use each,
//         declaration merging, extending, practical guidelines
// Run: npx ts-node src/phase-1/07_type_vs_interface.ts
// ============================================================

// ----------------------------------------------------------
// SIMILARITIES — both can describe object shapes
// ----------------------------------------------------------

// Using interface
interface UserInterface {
  id:    number;
  name:  string;
  email: string;
}

// Using type
type UserType = {
  id:    number;
  name:  string;
  email: string;
};

// Both work identically for describing shapes
const u1: UserInterface = { id: 1, name: "Alice", email: "a@b.com" };
const u2: UserType      = { id: 2, name: "Bob",   email: "b@c.com" };

// Both can be used as function parameter types
function printUser(user: UserInterface | UserType): void {
  console.log(`${user.name} <${user.email}>`);
}
printUser(u1);
printUser(u2);

// ----------------------------------------------------------
// DIFFERENCE 1: Declaration Merging — interface only
// ----------------------------------------------------------
interface Window {
  title: string;
}
interface Window {
  // TypeScript MERGES these — the result has both 'title' and 'theme'
  theme: "light" | "dark";
}
// Result: Window = { title: string; theme: "light" | "dark" }

// ❌ type cannot be declared twice
// type Duplicate = { a: string };
// type Duplicate = { b: string }; // Error: Duplicate identifier 'Duplicate'

// When is merging useful?
// - Augmenting types from third-party libraries
// - Adding properties to global interfaces (e.g., Express Request, process.env)

// ----------------------------------------------------------
// DIFFERENCE 2: Extending — different syntax
// ----------------------------------------------------------

// Interface extends interface
interface Animal { name: string; }
interface Pet extends Animal { owner: string; }
interface Dog extends Pet { breed: string; }

// Type uses intersection (&)
type AnimalType = { name: string };
type PetType    = AnimalType & { owner: string };
type DogType    = PetType    & { breed: string };

// Interface can also extend a type alias
type HasId = { id: number };
interface UserWithId extends HasId { name: string; }
// UserWithId = { id: number; name: string }

// Type can also intersect an interface
interface HasName { name: string; }
type PersonType = HasName & { age: number };

// ----------------------------------------------------------
// DIFFERENCE 3: Union — type only
// ----------------------------------------------------------

// ✅ type supports union
type StringOrNumber = string | number;
type ID             = string | number;
type Nullable<T>    = T | null;
type Result<T>      = { ok: true; data: T } | { ok: false; error: string };

// ❌ interface does NOT support union
// interface StringOrNumber = string | number; // syntax error

// ----------------------------------------------------------
// DIFFERENCE 4: Primitive aliases — type only
// ----------------------------------------------------------

// ✅ type can alias primitives
type Username     = string;
type Milliseconds = number;
type Predicate    = (x: number) => boolean;

// ❌ interface cannot alias primitives or functions directly
// interface Username = string; // syntax error

// ----------------------------------------------------------
// DIFFERENCE 5: Computed/mapped types — type only
// ----------------------------------------------------------

// ✅ type supports mapped types and computed properties
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type ReadOnly<T> = {
  readonly [K in keyof T]: T[K];
};

// ❌ interface cannot use mapped types directly

// ----------------------------------------------------------
// DIFFERENCE 6: Tuple and array shorthand — type only
// ----------------------------------------------------------

// ✅ type for tuples
type Pair    = [string, number];
type RGB     = [r: number, g: number, b: number];
type Handler = (event: MouseEvent) => void;

// ❌ interface for tuples is verbose and uncommon
// interface PairInterface { 0: string; 1: number; }

// ----------------------------------------------------------
// DECISION GUIDE
// ----------------------------------------------------------
console.log(`
┌─────────────────────────────────────────────────────────────┐
│              Type vs Interface — When to Use                │
├─────────────────────────────────┬───────────────────────────┤
│ Situation                       │ Use                       │
├─────────────────────────────────┼───────────────────────────┤
│ Object shape (general)          │ interface (idiomatic)     │
│ Public API / library types      │ interface (mergeable)     │
│ Class implements                │ interface                 │
│ Extend from multiple sources    │ interface extends         │
│ Union type  (A | B | C)        │ type                      │
│ Intersection (A & B & C)       │ type (or interface extends)│
│ Primitive alias (string/number) │ type                      │
│ Function type alias             │ type                      │
│ Tuple type                      │ type                      │
│ Mapped / conditional types      │ type                      │
│ Augment third-party types       │ interface (merging)       │
└─────────────────────────────────┴───────────────────────────┘
`);

// ----------------------------------------------------------
// PRACTICAL EXAMPLES
// ----------------------------------------------------------

// ✅ interface for domain models (will be implemented by classes)
interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}

// ✅ type for utility/composition types
type CreateUserDto  = Pick<UserType, "name" | "email">;
type UpdateUserDto  = Partial<Pick<UserType, "name" | "email">>;
type UserResponse   = Omit<UserType, "email"> & { joinedAt: string };

// ✅ type for discriminated unions
type ApiResult<T> =
  | { status: "success"; data: T }
  | { status: "error";   message: string; code: number }
  | { status: "loading" };

function handleResult<T>(result: ApiResult<T>): void {
  switch (result.status) {
    case "success": console.log("Data:", result.data);            break;
    case "error":   console.log(`Error ${result.code}:`, result.message); break;
    case "loading": console.log("Loading...");                    break;
  }
}

handleResult({ status: "success", data: { id: 1 } });
handleResult({ status: "error", message: "Not found", code: 404 });
handleResult({ status: "loading" });

// ----------------------------------------------------------
// BOTTOM LINE
// ----------------------------------------------------------
// Both are very similar for most use cases.
// Default to interface for object shapes — it's idiomatic TypeScript.
// Reach for type when you need union, intersection, primitives, or mapped types.
// Don't overthink it — consistency within a project matters more than the choice itself.

export {};
