import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TickerTape from "@/components/wealth/TickerTape";
import WealthSidebar from "@/components/wealth/WealthSidebar";
import WealthKPICards from "@/components/wealth/WealthKPICards";
import WealthCharts from "@/components/wealth/WealthCharts";
import AssetInventory from "@/components/wealth/AssetInventory";
import CashflowLedger from "@/components/wealth/CashflowLedger";
import { wealthService } from "@/services/wealthService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const WealthOS = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: assets = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery({
    queryKey: ['wealth-assets'],
    queryFn: wealthService.getAssets,
  });

  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['wealth-transactions'],
    queryFn: wealthService.getTransactions,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getSnapshots,
  });

  const isLoading = assetsLoading || transactionsLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 p-6">
            <WealthKPICards assets={assets} />
            <WealthCharts assets={assets} snapshots={snapshots} />
            {/* Quick view of recent transactions */}
            <Card className="border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No recent transactions</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-PT')}</p>
                        </div>
                        <span className={`font-mono text-sm ${t.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.transaction_type === 'credit' ? '+' : '-'}€{t.amount.toLocaleString('de-DE')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'inventory':
        return (
          <div className="p-6">
            <AssetInventory assets={assets} onRefresh={refetchAssets} />
          </div>
        );

      case 'cashflow':
        return (
          <div className="p-6">
            <CashflowLedger transactions={transactions} onRefresh={refetchTransactions} />
          </div>
        );

      case 'reports':
        return (
          <div className="p-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">Reports module coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="p-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">Settings module coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Ticker Tape */}
      <TickerTape />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <WealthSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default WealthOS;
