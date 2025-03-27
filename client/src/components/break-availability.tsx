import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Coffee, Utensils, Clock } from "lucide-react";

interface BreakTypeAvailability {
  breakTypeId: number;
  code: string;
  name: string;
  isAvailable: boolean;
  currentCount: number;
  limit: number | "unlimited";
}

interface BreakAvailabilityResponse {
  availability: BreakTypeAvailability[];
}

// Function to get icon based on break type
const getBreakTypeIcon = (code: string) => {
  if (code.startsWith('tea')) return Coffee;
  if (code === 'dinner') return Utensils;
  return Clock;
};

export default function BreakAvailability() {
  // Fetch break type availability
  const { data } = useQuery<BreakAvailabilityResponse>({
    queryKey: ['/api/break-types/availability'],
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  if (!data) {
    return null;
  }

  const { availability } = data;

  return (
    <Card className="mb-4 overflow-hidden border-none shadow-md">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="text-lg flex items-center text-blue-700">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          Break Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {availability.map((item) => {
            // Skip bio breaks as they're unlimited
            if (item.code === 'bio') {
              return null;
            }
            
            const isTeaBreak = item.code.startsWith('tea');
            const isDinnerBreak = item.code === 'dinner';
            
            const limit = typeof item.limit === 'number' ? item.limit : Infinity;
            const percentage = limit ? (item.currentCount / limit) * 100 : 0;

            // Get the appropriate icon component
            const BreakIcon = getBreakTypeIcon(item.code);
            
            return (
              <div key={item.code} className="space-y-2 p-3 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-full mr-2 ${
                      isDinnerBreak ? 'bg-orange-50' : 'bg-blue-50'
                    }`}>
                      <BreakIcon className={`w-4 h-4 ${
                        isDinnerBreak ? 'text-orange-500' : 'text-blue-500'
                      }`} />
                    </div>
                    <span className="text-sm font-semibold">{item.name}</span>
                    {item.isAvailable ? (
                      <Badge className="ml-2 bg-green-100 text-green-700 border-none hover:bg-green-200">
                        Available
                      </Badge>
                    ) : (
                      <Badge className="ml-2 bg-red-100 text-red-700 border-none hover:bg-red-200">
                        Full
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-full">
                    {item.currentCount} / {item.limit === 'unlimited' ? '∞' : item.limit}
                  </span>
                </div>
                
                <div className={`h-2.5 w-full rounded-full ${percentage >= 100 ? 'bg-red-100' : 'bg-slate-100'} p-0.5`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ease-in-out ${
                      percentage >= 100 
                        ? 'bg-gradient-to-r from-red-400 to-red-600' 
                        : percentage > 75
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="text-xs">
                  {isTeaBreak && percentage >= 100 && (
                    <div className="flex items-center text-amber-600 mt-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>Only 3 employees can take tea breaks simultaneously</span>
                    </div>
                  )}
                  {isDinnerBreak && percentage >= 100 && (
                    <div className="flex items-center text-amber-600 mt-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>Only 5 employees can take dinner breaks simultaneously</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}