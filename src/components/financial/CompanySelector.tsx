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
      <SelectTrigger className="w-[280px]">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue>
            {selectedCompany ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedCompany.name}</span>
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
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex flex-col items-start">
              <span className="font-medium">{company.name}</span>
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
