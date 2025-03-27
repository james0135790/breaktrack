import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO, isAfter } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ArrowUpRight, Battery, Clock, Brain, Coffee, Heart, Target, Zap, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Break, BreakType } from "@shared/schema";

// Types
interface BreakWithType extends Break {
  breakType: BreakType;
}

interface BreakHistoryResponse {
  breaks: BreakWithType[];
}

interface BreakSummary {
  totalUsed: number;
  totalRemaining: number;
  totalExceeded: number;
  breakTypeUsage: BreakTypeUsage[];
}

interface BreakTypeUsage {
  breakTypeId: number;
  code: string;
  name: string;
  durationUsed: number;
  durationLimit: number;
  icon: string;
}

interface BreakSummaryResponse {
  summary: BreakSummary;
}

interface WellnessInsight {
  title: string;
  description: string;
  score: number; // 0-100
  icon: React.ReactNode;
  color: string;
  recommendations: string[];
}

// Helper function to get an array of dates for the past week
const getPastWeekDates = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return dates;
};

export default function WellnessInsights() {
  // Get userId from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const userIdParam = searchParams.get('userId');
  const userId = userIdParam ? parseInt(userIdParam) : 1;
  
  const [pastWeekData, setPastWeekData] = useState<any[]>([]);
  const [breakDistribution, setBreakDistribution] = useState<any[]>([]);
  const [timeOfDayData, setTimeOfDayData] = useState<any[]>([]);
  const [insights, setInsights] = useState<WellnessInsight[]>([]);
  
  // Get past week dates
  const pastWeekDates = getPastWeekDates();
  
  // Fetch break history for the current day
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayBreakHistoryData } = useQuery<BreakHistoryResponse>({
    queryKey: [`/api/breaks/history?userId=${userId}&date=${today}`],
  });
  
  // Fetch break summary for the current day
  const { data: todaySummaryData } = useQuery<BreakSummaryResponse>({
    queryKey: [`/api/breaks/summary?userId=${userId}&date=${today}`],
  });
  
  // Fetch break history data for the past week
  const fetchPastWeekData = async () => {
    const weeklyData: any[] = [];
    const typeDistribution: Record<string, number> = {};
    const hourlyDistribution: Record<string, number> = {};
    
    // Initialize hours (8AM to 5PM)
    for (let hour = 8; hour <= 17; hour++) {
      const hourLabel = hour < 12 
        ? `${hour}AM` 
        : hour === 12 
          ? '12PM' 
          : `${hour - 12}PM`;
      hourlyDistribution[hourLabel] = 0;
    }
    
    // Fetch data for each date in past week
    for (const date of pastWeekDates) {
      try {
        const response = await fetch(`/api/breaks/history?userId=${userId}&date=${date}`);
        const data = await response.json();
        const breaks = data.breaks || [];
        
        const summaryResponse = await fetch(`/api/breaks/summary?userId=${userId}&date=${date}`);
        const summaryData = await summaryResponse.json();
        const summary = summaryData.summary || { totalUsed: 0, totalRemaining: 70, totalExceeded: 0 };
        
        // Add to weekly data
        weeklyData.push({
          date: format(parseISO(date), 'MMM dd'),
          totalBreakTime: summary.totalUsed,
          exceededTime: summary.totalExceeded,
        });
        
        // Process break type distribution
        for (const breakEntry of breaks) {
          const typeName = breakEntry.breakType?.name || 'Unknown';
          typeDistribution[typeName] = (typeDistribution[typeName] || 0) + breakEntry.durationMinutes;
          
          // Process time of day
          if (breakEntry.startTime) {
            const startTime = new Date(breakEntry.startTime);
            const hour = startTime.getHours();
            if (hour >= 8 && hour <= 17) {
              const hourLabel = hour < 12 
                ? `${hour}AM` 
                : hour === 12 
                  ? '12PM' 
                  : `${hour - 12}PM`;
              hourlyDistribution[hourLabel] = (hourlyDistribution[hourLabel] || 0) + 1;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching data for ${date}:`, error);
      }
    }
    
    // Convert type distribution to array
    const typeData = Object.entries(typeDistribution).map(([name, value]) => ({
      name,
      value,
    }));
    
    // Convert hourly distribution to array
    const hourlyData = Object.entries(hourlyDistribution).map(([hour, count]) => ({
      hour,
      count,
    }));
    
    setPastWeekData(weeklyData);
    setBreakDistribution(typeData);
    setTimeOfDayData(hourlyData);
    
    // Generate insights based on the data
    generateInsights(weeklyData, typeData, hourlyData, todayBreakHistoryData?.breaks || []);
  };
  
  // Generate personalized insights
  const generateInsights = (
    weeklyData: any[],
    typeData: any[],
    hourlyData: any[],
    todayBreaks: BreakWithType[]
  ) => {
    const newInsights: WellnessInsight[] = [];
    
    // Insight 1: Break Consistency
    const breakConsistency = weeklyData.every(day => day.totalBreakTime > 0) ? 100 :
      (weeklyData.filter(day => day.totalBreakTime > 0).length / weeklyData.length) * 100;
    
    newInsights.push({
      title: "Break Consistency",
      description: `You've taken breaks on ${Math.round(breakConsistency)}% of workdays in the past week.`,
      score: breakConsistency,
      icon: <Clock className="h-8 w-8" />,
      color: breakConsistency >= 80 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800",
      recommendations: breakConsistency < 80 ? [
        "Try to take at least one break every workday",
        "Set reminders to ensure you don't skip breaks",
        "Schedule breaks in your calendar"
      ] : [
        "Keep maintaining your consistent break schedule",
        "Consider optimizing break timing based on your energy levels"
      ]
    });
    
    // Insight 2: Break Variety
    const breakVariety = Math.min(100, (typeData.length / 4) * 100);
    newInsights.push({
      title: "Break Variety",
      description: `You utilize ${typeData.length} different types of breaks in your schedule.`,
      score: breakVariety,
      icon: <Coffee className="h-8 w-8" />,
      color: breakVariety >= 50 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800",
      recommendations: breakVariety < 75 ? [
        "Try to mix different break types throughout your day",
        "Alternate between physical and mental break activities",
        "Consider adding short mindfulness breaks"
      ] : [
        "Your diverse break pattern is excellent for overall wellbeing",
        "Continue balancing different break types"
      ]
    });
    
    // Insight 3: Energy Management
    const exceededTimes = weeklyData.filter(day => day.exceededTime > 0).length;
    const energyScore = 100 - ((exceededTimes / weeklyData.length) * 100);
    
    newInsights.push({
      title: "Energy Management",
      description: `You've exceeded break time limits ${exceededTimes} days in the past week.`,
      score: energyScore,
      icon: <Battery className="h-8 w-8" />,
      color: energyScore >= 70 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800",
      recommendations: energyScore < 70 ? [
        "Try setting a timer when taking longer breaks",
        "Plan your break activities in advance",
        "Balance longer breaks with shorter ones"
      ] : [
        "You're managing your break time well",
        "Consider scheduling your most important tasks right after breaks"
      ]
    });
    
    // Insight 4: Mental Refresh
    const bioAndTeaTimes = typeData.filter(type => 
      type.name.toLowerCase().includes('tea') || type.name.toLowerCase().includes('bio')
    ).reduce((sum, type) => sum + type.value, 0);
    const totalBreakTime = typeData.reduce((sum, type) => sum + type.value, 0);
    const mentalRefreshScore = Math.min(100, (bioAndTeaTimes / (totalBreakTime || 1)) * 150);
    
    newInsights.push({
      title: "Mental Refresh Index",
      description: `Your short breaks make up ${Math.round((bioAndTeaTimes / (totalBreakTime || 1)) * 100)}% of your total break time.`,
      score: mentalRefreshScore,
      icon: <Brain className="h-8 w-8" />,
      color: mentalRefreshScore >= 60 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800",
      recommendations: mentalRefreshScore < 60 ? [
        "Try incorporating more short, frequent breaks",
        "Practice a 2-minute mindfulness exercise between tasks",
        "Take a quick walk around your workspace every hour"
      ] : [
        "Your short break pattern helps maintain mental clarity",
        "Continue the excellent practice of mental refresh breaks"
      ]
    });
    
    // Insight 5: Wellbeing Score (combination of all other scores)
    const wellbeingScore = Math.round(
      (breakConsistency + breakVariety + energyScore + mentalRefreshScore) / 4
    );
    
    newInsights.push({
      title: "Overall Wellbeing Score",
      description: `Your combined break patterns result in a wellbeing score of ${wellbeingScore}%.`,
      score: wellbeingScore,
      icon: <Heart className="h-8 w-8" />,
      color: wellbeingScore >= 75 ? "bg-green-100 text-green-800" : 
             wellbeingScore >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800",
      recommendations: wellbeingScore < 75 ? [
        "Review the recommendations in other insight categories",
        "Focus on improving your lowest-scoring areas first",
        "Consider tracking your energy levels throughout the day"
      ] : [
        "Your break habits are supporting your overall wellbeing",
        "Keep monitoring your patterns to maintain this excellent score"
      ]
    });
    
    setInsights(newInsights);
  };
  
  useEffect(() => {
    fetchPastWeekData();
  }, [userId, todayBreakHistoryData]);
  
  // Get today summary or default values
  const todaySummary = todaySummaryData?.summary || {
    totalUsed: 0,
    totalRemaining: 70,
    totalExceeded: 0,
    breakTypeUsage: []
  };
  
  // Format daily usage for today
  const todayBreakUsage = todaySummary.breakTypeUsage.map(usage => ({
    name: usage.name,
    used: usage.durationUsed,
    limit: usage.durationLimit,
    fill: usage.durationUsed > usage.durationLimit ? '#ef4444' : '#3b82f6'
  }));
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/dashboard?userId=${userId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 text-center">
          Wellness Insights Dashboard
        </h1>
        <p className="text-neutral-500 text-center mt-2">
          Personalized analytics to help optimize your break patterns
        </p>
      </header>
      
      {/* Main Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {insights.map((insight, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className={`pb-2 ${insight.color}`}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  {insight.icon}
                  <span className="ml-2">{insight.title}</span>
                </CardTitle>
                <Badge variant="outline" className="font-mono bg-white bg-opacity-80">
                  {Math.round(insight.score)}%
                </Badge>
              </div>
              <CardDescription className="text-sm font-medium mt-1">
                {insight.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Progress 
                value={insight.score} 
                className="h-2 mb-4" 
              />
              <div className="space-y-2">
                {insight.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start">
                    <div className="shrink-0 mt-0.5">
                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600 ml-2">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Data Visualization */}
      <Tabs defaultValue="weekly" className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
          <TabsTrigger value="weekly">Weekly Analysis</TabsTrigger>
          <TabsTrigger value="breakdown">Break Types</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Break Pattern</CardTitle>
              <CardDescription>
                Your total break minutes used over the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={pastWeekData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalBreakTime" 
                      name="Break Minutes" 
                      stroke="#3b82f6" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="exceededTime" 
                      name="Exceeded Minutes" 
                      stroke="#ef4444" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" disabled className="text-sm">
                <Target className="h-4 w-4 mr-2" />
                Target: 70 minutes per day
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="breakdown" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Break Type Distribution</CardTitle>
              <CardDescription>
                How your break time is distributed across different types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} minutes`, 'Duration']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <div className="grid grid-cols-2 gap-2 w-full">
                {breakDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-600">{entry.name}: {entry.value}min</span>
                  </div>
                ))}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="timing" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Break Timing Patterns</CardTitle>
              <CardDescription>
                When you typically take breaks during the workday
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeOfDayData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Number of Breaks" 
                      fill="#8884d8" 
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button variant="outline" size="sm" className="text-sm">
                <Zap className="h-4 w-4 mr-2" />
                Morning Productivity: {
                  timeOfDayData
                    .filter(d => d.hour.includes('AM') || d.hour === '12PM')
                    .reduce((sum, d) => sum + d.count, 0) > 
                  timeOfDayData
                    .filter(d => d.hour.includes('PM') && d.hour !== '12PM')
                    .reduce((sum, d) => sum + d.count, 0) ?
                  'High' : 'Normal'
                }
              </Button>
              <Button variant="outline" size="sm" className="text-sm">
                <Battery className="h-4 w-4 mr-2" />
                Peak Break Hour: {
                  timeOfDayData.reduce((max, d) => 
                    d.count > (max.count || 0) ? d : max, {}).hour || 'N/A'
                }
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Today's Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today's Break Utilization</CardTitle>
          <CardDescription>
            How you've used your break allowance today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Total Used: {todaySummary.totalUsed} minutes
              </span>
              <span className="text-sm font-medium">
                {todaySummary.totalRemaining > 0 
                  ? `Remaining: ${todaySummary.totalRemaining} minutes` 
                  : `Exceeded: ${todaySummary.totalExceeded} minutes`}
              </span>
            </div>
            <Progress 
              value={Math.min(100, (todaySummary.totalUsed / 70) * 100)} 
              className="h-2.5" 
            />
          </div>
          
          <div className="h-60 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={todayBreakUsage}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip 
                  formatter={(value, name) => [`${value} minutes`, name === 'used' ? 'Used' : 'Limit']}
                />
                <Legend />
                <Bar dataKey="used" name="Minutes Used" fill="#3b82f6" />
                <Bar dataKey="limit" name="Allowance" fill="#d1d5db" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}