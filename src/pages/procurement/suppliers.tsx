import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2,
  MoreHorizontal,
  Star,
  ArrowUpDown,
} from 'lucide-react';
import { useProcurementSuppliers } from '@/hooks/procurement/useProcurementData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SupplierFormDialog from '@/components/procurement/SupplierFormDialog';
import ContactLogDialog from '@/components/procurement/ContactLogDialog';

const stageColors: Record<string, string> = {
  lead: 'bg-slate-500/20 text-slate-400',
  contacted: 'bg-blue-500/20 text-blue-400',
  negotiating: 'bg-amber-500/20 text-amber-400',
  qualified: 'bg-green-500/20 text-green-400',
  inactive: 'bg-red-500/20 text-red-400',
};

const stageLabels: Record<string, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  qualified: 'Qualified',
  inactive: 'Inactive',
};

export default function ProcurementSuppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [contactLogSupplier, setContactLogSupplier] = useState<any>(null);

  const { data: suppliers, isLoading } = useProcurementSuppliers();

  const filteredSuppliers = suppliers?.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleAddContactLog = (supplier: any) => {
    setContactLogSupplier(supplier);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your supplier database and relationships
          </p>
        </div>
        <Button onClick={() => setShowSupplierForm(true)} className="gap-2">
          <Plus size={16} />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Suppliers ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading suppliers...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No suppliers found' : 'No suppliers yet'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowSupplierForm(true)}
              >
                Add your first supplier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.category && (
                        <div className="text-xs text-muted-foreground">
                          {supplier.category}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail size={12} className="text-muted-foreground" />
                            <span className="text-muted-foreground">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone size={12} className="text-muted-foreground" />
                            <span className="text-muted-foreground">{supplier.phone}</span>
                          </div>
                        )}
                        {!supplier.email && !supplier.phone && (
                          <span className="text-sm text-muted-foreground">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.specialty || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={stageColors[supplier.crm_stage] || stageColors.lead}>
                        {stageLabels[supplier.crm_stage] || 'Lead'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-500" />
                        <span>{supplier.trust_score || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddContactLog(supplier)}>
                            Add Contact Log
                          </DropdownMenuItem>
                          {supplier.email && (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${supplier.email}`}>
                                Send Email
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Supplier Form Dialog */}
      <SupplierFormDialog 
        open={showSupplierForm} 
        onOpenChange={(open) => {
          setShowSupplierForm(open);
          if (!open) setEditingSupplier(null);
        }}
        supplier={editingSupplier}
      />

      {/* Contact Log Dialog */}
      <ContactLogDialog
        open={!!contactLogSupplier}
        onOpenChange={(open) => {
          if (!open) setContactLogSupplier(null);
        }}
        supplierId={contactLogSupplier?.id}
        supplierName={contactLogSupplier?.name}
      />
    </div>
  );
}
