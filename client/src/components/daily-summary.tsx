import { Progress } from "@/components/ui/progress";
import { DailyBreaksSummary } from "@shared/schema";

interface DailySummaryProps {
  summary: DailyBreaksSummary;
}

export default function DailySummary({ summary }: DailySummaryProps) {
  const totalAllowed = 70; // Fixed total break time allowed per day
  const progressPercentage = Math.min((summary.totalUsed / totalAllowed) * 100, 100);
  
  // Map of material icons for break types
  const iconMap: Record<string, string> = {
    local_cafe: "local_cafe",
    restaurant: "restaurant",
    wc: "wc"
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Daily Summary</h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-neutral-500">Total Break Time Allowed</span>
          <span className="font-medium">70 min</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-neutral-500">Used Time</span>
          <span className="font-medium">{summary.totalUsed} min</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-neutral-500">Remaining Time</span>
          <span className="font-medium">{summary.totalRemaining} min</span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="w-full bg-neutral-200 h-2.5" 
        />
      </div>
      
      {summary.totalExceeded > 0 && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-md mb-6">
          <div className="flex items-center text-red-500">
            <span className="material-icons mr-2">warning</span>
            <span className="font-medium">Exceeded Break Time</span>
          </div>
          <div className="mt-1 text-sm text-red-500">
            You have exceeded your daily break time by {summary.totalExceeded} minutes
          </div>
        </div>
      )}
      
      <h3 className="font-medium text-neutral-900 mb-3">Break Usage</h3>
      <ul className="space-y-3">
        {summary.breakTypeUsage.map((usage) => (
          <li key={usage.breakTypeId} className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="material-icons text-primary text-sm mr-2">
                {iconMap[usage.icon] || "schedule"}
              </span>
              <span className="text-sm">{usage.name}</span>
            </div>
            <span className="text-sm font-medium">
              {usage.durationUsed} min / {usage.durationLimit} min
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
