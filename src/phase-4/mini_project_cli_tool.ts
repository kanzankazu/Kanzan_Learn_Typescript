// ============================================================
// Phase 4 — Mini Project: Type-Safe CLI Tool
// ============================================================
// A CLI argument parser & command runner demonstrating:
// - Type-safe config with ProcessEnv typing
// - Generic subcommand system
// - Mapped types for flag definitions
// - Module-style organization
//
// Run: npx ts-node src/phase-4/mini_project_cli_tool.ts --help
//   or: npx ts-node src/phase-4/mini_project_cli_tool.ts greet --name Faisal --count 3
//   or: npx ts-node src/phase-4/mini_project_cli_tool.ts calc --op add --a 10 --b 5
//   or: npx ts-node src/phase-4/mini_project_cli_tool.ts env
// ============================================================

// ----------------------------------------------------------
// Types — flag definitions and parsed results
// ----------------------------------------------------------
type FlagType = "string" | "number" | "boolean";

type FlagRuntimeType<T extends FlagType> =
  T extends "string"  ? string  :
  T extends "number"  ? number  :
  T extends "boolean" ? boolean :
  never;

interface FlagDef<T extends FlagType = FlagType> {
  type:       T;
  short?:     string;          // e.g. "-n" for "--name"
  required?:  boolean;
  default?:   FlagRuntimeType<T>;
  description: string;
}

type FlagDefs = Record<string, FlagDef>;

// Derive the parsed flags object type from a FlagDefs map
type ParsedFlags<T extends FlagDefs> = {
  [K in keyof T]:
    T[K]["required"] extends true
      ? FlagRuntimeType<T[K]["type"]>
      : FlagRuntimeType<T[K]["type"]> | undefined;
};

// ----------------------------------------------------------
// Argument parser
// ----------------------------------------------------------
function parseArgs<T extends FlagDefs>(
  argv: string[],
  defs: T,
): { flags: Partial<ParsedFlags<T>>; positional: string[] } {
  const flags: Record<string, unknown> = {};
  const positional: string[] = [];

  // Apply defaults
  for (const [key, def] of Object.entries(defs)) {
    if (def.default !== undefined) flags[key] = def.default;
    if (def.type === "boolean")    flags[key] = false;
  }

  // Build short-flag → long-flag lookup
  const shortMap: Record<string, string> = {};
  for (const [key, def] of Object.entries(defs)) {
    if (def.short) shortMap[def.short] = key;
  }

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith("--") || arg.startsWith("-")) {
      const isLong = arg.startsWith("--");
      const raw    = isLong ? arg.slice(2) : arg.slice(1);

      // Handle --flag=value syntax
      const eqIdx = raw.indexOf("=");
      const flagKey = eqIdx >= 0 ? raw.slice(0, eqIdx) : raw;
      const eqValue = eqIdx >= 0 ? raw.slice(eqIdx + 1) : undefined;

      // Resolve short to long name
      const key = isLong ? flagKey : (shortMap[flagKey] ?? flagKey);
      const def  = defs[key];

      if (!def) {
        console.warn(`Unknown flag: ${arg}`);
        i++;
        continue;
      }

      if (def.type === "boolean") {
        flags[key] = true;
      } else {
        const value = eqValue ?? argv[i + 1];
        if (value === undefined || value.startsWith("-")) {
          console.error(`Flag --${key} requires a value`);
          process.exit(1);
        }
        if (def.type === "number") {
          const num = parseFloat(value);
          if (isNaN(num)) {
            console.error(`Flag --${key} must be a number, got: ${value}`);
            process.exit(1);
          }
          flags[key] = num;
        } else {
          flags[key] = value;
        }
        if (!eqValue) i++; // consumed next token
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  return { flags: flags as Partial<ParsedFlags<T>>, positional };
}

// ----------------------------------------------------------
// Command system
// ----------------------------------------------------------
interface Command<T extends FlagDefs = FlagDefs> {
  name:        string;
  description: string;
  flags:       T;
  handler(flags: Partial<ParsedFlags<T>>): void | Promise<void>;
}

function defineCommand<T extends FlagDefs>(cmd: Command<T>): Command<T> {
  return cmd;
}

// ----------------------------------------------------------
// CLI App
// ----------------------------------------------------------
class CLI {
  private commands = new Map<string, Command>();
  private globalFlags: FlagDefs = {
    help:    { type: "boolean", short: "h", description: "Show help message" },
    version: { type: "boolean", short: "v", description: "Show version" },
  };

  constructor(
    private name: string,
    private version: string,
    private description: string,
  ) {}

  register<T extends FlagDefs>(cmd: Command<T>): this {
    this.commands.set(cmd.name, cmd as unknown as Command);
    return this;
  }

  printHelp(commandName?: string): void {
    if (commandName) {
      const cmd = this.commands.get(commandName);
      if (!cmd) { console.log(`Unknown command: ${commandName}`); return; }

      console.log(`\n${this.name} ${cmd.name} — ${cmd.description}\n`);
      console.log(`Usage: ${this.name} ${cmd.name} [flags]\n`);
      console.log("Flags:");
      for (const [key, def] of Object.entries(cmd.flags)) {
        const short    = def.short ? `, -${def.short}` : "";
        const required = def.required ? " (required)" : "";
        const defVal   = def.default !== undefined ? ` [default: ${def.default}]` : "";
        console.log(`  --${key}${short}  ${def.description}${required}${defVal}`);
      }
      return;
    }

    console.log(`\n${this.name} v${this.version} — ${this.description}\n`);
    console.log(`Usage: ${this.name} <command> [flags]\n`);
    console.log("Commands:");
    this.commands.forEach(cmd => {
      console.log(`  ${cmd.name.padEnd(12)} ${cmd.description}`);
    });
    console.log("\nGlobal flags:");
    for (const [key, def] of Object.entries(this.globalFlags)) {
      const short = def.short ? `, -${def.short}` : "";
      console.log(`  --${key}${short}  ${def.description}`);
    }
    console.log("");
  }

  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    const { flags: globalFlags, positional } = parseArgs(argv, this.globalFlags);

    if (globalFlags.version) {
      console.log(`${this.name} v${this.version}`);
      return;
    }

    const commandName = positional[0];

    if (!commandName || (globalFlags.help && !commandName)) {
      this.printHelp();
      return;
    }

    if (commandName === "help") {
      this.printHelp(positional[1]);
      return;
    }

    const cmd = this.commands.get(commandName);
    if (!cmd) {
      console.error(`Unknown command: "${commandName}". Run "${this.name} --help" for usage.`);
      process.exit(1);
    }

    const cmdArgv = argv.slice(argv.indexOf(commandName) + 1);
    const { flags } = parseArgs(cmdArgv, cmd.flags);

    if (globalFlags.help) {
      this.printHelp(commandName);
      return;
    }

    // Validate required flags
    for (const [key, def] of Object.entries(cmd.flags)) {
      if (def.required && flags[key] === undefined) {
        console.error(`Error: --${key} is required for "${commandName}" command`);
        this.printHelp(commandName);
        process.exit(1);
      }
    }

    await cmd.handler(flags);
  }
}

// ----------------------------------------------------------
// Define commands
// ----------------------------------------------------------

const greetCommand = defineCommand({
  name:        "greet",
  description: "Print a greeting message",
  flags: {
    name:  { type: "string",  short: "n", required: true,  description: "Name to greet" },
    count: { type: "number",  short: "c", default: 1,      description: "How many times to greet" },
    upper: { type: "boolean", short: "u", description: "Print in uppercase" },
  },
  handler(flags) {
    const name  = flags.name!;
    const count = flags.count ?? 1;
    for (let i = 0; i < count; i++) {
      const msg = `Hello, ${name}! (${i + 1}/${count})`;
      console.log(flags.upper ? msg.toUpperCase() : msg);
    }
  },
});

const calcCommand = defineCommand({
  name:        "calc",
  description: "Perform arithmetic operations",
  flags: {
    op: { type: "string", short: "o", required: true,  description: "Operation: add|sub|mul|div" },
    a:  { type: "number", short: "a", required: true,  description: "First operand" },
    b:  { type: "number", short: "b", required: true,  description: "Second operand" },
  },
  handler(flags) {
    const a  = flags.a!;
    const b  = flags.b!;
    const op = flags.op!;

    const ops: Record<string, (a: number, b: number) => number> = {
      add: (a, b) => a + b,
      sub: (a, b) => a - b,
      mul: (a, b) => a * b,
      div: (a, b) => {
        if (b === 0) throw new Error("Cannot divide by zero");
        return a / b;
      },
    };

    if (!ops[op]) {
      console.error(`Unknown operation: "${op}". Use: add, sub, mul, div`);
      process.exit(1);
    }
    console.log(`${a} ${op} ${b} = ${ops[op](a, b)}`);
  },
});

const envCommand = defineCommand({
  name:        "env",
  description: "Show current environment info",
  flags: {
    all: { type: "boolean", short: "a", description: "Show all env variables" },
  },
  handler(flags) {
    console.log("\nEnvironment Info:");
    console.log(`  NODE_ENV:  ${process.env.NODE_ENV ?? "not set"}`);
    console.log(`  Node.js:   ${process.version}`);
    console.log(`  Platform:  ${process.platform}`);
    console.log(`  CWD:       ${process.cwd()}`);

    if (flags.all) {
      console.log("\nAll environment variables:");
      Object.entries(process.env)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([k, v]) => console.log(`  ${k}=${v}`));
    }
  },
});

// ----------------------------------------------------------
// Bootstrap
// ----------------------------------------------------------
const cli = new CLI("ts-cli", "1.0.0", "A type-safe CLI tool built with TypeScript")
  .register(greetCommand)
  .register(calcCommand)
  .register(envCommand);

cli.run().catch(err => {
  console.error("Fatal error:", (err as Error).message);
  process.exit(1);
});
