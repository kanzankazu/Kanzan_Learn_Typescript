// ============================================================
// Phase 3 — 02: Mapped Types
// ============================================================
// Topics: basic mapped types, modifiers (+/-), key remapping (as),
//         Capitalize/Uncapitalize, filter by value type,
//         nested mapped types
// Run: npx ts-node src/phase-3/02_mapped_types.ts
// ============================================================

// ----------------------------------------------------------
// 1. Basic mapped type — iterate over keys of T
// ----------------------------------------------------------
// Syntax: { [K in keyof T]: SomeType }

type Stringify<T> = {
  [K in keyof T]: string; // convert every property value to string
};

interface Point { x: number; y: number; z: number }
type StringPoint = Stringify<Point>; // { x: string; y: string; z: string }

// Reimplement built-in utility types to understand how they work
type MyPartial<T>  = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] }; // '-?' removes optionality
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyMutable<T>  = { -readonly [K in keyof T]: T[K] }; // '-readonly' removes readonly

interface UserConfig {
  host:     string;
  port:     number;
  debug?:   boolean;
  timeout?: number;
}

type PartialConfig  = MyPartial<UserConfig>;  // all optional
type RequiredConfig = MyRequired<UserConfig>; // all required
type ReadonlyConfig = MyReadonly<UserConfig>; // all readonly

const cfg: RequiredConfig = { host: "localhost", port: 3000, debug: false, timeout: 5000 };
console.log(cfg);

// ----------------------------------------------------------
// 2. Mapped type with value transformation
// ----------------------------------------------------------
// Nullable — wrap every value with | null
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Optional (| undefined)
type Undefinable<T> = { [K in keyof T]: T[K] | undefined };

// Wrap values in a getter function
type Getters<T> = { [K in keyof T]: () => T[K] };

// Wrap values in a setter function
type Setters<T> = { [K in keyof T]: (value: T[K]) => void };

interface Product { name: string; price: number; stock: number }

type ProductGetters = Getters<Product>;
// { name: () => string; price: () => number; stock: () => number }

function makeGetters<T extends object>(obj: T): Getters<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, () => v])
  ) as Getters<T>;
}

const product = { name: "Laptop", price: 1200, stock: 50 };
const getters = makeGetters(product);
console.log(getters.name());   // Laptop
console.log(getters.price());  // 1200

// ----------------------------------------------------------
// 3. Key remapping with 'as' (TypeScript 4.1+)
// ----------------------------------------------------------
// Rename keys using template literals

type Getters2<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters2<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (newVal: T[K], oldVal: T[K]) => void;
};

type ProductGetters2 = Getters2<Product>;
// { getName: () => string; getPrice: () => number; getStock: () => number }

type ProductSetters = Setters2<Product>;
// { setName: (value: string) => void; ... }

type ProductEvents = EventHandlers<Product>;
// { onNameChange: (newVal: string, oldVal: string) => void; ... }

// ----------------------------------------------------------
// 4. Filter keys by value type
// ----------------------------------------------------------
// Keep only keys whose value type extends Filter
type PickByType<T, Filter> = {
  [K in keyof T as T[K] extends Filter ? K : never]: T[K];
};

// Exclude keys whose value type extends Filter
type OmitByType<T, Filter> = {
  [K in keyof T as T[K] extends Filter ? never : K]: T[K];
};

interface MixedModel {
  id:        number;
  name:      string;
  email:     string;
  age:       number;
  isActive:  boolean;
  score:     number;
  tags:      string[];
  createdAt: Date;
}

type StringProps  = PickByType<MixedModel, string>;  // { name, email }
type NumberProps  = PickByType<MixedModel, number>;  // { id, age, score }
type BooleanProps = PickByType<MixedModel, boolean>; // { isActive }
type NonStringProps = OmitByType<MixedModel, string>; // everything except name, email

const stringProps: StringProps = { name: "Alice", email: "a@b.com" };
console.log(stringProps);

// ----------------------------------------------------------
// 5. Nested mapped types
// ----------------------------------------------------------
type DeepPartial<T> = T extends object ? {
  [K in keyof T]?: DeepPartial<T[K]>;
} : T;

type DeepReadonly<T> = T extends object ? {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
} : T;

type DeepRequired<T> = T extends object ? {
  [K in keyof T]-?: DeepRequired<T[K]>;
} : T;

interface AppConfig {
  server: {
    host:   string;
    port:   number;
    ssl?:   { cert: string; key: string };
  };
  database: {
    url:     string;
    poolSize?: number;
  };
  features?: {
    darkMode?:    boolean;
    beta?:        boolean;
  };
}

// All nested properties optional — for config merging
type PartialAppConfig = DeepPartial<AppConfig>;

const partialCfg: PartialAppConfig = {
  server: { port: 4000 }, // no host required
};
console.log("Partial config:", JSON.stringify(partialCfg));

// ----------------------------------------------------------
// 6. Mapped type from union
// ----------------------------------------------------------
// Create an object type from a string union
type FlagMap<T extends string> = { [K in T]: boolean };
type PermissionFlags = FlagMap<"read" | "write" | "delete" | "admin">;
// { read: boolean; write: boolean; delete: boolean; admin: boolean }

function createFlags<T extends string>(
  keys: T[],
  defaultValue: boolean = false,
): FlagMap<T> {
  return Object.fromEntries(keys.map(k => [k, defaultValue])) as FlagMap<T>;
}

const userPermissions = createFlags(["read", "write", "delete", "admin"], false);
userPermissions.read  = true;
userPermissions.write = true;
console.log("Permissions:", userPermissions);

// ----------------------------------------------------------
// 7. Mapped type for validation schema
// ----------------------------------------------------------
type Validator<T> = (value: T) => string | null; // null = valid, string = error message

type ValidationSchema<T> = {
  [K in keyof T]?: Validator<T[K]>;
};

interface RegistrationForm {
  username: string;
  email:    string;
  password: string;
  age:      number;
}

const schema: ValidationSchema<RegistrationForm> = {
  username: v => v.length >= 3 ? null : "Username must be at least 3 characters",
  email:    v => v.includes("@") ? null : "Invalid email format",
  password: v => v.length >= 8 ? null : "Password must be at least 8 characters",
  age:      v => v >= 18 ? null : "Must be 18 or older",
};

function validate<T>(data: T, schema: ValidationSchema<T>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key in schema) {
    const validator = schema[key];
    if (validator) {
      const error = validator((data as Record<string, unknown>)[key] as never);
      if (error) errors[key] = error;
    }
  }
  return errors;
}

const validData   = { username: "faisal", email: "f@b.com", password: "secret123", age: 28 };
const invalidData = { username: "ab",     email: "no-at",   password: "short",     age: 15 };

console.log("Valid errors:",   validate(validData, schema));
console.log("Invalid errors:", validate(invalidData, schema));

export {};
