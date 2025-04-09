import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Issue schema
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  platform: text("platform").notNull(),
  productCategory: text("product_category").notNull(),
  severity: text("severity").notNull(),
  frequency: text("frequency").notNull(),
  customFrequencyDescription: text("custom_frequency_description"),
  reproducible: text("reproducible").notNull(),
  reproductionSteps: text("reproduction_steps").notNull(),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior").notNull(),
  softwareVersion: text("software_version").notNull(),
  operatingSystem: text("operating_system"),
  osVersion: text("os_version").notNull(),
  reportedBy: text("reported_by").notNull(),
  additionalEnvironment: text("additional_environment"),
  jiraTicketId: text("jira_ticket_id"),
  status: text("status").default("submitted"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Media schema
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().references(() => issues.id),
  type: text("type").notNull(), // photo, video, audio, file
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  transcription: text("transcription"), // For audio files
  createdAt: timestamp("created_at").defaultNow(),
});

// Issue insert schema
export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  jiraTicketId: true,
  status: true,
  createdAt: true,
});

// Media insert schema
export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
});

// Combined schema for form data
export const issueFormSchema = insertIssueSchema.extend({
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to submit the form",
  }),
  // Validate customFrequencyDescription is provided when frequency is custom
  customFrequencyDescription: z.string().optional(),
  // Add validation for reportedBy
  reportedBy: z.string().min(2, {
    message: "Reported By must be at least 2 characters long"
  }),
  // Media files will be handled separately through multipart/form-data
});

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Issue = typeof issues.$inferSelect;
export type Media = typeof media.$inferSelect;
export type IssueFormData = z.infer<typeof issueFormSchema>;
