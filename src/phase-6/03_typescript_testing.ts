// ============================================================
// Phase 6 — 03: TypeScript + Testing
// ============================================================
// Topics: typed mocks with vitest, testing utilities,
//         type-safe test factories, spy typing,
//         testing async code, testing React hooks (pattern)
//
// NOTE: Patterns reference file.
//       To run real tests:
//         npm install -D vitest @vitest/ui
//         Add to package.json: "test": "vitest run"
// ============================================================

// ----------------------------------------------------------
// Simulating vitest types for documentation
// ----------------------------------------------------------
// In real tests: import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
type MockFn<T extends (...args: any[]) => any> = T & {
  mockReturnValue(val: ReturnType<T>): void;
  mockResolvedValue(val: Awaited<ReturnType<T>>): void;
  mockRejectedValue(err: unknown): void;
  mockImplementation(fn: T): void;
  mockClear(): void;
  mockReset(): void;
  calls: Parameters<T>[];
};
const vi = {
  fn: <T extends (...args: any[]) => any>(impl?: T): MockFn<T> => {
    const calls: Parameters<T>[] = [];
    const mock = ((...args: any[]) => {
      calls.push(args as Parameters<T>);
      return impl?.(...args);
    }) as MockFn<T>;
    mock.calls = calls;
    mock.mockClear = () => { calls.length = 0; };
    mock.mockReset = () => { calls.length = 0; };
    mock.mockReturnValue = (val: ReturnType<T>) => { /* noop in sim */ };
    mock.mockResolvedValue = (val: any) => { /* noop in sim */ };
    mock.mockRejectedValue = (err: any) => { /* noop in sim */ };
    mock.mockImplementation = (fn: T) => { /* noop in sim */ };
    return mock;
  },
};

// ----------------------------------------------------------
// 1. Domain types used in tests
// ----------------------------------------------------------

interface User {
  id:        number;
  name:      string;
  email:     string;
  role:      "admin" | "user";
  isActive:  boolean;
  createdAt: Date;
}

interface CreateUserDto {
  name:  string;
  email: string;
  role?: "admin" | "user";
}

interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(dto: CreateUserDto): Promise<User>;
  update(id: number, dto: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
}

class UserService {
  constructor(private readonly repo: UserRepository) {}

  async getUserById(id: number): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new Error(`User #${id} not found`);
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    if (!dto.name.trim())  throw new Error("Name is required");
    if (!dto.email.trim()) throw new Error("Email is required");
    if (!dto.email.includes("@")) throw new Error("Invalid email");

    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new Error("Email already taken");

    return this.repo.create(dto);
  }

  async deactivateUser(id: number): Promise<User> {
    const user = await this.getUserById(id);
    return this.repo.update(id, { isActive: false });
  }

  async getAdmins(): Promise<User[]> {
    const all = await this.repo.findAll();
    return all.filter(u => u.role === "admin");
  }
}

// ----------------------------------------------------------
// 2. Test factories — create typed test data
// ----------------------------------------------------------

// Factory with overrides pattern
function createUser(overrides: Partial<User> = {}): User {
  return {
    id:        1,
    name:      "Test User",
    email:     "test@mail.com",
    role:      "user",
    isActive:  true,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createAdmin(overrides: Partial<User> = {}): User {
  return createUser({ role: "admin", name: "Admin User", ...overrides });
}

function createUserList(count: number, overrides: (i: number) => Partial<User> = () => {}): User[] {
  return Array.from({ length: count }, (_, i) =>
    createUser({ id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@mail.com`, ...overrides(i) })
  );
}

// Typed partial mock — implement only the methods you need for a test
type DeepPartialMock<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer R
    ? MockFn<(...args: A) => R>
    : DeepPartialMock<T[K]>;
};

function createMockRepo(overrides: DeepPartialMock<UserRepository> = {}): UserRepository {
  return {
    findById:    vi.fn(async () => null),
    findByEmail: vi.fn(async () => null),
    findAll:     vi.fn(async () => []),
    create:      vi.fn(async (dto) => createUser({ name: dto.name, email: dto.email, role: dto.role })),
    update:      vi.fn(async (id, dto) => createUser({ id, ...dto })),
    delete:      vi.fn(async () => {}),
    ...overrides,
  };
}

// ----------------------------------------------------------
// 3. Test patterns — what real tests look like
// ----------------------------------------------------------

// Real vitest tests would look like:
//
// describe("UserService", () => {
//   let repo: UserRepository;
//   let service: UserService;
//
//   beforeEach(() => {
//     repo    = createMockRepo();
//     service = new UserService(repo);
//   });
//
//   afterEach(() => {
//     vi.clearAllMocks();
//   });
//
//   describe("getUserById", () => {
//     it("returns user when found", async () => {
//       const user = createUser({ id: 42 });
//       vi.mocked(repo.findById).mockResolvedValue(user);
//
//       const result = await service.getUserById(42);
//
//       expect(result).toEqual(user);
//       expect(repo.findById).toHaveBeenCalledWith(42);
//       expect(repo.findById).toHaveBeenCalledTimes(1);
//     });
//
//     it("throws when user not found", async () => {
//       vi.mocked(repo.findById).mockResolvedValue(null);
//
//       await expect(service.getUserById(99)).rejects.toThrow("User #99 not found");
//     });
//   });
//
//   describe("createUser", () => {
//     it("creates user with valid data", async () => {
//       const dto = { name: "Alice", email: "alice@mail.com" };
//       vi.mocked(repo.findByEmail).mockResolvedValue(null);
//       vi.mocked(repo.create).mockResolvedValue(createUser(dto));
//
//       const result = await service.createUser(dto);
//
//       expect(result.name).toBe("Alice");
//       expect(repo.create).toHaveBeenCalledWith(dto);
//     });
//
//     it.each([
//       [{ name: "",    email: "a@b.com" }, "Name is required"],
//       [{ name: "Bob", email: "" },        "Email is required"],
//       [{ name: "Bob", email: "not-email" },"Invalid email"],
//     ])("throws for invalid dto: %o", async (dto, expectedError) => {
//       await expect(service.createUser(dto)).rejects.toThrow(expectedError);
//     });
//
//     it("throws when email is taken", async () => {
//       vi.mocked(repo.findByEmail).mockResolvedValue(createUser());
//       await expect(service.createUser({ name: "Alice", email: "taken@mail.com" }))
//         .rejects.toThrow("Email already taken");
//     });
//   });
// });

// ----------------------------------------------------------
// 4. Typed spy utilities
// ----------------------------------------------------------

type SpiedFn<T extends (...args: any[]) => any> = MockFn<T>;

// Create a typed spy that wraps an existing function
function spyOn<T extends object, K extends keyof T>(
  obj: T,
  method: K,
): T[K] extends (...args: any[]) => any ? SpiedFn<T[K]> : never {
  const original = obj[method] as Function;
  const spy = vi.fn(original.bind(obj));
  (obj as Record<string | symbol, unknown>)[method as string] = spy;
  return spy as any;
}

// ----------------------------------------------------------
// 5. Test assertion helpers (typed)
// ----------------------------------------------------------

function expectType<T>(_value: T): void {
  // This is a compile-time check only — no runtime behavior
  // Usage: expectType<string>(someValue) — errors if someValue is not string
}

// Type-level test utilities
type Expect<T extends true>    = T;
type Equal<X, Y>               = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type NotEqual<X, Y>            = Equal<X, Y> extends true ? false : true;
type IsAny<T>                  = 0 extends 1 & T ? true : false;
type IsNever<T>                = [T] extends [never] ? true : false;

// Compile-time type assertions — errors show up as TS errors
type test1 = Expect<Equal<string, string>>;                   // ✅
type test2 = Expect<Equal<number[], Array<number>>>;          // ✅
type test3 = Expect<NotEqual<string, number>>;                // ✅
type test4 = Expect<IsNever<never>>;                          // ✅
type test5 = Expect<Equal<Awaited<Promise<string>>, string>>; // ✅

// ----------------------------------------------------------
// 6. Integration test pattern
// ----------------------------------------------------------

// For integration tests that hit a real (or in-memory) database:
// import { createApp } from "../src/app";
// import supertest from "supertest";
//
// describe("POST /api/users", () => {
//   const app = createApp();
//
//   it("creates a user and returns 201", async () => {
//     const res = await supertest(app)
//       .post("/api/users")
//       .send({ name: "Alice", email: "alice@test.com" })
//       .set("Authorization", `Bearer ${adminToken}`);
//
//     expect(res.status).toBe(201);
//     expect(res.body.data.name).toBe("Alice");
//     expect(res.body.data.password).toBeUndefined(); // never leak password
//   });
// });

// ----------------------------------------------------------
// Demo: run the patterns without a test runner
// ----------------------------------------------------------

async function demo() {
  console.log("=== Testing patterns demo ===\n");

  // Test factories
  const alice = createUser({ name: "Alice", email: "alice@mail.com", role: "admin" });
  const users = createUserList(5);
  console.log("Factory - Alice:", alice.name, alice.role);
  console.log("Factory - List:", users.map(u => u.name).join(", "));

  // Mock repo
  const repo = createMockRepo({
    findById: vi.fn(async (id: number) => id === 1 ? alice : null),
    findAll:  vi.fn(async () => users),
  });

  const service = new UserService(repo);

  // Test: get existing user
  try {
    const found = await service.getUserById(1);
    console.log("\n✅ getUserById(1):", found.name);
  } catch (e) {
    console.log("❌ getUserById(1):", (e as Error).message);
  }

  // Test: get non-existing user
  try {
    await service.getUserById(99);
  } catch (e) {
    console.log("✅ getUserById(99) threw:", (e as Error).message);
  }

  // Test: get admins (using mock list of users with no admins)
  const admins = await service.getAdmins();
  console.log("✅ getAdmins from 5-user list:", admins.length, "admins");

  // Check mock call tracking
  console.log("\nSpy call tracking:");
  console.log("findById called:", repo.findById.calls.length, "times");
  console.log("findAll called:", repo.findAll.calls.length, "times");
}

demo();

export { createUser, createAdmin, createUserList, createMockRepo, UserService };
