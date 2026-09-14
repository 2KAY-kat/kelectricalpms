import { z } from "zod";

// Project validation schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, "Project name is required")
    .max(200, "Project name must be less than 200 characters"),
  description: z.string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]),
  progress: z.number()
    .min(0, "Progress must be at least 0")
    .max(100, "Progress cannot exceed 100"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number()
    .positive("Budget must be a positive number")
    .optional(),
  client_name: z.string()
    .max(200, "Client name must be less than 200 characters")
    .optional(),
  client_contact: z.string()
    .max(200, "Client contact must be less than 200 characters")
    .optional(),
  location_address: z.string()
    .max(500, "Location address must be less than 500 characters")
    .optional(),
  current_phase: z.string()
    .max(100, "Phase name must be less than 100 characters")
    .optional(),
  phases: z.array(z.string())
    .optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

// Document validation schema
export const documentSchema = z.object({
  title: z.string()
    .min(1, "Document title is required")
    .max(200, "Document title must be less than 200 characters"),
  document_type: z.enum(["quotation", "receipt", "contract", "invoice", "proposal", "report"]),
  project_id: z.string().uuid().optional(),
  content: z.object({
    attention_to: z.string().max(200).optional(),
    items: z.array(z.object({
      qty: z.number().positive("Quantity must be positive"),
      description: z.string().min(1, "Description is required").max(500),
      unit_price: z.number().nonnegative("Unit price cannot be negative"),
      amount: z.number().nonnegative("Amount cannot be negative"),
    })).optional(),
    labor_cost: z.number().nonnegative("Labor cost cannot be negative").optional(),
    notes: z.string()
      .max(5000, "Notes must be less than 5000 characters")
      .optional(),
    subtotal: z.number().optional(),
    tax: z.number().optional(),
    total: z.number().optional(),
  }),
});

// Note validation schema
export const noteSchema = z.object({
  title: z.string()
    .min(1, "Note title is required")
    .max(200, "Note title must be less than 200 characters"),
  content: z.string()
    .min(1, "Note content is required")
    .max(5000, "Note content must be less than 5000 characters"),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  project_id: z.string().uuid().optional(),
});

// Bulletin post validation schema
export const bulletinSchema = z.object({
  title: z.string()
    .min(1, "Post title is required")
    .max(200, "Post title must be less than 200 characters"),
  content: z.string()
    .min(1, "Post content is required")
    .max(5000, "Post content must be less than 5000 characters"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  project_id: z.string().uuid().optional(),
});

// Branding validation schema
export const brandingSchema = z.object({
  company_name: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters"),
  tagline: z.string()
    .max(200, "Tagline must be less than 200 characters")
    .optional(),
  primary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  secondary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  address: z.string()
    .max(500, "Address must be less than 500 characters")
    .optional(),
  phone: z.string()
    .max(50, "Phone must be less than 50 characters")
    .optional(),
  phone_secondary: z.string()
    .max(50, "Secondary phone must be less than 50 characters")
    .optional(),
  email: z.string()
    .email("Invalid email format")
    .max(200, "Email must be less than 200 characters")
    .optional(),
  website: z.string()
    .url("Invalid URL format")
    .max(200, "Website must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  bank_name: z.string()
    .max(200, "Bank name must be less than 200 characters")
    .optional(),
  bank_account: z.string()
    .max(100, "Bank account must be less than 100 characters")
    .optional(),
});
