
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { handleNumericInput } from "../utils/tradeFormUtils";
import { LucideIcon } from "lucide-react";

interface TradeInputFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  readOnly?: boolean;
  className?: string;
}

export const TradeInputField = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  icon: Icon,
  readOnly = false,
  className = ""
}: TradeInputFieldProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="flex items-center gap-1">
        {Icon && <Icon size={14} className={readOnly ? "text-muted-foreground" : ""} />}
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => readOnly ? null : handleNumericInput(e.target.value, onChange)}
        inputMode="decimal"
        className={`font-mono ${className}`}
        readOnly={readOnly}
      />
    </div>
  );
};
