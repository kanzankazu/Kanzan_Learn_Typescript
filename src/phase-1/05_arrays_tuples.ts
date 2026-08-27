// ============================================================
// Phase 1 — 05: Arrays & Tuples
// ============================================================
// Topics: typed arrays, readonly arrays, array methods with types,
//         tuples, named tuples, tuple patterns
// Run: npx ts-node src/phase-1/05_arrays_tuples.ts
// ============================================================

// ----------------------------------------------------------
// 1. Typed arrays — two equivalent syntaxes
// ----------------------------------------------------------
const numbers:  number[]       = [1, 2, 3, 4, 5];
const names:    Array<string>  = ["Alice", "Bob", "Charlie"];
const flags:    boolean[]      = [true, false, true];

// TypeScript infers element types
const inferred = [1, 2, 3];        // number[]
const mixed    = [1, "two", true]; // (string | number | boolean)[]

console.log(numbers, names, flags);

// ----------------------------------------------------------
// 2. Array of objects
// ----------------------------------------------------------
type User = { id: number; name: string; isActive: boolean };

const users: User[] = [
  { id: 1, name: "Alice", isActive: true  },
  { id: 2, name: "Bob",   isActive: false },
  { id: 3, name: "Carol", isActive: true  },
];

// Typed array methods — TypeScript knows what's in the array
const activeUsers: User[]   = users.filter(u => u.isActive);
const userNames:   string[] = users.map(u => u.name);
const totalIds:    number   = users.reduce((acc, u) => acc + u.id, 0);

console.log("Active:", activeUsers.map(u => u.name)); // ["Alice", "Carol"]
console.log("Names:", userNames);                      // ["Alice", "Bob", "Carol"]
console.log("ID sum:", totalIds);                      // 6

// ----------------------------------------------------------
// 3. Readonly arrays — cannot be mutated
// ----------------------------------------------------------
const readonlyNums: readonly number[] = [1, 2, 3];
// readonlyNums.push(4);    // ❌ Property 'push' does not exist on type 'readonly number[]'
// readonlyNums[0] = 99;    // ❌ Cannot assign to '0' because it is a read-only index signature

// ReadonlyArray<T> is equivalent
const readonlyNames: ReadonlyArray<string> = ["Alice", "Bob"];

// Use 'as const' for deeply immutable arrays
const DIRECTIONS = ["north", "south", "east", "west"] as const;
// DIRECTIONS[0] = "up"; // ❌ readonly
// DIRECTIONS.push("up"); // ❌ readonly
type Direction = typeof DIRECTIONS[number]; // "north" | "south" | "east" | "west"

// ----------------------------------------------------------
// 4. Useful array patterns
// ----------------------------------------------------------

// Remove duplicates
const withDups = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(withDups)];
console.log(unique); // [1, 2, 3, 4]

// Flatten nested arrays
const nested = [[1, 2], [3, [4, 5]]];
console.log(nested.flat());    // [1, 2, 3, [4, 5]]
console.log(nested.flat(2));   // [1, 2, 3, 4, 5]

// Group by (manual — Array.prototype.group is experimental)
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {} as Record<string, T[]>);
}

const grouped = groupBy(users, u => u.isActive ? "active" : "inactive");
console.log("Grouped:", JSON.stringify(grouped, null, 2));

// Chunk array into pages
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
console.log(chunk([1, 2, 3, 4, 5, 6, 7], 3)); // [[1,2,3],[4,5,6],[7]]

// ----------------------------------------------------------
// 5. Tuples — fixed-length array with specific types per position
// ----------------------------------------------------------
// A tuple is an array where each position has a specific type
let coordinate: [number, number] = [10.5, 106.8];
let entry:      [string, number] = ["age", 28];
let record:     [number, string, boolean] = [1, "Alice", true];

console.log(coordinate[0], coordinate[1]); // 10.5 106.8
console.log(entry[0].toUpperCase());        // AGE
console.log(record[2] ? "active" : "inactive"); // active

// TypeScript enforces types per position
// coordinate = [106.8, "latitude"]; // ❌ string is not assignable to number

// ----------------------------------------------------------
// 6. Named tuples — more readable (TypeScript 4.0+)
// ----------------------------------------------------------
type RGB    = [red: number, green: number, blue: number];
type LatLng = [latitude: number, longitude: number];
type Range  = [min: number, max: number];

const red:    RGB    = [255, 0, 0];
const jakarta: LatLng = [-6.2, 106.8];
const range:  Range  = [0, 100];

// Destructure with meaningful names
const [r, g, b]     = red;
const [lat, lng]    = jakarta;
const [min, max]    = range;

console.log(`RGB(${r},${g},${b})`);         // RGB(255,0,0)
console.log(`Lat: ${lat}, Lng: ${lng}`);    // Lat: -6.2, Lng: 106.8
console.log(`Range: ${min} to ${max}`);     // Range: 0 to 100

// ----------------------------------------------------------
// 7. Optional tuple elements
// ----------------------------------------------------------
type HttpResponse = [statusCode: number, body: string, headers?: Record<string, string>];

const ok:       HttpResponse = [200, '{"data": "ok"}'];
const withHdr:  HttpResponse = [200, '{"data": "ok"}', { "Content-Type": "application/json" }];

function processResponse([code, body, headers]: HttpResponse): void {
  console.log(`${code}: ${body.slice(0, 20)}${headers ? " (with headers)" : ""}`);
}
processResponse(ok);
processResponse(withHdr);

// ----------------------------------------------------------
// 8. Rest in tuples
// ----------------------------------------------------------
type StringThenNumbers = [string, ...number[]];
type NumbersThenString = [...number[], string];

const mixed1: StringThenNumbers = ["label", 1, 2, 3, 4];
const mixed2: NumbersThenString = [1, 2, 3, "end"];

console.log(mixed1, mixed2);

// ----------------------------------------------------------
// 9. Tuple as function return — better than returning objects for simple pairs
// ----------------------------------------------------------
function minMax(nums: number[]): [min: number, max: number] {
  return [Math.min(...nums), Math.max(...nums)];
}

function splitOnFirst(str: string, sep: string): [before: string, after: string] {
  const idx = str.indexOf(sep);
  if (idx === -1) return [str, ""];
  return [str.slice(0, idx), str.slice(idx + sep.length)];
}

const [minimum, maximum] = minMax([3, 1, 4, 1, 5, 9, 2, 6]);
console.log(`min=${minimum}, max=${maximum}`); // min=1, max=9

const [key, value] = splitOnFirst("name=Faisal", "=");
console.log(`key="${key}", value="${value}"`); // key="name", value="Faisal"

export {};
