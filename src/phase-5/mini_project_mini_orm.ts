// ============================================================
// Phase 5 — Mini Project: Mini ORM
// ============================================================
// A type-safe ORM-like system demonstrating:
// - @Table, @Column decorators
// - Generic Model<T> class
// - Type-safe query builder
// - Relations (has-one, has-many)
//
// Run: npx ts-node src/phase-5/mini_project_mini_orm.ts
// ============================================================

// ----------------------------------------------------------
// Metadata storage (replaces reflect-metadata for simplicity)
// ----------------------------------------------------------
const tableMetadata  = new Map<Function, string>();
const columnMetadata = new Map<Function, Map<string, ColumnOptions>>();
const relationMeta   = new Map<Function, RelationDef[]>();

// ----------------------------------------------------------
// Decorator options
// ----------------------------------------------------------
interface ColumnOptions {
  type?:      "string" | "number" | "boolean" | "date";
  primary?:   boolean;
  nullable?:  boolean;
  default?:   unknown;
  unique?:    boolean;
  length?:    number;
}

interface RelationDef {
  type:       "hasOne" | "hasMany" | "belongsTo";
  target:     () => Function;
  foreignKey: string;
  field:      string;
}

// ----------------------------------------------------------
// Decorators
// ----------------------------------------------------------
function Table(name: string) {
  return function (constructor: Function) {
    tableMetadata.set(constructor, name);
  };
}

function Column(options: ColumnOptions = {}) {
  return function (target: object, key: string) {
    const ctor = target.constructor;
    if (!columnMetadata.has(ctor)) columnMetadata.set(ctor, new Map());
    columnMetadata.get(ctor)!.set(key, options);
  };
}

function PrimaryKey() {
  return Column({ type: "number", primary: true });
}

function HasMany(target: () => Function, foreignKey: string) {
  return function (proto: object, field: string) {
    const ctor = proto.constructor;
    if (!relationMeta.has(ctor)) relationMeta.set(ctor, []);
    relationMeta.get(ctor)!.push({ type: "hasMany", target, foreignKey, field });
  };
}

function BelongsTo(target: () => Function, foreignKey: string) {
  return function (proto: object, field: string) {
    const ctor = proto.constructor;
    if (!relationMeta.has(ctor)) relationMeta.set(ctor, []);
    relationMeta.get(ctor)!.push({ type: "belongsTo", target, foreignKey, field });
  };
}

// ----------------------------------------------------------
// Entity classes
// ----------------------------------------------------------
@Table("users")
class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: "string", length: 100 })
  name!: string;

  @Column({ type: "string", unique: true })
  email!: string;

  @Column({ type: "string", default: "user" })
  role!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "date" })
  createdAt!: Date;

  @HasMany(() => Post, "authorId")
  posts?: Post[];
}

@Table("posts")
class Post {
  @PrimaryKey()
  id!: number;

  @Column({ type: "string" })
  title!: string;

  @Column({ type: "string", nullable: true })
  content?: string;

  @Column({ type: "boolean", default: false })
  published!: boolean;

  @Column({ type: "number" })
  authorId!: number;

  @Column({ type: "date" })
  createdAt!: Date;

  @BelongsTo(() => User, "authorId")
  author?: User;
}

// ----------------------------------------------------------
// Schema introspection — read decorator metadata
// ----------------------------------------------------------
function getSchema(ctor: Function): {
  table: string;
  columns: Array<{ name: string } & ColumnOptions>;
  primaryKey: string;
} {
  const table   = tableMetadata.get(ctor) ?? ctor.name.toLowerCase();
  const columns = columnMetadata.get(ctor) ?? new Map();
  const cols    = [...columns.entries()].map(([name, opts]) => ({ name, ...opts }));
  const pk      = cols.find(c => c.primary)?.name ?? "id";
  return { table, columns: cols, primaryKey: pk };
}

// ----------------------------------------------------------
// Type-safe query builder
// ----------------------------------------------------------
type WhereOp = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "IS NULL" | "IS NOT NULL";

interface WhereClause {
  field: string;
  op:    WhereOp;
  value?: unknown;
}

class ModelQuery<T extends object> {
  private _where:  WhereClause[] = [];
  private _select: string[] = [];
  private _order:  Array<{ field: string; dir: "ASC" | "DESC" }> = [];
  private _limit?:  number;
  private _offset?: number;
  private _with:   string[] = [];

  constructor(
    private ctor: new () => T,
    private store: T[],
  ) {}

  select(...fields: (keyof T)[]): this {
    this._select = [...this._select, ...(fields as string[])];
    return this;
  }

  where(field: keyof T, op: WhereOp, value?: unknown): this {
    this._where.push({ field: field as string, op, value });
    return this;
  }

  orderBy(field: keyof T, dir: "ASC" | "DESC" = "ASC"): this {
    this._order.push({ field: field as string, dir });
    return this;
  }

  limit(n: number): this { this._limit = n; return this; }
  offset(n: number): this { this._offset = n; return this; }
  with(...relations: string[]): this { this._with = relations; return this; }

  // Execute against in-memory store
  get(): T[] {
    let results = [...this.store];

    // Apply where clauses
    for (const clause of this._where) {
      results = results.filter(item => {
        const val = (item as Record<string, unknown>)[clause.field];
        switch (clause.op) {
          case "=":          return val === clause.value;
          case "!=":         return val !== clause.value;
          case ">":          return (val as number) > (clause.value as number);
          case "<":          return (val as number) < (clause.value as number);
          case ">=":         return (val as number) >= (clause.value as number);
          case "<=":         return (val as number) <= (clause.value as number);
          case "LIKE":       return String(val).includes(String(clause.value).replace(/%/g, ""));
          case "IN":         return (clause.value as unknown[]).includes(val);
          case "IS NULL":    return val === null || val === undefined;
          case "IS NOT NULL": return val !== null && val !== undefined;
          default:           return true;
        }
      });
    }

    // Apply ordering
    if (this._order.length > 0) {
      results.sort((a, b) => {
        for (const { field, dir } of this._order) {
          const av = (a as Record<string, unknown>)[field];
          const bv = (b as Record<string, unknown>)[field];
          const cmp = av === bv ? 0 : av! < bv! ? -1 : 1;
          if (cmp !== 0) return dir === "ASC" ? cmp : -cmp;
        }
        return 0;
      });
    }

    // Apply offset & limit
    if (this._offset) results = results.slice(this._offset);
    if (this._limit)  results = results.slice(0, this._limit);

    // Apply field selection
    if (this._select.length > 0) {
      results = results.map(item => {
        const out: Partial<T> = {};
        this._select.forEach(f => {
          (out as Record<string, unknown>)[f] = (item as Record<string, unknown>)[f];
        });
        return out as T;
      });
    }

    return results;
  }

  first(): T | undefined { return this.limit(1).get()[0]; }
  count(): number        { return this.get().length; }
  exists(): boolean      { return this.count() > 0; }
  toSQL(): string {
    const schema = getSchema(this.ctor);
    const sel    = this._select.length > 0 ? this._select.join(", ") : "*";
    let sql      = `SELECT ${sel} FROM ${schema.table}`;
    if (this._where.length > 0) {
      const conds = this._where.map(w => {
        if (w.op === "IS NULL" || w.op === "IS NOT NULL") return `${w.field} ${w.op}`;
        const v = typeof w.value === "string" ? `'${w.value}'` : String(w.value);
        return `${w.field} ${w.op} ${v}`;
      });
      sql += ` WHERE ${conds.join(" AND ")}`;
    }
    if (this._order.length > 0)
      sql += ` ORDER BY ${this._order.map(o => `${o.field} ${o.dir}`).join(", ")}`;
    if (this._limit  !== undefined) sql += ` LIMIT ${this._limit}`;
    if (this._offset !== undefined) sql += ` OFFSET ${this._offset}`;
    return sql;
  }
}

// ----------------------------------------------------------
// Generic Model base class
// ----------------------------------------------------------
class Model<T extends object> {
  private static stores = new Map<Function, object[]>();

  protected static getStore<T extends object>(ctor: new () => T): T[] {
    if (!Model.stores.has(ctor)) Model.stores.set(ctor, []);
    return Model.stores.get(ctor) as T[];
  }

  static query<T extends object>(this: new () => T): ModelQuery<T> {
    const store = Model.getStore(this as unknown as new () => T);
    return new ModelQuery(this as unknown as new () => T, store);
  }

  static create<T extends object>(this: new () => T, data: Partial<T>): T {
    const store  = Model.getStore(this as unknown as new () => T);
    const schema = getSchema(this as unknown as Function);
    const pk     = schema.primaryKey;
    const maxId  = store.reduce((max, item) => {
      const id = (item as Record<string, unknown>)[pk] as number;
      return id > max ? id : max;
    }, 0);
    const instance: Record<string, unknown> = { ...data };
    if (!instance[pk]) instance[pk] = maxId + 1;
    if (!instance["createdAt"]) instance["createdAt"] = new Date();
    store.push(instance as T);
    return instance as T;
  }

  static findById<T extends object>(this: new () => T, id: number): T | undefined {
    const store  = Model.getStore(this as unknown as new () => T);
    const schema = getSchema(this as unknown as Function);
    return store.find(item => (item as Record<string, unknown>)[schema.primaryKey] === id);
  }

  static all<T extends object>(this: new () => T): T[] {
    return [...Model.getStore(this as unknown as new () => T)];
  }

  static count<T extends object>(this: new () => T): number {
    return Model.getStore(this as unknown as new () => T).length;
  }
}

// Make User and Post extend Model
class UserModel extends Model<User> {}
class PostModel extends Model<Post> {}

// ----------------------------------------------------------
// Demo
// ----------------------------------------------------------
function section(title: string) {
  console.log(`\n${"─".repeat(50)}\n${title}\n${"─".repeat(50)}`);
}

section("Schema Introspection");
const userSchema = getSchema(User);
console.log("Table:", userSchema.table);
console.log("PK:", userSchema.primaryKey);
console.log("Columns:", userSchema.columns.map(c => `${c.name}(${c.type ?? "any"})`).join(", "));

section("Seeding data");
const users: User[] = [
  UserModel.create<User>({ name: "Alice",   email: "alice@mail.com", role: "admin",  isActive: true  } as Partial<User>),
  UserModel.create<User>({ name: "Bob",     email: "bob@mail.com",   role: "user",   isActive: true  } as Partial<User>),
  UserModel.create<User>({ name: "Charlie", email: "charlie@mail.com",role: "user",  isActive: false } as Partial<User>),
  UserModel.create<User>({ name: "Diana",   email: "diana@mail.com", role: "admin",  isActive: true  } as Partial<User>),
];

const posts: Post[] = [
  PostModel.create<Post>({ title: "TypeScript is awesome", authorId: 1, published: true  } as Partial<Post>),
  PostModel.create<Post>({ title: "Generics deep dive",    authorId: 1, published: true  } as Partial<Post>),
  PostModel.create<Post>({ title: "Decorators guide",      authorId: 2, published: false } as Partial<Post>),
  PostModel.create<Post>({ title: "Draft post",            authorId: 3, published: false } as Partial<Post>),
];

console.log(`Created ${UserModel.count<User>() as unknown as number} users, ${PostModel.count<Post>() as unknown as number} posts`);

section("Queries");

const activeUsers = new ModelQuery<User>(User, users)
  .where("isActive", "=", true)
  .orderBy("name")
  .get();
console.log("Active users:", activeUsers.map(u => u.name).join(", "));

const admins = new ModelQuery<User>(User, users)
  .where("role", "=", "admin")
  .select("id", "name")
  .get();
console.log("Admins:", admins.map(u => u.name).join(", "));

const publishedPosts = new ModelQuery<Post>(Post, posts)
  .where("published", "=", true)
  .orderBy("id", "DESC")
  .get();
console.log("Published posts:", publishedPosts.map(p => p.title).join(", "));

section("Generated SQL");
console.log(new ModelQuery<User>(User, users)
  .select("id", "name", "email")
  .where("isActive", "=", true)
  .where("role", "IN", ["admin", "user"])
  .orderBy("name")
  .limit(10)
  .toSQL()
);

section("Schema dump");
[User, Post].forEach(entity => {
  const schema = getSchema(entity);
  console.log(`\n${schema.table}:`);
  schema.columns.forEach(col => {
    const flags = [
      col.primary  ? "PK"       : null,
      col.unique   ? "UNIQUE"   : null,
      col.nullable ? "NULLABLE" : "NOT NULL",
      col.default !== undefined ? `DEFAULT(${col.default})` : null,
    ].filter(Boolean).join(" | ");
    console.log(`  ${col.name.padEnd(12)} ${(col.type ?? "any").padEnd(10)} ${flags}`);
  });
});
