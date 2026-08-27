// ============================================================
// Phase 0 — 06: Promises & Async/Await
// ============================================================
// Topics: Promise, async/await, error handling, parallel vs sequential
// Run: npx ts-node src/phase-0/06_promises_async.ts
// ============================================================

// ----------------------------------------------------------
// 1. Creating a Promise manually
// ----------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchUser(id: number): Promise<{ id: number; name: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) {
        reject(new Error(`Invalid user ID: ${id}`));
        return;
      }
      resolve({ id, name: `User_${id}` });
    }, 100); // simulate 100ms network delay
  });
}

// ----------------------------------------------------------
// 2. Promise chaining (.then / .catch / .finally)
// ----------------------------------------------------------
fetchUser(1)
  .then(user => {
    console.log("Got user:", user.name); // User_1
    return user.id * 10; // pass value to next .then
  })
  .then(multiplied => {
    console.log("Multiplied:", multiplied); // 10
  })
  .catch(err => {
    console.error("Error:", (err as Error).message);
  })
  .finally(() => {
    console.log("Done (always runs)");
  });

// ----------------------------------------------------------
// 3. async/await — syntactic sugar over Promises
// ----------------------------------------------------------
async function getUser(id: number): Promise<string> {
  const user = await fetchUser(id); // pause here until Promise resolves
  return user.name;
}

// async/await with try/catch error handling
async function run() {
  try {
    const name = await getUser(2);
    console.log("Async user:", name); // User_2

    // This will reject
    await getUser(-1);
  } catch (err) {
    console.error("Caught error:", (err as Error).message);
  }
}
run();

// ----------------------------------------------------------
// 4. Sequential vs Parallel execution
// ----------------------------------------------------------
async function sequential() {
  console.time("sequential");
  const user1 = await fetchUser(1); // wait 100ms
  const user2 = await fetchUser(2); // wait another 100ms
  console.timeEnd("sequential");   // ~200ms total
  console.log(user1.name, user2.name);
}

async function parallel() {
  console.time("parallel");
  // Both start at the same time
  const [user1, user2] = await Promise.all([fetchUser(1), fetchUser(2)]);
  console.timeEnd("parallel");     // ~100ms total
  console.log(user1.name, user2.name);
}

sequential();
parallel();

// ----------------------------------------------------------
// 5. Promise.all — fail fast if any rejects
// ----------------------------------------------------------
async function demoPromiseAll() {
  try {
    const results = await Promise.all([
      fetchUser(1),
      fetchUser(2),
      fetchUser(3),
    ]);
    console.log("All users:", results.map(u => u.name));
  } catch (err) {
    // If any one fails, the whole thing fails
    console.error("One failed:", (err as Error).message);
  }
}
demoPromiseAll();

// ----------------------------------------------------------
// 6. Promise.allSettled — get results regardless of failure
// ----------------------------------------------------------
async function demoAllSettled() {
  const results = await Promise.allSettled([
    fetchUser(1),
    fetchUser(-1), // this will reject
    fetchUser(3),
  ]);

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`[${index}] OK:`, result.value.name);
    } else {
      console.log(`[${index}] Failed:`, result.reason.message);
    }
  });
}
demoAllSettled();

// ----------------------------------------------------------
// 7. Promise.race — first to settle wins
// ----------------------------------------------------------
async function demoRace() {
  const fast = new Promise<string>(r => setTimeout(() => r("fast"), 50));
  const slow = new Promise<string>(r => setTimeout(() => r("slow"), 200));
  const winner = await Promise.race([fast, slow]);
  console.log("Race winner:", winner); // "fast"
}
demoRace();

// ----------------------------------------------------------
// 8. async error patterns
// ----------------------------------------------------------

// ✅ Pattern: wrap in try/catch
async function safeFetch(id: number) {
  try {
    return await fetchUser(id);
  } catch (err) {
    console.error("safeFetch error:", (err as Error).message);
    return null;
  }
}

// ✅ Pattern: helper to avoid try/catch repetition
async function to<T>(promise: Promise<T>): Promise<[Error | null, T | null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as Error, null];
  }
}

async function demoTo() {
  const [err, user] = await to(fetchUser(1));
  if (err) {
    console.error("Error:", err.message);
    return;
  }
  console.log("User from to():", user?.name);

  const [err2, badUser] = await to(fetchUser(-1));
  if (err2) {
    console.error("Expected error:", err2.message); // logs error
  } else {
    console.log(badUser);
  }
}
demoTo();

export {};
