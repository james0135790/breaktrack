import { format } from "date-fns";
import { Break } from "@shared/schema";

interface BreakWithType extends Break {
  breakType?: {
    id: number;
    name: string;
    code: string;
    durationLimit: number;
    icon: string;
  };
}

interface BreakHistoryProps {
  breaks: BreakWithType[];
}

export default function BreakHistory({ breaks }: BreakHistoryProps) {
  // Format time from date string (HH:MM)
  const formatTime = (dateStr: string | Date | null) => {
    if (!dateStr) return '--:--';
    try {
      return format(new Date(dateStr), 'HH:mm');
    } catch (e) {
      return '--:--';
    }
  };
  
  // Filter out active breaks and sort by start time (newest first)
  const completedBreaks = breaks
    .filter(breakItem => !breakItem.active && breakItem.endTime)
    .sort((a, b) => {
      const bTime = b.startTime ? new Date(b.startTime.toString()).getTime() : 0;
      const aTime = a.startTime ? new Date(a.startTime.toString()).getTime() : 0;
      return bTime - aTime;
    });
  
  // Get the appropriate icon for a break type
  const getBreakIcon = (breakTypeId: number) => {
    // Map break type IDs to standard icons (in a real app, we'd fetch the break type details)
    const iconMap: Record<number, string> = {
      1: "local_cafe", // Tea Break
      2: "restaurant", // Dinner Break
      3: "wc",         // Bio Break
      4: "schedule"    // Other Break
    };
    
    return iconMap[breakTypeId] || "schedule";
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Today's Break History</h2>
      
      {completedBreaks.length > 0 ? (
        <div className="overflow-y-auto max-h-64">
          <table className="min-w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left py-2 px-3 text-xs text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="text-left py-2 px-3 text-xs text-neutral-500 uppercase tracking-wider">Time</th>
                <th className="text-right py-2 px-3 text-xs text-neutral-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {completedBreaks.map((breakItem) => (
                <tr key={breakItem.id}>
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <span className="material-icons text-primary text-sm mr-2">
                        {getBreakIcon(breakItem.breakTypeId)}
                      </span>
                      <span className="text-sm">
                        {breakItem.breakType?.name || 
                         (breakItem.breakTypeId === 1 ? 'Tea Break' : 
                          breakItem.breakTypeId === 2 ? 'Dinner Break' : 
                          breakItem.breakTypeId === 3 ? 'Bio Break' : 
                          'Other Break')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-neutral-500">
                    {formatTime(breakItem.startTime)} - {formatTime(breakItem.endTime || '')}
                  </td>
                  <td className="py-3 px-3 text-sm text-right font-medium">
                    {breakItem.durationMinutes} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 text-sm text-neutral-500 text-center">
          No break history for today
        </div>
      )}
    </div>
  );
}
