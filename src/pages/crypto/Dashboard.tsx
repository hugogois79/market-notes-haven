
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Wallet, ArrowRightLeft, LineChart, PlusCircle } from "lucide-react";
import MarketTrends from "@/components/MarketTrends";

const CryptoDashboard = () => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand">Crypto Portfolio</h1>
          <p className="text-muted-foreground">
            Track and manage your cryptocurrency investments
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md mx-auto bg-secondary">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-brand/10 data-[state=active]:text-brand">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-brand/10 data-[state=active]:text-brand">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2 data-[state=active]:bg-brand/10 data-[state=active]:text-brand">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Trade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Portfolio Summary Card */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Portfolio Summary</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Coins className="h-16 w-16 text-muted-foreground mb-6" />
                  <h2 className="text-2xl font-bold mb-2">Portfolio Coming Soon</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    We're working on implementing the full crypto portfolio feature.
                  </p>
                  <Button size="sm" variant="brand">
                    <span>Get notified when it's ready</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Market Trends Card */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Market Trends</CardTitle>
                <CardDescription>Latest cryptocurrency prices</CardDescription>
              </CardHeader>
              <CardContent>
                <MarketTrends />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowRightLeft className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-2">Transactions Coming Soon</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Track your crypto purchases and sales with our transaction history feature.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PlusCircle className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-2">Add Trades Coming Soon</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Record your cryptocurrency trades with our easy-to-use form.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CryptoDashboard;
