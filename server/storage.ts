import { 
  Department, InsertDepartment,
  User, InsertUser,
  BreakType, InsertBreakType,
  Break, InsertBreak, UpdateBreak,
  DailyBreaksSummary, DepartmentBreakStats
} from "@shared/schema";

// Storage interface 
export interface IStorage {
  // Department Operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByCode(code: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByDepartment(departmentId: number): Promise<User[]>;
  
  // Break Type Operations
  getBreakTypes(): Promise<BreakType[]>;
  getBreakType(id: number): Promise<BreakType | undefined>;
  getBreakTypeByCode(code: string): Promise<BreakType | undefined>;
  createBreakType(breakType: InsertBreakType): Promise<BreakType>;
  
  // Break Operations
  createBreak(breakData: InsertBreak): Promise<Break>;
  updateBreak(id: number, breakData: UpdateBreak): Promise<Break | undefined>;
  getActiveBreak(userId: number): Promise<Break | undefined>;
  getBreaksByUserAndDate(userId: number, date: string): Promise<Break[]>;
  getBreaksByDepartmentAndDate(departmentId: number, date: string): Promise<Break[]>;
  
  // Break Availability Operations
  getActiveBreakCountByType(breakTypeCode: string): Promise<number>;
  isBreakTypeAvailable(breakTypeCode: string): Promise<boolean>;
  getBreakTypeLimit(breakTypeCode: string): Promise<number>;
  
  // Summary Operations
  getDailyBreaksSummary(userId: number, date: string): Promise<DailyBreaksSummary>;
  getDepartmentBreakStats(departmentId: number, date: string): Promise<DepartmentBreakStats>;
}

// Constants
const TOTAL_DAILY_BREAK_MINUTES = 70;

// In-memory storage implementation
export class MemStorage implements IStorage {
  private departments: Map<number, Department>;
  private users: Map<number, User>;
  private breakTypes: Map<number, BreakType>;
  private breaks: Map<number, Break>;
  
  // These maps store the limits for break types and other configurations
  private breakTypeLimits: Map<string, number>;
  
  // Counters for generating IDs
  private departmentIdCounter: number;
  private userIdCounter: number;
  private breakTypeIdCounter: number;
  private breakIdCounter: number;
  
  constructor() {
    this.departments = new Map();
    this.users = new Map();
    this.breakTypes = new Map();
    this.breaks = new Map();
    this.breakTypeLimits = new Map();
    
    this.departmentIdCounter = 1;
    this.userIdCounter = 1;
    this.breakTypeIdCounter = 1;
    this.breakIdCounter = 1;
    
    // Initialize with default data
    this.initDefaultDepartments();
    this.initDefaultBreakTypes();
  }
  
  // Initialize default departments
  private initDefaultDepartments() {
    const defaultDepartments: InsertDepartment[] = [
      { name: "Engineering", code: "ENG" },
      { name: "Human Resources", code: "HR" },
      { name: "Marketing", code: "MKT" },
      { name: "Sales", code: "SLS" },
      { name: "Customer Support", code: "CS" }
    ];
    
    // Create default departments
    for (const dept of defaultDepartments) {
      this.createDepartment(dept);
    }
    
    // Create a default user in the Engineering department
    const defaultUser: InsertUser = {
      username: "jsmith",
      password: "password123",
      name: "John Smith",
      departmentId: 1 // Engineering
    };
    this.createUser(defaultUser);
  }
  
  // Initialize default break types
  private initDefaultBreakTypes() {
    const defaultBreakTypes: InsertBreakType[] = [
      { 
        code: "tea1", 
        name: "Tea Break 1", 
        description: "Morning tea break",
        icon: "coffee",
        maxConcurrent: 3,
        durationLimit: 15
      },
      { 
        code: "tea2", 
        name: "Tea Break 2", 
        description: "Afternoon tea break",
        icon: "coffee",
        maxConcurrent: 3,
        durationLimit: 15
      },
      { 
        code: "dinner", 
        name: "Dinner Break", 
        description: "Lunch/Dinner break",
        icon: "utensils",
        maxConcurrent: 5,
        durationLimit: 30
      },
      { 
        code: "bio", 
        name: "Bio Break", 
        description: "Brief personal break",
        icon: "user",
        maxConcurrent: Number.MAX_SAFE_INTEGER,
        durationLimit: 10
      }
    ];
    
    // Create default break types
    for (const breakType of defaultBreakTypes) {
      this.createBreakType(breakType);
      
      // Store the concurrent limits
      if (breakType.maxConcurrent !== undefined && breakType.maxConcurrent !== null) {
        this.breakTypeLimits.set(breakType.code, breakType.maxConcurrent);
      }
    }
  }
  
  // Department operations
  
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }
  
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }
  
  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(d => d.code === code);
  }
  
  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }
  
  // User operations
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  
  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.departmentId === departmentId);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      departmentId: insertUser.departmentId || null,
      name: insertUser.name || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Break type operations
  
  async getBreakTypes(): Promise<BreakType[]> {
    return Array.from(this.breakTypes.values());
  }
  
  async getBreakType(id: number): Promise<BreakType | undefined> {
    return this.breakTypes.get(id);
  }
  
  async getBreakTypeByCode(code: string): Promise<BreakType | undefined> {
    return Array.from(this.breakTypes.values()).find(bt => bt.code === code);
  }
  
  async createBreakType(insertBreakType: InsertBreakType): Promise<BreakType> {
    const id = this.breakTypeIdCounter++;
    
    // Create a fully typed BreakType with all optional fields set to null if not present
    const breakType: BreakType = { 
      ...insertBreakType, 
      id,
      description: insertBreakType.description || null,
      icon: insertBreakType.icon || null,
      maxConcurrent: insertBreakType.maxConcurrent || null,
      durationLimit: insertBreakType.durationLimit || null
    };
    
    this.breakTypes.set(id, breakType);
    
    // Store the concurrent limit if provided
    if (insertBreakType.maxConcurrent !== undefined && insertBreakType.maxConcurrent !== null) {
      this.breakTypeLimits.set(insertBreakType.code, insertBreakType.maxConcurrent);
    }
    
    return breakType;
  }
  
  // Break operations
  
  async createBreak(breakData: InsertBreak): Promise<Break> {
    const id = this.breakIdCounter++;
    
    const newBreak: Break = { 
      ...breakData, 
      id, 
      startTime: breakData.startTime || null,
      active: true,
      endTime: null,
      durationMinutes: null
    };
    
    this.breaks.set(id, newBreak);
    return newBreak;
  }
  
  async updateBreak(id: number, breakData: UpdateBreak): Promise<Break | undefined> {
    const existingBreak = this.breaks.get(id);
    if (!existingBreak) {
      return undefined;
    }
    
    const updatedBreak: Break = { ...existingBreak, ...breakData };
    this.breaks.set(id, updatedBreak);
    return updatedBreak;
  }
  
  async getActiveBreak(userId: number): Promise<Break | undefined> {
    return Array.from(this.breaks.values()).find(b => b.userId === userId && b.active);
  }
  
  async getBreaksByUserAndDate(userId: number, date: string): Promise<Break[]> {
    return Array.from(this.breaks.values())
      .filter(b => b.userId === userId && b.date === date)
      .sort((a, b) => {
        const aDate = new Date(a.startTime || 0);
        const bDate = new Date(b.startTime || 0);
        return bDate.getTime() - aDate.getTime(); // Latest first
      });
  }
  
  async getBreaksByDepartmentAndDate(departmentId: number, date: string): Promise<Break[]> {
    // Get all users in the department
    const departmentUsers = await this.getUsersByDepartment(departmentId);
    const userIds = departmentUsers.map(u => u.id);
    
    // Get all breaks for these users on the given date
    return Array.from(this.breaks.values())
      .filter(b => userIds.includes(b.userId) && b.date === date)
      .sort((a, b) => {
        const aDate = new Date(a.startTime || 0);
        const bDate = new Date(b.startTime || 0);
        return bDate.getTime() - aDate.getTime(); // Latest first
      });
  }
  
  // Break availability operations
  
  async getActiveBreakCountByType(breakTypeCode: string): Promise<number> {
    const breakType = await this.getBreakTypeByCode(breakTypeCode);
    if (!breakType) {
      return 0;
    }
    
    return Array.from(this.breaks.values())
      .filter(b => b.breakTypeId === breakType.id && b.active)
      .length;
  }
  
  async getBreakTypeLimit(breakTypeCode: string): Promise<number> {
    return this.breakTypeLimits.get(breakTypeCode) || Number.MAX_SAFE_INTEGER;
  }
  
  async isBreakTypeAvailable(breakTypeCode: string): Promise<boolean> {
    const currentCount = await this.getActiveBreakCountByType(breakTypeCode);
    const limit = await this.getBreakTypeLimit(breakTypeCode);
    return currentCount < limit;
  }
  
  // Summary operations
  
  async getDailyBreaksSummary(userId: number, date: string): Promise<DailyBreaksSummary> {
    // Get all breaks for the user on the given date
    const userBreaks = await this.getBreaksByUserAndDate(userId, date);
    
    // Get all break types
    const allBreakTypes = await this.getBreakTypes();
    
    // Calculate total time used
    let totalUsed = 0;
    
    // Create break type usage stats
    const breakTypeUsage = allBreakTypes.map(bt => {
      // Get total duration for this break type
      const breaksOfType = userBreaks.filter(b => b.breakTypeId === bt.id);
      const durationUsed = breaksOfType.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
      
      // Add to total
      totalUsed += durationUsed;
      
      return {
        breakTypeId: bt.id,
        code: bt.code,
        name: bt.name,
        durationUsed,
        durationLimit: bt.durationLimit || 0,
        icon: bt.icon || ""
      };
    });
    
    // Calculate remaining and exceeded
    const totalRemaining = Math.max(0, TOTAL_DAILY_BREAK_MINUTES - totalUsed);
    const totalExceeded = Math.max(0, totalUsed - TOTAL_DAILY_BREAK_MINUTES);
    
    return {
      totalUsed,
      totalRemaining,
      totalExceeded,
      breakTypeUsage
    };
  }
  
  async getDepartmentBreakStats(departmentId: number, date: string): Promise<DepartmentBreakStats> {
    // Get all breaks for the department on the given date
    const departmentBreaks = await this.getBreaksByDepartmentAndDate(departmentId, date);
    
    // Get all users in the department
    const departmentUsers = await this.getUsersByDepartment(departmentId);
    
    // Get department details
    const department = await this.getDepartment(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }
    
    // Get all break types
    const allBreakTypes = await this.getBreakTypes();
    
    // Calculate total break minutes
    const totalBreakMinutes = departmentBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    
    // Calculate average break minutes per employee
    const employeeCount = departmentUsers.length;
    const averageBreakMinutes = employeeCount > 0 
      ? totalBreakMinutes / employeeCount 
      : 0;
    
    // Calculate exceeded count (employees who exceeded total daily limit)
    const exceededMap = new Map<number, number>();
    for (const breakEntry of departmentBreaks) {
      const userId = breakEntry.userId;
      exceededMap.set(userId, (exceededMap.get(userId) || 0) + (breakEntry.durationMinutes || 0));
    }
    
    const exceededCount = Array.from(exceededMap.values())
      .filter(total => total > TOTAL_DAILY_BREAK_MINUTES)
      .length;
    
    // Create break type stats
    const breakTypeStats = allBreakTypes.map(bt => {
      // Get all breaks of this type
      const breaksOfType = departmentBreaks.filter(b => b.breakTypeId === bt.id);
      
      // Calculate total usage
      const totalUsage = breaksOfType.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
      
      // Calculate average usage
      const averageUsage = employeeCount > 0 
        ? totalUsage / employeeCount
        : 0;
      
      return {
        breakTypeId: bt.id,
        breakTypeName: bt.name,
        totalUsage,
        averageUsage
      };
    });
    
    return {
      departmentId,
      departmentName: department.name,
      departmentCode: department.code,
      employeeCount,
      totalBreakMinutes,
      averageBreakMinutes,
      exceededCount,
      breakTypeStats
    };
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();