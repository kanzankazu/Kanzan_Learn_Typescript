// ============================================================
// Phase 2 — Mini Project: Generic Data Store
// ============================================================
// A type-safe in-memory data store using generics, abstract classes,
// type narrowing, and discriminated union error handling.
//
// Run: npx ts-node src/phase-2/mini_project_data_store.ts
// ============================================================

// ----------------------------------------------------------
// Result type — error handling without exceptions
// ----------------------------------------------------------
type Ok<T>   = { ok: true;  value: T };
type Err<E>  = { ok: false; error: E };
type Result<T, E = string> = Ok<T> | Err<E>;

const Ok  = <T>(value: T): Ok<T>   => ({ ok: true, value });
const Err = <E>(error: E): Err<E>  => ({ ok: false, error });

// ----------------------------------------------------------
// Base entity
// ----------------------------------------------------------
interface Entity {
  readonly id: number;
  createdAt:   Date;
  updatedAt:   Date;
}

// ----------------------------------------------------------
// Generic Repository — abstract base
// ----------------------------------------------------------
abstract class BaseRepository<T extends Entity> {
  protected store = new Map<number, T>();
  private nextId  = 1;

  protected generateId(): number { return this.nextId++; }

  findById(id: number): Result<T> {
    const item = this.store.get(id);
    if (!item) return Err(`[${this.entityName}] ID ${id} not found`);
    return Ok(item);
  }

  findAll(predicate?: (item: T) => boolean): T[] {
    const all = [...this.store.values()];
    return predicate ? all.filter(predicate) : all;
  }

  findOne(predicate: (item: T) => boolean): Result<T> {
    const found = this.findAll(predicate)[0];
    if (!found) return Err(`[${this.entityName}] No matching record found`);
    return Ok(found);
  }

  save(item: T): T {
    this.store.set(item.id, { ...item, updatedAt: new Date() });
    return this.store.get(item.id)!;
  }

  delete(id: number): Result<void> {
    if (!this.store.has(id)) return Err(`[${this.entityName}] ID ${id} not found`);
    this.store.delete(id);
    return Ok(undefined);
  }

  count(predicate?: (item: T) => boolean): number {
    return this.findAll(predicate).length;
  }

  protected abstract get entityName(): string;
  abstract create(dto: Omit<T, keyof Entity>): Result<T>;
  abstract update(id: number, dto: Partial<Omit<T, keyof Entity>>): Result<T>;
}

// ----------------------------------------------------------
// User entity & repository
// ----------------------------------------------------------
type UserRole = "admin" | "moderator" | "user";

interface User extends Entity {
  name:      string;
  email:     string;
  role:      UserRole;
  isActive:  boolean;
}

type CreateUserDto = Omit<User, keyof Entity>;
type UpdateUserDto = Partial<Omit<User, keyof Entity>>;

class UserRepository extends BaseRepository<User> {
  protected get entityName() { return "User"; }

  create(dto: CreateUserDto): Result<User> {
    if (!dto.name.trim())  return Err("Name is required");
    if (!dto.email.trim()) return Err("Email is required");
    if (!dto.email.includes("@")) return Err("Email is invalid");

    // Check duplicate email
    const existing = this.findAll(u => u.email === dto.email.toLowerCase());
    if (existing.length > 0) return Err(`Email '${dto.email}' is already taken`);

    const now  = new Date();
    const user: User = {
      id:        this.generateId(),
      name:      dto.name.trim(),
      email:     dto.email.toLowerCase().trim(),
      role:      dto.role ?? "user",
      isActive:  dto.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    return Ok(this.save(user));
  }

  update(id: number, dto: UpdateUserDto): Result<User> {
    const result = this.findById(id);
    if (!result.ok) return result;

    if (dto.email !== undefined) {
      if (!dto.email.includes("@")) return Err("Email is invalid");
      const existing = this.findAll(u => u.email === dto.email!.toLowerCase() && u.id !== id);
      if (existing.length > 0) return Err(`Email '${dto.email}' is already taken`);
    }

    const updated: User = { ...result.value, ...dto, updatedAt: new Date() };
    return Ok(this.save(updated));
  }

  findByEmail(email: string): Result<User> {
    return this.findOne(u => u.email === email.toLowerCase());
  }

  findByRole(role: UserRole): User[] {
    return this.findAll(u => u.role === role);
  }

  deactivate(id: number): Result<User> {
    return this.update(id, { isActive: false });
  }
}

// ----------------------------------------------------------
// Product entity & repository
// ----------------------------------------------------------
type ProductCategory = "electronics" | "clothing" | "food" | "books" | "other";

interface Product extends Entity {
  name:      string;
  price:     number;
  stock:     number;
  category:  ProductCategory;
  sku:       string;
}

type CreateProductDto = Omit<Product, keyof Entity>;
type UpdateProductDto = Partial<Omit<Product, keyof Entity>>;

class ProductRepository extends BaseRepository<Product> {
  protected get entityName() { return "Product"; }

  create(dto: CreateProductDto): Result<Product> {
    if (!dto.name.trim()) return Err("Product name is required");
    if (dto.price < 0)    return Err("Price cannot be negative");
    if (dto.stock < 0)    return Err("Stock cannot be negative");
    if (!dto.sku.trim())  return Err("SKU is required");

    const existingSku = this.findAll(p => p.sku === dto.sku.toUpperCase());
    if (existingSku.length > 0) return Err(`SKU '${dto.sku}' already exists`);

    const now = new Date();
    const product: Product = {
      id:        this.generateId(),
      name:      dto.name.trim(),
      price:     dto.price,
      stock:     dto.stock,
      category:  dto.category,
      sku:       dto.sku.toUpperCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
    return Ok(this.save(product));
  }

  update(id: number, dto: UpdateProductDto): Result<Product> {
    const result = this.findById(id);
    if (!result.ok) return result;

    if (dto.price !== undefined && dto.price < 0) return Err("Price cannot be negative");
    if (dto.stock !== undefined && dto.stock < 0) return Err("Stock cannot be negative");

    const updated: Product = { ...result.value, ...dto, updatedAt: new Date() };
    return Ok(this.save(updated));
  }

  adjustStock(id: number, delta: number): Result<Product> {
    const result = this.findById(id);
    if (!result.ok) return result;

    const newStock = result.value.stock + delta;
    if (newStock < 0) return Err(`Insufficient stock (current: ${result.value.stock}, requested: ${-delta})`);

    return this.update(id, { stock: newStock });
  }

  findByCategory(category: ProductCategory): Product[] {
    return this.findAll(p => p.category === category);
  }

  findLowStock(threshold: number = 10): Product[] {
    return this.findAll(p => p.stock <= threshold);
  }

  getTotalValue(): number {
    return this.findAll().reduce((sum, p) => sum + p.price * p.stock, 0);
  }
}

// ----------------------------------------------------------
// Demo
// ----------------------------------------------------------
function printResult<T>(label: string, result: Result<T>): void {
  if (result.ok) {
    const v = result.value;
    if (v && typeof v === "object" && "name" in v) {
      const named = v as { id: number; name: string };
      console.log(`  ✅ ${label}: #${named.id} "${named.name}"`);
    } else {
      console.log(`  ✅ ${label}: OK`);
    }
  } else {
    console.log(`  ❌ ${label}: ${result.error}`);
  }
}

function section(title: string): void {
  console.log(`\n${"=".repeat(50)}\n${title}\n${"=".repeat(50)}`);
}

// --- Users ---
section("Users");
const users = new UserRepository();

printResult("Create Alice",          users.create({ name: "Alice",   email: "alice@mail.com", role: "admin",     isActive: true  }));
printResult("Create Bob",            users.create({ name: "Bob",     email: "bob@mail.com",   role: "user",      isActive: true  }));
printResult("Create Carol",          users.create({ name: "Carol",   email: "carol@mail.com", role: "moderator", isActive: true  }));
printResult("Duplicate email",       users.create({ name: "Dup",     email: "alice@mail.com", role: "user",      isActive: true  }));
printResult("Invalid email",         users.create({ name: "Bad",     email: "not-an-email",   role: "user",      isActive: true  }));
printResult("Update Bob role",       users.update(2, { role: "moderator" }));
printResult("Deactivate Carol",      users.deactivate(3));
printResult("Find non-existent #99", users.findById(99));

console.log(`\nAdmins: ${users.findByRole("admin").map(u => u.name).join(", ")}`);
console.log(`Total users: ${users.count()}, Active: ${users.count(u => u.isActive)}`);

// --- Products ---
section("Products");
const products = new ProductRepository();

printResult("Create Laptop",     products.create({ name: "Laptop Pro",    price: 1200, stock: 50,  category: "electronics", sku: "LAP-001" }));
printResult("Create Mouse",      products.create({ name: "Wireless Mouse", price: 25,  stock: 200, category: "electronics", sku: "MOU-001" }));
printResult("Create Python Book",products.create({ name: "Python Basics",  price: 35,  stock: 8,   category: "books",       sku: "BOO-001" }));
printResult("Create TS Book",    products.create({ name: "TypeScript Pro", price: 45,  stock: 5,   category: "books",       sku: "BOO-002" }));
printResult("Duplicate SKU",     products.create({ name: "Copy",          price: 10,  stock: 10,  category: "other",       sku: "LAP-001" }));
printResult("Negative price",    products.create({ name: "Bad",           price: -1,  stock: 10,  category: "other",       sku: "BAD-001" }));

printResult("Sell 5 Laptops",    products.adjustStock(1, -5));
printResult("Restock Mouse +50", products.adjustStock(2, 50));
printResult("Oversell Python",   products.adjustStock(3, -100)); // should fail

console.log(`\nBooks: ${products.findByCategory("books").map(p => p.name).join(", ")}`);
console.log(`Low stock (≤10): ${products.findLowStock(10).map(p => `${p.name}(${p.stock})`).join(", ")}`);
console.log(`Total inventory value: $${products.getTotalValue().toLocaleString()}`);
