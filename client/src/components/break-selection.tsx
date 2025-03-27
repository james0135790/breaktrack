import { Button } from "@/components/ui/button";
import { BreakType } from "@shared/schema";

interface BreakSelectionProps {
  breakTypes: BreakType[];
  onStartBreak: (breakTypeCode: string) => void;
  isLoading: boolean;
  hasActiveBreak: boolean;
}

export default function BreakSelection({ 
  breakTypes, 
  onStartBreak, 
  isLoading,
  hasActiveBreak
}: BreakSelectionProps) {
  // The material icons that match the break type icons
  const iconMap: Record<string, string> = {
    local_cafe: "local_cafe",
    restaurant: "restaurant",
    wc: "wc"
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Break Types</h2>
      <p className="text-sm text-neutral-500 mb-4">Select a break type to start tracking your time</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakTypes.map((breakType) => (
          <div key={breakType.id} className="break-button-container">
            <button 
              className="break-button w-full text-left p-4 rounded-lg border border-neutral-200 hover:border-primary hover:shadow-md flex items-center justify-between"
              onClick={() => onStartBreak(breakType.code)}
              disabled={isLoading || hasActiveBreak}
            >
              <div className="flex items-center">
                <span className="material-icons text-primary mr-3">
                  {iconMap[breakType.icon] || "schedule"}
                </span>
                <div>
                  <div className="font-medium">{breakType.name}</div>
                  <div className="text-sm text-neutral-500">{breakType.durationMinutes} minutes</div>
                </div>
              </div>
              <span className="material-icons text-neutral-200">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
