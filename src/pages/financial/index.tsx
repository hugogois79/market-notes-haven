import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/layouts/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanySelector from "@/components/financial/CompanySelector";
import FinancialDashboard from "@/components/financial/FinancialDashboard";
import CompanyManagement from "@/components/financial/CompanyManagement";
import BankAccountManagement from "@/components/financial/BankAccountManagement";
import ProjectManagement from "@/components/financial/ProjectManagement";
import TransactionManagement from "@/components/financial/TransactionManagement";
import LoanManagement from "@/components/financial/LoanManagement";
import { Building2, TrendingUp, Briefcase, CreditCard, PiggyBank } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FinancialPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-select first company if none selected
  if (companies && companies.length > 0 && !selectedCompanyId) {
    setSelectedCompanyId(companies[0].id);
  }

  return (
    <MainLayout>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Financial Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Multi-company financial control system
            </p>
          </div>
          {selectedCompanyId && (
            <CompanySelector
              companies={companies || []}
              selectedCompanyId={selectedCompanyId}
              onCompanyChange={setSelectedCompanyId}
            />
          )}
        </div>

        {!selectedCompanyId && companies?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No companies created</h3>
            <p className="text-muted-foreground">
              Start by creating your first company
            </p>
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className={isMobile ? "flex w-full overflow-x-auto overflow-y-hidden whitespace-nowrap pb-px" : "grid w-full grid-cols-6"}>
              <TabsTrigger value="dashboard" className="flex-shrink-0">
                <TrendingUp className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex-shrink-0">
                <CreditCard className="h-4 w-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex-shrink-0">
                <Briefcase className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex-shrink-0">
                <PiggyBank className="h-4 w-4 mr-2" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="loans" className="flex-shrink-0">
                <CreditCard className="h-4 w-4 mr-2" />
                Loans
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex-shrink-0">
                <Building2 className="h-4 w-4 mr-2" />
                Companies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              {selectedCompanyId && (
                <FinancialDashboard companyId={selectedCompanyId} />
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              {selectedCompanyId && (
                <TransactionManagement companyId={selectedCompanyId} />
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              {selectedCompanyId && (
                <ProjectManagement companyId={selectedCompanyId} />
              )}
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4">
              {selectedCompanyId && (
                <BankAccountManagement companyId={selectedCompanyId} />
              )}
            </TabsContent>

            <TabsContent value="loans" className="space-y-4">
              {selectedCompanyId && (
                <LoanManagement companyId={selectedCompanyId} />
              )}
            </TabsContent>

            <TabsContent value="companies" className="space-y-4">
              <CompanyManagement />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
