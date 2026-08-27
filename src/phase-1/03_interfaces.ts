// ============================================================
// Phase 1 — 03: Interfaces
// ============================================================
// Topics: interface declaration, optional/readonly, extending,
//         implements, function signatures, index signatures,
//         declaration merging
// Run: npx ts-node src/phase-1/03_interfaces.ts
// ============================================================

// ----------------------------------------------------------
// 1. Basic interface — describes the shape of an object
// ----------------------------------------------------------
interface Point {
  x: number;
  y: number;
}

const origin: Point = { x: 0, y: 0 };
const p: Point      = { x: 3, y: 4 };

function distanceBetween(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}
console.log(distanceBetween(origin, p)); // 5

// ----------------------------------------------------------
// 2. Optional and readonly properties
// ----------------------------------------------------------
interface User {
  readonly id:   number;   // cannot be changed after creation
  name:          string;
  email:         string;
  age?:          number;   // optional
  bio?:          string;   // optional
}

const alice: User = { id: 1, name: "Alice", email: "alice@mail.com" };
const bob:   User = { id: 2, name: "Bob",   email: "bob@mail.com", age: 30 };

// alice.id = 99; // ❌ Cannot assign to 'id' because it is a read-only property
alice.name = "Alicia"; // ✅ non-readonly can be changed
console.log(alice, bob);

// ----------------------------------------------------------
// 3. Interface extending — build on top of existing interfaces
// ----------------------------------------------------------
interface Animal {
  name:    string;
  species: string;
}

interface Pet extends Animal {
  owner:   string;
  isVaccinated: boolean;
}

interface Dog extends Pet {
  breed: string;
}

const myDog: Dog = {
  name:          "Buddy",
  species:       "Canis lupus familiaris",
  owner:         "Faisal",
  isVaccinated:  true,
  breed:         "Golden Retriever",
};
console.log(`${myDog.name} — ${myDog.breed}, owned by ${myDog.owner}`);

// Extend multiple interfaces
interface Flyable  { fly(): void; }
interface Swimmable { swim(): void; }

interface Duck extends Animal, Flyable, Swimmable {
  quack(): void;
}

// ----------------------------------------------------------
// 4. Implementing an interface in a class
// ----------------------------------------------------------
interface Shape {
  readonly kind:    string;
  getArea():        number;
  getPerimeter():   number;
  describe():       string;
}

class Circle implements Shape {
  readonly kind = "circle";

  constructor(private radius: number) {}

  getArea(): number      { return Math.PI * this.radius ** 2; }
  getPerimeter(): number { return 2 * Math.PI * this.radius; }
  describe(): string     {
    return `Circle(r=${this.radius}) — area=${this.getArea().toFixed(2)}`;
  }
}

class Rectangle implements Shape {
  readonly kind = "rectangle";

  constructor(private width: number, private height: number) {}

  getArea(): number      { return this.width * this.height; }
  getPerimeter(): number { return 2 * (this.width + this.height); }
  describe(): string     {
    return `Rect(${this.width}×${this.height}) — area=${this.getArea()}`;
  }
}

const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(s => console.log(s.describe()));

// ----------------------------------------------------------
// 5. Function signatures in interfaces
// ----------------------------------------------------------
interface MathOperation {
  (a: number, b: number): number; // callable interface
}

interface Formatter {
  format(value: number): string;
  formatWithSymbol(value: number, symbol: string): string;
}

const add:      MathOperation = (a, b) => a + b;
const multiply: MathOperation = (a, b) => a * b;

console.log(add(2, 3));       // 5
console.log(multiply(2, 3));  // 6

// ----------------------------------------------------------
// 6. Index signatures — dynamic keys
// ----------------------------------------------------------
interface StringMap {
  [key: string]: string; // any string key, string value
}

interface NumberMap {
  [key: string]: number;
  count: number; // specific keys must match the index type
}

const translations: StringMap = {
  hello:   "hola",
  goodbye: "adiós",
  thanks:  "gracias",
};

translations["morning"] = "mañana"; // ✅ dynamic key
console.log(translations["hello"]);  // hola

// ----------------------------------------------------------
// 7. Nested interfaces
// ----------------------------------------------------------
interface Address {
  street:  string;
  city:    string;
  country: string;
  zip?:    string;
}

interface Company {
  id:       number;
  name:     string;
  address:  Address;
  employees: number;
}

const company: Company = {
  id:        1,
  name:      "Acme Corp",
  address:   { street: "123 Main St", city: "Jakarta", country: "Indonesia" },
  employees: 250,
};
console.log(`${company.name} in ${company.address.city}`);

// ----------------------------------------------------------
// 8. Declaration merging — unique to interfaces (not type aliases)
// ----------------------------------------------------------
// You can "extend" an interface by declaring it again with the same name.
// TypeScript merges both declarations into one.

interface Config {
  host: string;
  port: number;
}

// In another file or below — TypeScript merges these
interface Config {
  timeout: number;
  retries?: number;
}

// Result: Config = { host, port, timeout, retries? }
const appConfig: Config = {
  host:    "localhost",
  port:    3000,
  timeout: 5000,
};
console.log(appConfig);

// When is this useful?
// - Augmenting third-party library types
// - Adding custom properties to global objects (e.g., Window, Express Request)

// ----------------------------------------------------------
// 9. Readonly interface utility
// ----------------------------------------------------------
interface MutableUser {
  name:  string;
  email: string;
}

// Make all properties readonly using Readonly<T>
type ImmutableUser = Readonly<MutableUser>;

const frozen: ImmutableUser = { name: "Alice", email: "a@b.com" };
// frozen.name = "Bob"; // ❌ readonly

// Partial<T> — make all properties optional
type UserDraft = Partial<MutableUser>;
const draft: UserDraft = {}; // ✅ all fields optional

export {};
