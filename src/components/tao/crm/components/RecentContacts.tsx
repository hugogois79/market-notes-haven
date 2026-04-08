
import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaoContactLog, TaoValidator } from "@/services/taoValidatorService";
import { ContactMethodIcon } from './ContactMethodIcon';

interface RecentContactsProps {
  contacts: TaoContactLog[];
  validator: TaoValidator;
  onAddContact: (validator: TaoValidator) => void;
}

export const RecentContacts: React.FC<RecentContactsProps> = ({
  contacts,
  validator,
  onAddContact,
}) => {
  if (contacts.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => onAddContact(validator)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add first contact
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map(contact => (
        <div key={contact.id} className="flex items-start">
          <div className="flex-shrink-0 mr-2 mt-0.5">
            <ContactMethodIcon method={contact.method} />
          </div>
          <div className="text-sm">
            <div className="font-medium">{format(new Date(contact.contact_date), "MMM d, yyyy")}</div>
            <div className="text-muted-foreground line-clamp-1">
              {contact.summary || "No summary"}
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-6 mt-1"
        onClick={() => onAddContact(validator)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add contact
      </Button>
    </div>
  );
};
