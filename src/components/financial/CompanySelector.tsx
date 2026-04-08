import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
  tax_id: string;
}

interface CompanySelectorProps {
  companies: Company[];
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
}

export default function CompanySelector({
  companies,
  selectedCompanyId,
  onCompanyChange,
}: CompanySelectorProps) {
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <Select value={selectedCompanyId} onValueChange={onCompanyChange}>
      <SelectTrigger className="w-[320px] h-auto min-h-10 py-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <SelectValue>
            {selectedCompany ? (
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{selectedCompany.name}</span>
                <span className="text-xs text-muted-foreground">
                  Tax ID: {selectedCompany.tax_id}
                </span>
              </div>
            ) : (
              "Select a company"
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="min-w-[320px]">
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id} className="py-2.5">
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">{company.name}</span>
              <span className="text-xs text-muted-foreground">
                Tax ID: {company.tax_id}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
