
import React from "react";
import { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TradeInputFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  allowDecimals?: boolean;
}

export const TradeInputField = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  icon: Icon,
  allowDecimals = false,
}: TradeInputFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Handle numeric inputs with optional decimal support
    if (allowDecimals) {
      // Allow empty string, digits, decimal point, and negative sign at the start
      if (newValue === "" || /^-?\d*\.?\d*$/.test(newValue)) {
        onChange(newValue);
      }
    } else {
      // Only allow integers
      if (newValue === "" || /^-?\d*$/.test(newValue)) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="flex items-center gap-1">
        {Icon && <Icon size={14} className="text-muted-foreground" />}
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className="text-sm"
      />
    </div>
  );
};
