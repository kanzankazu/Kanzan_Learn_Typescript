// ============================================================
// Phase 3 — 03: Template Literal Types
// ============================================================
// Topics: basic template literals, string manipulation intrinsics,
//         combining with unions, mapped types, practical patterns
// Run: npx ts-node src/phase-3/03_template_literal_types.ts
// ============================================================

// ----------------------------------------------------------
// 1. Basic template literal type
// ----------------------------------------------------------
type Greeting = `Hello, ${string}!`;
// any string matching "Hello, ___!"

type Version = `v${number}.${number}.${number}`;
// "v1.0.0", "v2.3.14", etc.

type ApiPath = `/api/${string}`;
// "/api/users", "/api/posts/42", etc.

const greeting: Greeting = "Hello, TypeScript!"; // ✅
const version: Version   = "v1.2.3"; // ✅
const path: ApiPath      = "/api/users/42"; // ✅

// ----------------------------------------------------------
// 2. Template literal + union = explosive combination
// ----------------------------------------------------------
type Side = "Top" | "Right" | "Bottom" | "Left";
type Spacing = "margin" | "padding";

// Creates: "marginTop" | "marginRight" | "marginBottom" | "marginLeft"
//        | "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft"
type SpacingProperty = `${Spacing}${Side}`;

const prop: SpacingProperty = "marginTop"; // ✅
// const bad: SpacingProperty = "borderTop"; // ❌

// HTTP method + path combinator
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ApiVersion = "v1" | "v2";
type Resource   = "users" | "products" | "orders";

type ApiEndpoint = `/${ApiVersion}/${Resource}`;
// "/v1/users" | "/v1/products" | "/v1/orders" | "/v2/users" | ...

const endpoint: ApiEndpoint = "/v1/users"; // ✅

// ----------------------------------------------------------
// 3. String manipulation intrinsic types
// ----------------------------------------------------------
type Upper = Uppercase<"hello world">;     // "HELLO WORLD"
type Lower = Lowercase<"HELLO WORLD">;     // "hello world"
type Cap   = Capitalize<"hello world">;    // "Hello world"
type Uncap = Uncapitalize<"Hello World">;  // "hello World"

// Practical use — generate getter names
type FieldName = "name" | "email" | "age" | "createdAt";
type GetterName = `get${Capitalize<FieldName>}`;
// "getName" | "getEmail" | "getAge" | "getCreatedAt"

type EventName = "click" | "focus" | "blur" | "change" | "submit";
type HandlerName = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur" | "onChange" | "onSubmit"

// ----------------------------------------------------------
// 4. Template literal + mapped types
// ----------------------------------------------------------
interface UserModel {
  id:    number;
  name:  string;
  email: string;
  age:   number;
}

// Generate getter methods object
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// Generate setter methods object
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

// Generate onChange event handlers
type ChangeHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (
    newValue: T[K],
    oldValue: T[K],
  ) => void;
};

type UserGetters  = Getters<UserModel>;
// { getId: () => number; getName: () => string; ... }

type UserSetters  = Setters<UserModel>;
// { setId: (v: number) => void; setName: (v: string) => void; ... }

type UserHandlers = ChangeHandlers<UserModel>;
// { onIdChange: (n: number, o: number) => void; ... }

// ----------------------------------------------------------
// 5. Route params extraction (infer in template literal)
// ----------------------------------------------------------
// Extract :param names from a route string
type ExtractRouteParams<Route extends string> =
  Route extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : Route extends `${string}:${infer Param}`
    ? Param
    : never;

type UserRouteParams    = ExtractRouteParams<"/users/:userId">;         // "userId"
type PostRouteParams    = ExtractRouteParams<"/posts/:postId/comments/:commentId">; // "postId" | "commentId"
type ProductRouteParams = ExtractRouteParams<"/api/v1/products/:id/reviews/:reviewId">; // "id" | "reviewId"

// ----------------------------------------------------------
// 6. CSS property type helpers
// ----------------------------------------------------------
type CssBorderSide = "Top" | "Right" | "Bottom" | "Left";
type CssCorner = "TopLeft" | "TopRight" | "BottomLeft" | "BottomRight";

type BorderProperty   = `border${CssBorderSide}${"Width" | "Style" | "Color"}`;
type RadiusProperty   = `borderRadius${CssCorner}`;
type TransformFn      = `${"translate" | "scale" | "rotate"}${"X" | "Y" | "Z" | "3d"}`;

const border: BorderProperty = "borderTopWidth";    // ✅
const radius: RadiusProperty = "borderRadiusTopLeft"; // ✅

// ----------------------------------------------------------
// 7. Event system with template literal types
// ----------------------------------------------------------
type AppEvents = {
  userLoggedIn:   { userId: number; timestamp: Date };
  userLoggedOut:  { userId: number };
  orderCreated:   { orderId: string; total: number };
  orderCancelled: { orderId: string; reason: string };
};

// "on" + PascalCase event name
type EventListenerMap = {
  [K in keyof AppEvents as `on${Capitalize<string & K>}`]: (data: AppEvents[K]) => void;
};

// Type-safe event emitter
class TypedEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<string, Array<(data: unknown) => void>>();

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): void {
    const key = String(event);
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key)!.push(handler as (data: unknown) => void);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const key = String(event);
    this.listeners.get(key)?.forEach(h => h(data));
  }

  off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): void {
    const key = String(event);
    const handlers = this.listeners.get(key) ?? [];
    this.listeners.set(key, handlers.filter(h => h !== handler));
  }
}

const emitter = new TypedEmitter<AppEvents>();

emitter.on("userLoggedIn", ({ userId, timestamp }) => {
  console.log(`User #${userId} logged in at ${timestamp.toISOString()}`);
});

emitter.on("orderCreated", ({ orderId, total }) => {
  console.log(`Order ${orderId} created — total: $${total}`);
});

emitter.emit("userLoggedIn",  { userId: 42, timestamp: new Date() });
emitter.emit("orderCreated",  { orderId: "ORD-001", total: 249.99 });
// emitter.emit("userLoggedIn", { userId: "wrong" }); // ❌ type error

// ----------------------------------------------------------
// 8. Deep key paths (dot notation)
// ----------------------------------------------------------
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends object
    ? Paths<T[K], `${Prefix}${string & K}.`> | `${Prefix}${string & K}`
    : `${Prefix}${string & K}`;
}[keyof T];

interface DeepConfig {
  server:   { host: string; port: number };
  database: { url: string; poolSize: number };
  app:      { name: string; version: string };
}

type ConfigPaths = Paths<DeepConfig>;
// "server" | "database" | "app" | "server.host" | "server.port" | ...

console.log("Template literal types demo complete ✅");

export {};
