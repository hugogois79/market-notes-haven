
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTokens } from "@/services/tokenService";
import { Token } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const TokensList = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");
  const [currentTab, setCurrentTab] = useState<"all" | "favorite">("all");
  const [sortField, setSortField] = useState<"name" | "symbol" | "industry">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        const fetchedTokens = await fetchTokens();
        setTokens(fetchedTokens);
        setFilteredTokens(fetchedTokens);
      } catch (error) {
        console.error("Error loading tokens:", error);
        toast.error("Failed to load tokens");
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  useEffect(() => {
    let result = [...tokens];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        token => 
          token.name.toLowerCase().includes(query) || 
          token.symbol.toLowerCase().includes(query) || 
          token.industry?.toLowerCase().includes(query) ||
          token.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let fieldA = a[sortField] || "";
      let fieldB = b[sortField] || "";
      
      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      return 0;
    });

    setFilteredTokens(result);
  }, [tokens, searchQuery, sortField, sortDirection, currentTab]);

  const handleSort = (field: "name" | "symbol" | "industry") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderTokenCard = (token: Token) => (
    <Card key={token.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {token.logo_url ? (
              <img 
                src={token.logo_url} 
                alt={token.name} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {token.symbol.substring(0, 2).toUpperCase()}
              </div>
            )}
            <CardTitle className="text-lg">{token.name}</CardTitle>
          </div>
          <Badge variant="outline" className="ml-2">
            {token.symbol}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        {token.industry && (
          <Badge variant="secondary" className="mb-2">
            {token.industry}
          </Badge>
        )}
        {token.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {token.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {token.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {token.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{token.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link to={`/tokens/${token.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  const renderTokenRow = (token: Token) => (
    <tr key={token.id} className="hover:bg-muted/50">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          {token.logo_url ? (
            <img 
              src={token.logo_url} 
              alt={token.name} 
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {token.symbol.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span>{token.name}</span>
        </div>
      </td>
      <td className="px-4 py-2">{token.symbol}</td>
      <td className="px-4 py-2">{token.industry || "-"}</td>
      <td className="px-4 py-2">
        <div className="flex flex-wrap gap-1">
          {token.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {token.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{token.tags.length - 2}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-2 text-right">
        <Link to={`/tokens/${token.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 py-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1EAEDB]">Tokens</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track investment tokens
          </p>
        </div>
        <Link to="/tokens/new">
          <Button className="gap-2" variant="brand">
            <Plus size={16} />
            Add Token
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search tokens..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setCurrentView(currentView === "grid" ? "list" : "grid")}
          >
            View: {currentView === "grid" ? "Grid" : "List"}
          </Button>
          
          <Button variant="outline" size="sm" className="gap-1">
            <Filter size={16} />
            Filter
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => handleSort("name")}
          >
            <ArrowUpDown size={16} />
            Sort
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setCurrentTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Tokens</TabsTrigger>
          <TabsTrigger value="favorite">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredTokens.length > 0 ? (
            currentView === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTokens.map(renderTokenCard)}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th 
                        className="px-4 py-2 text-left cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === "name" && (
                            <ArrowUpDown size={14} className="text-muted-foreground" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("symbol")}
                      >
                        <div className="flex items-center gap-1">
                          Symbol
                          {sortField === "symbol" && (
                            <ArrowUpDown size={14} className="text-muted-foreground" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("industry")}
                      >
                        <div className="flex items-center gap-1">
                          Industry
                          {sortField === "industry" && (
                            <ArrowUpDown size={14} className="text-muted-foreground" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left">Tags</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTokens.map(renderTokenRow)}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="bg-card rounded-lg p-8 text-center border border-border animate-fade-in">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1EAEDB]/10 text-[#1EAEDB] mb-4">
                <Banknote size={24} />
              </div>
              <h3 className="text-lg font-medium mb-2">No Tokens Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `No tokens match your search criteria "${searchQuery}".` 
                  : "Start adding tokens to track your investments."}
              </p>
              <Link to="/tokens/new">
                <Button variant="brand">
                  Add Your First Token
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorite">
          <div className="bg-card rounded-lg p-8 text-center border border-border animate-fade-in mt-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1EAEDB]/10 text-[#1EAEDB] mb-4">
              <Banknote size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">Favorites Coming Soon</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The ability to favorite tokens will be available in a future update.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokensList;
