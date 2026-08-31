// ============================================================
// Phase 6 — 02: TypeScript + Express
// ============================================================
// Topics: typed Request/Response, extended interfaces,
//         typed middleware, route handlers, error handling,
//         typed query/body/params
//
// NOTE: This is a REFERENCE file with code patterns.
//       To run a real Express app:
//         npm install express @types/express
//         npm install -D ts-node typescript
// ============================================================

// Simulate Express types for documentation purposes
// In a real project: import { Request, Response, NextFunction, Router } from "express"
namespace Express {
  export interface Request {
    params:  Record<string, string>;
    query:   Record<string, string | string[]>;
    body:    unknown;
    headers: Record<string, string | string[] | undefined>;
    method:  string;
    path:    string;
    ip?:     string;
  }
  export interface Response {
    status(code: number): this;
    json(data: unknown): this;
    send(data: unknown): this;
    set(key: string, value: string): this;
  }
  export type NextFunction = (err?: unknown) => void;
}

type Request      = Express.Request;
type Response     = Express.Response;
type NextFunction  = Express.NextFunction;

// ----------------------------------------------------------
// 1. Typed Request extensions
// ----------------------------------------------------------

// Extend Request to carry authenticated user
interface AuthRequest extends Request {
  user: {
    id:    number;
    email: string;
    role:  "admin" | "user";
  };
}

// Typed route parameters
interface TypedRequest<
  Params  extends Record<string, string> = {},
  Body                                   = unknown,
  Query   extends Record<string, string | string[] | undefined> = {},
> {
  params:  Params;
  body:    Body;
  query:   Query;
  headers: Record<string, string | string[] | undefined>;
  method:  string;
  path:    string;
  ip?:     string;
}

// ----------------------------------------------------------
// 2. Typed route handlers
// ----------------------------------------------------------

// GET /users/:id
type GetUserHandler = (
  req: TypedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

// POST /users
interface CreateUserBody {
  name:  string;
  email: string;
  role?: "admin" | "user";
}

type CreateUserHandler = (
  req: TypedRequest<{}, CreateUserBody>,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

// GET /users?page=1&limit=20&search=alice
interface UserQuery {
  page?:   string;
  limit?:  string;
  search?: string;
  role?:   string;
  [key: string]: string | string[] | undefined;
}

type ListUsersHandler = (
  req: TypedRequest<{}, unknown, UserQuery>,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

// ----------------------------------------------------------
// 3. Middleware typing
// ----------------------------------------------------------

type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type AuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => void | Promise<void>;

// Request ID middleware
const requestId: Middleware = (req, res, next) => {
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  res.set("X-Request-ID", id);
  (req as unknown as Record<string, unknown>)["requestId"] = id;
  next();
};

// Logger middleware
const logger: Middleware = (req, res, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.path}`);
  // In real app: hook into res.on("finish") for response logging
  next();
  console.log(`← ${req.method} ${req.path} (${Date.now() - start}ms)`);
};

// Rate limiter middleware factory
function rateLimit(options: { windowMs: number; max: number; message?: string }): Middleware {
  const hits = new Map<string, number[]>();
  return (req, res, next) => {
    const key = req.ip ?? "unknown";
    const now  = Date.now();
    const prev = (hits.get(key) ?? []).filter(t => now - t < options.windowMs);
    if (prev.length >= options.max) {
      res.status(429).json({ error: options.message ?? "Too many requests" });
      return;
    }
    hits.set(key, [...prev, now]);
    next();
  };
}

// Auth middleware — verify JWT
function authenticate(secret: string): Middleware {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }
    const token = authHeader.slice(7);
    try {
      // In real app: jwt.verify(token, secret)
      // Mock: decode base64
      const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64").toString());
      (req as unknown as Record<string, unknown>)["user"] = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}

// Role-based authorization middleware
function authorize(...roles: string[]): Middleware {
  return (req, res, next) => {
    const user = (req as unknown as Record<string, unknown>)["user"] as { role: string } | undefined;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: `Requires one of: ${roles.join(", ")}` });
      return;
    }
    next();
  };
}

// ----------------------------------------------------------
// 4. Route handler implementations (mock)
// ----------------------------------------------------------

// Typed response helpers
function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}

function noContent(res: Response): void {
  res.status(204).send(null);
}

function notFound(res: Response, message = "Not found"): void {
  res.status(404).json({ success: false, error: message });
}

function badRequest(res: Response, message: string, details?: unknown): void {
  res.status(400).json({ success: false, error: message, details });
}

// Async handler wrapper — catches promise rejections
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): Middleware {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// ----------------------------------------------------------
// 5. Typed controllers
// ----------------------------------------------------------

interface UserModel {
  id:        number;
  name:      string;
  email:     string;
  role:      "admin" | "user";
  isActive:  boolean;
  createdAt: Date;
}

// Mock user store
const userStore: UserModel[] = [
  { id: 1, name: "Alice", email: "alice@mail.com", role: "admin", isActive: true, createdAt: new Date() },
  { id: 2, name: "Bob",   email: "bob@mail.com",   role: "user",  isActive: true, createdAt: new Date() },
];
let nextId = 3;

// Controllers
const UserController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as UserQuery;
    let users = [...userStore];
    if (query.role)   users = users.filter(u => u.role === query.role);
    if (query.search) users = users.filter(u =>
      u.name.toLowerCase().includes(query.search!.toLowerCase())
    );
    const page  = parseInt(query.page  ?? "1",  10);
    const limit = parseInt(query.limit ?? "10", 10);
    const total = users.length;
    const data  = users.slice((page - 1) * limit, page * limit);
    ok(res, { users: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id   = parseInt(req.params["id"] ?? "0", 10);
    const user = userStore.find(u => u.id === id);
    if (!user) return notFound(res, `User #${id} not found`);
    ok(res, user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Partial<CreateUserBody>;
    if (!body.name?.trim())  return badRequest(res, "name is required");
    if (!body.email?.trim()) return badRequest(res, "email is required");
    if (!body.email.includes("@")) return badRequest(res, "email is invalid");
    if (userStore.some(u => u.email === body.email))
      return badRequest(res, "email already taken");

    const user: UserModel = {
      id:        nextId++,
      name:      body.name.trim(),
      email:     body.email.toLowerCase(),
      role:      body.role ?? "user",
      isActive:  true,
      createdAt: new Date(),
    };
    userStore.push(user);
    created(res, user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id    = parseInt(req.params["id"] ?? "0", 10);
    const index = userStore.findIndex(u => u.id === id);
    if (index === -1) return notFound(res, `User #${id} not found`);

    const body = req.body as Partial<UserModel>;
    userStore[index] = { ...userStore[index], ...body, id };
    ok(res, userStore[index]);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id    = parseInt(req.params["id"] ?? "0", 10);
    const index = userStore.findIndex(u => u.id === id);
    if (index === -1) return notFound(res, `User #${id} not found`);
    userStore.splice(index, 1);
    noContent(res);
  }),
};

// ----------------------------------------------------------
// 6. Global error handler
// ----------------------------------------------------------

interface AppError extends Error {
  statusCode?: number;
  code?:       string;
}

function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev      = process.env.NODE_ENV === "development";

  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  res.status(statusCode).json({
    success: false,
    error:   err.message,
    code:    err.code,
    ...(isDev ? { stack: err.stack } : {}),
  });
}

// ----------------------------------------------------------
// 7. Route registration (mock)
// ----------------------------------------------------------

// In a real Express app:
// const router = Router();
// router.get("/",     authenticate(JWT_SECRET), UserController.list);
// router.get("/:id",  authenticate(JWT_SECRET), UserController.getById);
// router.post("/",    authenticate(JWT_SECRET), authorize("admin"), UserController.create);
// router.put("/:id",  authenticate(JWT_SECRET), authorize("admin"), UserController.update);
// router.delete("/:id", authenticate(JWT_SECRET), authorize("admin"), UserController.delete);

// app.use(requestId);
// app.use(logger);
// app.use(rateLimit({ windowMs: 60_000, max: 100 }));
// app.use("/api/users", router);
// app.use(errorHandler);

// ----------------------------------------------------------
// 8. Environment config — typed process.env
// ----------------------------------------------------------

interface Env {
  PORT:          string;
  NODE_ENV:      "development" | "staging" | "production";
  DATABASE_URL:  string;
  JWT_SECRET:    string;
  CORS_ORIGIN?:  string;
}

function loadEnv(): Env {
  const required: (keyof Env)[] = ["PORT", "NODE_ENV", "DATABASE_URL", "JWT_SECRET"];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  return process.env as unknown as Env;
}

console.log("Express patterns reference file loaded ✅");
console.log("To run a real Express app:");
console.log("  npm install express @types/express");
console.log("  npm install -D ts-node typescript nodemon");

export { asyncHandler, errorHandler, authenticate, authorize, rateLimit, UserController };
