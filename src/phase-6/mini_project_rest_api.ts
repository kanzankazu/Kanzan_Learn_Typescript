// ============================================================
// Phase 6 — Mini Project: Type-Safe REST API
// ============================================================
// A fully self-contained Express-style REST API simulation.
// Demonstrates all TypeScript patterns for a real Node.js backend:
// - Typed domain models & DTOs
// - Service layer with business logic
// - Repository pattern
// - JWT auth simulation
// - Typed middleware pipeline
// - Error handling
// - Input validation
//
// Run: npx ts-node src/phase-6/mini_project_rest_api.ts
// ============================================================

import * as http from "http";

// ----------------------------------------------------------
// Domain models
// ----------------------------------------------------------

type Role = "admin" | "user";

interface User {
  id:        number;
  name:      string;
  email:     string;
  password:  string; // hashed in production
  role:      Role;
  isActive:  boolean;
  createdAt: Date;
}

interface Post {
  id:        number;
  title:     string;
  content:   string;
  published: boolean;
  authorId:  number;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// DTOs
// ----------------------------------------------------------

interface RegisterDto  { name: string; email: string; password: string }
interface LoginDto     { email: string; password: string }
interface CreatePostDto { title: string; content: string; published?: boolean }
interface UpdatePostDto { title?: string; content?: string; published?: boolean }

// ----------------------------------------------------------
// API response shapes
// ----------------------------------------------------------

type ApiResponse<T> =
  | { success: true;  data: T; meta?: Record<string, unknown> }
  | { success: false; error: string; code?: string; details?: unknown };

function success<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}
function failure(error: string, code?: string, details?: unknown): ApiResponse<never> {
  return { success: false, error, ...(code ? { code } : {}), ...(details ? { details } : {}) };
}

// ----------------------------------------------------------
// In-memory stores
// ----------------------------------------------------------

const db = {
  users: new Map<number, User>(),
  posts: new Map<number, Post>(),
  ids: { user: 0, post: 0 },
  nextUserId: () => ++db.ids.user,
  nextPostId: () => ++db.ids.post,
};

// Seed data
const seed = () => {
  const now = new Date();
  db.users.set(1, {
    id: 1, name: "Admin", email: "admin@mail.com",
    password: "hashed_admin123", role: "admin",
    isActive: true, createdAt: now,
  });
  db.users.set(2, {
    id: 2, name: "Alice", email: "alice@mail.com",
    password: "hashed_pass123", role: "user",
    isActive: true, createdAt: now,
  });
  db.ids.user = 2;
  db.posts.set(1, {
    id: 1, title: "Hello World", content: "First post content",
    published: true, authorId: 1,
    createdAt: now, updatedAt: now,
  });
  db.ids.post = 1;
};
seed();

// ----------------------------------------------------------
// Auth simulation (no real JWT)
// ----------------------------------------------------------

interface TokenPayload { userId: number; role: Role }

const FAKE_SECRET = "super-secret-key-2024";

const tokenStore = new Map<string, TokenPayload>(); // token → payload

function generateToken(payload: TokenPayload): string {
  const token = Buffer.from(JSON.stringify(payload)).toString("base64") +
    "." + Date.now().toString(36);
  tokenStore.set(token, payload);
  return token;
}

function verifyToken(token: string): TokenPayload | null {
  return tokenStore.get(token) ?? null;
}

// ----------------------------------------------------------
// Mini HTTP framework
// ----------------------------------------------------------

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface AppRequest {
  method:  HttpMethod;
  path:    string;
  params:  Record<string, string>;
  query:   Record<string, string>;
  body:    unknown;
  headers: Record<string, string>;
  user?:   TokenPayload;
}

interface AppResponse {
  status:  number;
  body:    unknown;
  headers: Record<string, string>;
}

type Handler = (req: AppRequest) => AppResponse | Promise<AppResponse>;
type RouteEntry = { method: HttpMethod; pattern: string; handler: Handler; middlewares: Middleware2[] };
type Middleware2 = (req: AppRequest) => AppRequest | null; // null = reject

function respond(status: number, body: unknown, headers: Record<string, string> = {}): AppResponse {
  return { status, body, headers: { "Content-Type": "application/json", ...headers } };
}

class Router {
  private routes: RouteEntry[] = [];

  private add(method: HttpMethod, pattern: string, ...args: (Middleware2 | Handler)[]): this {
    const middlewares = args.slice(0, -1) as Middleware2[];
    const handler     = args[args.length - 1] as Handler;
    this.routes.push({ method, pattern, handler, middlewares });
    return this;
  }

  get   (path: string, ...args: (Middleware2 | Handler)[]): this { return this.add("GET",    path, ...args); }
  post  (path: string, ...args: (Middleware2 | Handler)[]): this { return this.add("POST",   path, ...args); }
  put   (path: string, ...args: (Middleware2 | Handler)[]): this { return this.add("PUT",    path, ...args); }
  patch (path: string, ...args: (Middleware2 | Handler)[]): this { return this.add("PATCH",  path, ...args); }
  delete(path: string, ...args: (Middleware2 | Handler)[]): this { return this.add("DELETE", path, ...args); }

  match(method: string, path: string): { route: RouteEntry; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const params = matchPath(route.pattern, path);
      if (params) return { route, params };
    }
    return null;
  }
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patParts  = pattern.split("/");
  const pathParts = path.split("/");
  if (patParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      params[patParts[i].slice(1)] = pathParts[i];
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ----------------------------------------------------------
// Middlewares
// ----------------------------------------------------------

const authMiddleware: Middleware2 = (req) => {
  const auth  = req.headers["authorization"];
  if (!auth?.startsWith("Bearer "))
    return null; // will be handled by route
  const payload = verifyToken(auth.slice(7));
  if (!payload) return null;
  return { ...req, user: payload };
};

const requireAuth: Middleware2 = (req) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = verifyToken(auth.slice(7));
  if (!payload) return null;
  return { ...req, user: payload };
};

function requireRole(...roles: Role[]): Middleware2 {
  return (req) => {
    if (!req.user) return null;
    if (!roles.includes(req.user.role)) return null;
    return req;
  };
}

// ----------------------------------------------------------
// Validation helpers
// ----------------------------------------------------------

type ValidationResult = { valid: boolean; errors: string[] };

function validateRegister(dto: Partial<RegisterDto>): ValidationResult {
  const errors: string[] = [];
  if (!dto.name?.trim())       errors.push("name is required");
  if (!dto.email?.trim())      errors.push("email is required");
  if (dto.email && !dto.email.includes("@")) errors.push("email is invalid");
  if (!dto.password)           errors.push("password is required");
  if (dto.password && dto.password.length < 8) errors.push("password must be at least 8 characters");
  return { valid: errors.length === 0, errors };
}

function validatePost(dto: Partial<CreatePostDto>): ValidationResult {
  const errors: string[] = [];
  if (!dto.title?.trim())   errors.push("title is required");
  if (!dto.content?.trim()) errors.push("content is required");
  return { valid: errors.length === 0, errors };
}

// ----------------------------------------------------------
// Route handlers
// ----------------------------------------------------------

const router = new Router();

// ── AUTH ──────────────────────────────────────────────────

router.post("/api/auth/register", async (req) => {
  const dto = req.body as Partial<RegisterDto>;
  const { valid, errors } = validateRegister(dto);
  if (!valid) return respond(400, failure("Validation failed", "VALIDATION_ERROR", errors));

  const existing = [...db.users.values()].find(u => u.email === dto.email!.toLowerCase());
  if (existing) return respond(409, failure("Email already registered", "DUPLICATE_EMAIL"));

  const user: User = {
    id:        db.nextUserId(),
    name:      dto.name!.trim(),
    email:     dto.email!.toLowerCase(),
    password:  `hashed_${dto.password}`, // simulate hash
    role:      "user",
    isActive:  true,
    createdAt: new Date(),
  };
  db.users.set(user.id, user);

  const token = generateToken({ userId: user.id, role: user.role });
  const { password: _, ...safeUser } = user;
  return respond(201, success({ user: safeUser, token }));
});

router.post("/api/auth/login", async (req) => {
  const dto = req.body as Partial<LoginDto>;
  if (!dto.email || !dto.password)
    return respond(400, failure("email and password are required"));

  const user = [...db.users.values()].find(u => u.email === dto.email!.toLowerCase());
  if (!user || user.password !== `hashed_${dto.password}`)
    return respond(401, failure("Invalid credentials", "INVALID_CREDENTIALS"));

  if (!user.isActive)
    return respond(403, failure("Account is deactivated", "ACCOUNT_INACTIVE"));

  const token = generateToken({ userId: user.id, role: user.role });
  const { password: _, ...safeUser } = user;
  return respond(200, success({ user: safeUser, token }));
});

router.get("/api/auth/me", requireAuth, async (req) => {
  if (!req.user) return respond(401, failure("Unauthorized"));
  const user = db.users.get(req.user.userId);
  if (!user) return respond(404, failure("User not found"));
  const { password: _, ...safeUser } = user;
  return respond(200, success(safeUser));
});

// ── USERS (admin only) ────────────────────────────────────

router.get("/api/users", requireAuth, requireRole("admin"), async (req) => {
  const all  = [...db.users.values()].map(({ password: _, ...u }) => u);
  return respond(200, success(all, { total: all.length }));
});

router.get("/api/users/:id", requireAuth, async (req) => {
  const id   = parseInt(req.params["id"] ?? "0");
  const user = db.users.get(id);
  if (!user) return respond(404, failure(`User #${id} not found`));
  // Users can only see themselves; admins can see anyone
  if (req.user!.role !== "admin" && req.user!.userId !== id)
    return respond(403, failure("Forbidden"));
  const { password: _, ...safeUser } = user;
  return respond(200, success(safeUser));
});

// ── POSTS ────────────────────────────────────────────────

router.get("/api/posts", async (req) => {
  const authorId = req.query["authorId"] ? parseInt(req.query["authorId"]) : undefined;
  let posts = [...db.posts.values()];
  // Unauthenticated users only see published posts
  if (!req.user) posts = posts.filter(p => p.published);
  if (authorId)  posts = posts.filter(p => p.authorId === authorId);
  return respond(200, success(posts, { total: posts.length }));
});

router.get("/api/posts/:id", async (req) => {
  const id   = parseInt(req.params["id"] ?? "0");
  const post = db.posts.get(id);
  if (!post) return respond(404, failure(`Post #${id} not found`));
  if (!post.published && req.user?.userId !== post.authorId && req.user?.role !== "admin")
    return respond(403, failure("Forbidden"));
  return respond(200, success(post));
});

router.post("/api/posts", requireAuth, async (req) => {
  const dto = req.body as Partial<CreatePostDto>;
  const { valid, errors } = validatePost(dto);
  if (!valid) return respond(400, failure("Validation failed", "VALIDATION_ERROR", errors));

  const now  = new Date();
  const post: Post = {
    id:        db.nextPostId(),
    title:     dto.title!.trim(),
    content:   dto.content!.trim(),
    published: dto.published ?? false,
    authorId:  req.user!.userId,
    createdAt: now,
    updatedAt: now,
  };
  db.posts.set(post.id, post);
  return respond(201, success(post));
});

router.put("/api/posts/:id", requireAuth, async (req) => {
  const id   = parseInt(req.params["id"] ?? "0");
  const post = db.posts.get(id);
  if (!post) return respond(404, failure(`Post #${id} not found`));
  if (post.authorId !== req.user!.userId && req.user!.role !== "admin")
    return respond(403, failure("Forbidden — you can only edit your own posts"));

  const dto = req.body as Partial<UpdatePostDto>;
  const updated: Post = {
    ...post,
    title:     dto.title     ?? post.title,
    content:   dto.content   ?? post.content,
    published: dto.published ?? post.published,
    updatedAt: new Date(),
  };
  db.posts.set(id, updated);
  return respond(200, success(updated));
});

router.delete("/api/posts/:id", requireAuth, async (req) => {
  const id   = parseInt(req.params["id"] ?? "0");
  const post = db.posts.get(id);
  if (!post) return respond(404, failure(`Post #${id} not found`));
  if (post.authorId !== req.user!.userId && req.user!.role !== "admin")
    return respond(403, failure("Forbidden"));
  db.posts.delete(id);
  return respond(204, null);
});

// ----------------------------------------------------------
// HTTP server
// ----------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", chunk => chunks.push(chunk));
  req.on("end", async () => {
    const rawBody = Buffer.concat(chunks).toString();
    const urlParts = (req.url ?? "/").split("?");
    const path     = urlParts[0];
    const query    = Object.fromEntries(
      (urlParts[1] ?? "").split("&").filter(Boolean).map(p => p.split("="))
    );

    let body: unknown = null;
    if (rawBody) {
      try { body = JSON.parse(rawBody); } catch { body = rawBody; }
    }

    // Build app request
    let appReq: AppRequest = {
      method:  (req.method ?? "GET") as HttpMethod,
      path,
      params:  {},
      query,
      body,
      headers: req.headers as Record<string, string>,
    };

    // Apply optional auth middleware (non-blocking)
    const authed = authMiddleware(appReq);
    if (authed) appReq = authed;

    // Match route
    const match = router.match(appReq.method, appReq.path);
    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify(failure(`Route not found: ${appReq.method} ${appReq.path}`)));
      return;
    }

    appReq = { ...appReq, params: match.params };

    // Run route middlewares
    for (const mw of match.route.middlewares) {
      const next = mw(appReq);
      if (!next) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(failure("Unauthorized or Forbidden")));
        return;
      }
      appReq = next;
    }

    // Run handler
    try {
      const result = await match.route.handler(appReq);
      res.writeHead(result.status, result.headers);
      res.end(result.body !== null ? JSON.stringify(result.body) : "");
    } catch (err) {
      console.error("[ERROR]", (err as Error).message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(failure("Internal server error")));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 REST API running on http://localhost:${PORT}`);
  console.log("\nAvailable endpoints:");
  console.log("  POST   /api/auth/register");
  console.log("  POST   /api/auth/login");
  console.log("  GET    /api/auth/me          (auth required)");
  console.log("  GET    /api/users            (admin only)");
  console.log("  GET    /api/users/:id        (auth required)");
  console.log("  GET    /api/posts            (public — published only)");
  console.log("  GET    /api/posts/:id        (public)");
  console.log("  POST   /api/posts            (auth required)");
  console.log("  PUT    /api/posts/:id        (auth required, author/admin)");
  console.log("  DELETE /api/posts/:id        (auth required, author/admin)");

  console.log("\nTest with curl:");
  console.log(`  # Login as admin:`);
  console.log(`  curl -s -X POST http://localhost:${PORT}/api/auth/login \\`);
  console.log(`    -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"email":"admin@mail.com","password":"admin123"}'`);
  console.log(`\n  # Get all users (use token from login):`);
  console.log(`  curl -s http://localhost:${PORT}/api/users \\`);
  console.log(`    -H 'Authorization: Bearer <token>'`);

  runSmokeTests();
});

// ----------------------------------------------------------
// Smoke tests
// ----------------------------------------------------------
async function simulateRequest(
  method: HttpMethod,
  path: string,
  body?: unknown,
  token?: string,
): Promise<AppResponse> {
  let appReq: AppRequest = {
    method, path, params: {}, query: {}, body,
    headers: {
      "content-type": "application/json",
      ...(token ? { "authorization": `Bearer ${token}` } : {}),
    },
  };

  const authed = authMiddleware(appReq);
  if (authed) appReq = authed;

  const match = router.match(method, path);
  if (!match) return respond(404, failure(`Not found: ${method} ${path}`));
  appReq = { ...appReq, params: match.params };

  for (const mw of match.route.middlewares) {
    const next = mw(appReq);
    if (!next) return respond(401, failure("Unauthorized"));
    appReq = next;
  }

  return match.route.handler(appReq);
}

async function runSmokeTests() {
  console.log("\n\n=== SMOKE TESTS ===\n");

  // Register
  const reg = await simulateRequest("POST", "/api/auth/register", {
    name: "Test User", email: "test@mail.com", password: "password123",
  });
  console.log(`[${reg.status}] POST /api/auth/register — ${(reg.body as any).success ? "✅" : "❌"}`);

  // Login as admin
  const login = await simulateRequest("POST", "/api/auth/login", {
    email: "admin@mail.com", password: "admin123",
  }) as AppResponse & { body: { data?: { token?: string } } };
  const token = (login.body as any)?.data?.token as string;
  console.log(`[${login.status}] POST /api/auth/login — ${token ? "✅ got token" : "❌"}`);

  // Get me
  const me = await simulateRequest("GET", "/api/auth/me", undefined, token);
  console.log(`[${me.status}] GET /api/auth/me — ${(me.body as any)?.data?.name ?? "❌"}`);

  // List users (admin)
  const users = await simulateRequest("GET", "/api/users", undefined, token);
  console.log(`[${users.status}] GET /api/users — ${(users.body as any)?.data?.length ?? 0} users`);

  // Get public posts
  const posts = await simulateRequest("GET", "/api/posts");
  console.log(`[${posts.status}] GET /api/posts (public) — ${(posts.body as any)?.data?.length ?? 0} posts`);

  // Create post
  const newPost = await simulateRequest("POST", "/api/posts", {
    title: "My New Post", content: "Some content here", published: true,
  }, token);
  const postId = (newPost.body as any)?.data?.id;
  console.log(`[${newPost.status}] POST /api/posts — id=${postId ?? "❌"}`);

  // Update post
  if (postId) {
    const updated = await simulateRequest("PUT", `/api/posts/${postId}`, {
      title: "Updated Title",
    }, token);
    console.log(`[${updated.status}] PUT /api/posts/${postId} — ${(updated.body as any)?.data?.title ?? "❌"}`);
  }

  // Unauthorized access
  const unauth = await simulateRequest("GET", "/api/users");
  console.log(`[${unauth.status}] GET /api/users (no token) — ${unauth.status === 401 ? "✅ correctly rejected" : "❌"}`);

  // Invalid registration
  const badReg = await simulateRequest("POST", "/api/auth/register", {
    name: "", email: "bad", password: "short",
  });
  console.log(`[${badReg.status}] POST /api/auth/register (invalid) — ${(badReg.body as any)?.error ?? "❌"}`);

  console.log("\n=== All smoke tests done ===");
  console.log("Server still running — Ctrl+C to stop.");
}
