// ============================================================
// Phase 2 — 01: Classes & OOP
// ============================================================
// Topics: access modifiers, readonly, constructor shorthand,
//         getter/setter, static, inheritance, abstract, override
// Run: npx ts-node src/phase-2/01_classes.ts
// ============================================================

// ----------------------------------------------------------
// 1. Access modifiers — public / protected / private
// ----------------------------------------------------------
class BankAccount {
  public   owner: string;      // accessible from anywhere
  protected balance: number;   // accessible from this class + subclasses
  private  _pin: string;       // accessible only within this class

  constructor(owner: string, initialBalance: number, pin: string) {
    this.owner   = owner;
    this.balance = initialBalance;
    this._pin    = pin;
  }

  public getBalance(): number {
    return this.balance;
  }

  public validatePin(pin: string): boolean {
    return this._pin === pin; // private field accessible here
  }
}

const acc = new BankAccount("Alice", 1000, "1234");
console.log(acc.owner);         // ✅ public
console.log(acc.getBalance());  // ✅ via public method
// console.log(acc.balance);    // ❌ protected
// console.log(acc._pin);       // ❌ private
console.log(acc.validatePin("1234")); // true

// ----------------------------------------------------------
// 2. Constructor shorthand — declare & assign in one step
// ----------------------------------------------------------
class Point {
  constructor(
    public readonly x: number,  // public + readonly
    public readonly y: number,
  ) {}

  distanceTo(other: Point): number {
    return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.log(p1.distanceTo(p2)); // 5
// p1.x = 10; // ❌ readonly

// ----------------------------------------------------------
// 3. Getter & Setter — computed / validated property access
// ----------------------------------------------------------
class Temperature {
  private _celsius: number;

  constructor(celsius: number) {
    this._celsius = celsius;
  }

  // Getter — accessed like a property, no ()
  get celsius(): number    { return this._celsius; }
  get fahrenheit(): number { return this._celsius * 9 / 5 + 32; }
  get kelvin(): number     { return this._celsius + 273.15; }

  // Setter — with validation
  set celsius(value: number) {
    if (value < -273.15) throw new RangeError("Temperature below absolute zero");
    this._celsius = value;
  }
}

const temp = new Temperature(100);
console.log(`${temp.celsius}°C = ${temp.fahrenheit}°F = ${temp.kelvin}K`);
temp.celsius = 37;
console.log(`Body temp: ${temp.fahrenheit}°F`); // 98.6°F

// ----------------------------------------------------------
// 4. Static members — belong to the class, not instances
// ----------------------------------------------------------
class IdGenerator {
  private static nextId = 1;
  private static readonly PREFIX = "ID";

  static generate(): string {
    return `${IdGenerator.PREFIX}-${String(IdGenerator.nextId++).padStart(4, "0")}`;
  }

  static reset(): void {
    IdGenerator.nextId = 1;
  }

  static peek(): number {
    return IdGenerator.nextId;
  }
}

console.log(IdGenerator.generate()); // ID-0001
console.log(IdGenerator.generate()); // ID-0002
console.log(IdGenerator.generate()); // ID-0003
IdGenerator.reset();
console.log(IdGenerator.generate()); // ID-0001

// ----------------------------------------------------------
// 5. Inheritance — extends + super
// ----------------------------------------------------------
class Animal {
  constructor(
    public readonly name: string,
    protected energy: number = 100,
  ) {}

  eat(amount: number): void {
    this.energy += amount;
    console.log(`${this.name} eats — energy: ${this.energy}`);
  }

  sleep(): void {
    this.energy += 50;
    console.log(`${this.name} sleeps — energy: ${this.energy}`);
  }

  toString(): string {
    return `${this.name} (energy: ${this.energy})`;
  }
}

class Dog extends Animal {
  constructor(name: string, public readonly breed: string) {
    super(name, 80); // must call super() first
  }

  bark(): void {
    this.energy -= 10;
    console.log(`${this.name} barks! Woof! — energy: ${this.energy}`);
  }

  // override parent method
  override toString(): string {
    return `${super.toString()}, breed: ${this.breed}`;
  }
}

class Cat extends Animal {
  private lives = 9;

  override eat(amount: number): void {
    super.eat(amount * 0.5); // cats eat less
  }

  purr(): void {
    console.log(`${this.name} purrs... 😸`);
  }
}

const dog = new Dog("Rex", "Labrador");
dog.eat(20);
dog.bark();
dog.sleep();
console.log(dog.toString());

const cat = new Cat("Whiskers");
cat.eat(20); // eats half
cat.purr();

// ----------------------------------------------------------
// 6. Abstract class — blueprint, cannot be instantiated directly
// ----------------------------------------------------------
abstract class Shape {
  constructor(public readonly color: string = "black") {}

  // Abstract methods — MUST be implemented in subclasses
  abstract getArea(): number;
  abstract getPerimeter(): number;

  // Concrete method — shared by all subclasses
  describe(): string {
    return `${this.constructor.name}(color=${this.color}, area=${this.getArea().toFixed(2)}, perimeter=${this.getPerimeter().toFixed(2)})`;
  }
}

// const s = new Shape(); // ❌ Cannot create an instance of an abstract class

class Circle extends Shape {
  constructor(public readonly radius: number, color?: string) {
    super(color);
  }
  getArea(): number      { return Math.PI * this.radius ** 2; }
  getPerimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(
    public readonly width: number,
    public readonly height: number,
    color?: string,
  ) { super(color); }
  getArea(): number      { return this.width * this.height; }
  getPerimeter(): number { return 2 * (this.width + this.height); }
}

class Triangle extends Shape {
  constructor(
    public readonly a: number,
    public readonly b: number,
    public readonly c: number,
  ) { super(); }
  getArea(): number {
    const s = (this.a + this.b + this.c) / 2;
    return Math.sqrt(s * (s - this.a) * (s - this.b) * (s - this.c));
  }
  getPerimeter(): number { return this.a + this.b + this.c; }
}

const shapes: Shape[] = [
  new Circle(5, "red"),
  new Rectangle(4, 6, "blue"),
  new Triangle(3, 4, 5),
];
shapes.forEach(s => console.log(s.describe()));

// ----------------------------------------------------------
// 7. Implementing interfaces in classes
// ----------------------------------------------------------
interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

interface Comparable<T> {
  compareTo(other: T): -1 | 0 | 1;
}

class Product implements Serializable, Comparable<Product> {
  constructor(
    public id: number,
    public name: string,
    public price: number,
  ) {}

  serialize(): string {
    return JSON.stringify({ id: this.id, name: this.name, price: this.price });
  }

  deserialize(data: string): void {
    const obj = JSON.parse(data) as { id: number; name: string; price: number };
    this.id    = obj.id;
    this.name  = obj.name;
    this.price = obj.price;
  }

  compareTo(other: Product): -1 | 0 | 1 {
    if (this.price < other.price) return -1;
    if (this.price > other.price) return 1;
    return 0;
  }
}

const laptop  = new Product(1, "Laptop",  1200);
const mouse   = new Product(2, "Mouse",   25);
const monitor = new Product(3, "Monitor", 400);

const sorted = [laptop, mouse, monitor].sort((a, b) => a.compareTo(b));
console.log(sorted.map(p => `${p.name}($${p.price})`).join(" < "));
// Mouse($25) < Monitor($400) < Laptop($1200)

const json = laptop.serialize();
console.log("Serialized:", json);
const copy = new Product(0, "", 0);
copy.deserialize(json);
console.log("Deserialized:", copy.name, copy.price);

export {};
