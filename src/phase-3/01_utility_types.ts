// ============================================================
// Phase 3 — 01: Built-in Utility Types
// ============================================================
// Topics: Partial, Required, Readonly, Pick, Omit, Record,
//         Extract, Exclude, NonNullable, ReturnType, Parameters,
//         InstanceType, Awaited, ConstructorParameters
// Run: npx ts-node src/phase-3/01_utility_types.ts
// ============================================================

// ----------------------------------------------------------
// Base interface used throughout this file
// ----------------------------------------------------------
interface User {
  id:          number;
  name:        string;
  email:       string;
  password:    string;
  role:        "admin" | "user" | "guest";
  age?:        number;
  bio?:        string;
  createdAt:   Date;
}

// ----------------------------------------------------------
// 1. Partial<T> — make all properties optional
// ----------------------------------------------------------
type UserPatch = Partial<User>;
// { id?: number; name?: string; email?: string; ... }

function updateUser(existing: User, patch: Partial<User>): User {
  return { ...existing, ...patch, id: existing.id }; // id is immutable
}

const alice: User = { id: 1, name: "Alice", email: "a@b.com", password: "hashed", role: "user", createdAt: new Date() };
const updated = updateUser(alice, { name: "Alicia", bio: "TypeScript enthusiast" });
console.log("Updated:", updated.name, updated.bio);

// ----------------------------------------------------------
// 2. Required<T> — make all properties required (remove optionals)
// ----------------------------------------------------------
type UserComplete = Required<User>;
// { id: number; name: string; age: number; bio: string; ... }  — age & bio no longer optional

// ----------------------------------------------------------
// 3. Readonly<T> — prevent mutation after creation
// ----------------------------------------------------------
type ImmutableUser = Readonly<User>;

const frozenUser: ImmutableUser = { ...alice };
// frozenUser.name = "Bob"; // ❌ Cannot assign to 'name' because it is a read-only property

// Object.freeze at runtime + Readonly at compile time = truly immutable
function freeze<T>(obj: T): Readonly<T> { return Object.freeze(obj); }
const locked = freeze(alice);

// ----------------------------------------------------------
// 4. Pick<T, K> — keep only selected properties
// ----------------------------------------------------------
type UserPublic   = Pick<User, "id" | "name" | "role">;
type UserCard     = Pick<User, "id" | "name" | "email">;
type UserCredentials = Pick<User, "email" | "password">;

const publicUser: UserPublic = { id: 1, name: "Alice", role: "user" };
console.log("Public user:", publicUser);

function displayUserCard(user: UserCard): string {
  return `[#${user.id}] ${user.name} <${user.email}>`;
}
console.log(displayUserCard({ id: 1, name: "Alice", email: "a@b.com" }));

// ----------------------------------------------------------
// 5. Omit<T, K> — remove selected properties
// ----------------------------------------------------------
type UserWithoutPassword = Omit<User, "password">;
type UserWithoutMeta     = Omit<User, "password" | "createdAt">;
type CreateUserDto       = Omit<User, "id" | "createdAt">;
type UpdateUserDto       = Partial<Omit<User, "id" | "createdAt">>;

// Safe to send to client — no password
function toPublicUser(user: User): UserWithoutPassword {
  const { password: _, ...rest } = user;
  return rest;
}
console.log("Without password:", toPublicUser(alice));

// ----------------------------------------------------------
// 6. Record<K, V> — object type with specific key/value types
// ----------------------------------------------------------
type RolePermissions  = Record<"admin" | "user" | "guest", string[]>;
type HttpStatusText   = Record<number, string>;
type UserMap          = Record<string, User>;
type FeatureFlags     = Record<string, boolean>;

const permissions: RolePermissions = {
  admin: ["read", "write", "delete", "manage"],
  user:  ["read", "write"],
  guest: ["read"],
};
console.log("Admin can:", permissions.admin.join(", "));

const statusText: Partial<HttpStatusText> = {
  200: "OK", 201: "Created", 400: "Bad Request",
  401: "Unauthorized", 404: "Not Found", 500: "Internal Server Error",
};
console.log("404 means:", statusText[404]);

// ----------------------------------------------------------
// 7. Exclude<T, U> — remove types from a union
// ----------------------------------------------------------
type AllRoles     = "admin" | "user" | "guest" | "moderator";
type NonAdminRole = Exclude<AllRoles, "admin">;
// "user" | "guest" | "moderator"

type StringOrNum  = string | number | boolean | null;
type Primitive    = Exclude<StringOrNum, null>;
// string | number | boolean

type NotString    = Exclude<string | number | symbol, string>;
// number | symbol

const role: NonAdminRole = "user"; // ✅
// const role2: NonAdminRole = "admin"; // ❌

// ----------------------------------------------------------
// 8. Extract<T, U> — keep only types that match U
// ----------------------------------------------------------
type Strings  = Extract<string | number | boolean, string>;        // string
type StrOrNum = Extract<string | number | boolean, string | number>; // string | number

type AdminOrUser = Extract<AllRoles, "admin" | "user">;
// "admin" | "user"

// ----------------------------------------------------------
// 9. NonNullable<T> — remove null and undefined
// ----------------------------------------------------------
type MaybeString    = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

type MaybeUser    = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User

function ensureValue<T>(value: T | null | undefined, fallback: NonNullable<T>): NonNullable<T> {
  return (value ?? fallback) as NonNullable<T>;
}
console.log(ensureValue(null, "default"));      // "default"
console.log(ensureValue("actual", "default"));  // "actual"

// ----------------------------------------------------------
// 10. ReturnType<T> — extract return type of a function
// ----------------------------------------------------------
function createUser(name: string, email: string): User {
  return { id: Date.now(), name, email, password: "", role: "user", createdAt: new Date() };
}

type CreatedUser = ReturnType<typeof createUser>; // User

// Useful when you don't control the function definition
function parseConfig() {
  return { host: "localhost", port: 3000, debug: true };
}
type Config = ReturnType<typeof parseConfig>;
// { host: string; port: number; debug: boolean }

const cfg: Config = parseConfig();
console.log("Config port:", cfg.port);

// ----------------------------------------------------------
// 11. Parameters<T> — extract parameter types as a tuple
// ----------------------------------------------------------
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, email: string]

function logCall<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T> {
  console.log(`Calling ${fn.name} with`, args);
  return fn(...args) as ReturnType<T>;
}

const newUser = logCall(createUser, "Bob", "bob@mail.com");
console.log("Created:", newUser.name);

// ----------------------------------------------------------
// 12. InstanceType<T> — get instance type from class constructor
// ----------------------------------------------------------
class Logger {
  constructor(private prefix: string) {}
  log(msg: string) { console.log(`[${this.prefix}] ${msg}`); }
}

type LoggerInstance = InstanceType<typeof Logger>; // Logger

function createLogger(prefix: string): LoggerInstance {
  return new Logger(prefix);
}
createLogger("APP").log("Hello from InstanceType demo");

// ----------------------------------------------------------
// 13. Awaited<T> — unwrap Promise (TypeScript 4.5+)
// ----------------------------------------------------------
async function fetchUser(id: number): Promise<User> {
  return alice; // mock
}

type FetchedUser = Awaited<ReturnType<typeof fetchUser>>; // User (not Promise<User>)

type NestedPromise = Awaited<Promise<Promise<string>>>; // string — recursively unwraps

// ----------------------------------------------------------
// 14. ConstructorParameters<T> — constructor param types
// ----------------------------------------------------------
class Database {
  constructor(
    private host: string,
    private port: number,
    private name: string,
  ) {}
}

type DbConstructorParams = ConstructorParameters<typeof Database>;
// [host: string, port: number, name: string]

function createDb(...args: ConstructorParameters<typeof Database>): Database {
  return new Database(...args);
}
const db = createDb("localhost", 5432, "mydb");
console.log("Database created:", db instanceof Database);

export {};
