import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Link } from "wouter";
import { ChartBar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import EmployeeInfo from "@/components/employee-info";
import ActiveBreakTimer from "@/components/active-break-timer";
import BreakSelection from "@/components/break-selection";
import DailySummary from "@/components/daily-summary";
import BreakHistory from "@/components/break-history";
import BreakAvailability from "@/components/break-availability";
import { BreakType, Break, User } from "@shared/schema";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  // Get userId from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const userIdParam = searchParams.get('userId');
  const [selectedUserId, setSelectedUserId] = useState<number>(userIdParam ? parseInt(userIdParam) : 1);
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Interface for API responses
  interface BreakWithType extends Break {
    breakType?: {
      id: number;
      name: string;
      code: string;
      durationLimit: number;
      icon: string;
    };
  }

  interface UsersResponse { users: User[] }
  interface BreakTypesResponse { breakTypes: BreakType[] }
  interface ActiveBreakResponse { activeBreak: Break | null; breakType: BreakType | null }
  interface BreakHistoryResponse { breaks: BreakWithType[] }
  interface BreakSummaryResponse { summary: { totalUsed: number; totalRemaining: number; totalExceeded: number; breakTypeUsage: any[] } }
  
  // Fetch all users for the employee selector
  const { data: usersData } = useQuery<UsersResponse>({
    queryKey: ['/api/users'],
  });

  // Fetch break types
  const { data: breakTypesData } = useQuery<BreakTypesResponse>({
    queryKey: ['/api/break-types'],
  });

  // Fetch active break if any
  const { 
    data: activeBreakData, 
    refetch: refetchActiveBreak
  } = useQuery<ActiveBreakResponse>({
    queryKey: [`/api/breaks/active?userId=${selectedUserId}`],
    refetchInterval: 1000, // Refetch every second to update timer
  });

  // Fetch break history
  const { 
    data: breakHistoryData,
    refetch: refetchBreakHistory
  } = useQuery<BreakHistoryResponse>({
    queryKey: [`/api/breaks/history?userId=${selectedUserId}&date=${today}`],
  });

  // Fetch daily summary
  const { 
    data: summaryData,
    refetch: refetchSummary
  } = useQuery<BreakSummaryResponse>({
    queryKey: [`/api/breaks/summary?userId=${selectedUserId}&date=${today}`],
  });

  // Start break mutation
  const startBreakMutation = useMutation({
    mutationFn: (breakTypeCode: string) => {
      return apiRequest('POST', '/api/breaks/start', {
        userId: selectedUserId,
        breakTypeCode
      });
    },
    onSuccess: () => {
      // Refetch active break and summary
      refetchActiveBreak();
      refetchSummary();
    }
  });

  // Get toast for notifications
  const { toast } = useToast();

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: (breakId: number) => {
      return apiRequest('POST', `/api/breaks/${breakId}/end`, { userId: selectedUserId });
    },
    onSuccess: (data: any) => {
      // Refetch everything after ending a break
      refetchActiveBreak();
      refetchBreakHistory();
      refetchSummary();
      
      // Show toast with total break time
      if (data && data.break && data.break.durationMinutes) {
        const breakName = data.breakType?.name || 'Break';
        toast({
          title: `${breakName} Ended`,
          description: `You took a break for ${data.break.durationMinutes} minutes.`,
          variant: "default",
        });
      }
    }
  });

  // Handle starting a break
  const handleStartBreak = (breakTypeCode: string) => {
    startBreakMutation.mutate(breakTypeCode);
  };

  // Handle ending a break
  const handleEndBreak = (breakId: number) => {
    endBreakMutation.mutate(breakId);
  };

  // Process the fetched data
  const users: User[] = usersData?.users || [];
  const breakTypes: BreakType[] = breakTypesData?.breakTypes || [];
  const activeBreak = activeBreakData?.activeBreak || null;
  const activeBreakType = activeBreakData?.breakType || null;
  const breakHistory = breakHistoryData?.breaks || [];
  const summary = summaryData?.summary || {
    totalUsed: 0,
    totalRemaining: 70,
    totalExceeded: 0,
    breakTypeUsage: []
  };

  // Find the selected user
  const selectedUser = users.find(user => user.id === selectedUserId) || {
    id: selectedUserId,
    username: 'Employee',
    name: 'Unknown Employee'
  };

  // Handle employee change
  const handleEmployeeChange = (userId: string) => {
    setSelectedUserId(Number(userId));
  };

  // Effect to refetch data when user changes
  useEffect(() => {
    if (selectedUserId) {
      refetchActiveBreak();
      refetchBreakHistory();
      refetchSummary();
    }
  }, [selectedUserId, refetchActiveBreak, refetchBreakHistory, refetchSummary]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 text-center">Break Management System</h1>
        <p className="text-neutral-500 text-center mt-2">Track your daily break time allowance (70 minutes)</p>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {selectedUser && (
                <EmployeeInfo 
                  employeeId={`EMP${selectedUser.id.toString().padStart(5, '0')}`} 
                  name={selectedUser.name || selectedUser.username} 
                />
              )}
            </div>
            <div>
              <Link href={`/wellness-insights?userId=${selectedUserId}`}>
                <Button variant="outline" className="flex items-center">
                  <ChartBar className="mr-2 h-4 w-4" />
                  Wellness Insights
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveBreakTimer 
            activeBreak={activeBreak}
            breakType={activeBreakType}
            onEndBreak={handleEndBreak}
          />
          
          <BreakSelection 
            breakTypes={breakTypes}
            onStartBreak={handleStartBreak}
            isLoading={startBreakMutation.isPending}
            hasActiveBreak={!!activeBreak}
          />
        </div>
        
        <div>
          <DailySummary summary={summary} />
          <BreakAvailability />
          <BreakHistory breaks={breakHistory} />
        </div>
      </div>
    </div>
  );
}
