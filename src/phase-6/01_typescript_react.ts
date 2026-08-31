// ============================================================
// Phase 6 — 01: TypeScript + React
// ============================================================
// Topics: props typing, children, events, hooks (useState/useRef/
//         useReducer/useContext), custom hooks, forwardRef, HOC,
//         generic components, discriminated union props
//
// NOTE: This file is a REFERENCE — it won't run standalone.
//       Copy patterns into a React project (Vite/Next.js).
//       Create one with: npm create vite@latest my-app -- --template react-ts
// ============================================================

// Simulating React types so this file is self-documenting
// In a real React project, just import from "react"
namespace React {
  export type FC<P = {}> = (props: P) => any;
  export type ReactNode = any;
  export type CSSProperties = Record<string, string | number>;
  export function useState<T>(init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void] { return null as any; }
  export function useEffect(fn: () => void | (() => void), deps?: unknown[]): void {}
  export function useRef<T>(init: T): { current: T } { return null as any; }
  export function useReducer<S, A>(reducer: (s: S, a: A) => S, init: S): [S, (a: A) => void] { return null as any; }
  export function useContext<T>(ctx: any): T { return null as any; }
  export function createContext<T>(def: T): any { return null; }
  export function useCallback<T extends Function>(fn: T, deps: unknown[]): T { return fn; }
  export function useMemo<T>(fn: () => T, deps: unknown[]): T { return fn(); }
  export function forwardRef<T, P>(render: (props: P, ref: any) => any): FC<P & { ref?: any }> { return null as any; }
  export type ChangeEvent<T> = { target: T & { value: string; checked: boolean } };
  export type MouseEvent<T = unknown> = { currentTarget: T; preventDefault(): void; stopPropagation(): void };
  export type FormEvent<T = unknown> = { currentTarget: T; preventDefault(): void };
  export type KeyboardEvent<T = unknown> = { key: string; code: string; currentTarget: T };
}

// ----------------------------------------------------------
// 1. Basic props typing
// ----------------------------------------------------------

interface ButtonProps {
  label:     string;
  onClick:   () => void;
  variant?:  "primary" | "secondary" | "danger" | "ghost";
  size?:     "sm" | "md" | "lg";
  disabled?: boolean;
  loading?:  boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  label, onClick, variant = "primary", size = "md",
  disabled = false, loading = false, className,
}) => {
  // JSX would go here in a real component
  return null;
};

// ----------------------------------------------------------
// 2. Children typing
// ----------------------------------------------------------

interface CardProps {
  title:     string;
  children:  React.ReactNode;        // any valid React content
  footer?:   React.ReactNode;
  className?: string;
}

// children as render prop (function as children)
interface ListProps<T> {
  items:    T[];
  keyFn:    (item: T) => string;
  children: (item: T, index: number) => React.ReactNode;
  empty?:   React.ReactNode;
}

// ----------------------------------------------------------
// 3. Event types
// ----------------------------------------------------------

interface InputProps {
  value:       string;
  onChange:    (e: React.ChangeEvent<{ value: string; focus(): void }>) => void;
  onKeyDown?:  (e: React.KeyboardEvent<{ value: string; focus(): void }>) => void;
  placeholder?: string;
}

// Typed event handlers — extracted for reuse
type InputChangeHandler   = (e: React.ChangeEvent<{ value: string; focus(): void }>)   => void;
type SelectChangeHandler  = (e: React.ChangeEvent<{ value: string }>)  => void;
type TextareaChangeHandler= (e: React.ChangeEvent<{ value: string }>)=> void;
type FormSubmitHandler    = (e: React.FormEvent<{ reset(): void }>)       => void;
type ButtonClickHandler   = (e: React.MouseEvent<{ disabled: boolean }>)    => void;

// ----------------------------------------------------------
// 4. useState — typed state
// ----------------------------------------------------------

function useCounter(initialCount: number = 0) {
  const [count, setCount] = React.useState(initialCount); // inferred: number

  return {
    count,
    increment: ()         => setCount(c => c + 1),
    decrement: ()         => setCount(c => c - 1),
    reset:     ()         => setCount(initialCount),
    set:       (n: number) => setCount(n),
  };
}

// Complex state — always type explicitly
interface UserFormState {
  name:     string;
  email:    string;
  role:     "admin" | "user" | "guest";
  isActive: boolean;
}

function useUserForm(initial?: Partial<UserFormState>) {
  const [form, setForm] = React.useState<UserFormState>({
    name:     initial?.name     ?? "",
    email:    initial?.email    ?? "",
    role:     initial?.role     ?? "user",
    isActive: initial?.isActive ?? true,
  });

  const setField = <K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K],
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => setForm({
    name: "", email: "", role: "user", isActive: true,
  });

  const isValid = form.name.trim() !== "" && form.email.includes("@");

  return { form, setField, reset, isValid };
}

// ----------------------------------------------------------
// 5. useRef — typed refs
// ----------------------------------------------------------

function useFocusOnMount() {
  const ref = React.useRef<{ value: string; focus(): void }>(null as unknown as { value: string; focus(): void });
  React.useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

// Ref to store mutable value without re-rendering (like instance variable)
function useLatest<T>(value: T): { readonly current: T } {
  const ref = React.useRef(value);
  React.useEffect(() => { ref.current = value; });
  return ref;
}

// Interval with cleanup
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useLatest(callback);
  React.useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ----------------------------------------------------------
// 6. useReducer — complex state with actions
// ----------------------------------------------------------

interface TodoItem {
  id:        number;
  title:     string;
  completed: boolean;
}

type TodoAction =
  | { type: "ADD";    title: string }
  | { type: "TOGGLE"; id: number }
  | { type: "DELETE"; id: number }
  | { type: "CLEAR_COMPLETED" };

interface TodoState {
  todos:  TodoItem[];
  nextId: number;
}

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "ADD":
      return {
        todos:  [...state.todos, { id: state.nextId, title: action.title, completed: false }],
        nextId: state.nextId + 1,
      };
    case "TOGGLE":
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.id ? { ...t, completed: !t.completed } : t
        ),
      };
    case "DELETE":
      return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
    case "CLEAR_COMPLETED":
      return { ...state, todos: state.todos.filter(t => !t.completed) };
  }
}

function useTodos() {
  const [state, dispatch] = React.useReducer(todoReducer, { todos: [], nextId: 1 });
  return {
    todos:           state.todos,
    add:             (title: string) => dispatch({ type: "ADD", title }),
    toggle:          (id: number)    => dispatch({ type: "TOGGLE", id }),
    delete:          (id: number)    => dispatch({ type: "DELETE", id }),
    clearCompleted:  ()              => dispatch({ type: "CLEAR_COMPLETED" }),
    completedCount:  state.todos.filter(t => t.completed).length,
    pendingCount:    state.todos.filter(t => !t.completed).length,
  };
}

// ----------------------------------------------------------
// 7. useContext — typed context
// ----------------------------------------------------------

interface AuthUser {
  id:    number;
  name:  string;
  email: string;
  role:  "admin" | "user";
}

interface AuthContextValue {
  user:    AuthUser | null;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => void;
  isAdmin: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
  const ctx = React.useContext<AuthContextValue | null>(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ----------------------------------------------------------
// 8. Generic components
// ----------------------------------------------------------

// Generic list component
interface SelectProps<T> {
  options:     T[];
  value:       T | null;
  onChange:    (value: T) => void;
  labelFn:     (item: T) => string;
  valueFn:     (item: T) => string;
  placeholder?: string;
}
// const Select = <T,>({ options, value, onChange, labelFn, valueFn, placeholder }: SelectProps<T>) => ...

// Generic table component
interface Column<T> {
  key:       keyof T | string;
  header:    string;
  render?:   (item: T) => React.ReactNode;
  sortable?: boolean;
  width?:    string;
}

interface TableProps<T> {
  data:       T[];
  columns:    Column<T>[];
  keyFn:      (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?:   boolean;
  empty?:     React.ReactNode;
}

// ----------------------------------------------------------
// 9. Discriminated union props (conditional props)
// ----------------------------------------------------------

// Either href OR onClick, but not both / neither
type LinkOrButtonProps =
  | { as: "link";   href: string; target?: "_blank" | "_self" }
  | { as: "button"; onClick: () => void; type?: "button" | "submit" };

type ActionProps = { children: React.ReactNode; disabled?: boolean } & LinkOrButtonProps;

// ----------------------------------------------------------
// 10. Custom hook — data fetching
// ----------------------------------------------------------

type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error";   error: Error };

function useFetch<T>(url: string | null): FetchState<T> & { refetch: () => void } {
  const [state, setState] = React.useState<FetchState<T>>({ status: "idle" });

  const fetchData = React.useCallback(async () => {
    if (!url) return;
    setState({ status: "loading" });
    try {
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json() as T;
      setState({ status: "success", data });
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [url]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// Usage example:
// const { status, data, error, refetch } = useFetch<User[]>("/api/users");
// if (status === "loading") return <Spinner />;
// if (status === "error")   return <ErrorMsg error={error} />;
// if (status === "success") return <UserList users={data} />;

// ----------------------------------------------------------
// 11. forwardRef — expose internal ref to parent
// ----------------------------------------------------------

interface TextInputProps {
  label:       string;
  value:       string;
  onChange:    InputChangeHandler;
  error?:      string;
  placeholder?: string;
}

const TextInput = React.forwardRef<{ value: string; focus(): void }, TextInputProps>(
  ({ label, value, onChange, error, placeholder }, ref) => {
    return null; // return <div>...</div> in real component
  }
);

console.log("React patterns reference file loaded ✅");
console.log("Copy these patterns into a Vite/Next.js React TypeScript project.");
console.log("Create one: npm create vite@latest my-app -- --template react-ts");

export {
  Button, useCounter, useUserForm, useFocusOnMount,
  useInterval, useTodos, useAuth, useFetch,
};
