import { relations, sql } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Department Table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

// User Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  departmentId: integer("department_id").references(() => departments.id),
});

// Break Types Table
export const breakTypes = pgTable("break_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  maxConcurrent: integer("max_concurrent").default(Number.MAX_SAFE_INTEGER),
  durationLimit: integer("duration_limit").default(15),
});

// Breaks Table
export const breaks = pgTable("breaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  breakTypeId: integer("break_type_id").notNull().references(() => breakTypes.id),
  startTime: timestamp("start_time").default(sql`CURRENT_TIMESTAMP`),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  active: boolean("active").default(true),
  date: date("date").notNull(),
});

// Define relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  breaks: many(breaks),
}));

export const breakTypesRelations = relations(breakTypes, ({ many }) => ({
  breaks: many(breaks),
}));

export const breaksRelations = relations(breaks, ({ one }) => ({
  user: one(users, {
    fields: [breaks.userId],
    references: [users.id],
  }),
  breakType: one(breakTypes, {
    fields: [breaks.breakTypeId],
    references: [breakTypes.id],
  }),
}));

// Define Zod schemas for validation
export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  code: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  departmentId: true,
});

export const insertBreakTypeSchema = createInsertSchema(breakTypes).pick({
  code: true,
  name: true,
  description: true,
  icon: true,
  maxConcurrent: true,
  durationLimit: true,
});

export const insertBreakSchema = createInsertSchema(breaks).pick({
  userId: true,
  breakTypeId: true,
  startTime: true,
  date: true,
});

export const updateBreakSchema = createInsertSchema(breaks).pick({
  endTime: true,
  durationMinutes: true,
  active: true,
});

// TypeScript types for use in the application
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBreakType = z.infer<typeof insertBreakTypeSchema>;
export type BreakType = typeof breakTypes.$inferSelect;

export type InsertBreak = z.infer<typeof insertBreakSchema>;
export type UpdateBreak = z.infer<typeof updateBreakSchema>;
export type Break = typeof breaks.$inferSelect;

// Additional types for statistics
export type DailyBreaksSummary = {
  totalUsed: number;
  totalRemaining: number;
  totalExceeded: number;
  breakTypeUsage: {
    breakTypeId: number;
    code: string;
    name: string;
    durationUsed: number;
    durationLimit: number;
    icon: string;
  }[];
};

export type DepartmentBreakStats = {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  employeeCount: number;
  totalBreakMinutes: number;
  averageBreakMinutes: number;
  exceededCount: number;
  breakTypeStats: {
    breakTypeId: number;
    breakTypeName: string;
    totalUsage: number;
    averageUsage: number;
  }[];
};