import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanySelector from "@/components/financial/CompanySelector";
import FinancialDashboard from "@/components/financial/FinancialDashboard";
import CompanyManagement from "@/components/financial/CompanyManagement";
import BankAccountManagement from "@/components/financial/BankAccountManagement";
import ProjectManagement from "@/components/financial/ProjectManagement";
import TransactionManagement from "@/components/financial/TransactionManagement";
import LoanManagement from "@/components/financial/LoanManagement";
import { Building2, TrendingUp, Briefcase, CreditCard, PiggyBank, Settings } from "lucide-react";
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
    <div className="w-full h-full flex flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Financial Management</h1>
            <p className="text-sm text-muted-foreground">
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
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 max-w-[1800px] mx-auto w-full">
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
            <TabsList className={isMobile ? "flex w-full overflow-x-auto overflow-y-hidden whitespace-nowrap pb-px" : "grid w-full grid-cols-5"}>
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
              <TabsTrigger value="loans" className="flex-shrink-0">
                <PiggyBank className="h-4 w-4 mr-2" />
                Loans
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-shrink-0">
                <Settings className="h-4 w-4 mr-2" />
                Settings
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

            <TabsContent value="loans" className="space-y-4">
              {selectedCompanyId && (
                <LoanManagement companyId={selectedCompanyId} />
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Tabs defaultValue="companies" className="w-full">
                <TabsList>
                  <TabsTrigger value="companies">
                    <Building2 className="h-4 w-4 mr-2" />
                    Companies
                  </TabsTrigger>
                  <TabsTrigger value="accounts">
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Accounts
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="companies" className="space-y-4 mt-4">
                  <CompanyManagement />
                </TabsContent>

                <TabsContent value="accounts" className="space-y-4 mt-4">
                  {selectedCompanyId && (
                    <BankAccountManagement companyId={selectedCompanyId} />
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
