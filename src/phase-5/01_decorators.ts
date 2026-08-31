// ============================================================
// Phase 5 — 01: Decorators
// ============================================================
// Topics: class, method, property, parameter decorators,
//         decorator factories, metadata, composition
//
// REQUIRES tsconfig.json:
//   "experimentalDecorators": true
//   "emitDecoratorMetadata": true   (for reflect-metadata)
//
// Run: npx ts-node src/phase-5/01_decorators.ts
// ============================================================

// ----------------------------------------------------------
// 1. Class decorator — receives the constructor
// ----------------------------------------------------------

// Simple class decorator — adds metadata to the class
function Component(options: { selector: string; template: string }) {
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    // Attach metadata to the class
    Object.defineProperty(constructor, "__selector__", { value: options.selector });
    Object.defineProperty(constructor, "__template__", { value: options.template });
    return constructor;
  };
}

// Singleton decorator — ensures only one instance is ever created
function Singleton<T extends { new (...args: any[]): object }>(constructor: T) {
  let instance: InstanceType<T> | null = null;
  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) return instance as InstanceType<typeof constructor>;
      super(...args);
      instance = this as unknown as InstanceType<T>;
    }
  } as T;
}

// Sealed decorator — prevents adding/removing properties
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
@Component({ selector: "app-root", template: "<div>Hello</div>" })
class AppComponent {
  title = "My App";
  render() { return `<app-root>${this.title}</app-root>`; }
}

@Singleton
class DatabaseService {
  private queryCount = 0;
  query(sql: string): string {
    this.queryCount++;
    return `Result of: ${sql} (query #${this.queryCount})`;
  }
  getQueryCount() { return this.queryCount; }
}

const app = new AppComponent();
console.log(app.render());

const db1 = new DatabaseService();
const db2 = new DatabaseService();
db1.query("SELECT * FROM users");
db1.query("SELECT * FROM products");
console.log("Same instance?", db1 === db2);           // true
console.log("Query count via db2:", db2.getQueryCount()); // 2 — same instance

// ----------------------------------------------------------
// 2. Method decorator — intercepts method calls
// ----------------------------------------------------------

// Log method calls with timing
function Log(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const original = descriptor.value as Function;
  descriptor.value = function (...args: any[]) {
    const start = Date.now();
    console.log(`[LOG] ${key}(${args.map(a => JSON.stringify(a)).join(", ")})`);
    const result = original.apply(this, args);
    console.log(`[LOG] ${key} returned ${JSON.stringify(result)} in ${Date.now() - start}ms`);
    return result;
  };
  return descriptor;
}

// Memoize — cache results of pure methods
function Memoize(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const original = descriptor.value as Function;
  const cache    = new Map<string, unknown>();
  descriptor.value = function (...args: any[]) {
    const cacheKey = JSON.stringify(args);
    if (cache.has(cacheKey)) {
      console.log(`[CACHE HIT] ${key}(${cacheKey})`);
      return cache.get(cacheKey);
    }
    const result = original.apply(this, args);
    cache.set(cacheKey, result);
    return result;
  };
  return descriptor;
}

// Throttle — limit how often a method can be called
function Throttle(ms: number) {
  return function (target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as Function;
    let lastCall   = 0;
    descriptor.value = function (...args: any[]) {
      const now = Date.now();
      if (now - lastCall < ms) {
        console.log(`[THROTTLE] ${key} skipped (${ms - (now - lastCall)}ms remaining)`);
        return;
      }
      lastCall = now;
      return original.apply(this, args);
    };
    return descriptor;
  };
}

// Validate arguments — decorator factory with schema
function Validate(...validators: Array<(v: unknown) => boolean>) {
  return function (target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as Function;
    descriptor.value = function (...args: any[]) {
      validators.forEach((validate, i) => {
        if (!validate(args[i])) {
          throw new TypeError(`Argument ${i} of ${key} is invalid: ${JSON.stringify(args[i])}`);
        }
      });
      return original.apply(this, args);
    };
    return descriptor;
  };
}

class MathService {
  @Log
  @Memoize
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @Validate(
    (v) => typeof v === "number" && v > 0,
    (v) => typeof v === "number" && v > 0,
  )
  divide(a: number, b: number): number {
    return a / b;
  }

  @Throttle(100)
  onScroll() {
    console.log("Scroll handler fired");
  }
}

const math = new MathService();
console.log("\nFibonacci:");
console.log(math.fibonacci(5));
console.log(math.fibonacci(5)); // cache hit

console.log("\nValidation:");
console.log(math.divide(10, 2)); // 5
try {
  math.divide(-1, 2); // should throw
} catch (e) {
  console.log("Caught:", (e as Error).message);
}

// ----------------------------------------------------------
// 3. Property decorator
// ----------------------------------------------------------

// Observable — track property changes
function Observable(target: any, key: string) {
  let value: unknown;
  Object.defineProperty(target, key, {
    get() { return value; },
    set(newValue: unknown) {
      const old = value;
      value = newValue;
      if (old !== newValue) {
        console.log(`[OBSERVABLE] ${key}: ${JSON.stringify(old)} → ${JSON.stringify(newValue)}`);
      }
    },
    enumerable: true,
    configurable: true,
  });
}

// MinLength property validator
function MinLength(min: number) {
  return function (target: any, key: string) {
    let value: string;
    Object.defineProperty(target, key, {
      get() { return value; },
      set(newValue: string) {
        if (typeof newValue === "string" && newValue.length > 0 && newValue.length < min) {
          throw new Error(`${key} must be at least ${min} characters, got ${newValue.length}`);
        }
        value = newValue;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

class UserProfile {
  @Observable
  name: string = "";

  @Observable
  email: string = "";

  @MinLength(8)
  password: string = "";
}

const profile = new UserProfile();
profile.name  = "Alice";
profile.name  = "Alicia"; // triggers observable
profile.email = "alice@mail.com";

try {
  profile.password = "short"; // throws
} catch (e) {
  console.log("Password error:", (e as Error).message);
}
profile.password = "SecurePass123";
console.log("Password set successfully");

// ----------------------------------------------------------
// 4. Parameter decorator
// ----------------------------------------------------------

// Mark a parameter as "required" (logged at call time)
const requiredParams = new Map<string, number[]>();

function Required(target: any, key: string, index: number) {
  const existing = requiredParams.get(key) ?? [];
  requiredParams.set(key, [...existing, index]);
}

function ValidateParams(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const original = descriptor.value as Function;
  descriptor.value = function (...args: any[]) {
    const required = requiredParams.get(key) ?? [];
    required.forEach(index => {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(`Parameter at index ${index} of ${key} is required`);
      }
    });
    return original.apply(this, args);
  };
  return descriptor;
}

class UserService {
  @ValidateParams
  createUser(
    @Required name: string,
    @Required email: string,
    role: string = "user",
  ): string {
    return `Created: ${name} <${email}> [${role}]`;
  }
}

const userSvc = new UserService();
console.log("\nParameter decorators:");
console.log(userSvc.createUser("Bob", "bob@mail.com"));
try {
  userSvc.createUser("", null as any); // should throw
} catch (e) {
  console.log("Caught:", (e as Error).message);
}

// ----------------------------------------------------------
// 5. Decorator composition — order matters
// ----------------------------------------------------------
// Decorators are applied bottom-up (closest to the method first)
// but evaluated top-down

function First() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    console.log("[FACTORY] First evaluated");
    const original = descriptor.value as Function;
    descriptor.value = function (...args: any[]) {
      console.log("[APPLY] First applied");
      return original.apply(this, args);
    };
    return descriptor;
  };
}

function Second() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    console.log("[FACTORY] Second evaluated");
    const original = descriptor.value as Function;
    descriptor.value = function (...args: any[]) {
      console.log("[APPLY] Second applied");
      return original.apply(this, args);
    };
    return descriptor;
  };
}

class CompositionDemo {
  @First()   // evaluated 1st, applied 2nd
  @Second()  // evaluated 2nd, applied 1st
  greet() { return "hello"; }
}

console.log("\nDecorator composition order:");
new CompositionDemo().greet();
// [FACTORY] First evaluated
// [FACTORY] Second evaluated
// [APPLY] First applied   ← outermost applied last = runs first
// [APPLY] Second applied

export {};
