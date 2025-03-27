import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, ResponsiveContainer, Pie, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from "recharts";
import { getQueryFn } from "@/lib/queryClient";

// Defining types directly
interface Department {
  id: number;
  name: string;
  code: string;
}

interface BreakTypeStat {
  breakTypeId: number;
  breakTypeName: string;
  totalUsage: number;
  averageUsage: number;
}

interface DepartmentBreakStats {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  employeeCount: number;
  totalBreakMinutes: number;
  averageBreakMinutes: number;
  exceededCount: number;
  breakTypeStats: BreakTypeStat[];
}

// Interface for chart data
interface DepartmentChartData {
  name: string;
  id: number;
  code: string;
}

// Interface for departments API response
interface DepartmentsResponse {
  departments: Department[];
}

// Interface for department stats API response
interface DepartmentStatsResponse {
  stats: DepartmentBreakStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DepartmentsPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery<DepartmentsResponse>({
    queryKey: ['/api/departments'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const departments: Department[] = departmentsData?.departments || [];
  
  const { data: statsData, isLoading: isLoadingStats } = useQuery<DepartmentStatsResponse>({
    queryKey: ['/api/departments', selectedDepartment, 'stats'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!selectedDepartment,
  });
  
  const stats: DepartmentBreakStats | null = statsData?.stats || null;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Department Break Statistics</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Department Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Compare break usage across departments</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoadingDepartments ? (
                <div className="h-full flex items-center justify-center">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="h-full flex items-center justify-center">No departments found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departments.map(dept => ({
                      name: dept.name,
                      id: dept.id,
                      code: dept.code
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="id" 
                      name="Department ID" 
                      fill="#8884d8" 
                      onClick={(data: any) => setSelectedDepartment(data.id as number)}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {isLoadingDepartments ? (
              <div>Loading departments...</div>
            ) : (
              departments.map(dept => (
                <Card 
                  key={dept.id}
                  className={`cursor-pointer ${selectedDepartment === dept.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedDepartment(dept.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle>{dept.name}</CardTitle>
                    <CardDescription>Code: {dept.code}</CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
          
          {selectedDepartment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Break Time Distribution</CardTitle>
                  <CardDescription>
                    {isLoadingStats ? 'Loading...' : stats?.departmentName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingStats ? (
                    <div className="h-full flex items-center justify-center">Loading statistics...</div>
                  ) : !stats ? (
                    <div className="h-full flex items-center justify-center">No statistics available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.breakTypeStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalUsage"
                          nameKey="breakTypeName"
                          label={({ breakTypeName, percent }: { breakTypeName: string, percent: number }) => 
                            `${breakTypeName}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {stats.breakTypeStats.map((entry: BreakTypeStat, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Department Summary</CardTitle>
                  <CardDescription>
                    {isLoadingStats ? 'Loading...' : stats?.departmentName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="h-full flex items-center justify-center">Loading statistics...</div>
                  ) : !stats ? (
                    <div className="h-full flex items-center justify-center">No statistics available</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Employees</p>
                          <p className="text-2xl font-bold">{stats.employeeCount}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Average Break Time</p>
                          <p className="text-2xl font-bold">{stats.averageBreakMinutes.toFixed(1)} mins</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Total Break Time</p>
                          <p className="text-2xl font-bold">{stats.totalBreakMinutes} mins</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Exceeded Limit</p>
                          <p className="text-2xl font-bold">{stats.exceededCount} employees</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}