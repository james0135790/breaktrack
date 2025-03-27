import { format } from "date-fns";

interface EmployeeInfoProps {
  employeeId: string;
  name: string;
}

export default function EmployeeInfo({ employeeId, name }: EmployeeInfoProps) {
  const today = format(new Date(), 'MMMM d, yyyy');
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ID:</span>
          <span className="font-medium">{employeeId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Name:</span>
          <span className="font-medium">{name}</span>
        </div>
      </div>
      <div>
        <div className="text-sm text-muted-foreground">Today</div>
        <div className="font-medium">{today}</div>
      </div>
    </div>
  );
}
