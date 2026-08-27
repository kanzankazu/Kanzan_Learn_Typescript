// ============================================================
// Phase 1 — 06: Enums
// ============================================================
// Topics: numeric enum, string enum, const enum,
//         reverse mapping, computed members,
//         enum vs string literal union
// Run: npx ts-node src/phase-1/06_enums.ts
// ============================================================

// ----------------------------------------------------------
// 1. Numeric enum — values auto-increment from 0
// ----------------------------------------------------------
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

console.log(Direction.Up);    // 0
console.log(Direction.Right); // 3
console.log(Direction[0]);    // "Up" — reverse mapping (numeric enums only)

function move(dir: Direction): void {
  switch (dir) {
    case Direction.Up:    console.log("Moving up");    break;
    case Direction.Down:  console.log("Moving down");  break;
    case Direction.Left:  console.log("Moving left");  break;
    case Direction.Right: console.log("Moving right"); break;
  }
}
move(Direction.Up);    // Moving up
move(Direction.Left);  // Moving left

// Custom starting value
enum Priority {
  Low    = 1,
  Medium = 5,
  High   = 10,
  Critical = 100,
}
console.log(Priority.Medium);  // 5
console.log(Priority.Critical); // 100

// ----------------------------------------------------------
// 2. String enum — recommended for most use cases
// ----------------------------------------------------------
// Advantages: readable values in logs/debugger, no reverse mapping confusion
enum Status {
  Pending   = "PENDING",
  Active    = "ACTIVE",
  Suspended = "SUSPENDED",
  Deleted   = "DELETED",
}

console.log(Status.Active);   // "ACTIVE" — readable!
// console.log(Status["ACTIVE"]); // ❌ no reverse mapping for string enums

function getStatusLabel(status: Status): string {
  const labels: Record<Status, string> = {
    [Status.Pending]:   "Waiting for approval",
    [Status.Active]:    "Currently active",
    [Status.Suspended]: "Temporarily suspended",
    [Status.Deleted]:   "Permanently removed",
  };
  return labels[status];
}
console.log(getStatusLabel(Status.Active)); // Currently active

// ----------------------------------------------------------
// 3. Heterogeneous enum — mixed types (avoid in practice)
// ----------------------------------------------------------
enum MixedEnum {
  No  = 0,
  Yes = "YES",
}
// Generally avoid — inconsistent types make it hard to reason about

// ----------------------------------------------------------
// 4. Computed & constant members
// ----------------------------------------------------------
enum FilePermission {
  None    = 0,
  Read    = 1 << 0,  // 1
  Write   = 1 << 1,  // 2
  Execute = 1 << 2,  // 4
  ReadWrite = Read | Write, // 3
  All       = Read | Write | Execute, // 7
}

const userPerms = FilePermission.ReadWrite;
console.log("Can read?",    (userPerms & FilePermission.Read)    !== 0); // true
console.log("Can write?",   (userPerms & FilePermission.Write)   !== 0); // true
console.log("Can execute?", (userPerms & FilePermission.Execute) !== 0); // false

// ----------------------------------------------------------
// 5. const enum — inlined at compile time (zero runtime cost)
// ----------------------------------------------------------
// 'const enum' values are replaced with their literal values at compile time.
// The enum object does NOT exist at runtime.
const enum HttpMethod {
  GET    = "GET",
  POST   = "POST",
  PUT    = "PUT",
  PATCH  = "PATCH",
  DELETE = "DELETE",
}

// After compile: `const method = "GET"` — no enum object in JS output
const method = HttpMethod.GET;
console.log(method); // "GET"

function fetchData(url: string, method: HttpMethod): void {
  console.log(`${method} ${url}`);
}
fetchData("/api/users", HttpMethod.GET);   // GET /api/users
fetchData("/api/users", HttpMethod.POST);  // POST /api/users

// ----------------------------------------------------------
// 6. Enum in switch — exhaustive checking
// ----------------------------------------------------------
enum Shape {
  Circle    = "CIRCLE",
  Rectangle = "RECTANGLE",
  Triangle  = "TRIANGLE",
}

function describeShape(shape: Shape): string {
  switch (shape) {
    case Shape.Circle:    return "A round shape with no corners";
    case Shape.Rectangle: return "A 4-sided shape with right angles";
    case Shape.Triangle:  return "A 3-sided polygon";
    default: {
      // If you add a new Shape and forget to handle it, TypeScript errors here
      const exhausted: never = shape;
      throw new Error(`Unknown shape: ${exhausted}`);
    }
  }
}
console.log(describeShape(Shape.Circle));    // A round shape with no corners
console.log(describeShape(Shape.Triangle));  // A 3-sided polygon

// ----------------------------------------------------------
// 7. Iterating over enum values
// ----------------------------------------------------------
// Numeric enum — Object.values includes both keys and values
console.log("\nNumeric enum entries:");
Object.entries(Direction)
  .filter(([k]) => isNaN(Number(k))) // filter out reverse-mapped numeric keys
  .forEach(([key, val]) => console.log(`  ${key} = ${val}`));

// String enum — clean iteration
console.log("\nString enum entries:");
Object.entries(Status).forEach(([key, val]) => console.log(`  ${key} = ${val}`));

// ----------------------------------------------------------
// 8. Enum vs string literal union — when to use which
// ----------------------------------------------------------

// String literal union — simpler, no runtime object
type StatusUnion = "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";

// Enum — more features: group under namespace, iterate, use as map key
// Use enum when:
// - You need to iterate over all values
// - You want values grouped under a meaningful name
// - You want the values to be configurable (not hardcoded strings)

// Use string literal union when:
// - Simple set of fixed string values
// - No need to iterate
// - Prefer minimal runtime footprint (const enum achieves same)

// Practical recommendation:
// ✅ const enum for flags/constants (zero runtime cost)
// ✅ string enum for domain concepts (Status, Role, etc.)
// ✅ string literal union for simple one-off sets

export {};
