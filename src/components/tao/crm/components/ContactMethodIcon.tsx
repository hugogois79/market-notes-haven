
import React from 'react';
import { Mail, MessageCircle, Phone } from "lucide-react";
import { TaoContactLog } from "@/services/taoValidatorService";

interface ContactMethodIconProps {
  method: TaoContactLog['method'];
  className?: string;
}

export const ContactMethodIcon: React.FC<ContactMethodIconProps> = ({ method, className = "h-4 w-4" }) => {
  switch (method) {
    case "Email":
      return <Mail className={className} />;
    case "Telegram":
      return <MessageCircle className={className} />;
    case "Call":
      return <Phone className={className} />;
    default:
      return <MessageCircle className={className} />;
  }
};
