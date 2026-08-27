// ============================================================
// Phase 1 — 02: Type Aliases
// ============================================================
// Topics: type alias, object types, optional/readonly props,
//         union, intersection, primitive alias
// Run: npx ts-node src/phase-1/02_type_alias.ts
// ============================================================

// ----------------------------------------------------------
// 1. Basic type alias — give a name to any type
// ----------------------------------------------------------
type UserID   = number;
type Username = string;
type IsAdmin  = boolean;

const id:       UserID   = 1;
const username: Username = "faisal_b";
const isAdmin:  IsAdmin  = false;

console.log(id, username, isAdmin);

// ----------------------------------------------------------
// 2. Object type alias
// ----------------------------------------------------------
type Point = {
  x: number;
  y: number;
};

type Size = {
  width:  number;
  height: number;
};

const origin: Point = { x: 0, y: 0 };
const screen: Size  = { width: 1920, height: 1080 };

function distanceFromOrigin(p: Point): number {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}
console.log(distanceFromOrigin({ x: 3, y: 4 })); // 5

// ----------------------------------------------------------
// 3. Optional properties — use '?' suffix
// ----------------------------------------------------------
type User = {
  id:          number;
  name:        string;
  email:       string;
  age?:        number;        // optional — may be undefined
  phoneNumber?: string;       // optional
};

const user1: User = { id: 1, name: "Alice", email: "alice@mail.com" };
const user2: User = { id: 2, name: "Bob",   email: "bob@mail.com", age: 30 };

// Accessing optional props — always check first
if (user1.age !== undefined) {
  console.log(user1.age.toFixed(0));
}

// Optional chaining — safe access without explicit null check
console.log(user1.phoneNumber?.toUpperCase()); // undefined (no crash)
console.log(user2.age?.toFixed(0));            // "30"

// ----------------------------------------------------------
// 4. Readonly properties — cannot be reassigned after creation
// ----------------------------------------------------------
type ImmutablePoint = {
  readonly x: number;
  readonly y: number;
};

const fixedPoint: ImmutablePoint = { x: 10, y: 20 };
// fixedPoint.x = 99; // ❌ Cannot assign to 'x' because it is a read-only property

// Readonly doesn't deep-freeze nested objects
type Config = {
  readonly host: string;
  readonly settings: { timeout: number };
};
const cfg: Config = { host: "localhost", settings: { timeout: 3000 } };
// cfg.host = "other"; // ❌ error
cfg.settings.timeout = 5000; // ✅ nested object is still mutable

// ----------------------------------------------------------
// 5. Union types — one of several types
// ----------------------------------------------------------
type StringOrNumber = string | number;
type ID = string | number;
type Nullable<T> = T | null;
type Optional<T> = T | null | undefined;

function formatID(id: ID): string {
  if (typeof id === "string") return id.toUpperCase();
  return id.toString();
}
console.log(formatID("abc-123")); // ABC-123
console.log(formatID(42));        // 42

// String literal union — acts like an enum
type Status   = "pending" | "active" | "suspended" | "deleted";
type Direction = "up" | "down" | "left" | "right";

function getStatusLabel(status: Status): string {
  const labels: Record<Status, string> = {
    pending:   "Waiting for review",
    active:    "Currently active",
    suspended: "Temporarily suspended",
    deleted:   "Permanently removed",
  };
  return labels[status];
}
console.log(getStatusLabel("active")); // Currently active

// ----------------------------------------------------------
// 6. Intersection types — combine multiple types into one
// ----------------------------------------------------------
type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

type SoftDeletable = {
  deletedAt: Date | null;
};

// BaseEntity has ALL properties from both types
type BaseEntity = Timestamped & SoftDeletable & { id: number };

type Product = BaseEntity & {
  name:  string;
  price: number;
  stock: number;
};

const laptop: Product = {
  id:        1,
  name:      "Laptop Pro",
  price:     1200,
  stock:     50,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
console.log(laptop.name, laptop.price);

// ----------------------------------------------------------
// 7. Complex type alias — combining everything
// ----------------------------------------------------------
type Address = {
  street:  string;
  city:    string;
  country: string;
  zip?:    string;
};

type ContactInfo = {
  email:   string;
  phone?:  string;
  address?: Address;
};

type Role = "owner" | "admin" | "member" | "viewer";

type TeamMember = BaseEntity & {
  readonly userId: number;
  name:            string;
  role:            Role;
  contact:         ContactInfo;
  isActive:        boolean;
};

const member: TeamMember = {
  id:        10,
  userId:    42,
  name:      "Faisal Bahri",
  role:      "admin",
  isActive:  true,
  contact:   {
    email: "faisal@mail.com",
    address: { street: "Jl. Sudirman", city: "Jakarta", country: "Indonesia" },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
console.log(`${member.name} is ${member.role}`);

// ----------------------------------------------------------
// 8. Recursive type alias
// ----------------------------------------------------------
type TreeNode = {
  value:    number;
  left?:   TreeNode; // recursive — a node can have child nodes
  right?:  TreeNode;
};

const tree: TreeNode = {
  value: 1,
  left:  { value: 2, left: { value: 4 }, right: { value: 5 } },
  right: { value: 3 },
};

function sumTree(node: TreeNode | undefined): number {
  if (!node) return 0;
  return node.value + sumTree(node.left) + sumTree(node.right);
}
console.log("Tree sum:", sumTree(tree)); // 15

// ----------------------------------------------------------
// 9. Type alias vs primitive — no runtime cost
// ----------------------------------------------------------
// Type aliases are ERASED at compile time — they are purely for
// development-time type checking. Zero runtime overhead.
type Milliseconds = number;
type Seconds      = number;

function sleep(ms: Milliseconds): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Note: TypeScript won't stop you from passing Seconds to Milliseconds
// because they're both just 'number' at runtime.
// For stronger separation, use branded types (covered in advanced phases).

export {};
