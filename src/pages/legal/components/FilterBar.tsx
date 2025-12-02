import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LegalCase {
  id: string;
  title: string;
  status: string;
}

interface LegalContact {
  id: string;
  name: string;
  role: string;
}

interface FilterBarProps {
  cases: LegalCase[];
  contacts: LegalContact[];
  filters: {
    caseId: string;
    documentType: string;
    contactId: string;
    searchTerm: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

const documentTypes = [
  { value: "Notes", label: "Notes" },
  { value: "Court Document", label: "Court Document" },
  { value: "Motion", label: "Motion" },
  { value: "Defendant Testimony", label: "Defendant Testimony" },
];

export function FilterBar({ cases, contacts, filters, onFilterChange, onClearFilters }: FilterBarProps) {
  const hasActiveFilters = filters.caseId || filters.documentType || filters.contactId || filters.searchTerm;
  const activeFilterCount = [filters.caseId, filters.documentType, filters.contactId, filters.searchTerm].filter(Boolean).length;

  return (
    <div className="border-b bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar documentos..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange("searchTerm", e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select
          value={filters.caseId}
          onValueChange={(value) => onFilterChange("caseId", value)}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Todos os Casos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Casos</SelectItem>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.documentType}
          onValueChange={(value) => onFilterChange("documentType", value)}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Todos os Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.contactId}
          onValueChange={(value) => onFilterChange("contactId", value)}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Todos os Contatos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Contatos</SelectItem>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
