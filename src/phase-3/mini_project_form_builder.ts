// ============================================================
// Phase 3 — Mini Project: Type-Safe Form Builder
// ============================================================
// Demonstrates: Mapped types, conditional types, template literal
// types, utility types — all combined to build a type-safe form system.
//
// Run: npx ts-node src/phase-3/mini_project_form_builder.ts
// ============================================================

// ----------------------------------------------------------
// Core types
// ----------------------------------------------------------
type FieldType = "text" | "email" | "password" | "number" | "checkbox" | "select" | "textarea";

// Map FieldType to its runtime value type
type FieldValueType = {
  text:     string;
  email:    string;
  password: string;
  number:   number;
  checkbox: boolean;
  select:   string;
  textarea: string;
};

// ----------------------------------------------------------
// Field configuration — per field
// ----------------------------------------------------------
type FieldConfig<T extends FieldType = FieldType> = {
  type:         T;
  label:        string;
  placeholder?: string;
  required?:    boolean;
  disabled?:    boolean;
  defaultValue?: FieldValueType[T];
  options?:     T extends "select" ? string[] : never; // only for select
  validate?:    (value: FieldValueType[T]) => string | null;
};

// ----------------------------------------------------------
// Schema — describe the shape of a form
// ----------------------------------------------------------
type FormSchema<T extends Record<string, FieldType>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

// ----------------------------------------------------------
// Derived types from a schema
// ----------------------------------------------------------
// FormData<Schema> — the actual data object the form produces
type FormData<T extends Record<string, FieldType>> = {
  [K in keyof T]: FieldValueType[T[K]];
};

// FormErrors<Schema> — validation errors per field
type FormErrors<T extends Record<string, FieldType>> = {
  [K in keyof T]?: string;
};

// FormTouched<Schema> — which fields the user has interacted with
type FormTouched<T extends Record<string, FieldType>> = {
  [K in keyof T]?: boolean;
};

// ChangeHandlers — on<FieldName>Change per field
type FormChangeHandlers<T extends Record<string, FieldType>> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (
    value: FieldValueType[T[K]],
  ) => void;
};

// ----------------------------------------------------------
// Form state
// ----------------------------------------------------------
type FormState<T extends Record<string, FieldType>> = {
  data:      FormData<T>;
  errors:    FormErrors<T>;
  touched:   FormTouched<T>;
  isValid:   boolean;
  isDirty:   boolean;
  isSubmitting: boolean;
};

// ----------------------------------------------------------
// Form class
// ----------------------------------------------------------
class Form<TFields extends Record<string, FieldType>> {
  private schema:  FormSchema<TFields>;
  private state:   FormState<TFields>;
  private initial: FormData<TFields>;

  constructor(schema: FormSchema<TFields>) {
    this.schema = schema;

    // Build initial data from defaultValues
    const data = {} as FormData<TFields>;
    for (const key in schema) {
      const field = schema[key];
      if (field.defaultValue !== undefined) {
        (data as Record<string, unknown>)[key] = field.defaultValue;
      } else {
        const defaults: Record<FieldType, unknown> = {
          text: "", email: "", password: "", number: 0,
          checkbox: false, select: "", textarea: "",
        };
        (data as Record<string, unknown>)[key] = defaults[field.type];
      }
    }

    this.initial = { ...data };
    this.state = {
      data,
      errors:       {} as FormErrors<TFields>,
      touched:      {} as FormTouched<TFields>,
      isValid:      false,
      isDirty:      false,
      isSubmitting: false,
    };
  }

  // Set a single field value
  setValue<K extends keyof TFields>(field: K, value: FieldValueType[TFields[K]]): void {
    (this.state.data as Record<string, unknown>)[field as string] = value;
    (this.state.touched as Record<string, unknown>)[field as string] = true;
    this.state.isDirty = JSON.stringify(this.state.data) !== JSON.stringify(this.initial);
    this.validateField(field);
  }

  // Validate a single field
  validateField<K extends keyof TFields>(field: K): string | null {
    const fieldCfg = this.schema[field];
    const value = this.state.data[field];

    // Required check
    if (fieldCfg.required) {
      const isEmpty =
        value === "" || value === null || value === undefined ||
        (fieldCfg.type === "number" && (value as number) === 0);
      if (isEmpty) {
        const error = `${fieldCfg.label} is required`;
        (this.state.errors as Record<string, unknown>)[field as string] = error;
        this.updateValidity();
        return error;
      }
    }

    // Custom validator
    if (fieldCfg.validate) {
      const error = (fieldCfg.validate as (v: unknown) => string | null)(value);
      if (error) {
        (this.state.errors as Record<string, unknown>)[field as string] = error;
        this.updateValidity();
        return error;
      }
    }

    // Clear error if valid
    delete (this.state.errors as Record<string, unknown>)[field as string];
    this.updateValidity();
    return null;
  }

  // Validate all fields
  validateAll(): boolean {
    let valid = true;
    for (const key in this.schema) {
      const error = this.validateField(key as keyof TFields);
      if (error) valid = false;
    }
    return valid;
  }

  private updateValidity(): void {
    this.state.isValid = Object.keys(this.state.errors).length === 0;
  }

  getState(): Readonly<FormState<TFields>> {
    return this.state;
  }

  getData(): Readonly<FormData<TFields>> {
    return this.state.data;
  }

  getErrors(): Readonly<FormErrors<TFields>> {
    return this.state.errors;
  }

  reset(): void {
    this.state.data      = { ...this.initial };
    this.state.errors    = {} as FormErrors<TFields>;
    this.state.touched   = {} as FormTouched<TFields>;
    this.state.isDirty   = false;
    this.state.isValid   = false;
    this.state.isSubmitting = false;
  }

  async submit(onSubmit: (data: FormData<TFields>) => Promise<void>): Promise<void> {
    if (!this.validateAll()) {
      console.log("Form has errors — cannot submit");
      return;
    }
    this.state.isSubmitting = true;
    try {
      await onSubmit(this.state.data);
    } finally {
      this.state.isSubmitting = false;
    }
  }
}

// ----------------------------------------------------------
// Demo 1: Registration form
// ----------------------------------------------------------
type RegisterFields = {
  username: "text";
  email:    "email";
  password: "password";
  age:      "number";
  role:     "select";
  agree:    "checkbox";
};

const registerSchema: FormSchema<RegisterFields> = {
  username: {
    type: "text", label: "Username", required: true,
    validate: v => v.length >= 3 ? null : "Must be at least 3 characters",
  },
  email: {
    type: "email", label: "Email", required: true,
    validate: v => /\S+@\S+\.\S+/.test(v) ? null : "Invalid email format",
  },
  password: {
    type: "password", label: "Password", required: true,
    validate: v => {
      if (v.length < 8)          return "Must be at least 8 characters";
      if (!/[A-Z]/.test(v))      return "Must contain at least one uppercase letter";
      if (!/[0-9]/.test(v))      return "Must contain at least one digit";
      return null;
    },
  },
  age: {
    type: "number", label: "Age", required: true,
    validate: v => v >= 18 && v <= 120 ? null : "Must be between 18 and 120",
  },
  role: {
    type: "select", label: "Role", required: true,
    options: ["user", "admin", "moderator"],
    defaultValue: "user",
  },
  agree: {
    type: "checkbox", label: "I agree to terms",
    validate: v => v ? null : "You must agree to the terms",
  },
};

console.log("=== Registration Form Demo ===\n");
const registerForm = new Form(registerSchema);

// Simulate user filling in the form
registerForm.setValue("username", "faisal");
registerForm.setValue("email", "faisal@mail.com");
registerForm.setValue("password", "Secret123");
registerForm.setValue("age", 28);
registerForm.setValue("role", "admin");
registerForm.setValue("agree", true);

const state = registerForm.getState();
console.log("Form data:",   registerForm.getData());
console.log("Errors:",      registerForm.getErrors());
console.log("Is valid:",    state.isValid);
console.log("Is dirty:",    state.isDirty);

// Submit
registerForm.submit(async (data) => {
  console.log("\n✅ Form submitted successfully:");
  console.log(JSON.stringify({ ...data, password: "***" }, null, 2));
});

// ----------------------------------------------------------
// Demo 2: Invalid submission
// ----------------------------------------------------------
console.log("\n=== Invalid Form Demo ===\n");
const badForm = new Form(registerSchema);

badForm.setValue("username", "ab");          // too short
badForm.setValue("email", "not-an-email");   // invalid
badForm.setValue("password", "weak");        // too weak
badForm.setValue("age", 15);                 // underage

console.log("Errors after invalid input:");
Object.entries(badForm.getErrors()).forEach(([field, error]) => {
  console.log(`  ${field}: ${error}`);
});

badForm.submit(async () => {
  console.log("This should not print");
});
