import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import {
  Break,
  insertBreakSchema,
  updateBreakSchema,
  insertBreakTypeSchema,
  insertUserSchema,
  insertDepartmentSchema
} from "@shared/schema";
import { z } from "zod";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Simple password check (in a real app, you'd use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Return user info (except password)
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Return user info (except password)
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });
  
  // Department routes
  app.get("/api/departments", async (_req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      res.json({ departments });
    } catch (error) {
      res.status(500).json({ error: "Failed to get departments" });
    }
  });
  
  app.get("/api/departments/:id", async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      res.json({ department });
    } catch (error) {
      res.status(500).json({ error: "Failed to get department" });
    }
  });

  app.post("/api/departments", async (req: Request, res: Response) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json({ department });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create department" });
      }
    }
  });
  
  app.get("/api/departments/:id/users", async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      const users = await storage.getUsersByDepartment(departmentId);
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: "Failed to get department users" });
    }
  });
  
  app.get("/api/departments/:id/stats", async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      const date = (req.query.date as string) || getTodayDate();
      
      const department = await storage.getDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      const stats = await storage.getDepartmentBreakStats(departmentId, date);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to get department statistics" });
    }
  });
  
  // User routes
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      // Get all users from all departments
      const departments = await storage.getDepartments();
      let allUsers: any[] = [];
      
      for (const dept of departments) {
        const users = await storage.getUsersByDepartment(dept.id);
        allUsers = [...allUsers, ...users];
      }
      
      res.json({ users: allUsers });
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // Break types routes
  app.get("/api/break-types", async (_req: Request, res: Response) => {
    try {
      const breakTypes = await storage.getBreakTypes();
      res.json({ breakTypes });
    } catch (error) {
      res.status(500).json({ error: "Failed to get break types" });
    }
  });
  
  app.get("/api/break-types/availability", async (req: Request, res: Response) => {
    try {
      const breakTypes = await storage.getBreakTypes();
      const availability = [];
      
      for (const breakType of breakTypes) {
        const isAvailable = await storage.isBreakTypeAvailable(breakType.code);
        const currentCount = await storage.getActiveBreakCountByType(breakType.code);
        const limit = await storage.getBreakTypeLimit(breakType.code);
        
        availability.push({
          breakTypeId: breakType.id,
          code: breakType.code,
          name: breakType.name,
          isAvailable,
          currentCount,
          limit: limit === Number.MAX_SAFE_INTEGER ? "unlimited" : limit
        });
      }
      
      res.json({ availability });
    } catch (error) {
      res.status(500).json({ error: "Failed to get break type availability" });
    }
  });
  
  // Breaks routes
  app.post("/api/breaks/start", async (req: Request, res: Response) => {
    try {
      const { userId, breakTypeCode } = req.body;
      
      if (!userId || !breakTypeCode) {
        return res.status(400).json({ error: "userId and breakTypeCode are required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if break type exists
      const breakType = await storage.getBreakTypeByCode(breakTypeCode);
      if (!breakType) {
        return res.status(404).json({ error: "Break type not found" });
      }
      
      // Check if user already has an active break
      const activeBreak = await storage.getActiveBreak(userId);
      if (activeBreak) {
        return res.status(400).json({ 
          error: "User already has an active break",
          activeBreak
        });
      }
      
      // Check if break type is available (within capacity limits)
      const isAvailable = await storage.isBreakTypeAvailable(breakTypeCode);
      if (!isAvailable) {
        const currentCount = await storage.getActiveBreakCountByType(breakTypeCode);
        const limit = await storage.getBreakTypeLimit(breakTypeCode);
        return res.status(400).json({ 
          error: `Break type limit reached. Current: ${currentCount}, Limit: ${limit}`,
          currentCount,
          limit,
          breakTypeCode
        });
      }
      
      // Create a new break
      const newBreak = await storage.createBreak({
        userId,
        breakTypeId: breakType.id,
        startTime: new Date(),
        date: getTodayDate()
      });
      
      res.status(201).json({ break: newBreak, breakType });
    } catch (error) {
      res.status(500).json({ error: "Failed to start break" });
    }
  });
  
  app.post("/api/breaks/:id/end", async (req: Request, res: Response) => {
    try {
      const breakId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Get the active break
      const activeBreak = await storage.getActiveBreak(userId);
      const breakToEnd = activeBreak && activeBreak.id === breakId ? activeBreak : null;
      
      if (!breakToEnd) {
        return res.status(404).json({ error: "Break not found" });
      }
      
      if (!breakToEnd.active) {
        return res.status(400).json({ error: "Break is already ended" });
      }
      
      // Calculate duration in minutes
      const startTime = new Date(breakToEnd.startTime || new Date()); // Ensure we have a valid date
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / (1000 * 60));
      
      // Update the break
      const updatedBreak = await storage.updateBreak(breakId, {
        endTime,
        durationMinutes,
        active: false
      });
      
      // Get the break type
      const breakType = await storage.getBreakType(breakToEnd.breakTypeId);
      
      // Get updated summary
      const summary = await storage.getDailyBreaksSummary(userId, getTodayDate());
      
      res.json({ 
        break: updatedBreak, 
        breakType,
        summary
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to end break" });
    }
  });
  
  app.get("/api/breaks/active", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const activeBreak = await storage.getActiveBreak(userId);
      
      if (!activeBreak) {
        return res.json({ activeBreak: null });
      }
      
      // Get the break type
      const breakType = await storage.getBreakType(activeBreak.breakTypeId);
      
      res.json({ activeBreak, breakType });
    } catch (error) {
      res.status(500).json({ error: "Failed to get active break" });
    }
  });
  
  app.get("/api/breaks/history", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const date = (req.query.date as string) || getTodayDate();
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const breaks = await storage.getBreaksByUserAndDate(userId, date);
      
      // Get break types for all breaks
      const breakTypesMap = new Map();
      for (const breakEntry of breaks) {
        if (!breakTypesMap.has(breakEntry.breakTypeId)) {
          const breakType = await storage.getBreakType(breakEntry.breakTypeId);
          if (breakType) {
            breakTypesMap.set(breakEntry.breakTypeId, breakType);
          }
        }
      }
      
      // Add break type to each break
      const breaksWithType = breaks.map(breakEntry => ({
        ...breakEntry,
        breakType: breakTypesMap.get(breakEntry.breakTypeId)
      }));
      
      res.json({ breaks: breaksWithType });
    } catch (error) {
      res.status(500).json({ error: "Failed to get break history" });
    }
  });
  
  app.get("/api/breaks/summary", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const date = (req.query.date as string) || getTodayDate();
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const summary = await storage.getDailyBreaksSummary(userId, date);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: "Failed to get break summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}