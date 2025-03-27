import { useState, useEffect } from "react";
import { differenceInSeconds } from "date-fns";
import { Button } from "@/components/ui/button";
import { BreakType, Break } from "@shared/schema";
import { formatTimeDisplay } from "@/lib/break-utils";

interface ActiveBreakTimerProps {
  activeBreak: Break | null;
  breakType: BreakType | null;
  onEndBreak: (breakId: number) => void;
}

export default function ActiveBreakTimer({ 
  activeBreak, 
  breakType, 
  onEndBreak 
}: ActiveBreakTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExceeded, setIsExceeded] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (activeBreak && breakType) {
      intervalId = setInterval(() => {
        // Check if startTime exists and convert it safely
        const startTime = activeBreak.startTime ? new Date(activeBreak.startTime) : new Date();
        const now = new Date();
        const elapsedSecs = differenceInSeconds(now, startTime);
        setElapsedSeconds(elapsedSecs);
        
        // Safely access durationMinutes with default fallback
        const durationLimit = (breakType.durationLimit || 15) * 60;
        const remaining = durationLimit - elapsedSecs;
        setRemainingSeconds(Math.abs(remaining));
        setIsExceeded(remaining < 0);
      }, 1000);
    } else {
      setRemainingSeconds(0);
      setIsExceeded(false);
      setElapsedSeconds(0);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeBreak, breakType]);

  // Calculate stroke dash offset for progress ring
  const calculateStrokeDashOffset = () => {
    if (!breakType) return 0;
    
    const totalSeconds = (breakType.durationLimit || 15) * 60;
    const progress = Math.min(elapsedSeconds / totalSeconds, 1);
    const circumference = 2 * Math.PI * 80;
    return circumference * (1 - progress);
  };

  // Format start time display
  const formatStartTime = (startTime: string | null) => {
    if (!startTime) return 'now';
    try {
      const date = new Date(startTime);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return 'now';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-6 timer-card ${
      activeBreak ? (isExceeded ? 'border-2 border-red-500' : 'border border-primary') : ''
    }`}>
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Active Break</h2>
      
      {!activeBreak ? (
        <div id="no-active-break" className="text-center py-8">
          <span className="material-icons text-neutral-200 text-5xl">coffee</span>
          <p className="text-neutral-500 mt-3">No active break</p>
          <p className="text-sm text-neutral-500 mt-1">Select a break type below to start</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-lg font-medium">{breakType?.name}</span>
              <span className="text-sm text-neutral-500 ml-2">({breakType?.durationLimit || 15} min)</span>
            </div>
            <div className="text-sm">
              Started at {formatStartTime(activeBreak.startTime ? activeBreak.startTime.toString() : null)}
            </div>
          </div>
          
          <div className="flex justify-center items-center mb-6">
            <div className="relative inline-block">
              <svg className="w-48 h-48">
                <circle 
                  cx="96" cy="96" r="80" 
                  fill="transparent"
                  stroke="#e0e0e0" 
                  strokeWidth="12">
                </circle>
                <circle 
                  className="progress-ring"
                  cx="96" cy="96" r="80" 
                  fill="transparent"
                  stroke={isExceeded ? "#f44336" : "#3f51b5"} 
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={calculateStrokeDashOffset()}
                  style={{ 
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%'
                  }}>
                </circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className={`text-4xl font-bold ${isExceeded ? 'text-red-500' : ''}`}>
                    {formatTimeDisplay(remainingSeconds)}
                  </span>
                  <span className="text-sm text-neutral-500">{isExceeded ? 'Overtime' : 'Remaining'}</span>
                </div>
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-xl font-medium">
                    {formatTimeDisplay(elapsedSeconds)}
                  </span>
                  <span className="text-xs text-neutral-500">Used Time</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="bg-primary hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full shadow-md flex items-center transition duration-200"
              onClick={() => onEndBreak(activeBreak.id)}
            >
              <span className="material-icons mr-2">stop_circle</span>
              End Break
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
