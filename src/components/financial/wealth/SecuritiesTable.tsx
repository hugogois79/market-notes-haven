import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Plus, Pencil, Trash2, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

type SecurityType = "equity" | "etf" | "bond" | "commodity" | "currency" | "crypto";

type RecentAnalysis = {
  analyst: string;
  company: string;
  target: number;
  date: string;
  grade?: string;
  previous_grade?: string;
};

// Helper to classify analyst grades
const getGradeStyle = (grade: string) => {
  const bullish = ["buy", "strong buy", "overweight", "outperform", "positive"];
  const bearish = ["sell", "strong sell", "underweight", "underperform", "negative"];
  
  const normalized = grade.toLowerCase();
  
  if (bullish.some(g => normalized.includes(g))) {
    return { color: "bg-green-100 text-green-800 border-green-200", icon: TrendingUp };
  }
  if (bearish.some(g => normalized.includes(g))) {
    return { color: "bg-red-100 text-red-800 border-red-200", icon: TrendingDown };
  }
  return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Minus };
};

type Security = {
  id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  currency: string | null;
  security_type: SecurityType | null;
  sector: string | null;
  industry: string | null;
  // Equity/ETF fields
  market_cap: number | null;
  eps: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  fcf: number | null;
  fcf_yield: number | null;
  roe: number | null;
  operating_margin: number | null;
  revenue_growth: number | null;
  debt_to_equity: number | null;
  interest_coverage: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  // Bond fields
  coupon_rate: number | null;
  maturity_date: string | null;
  credit_rating: string | null;
  yield_to_maturity: number | null;
  // ETF fields
  expense_ratio: number | null;
  aum: number | null;
  tracking_index: string | null;
  nav: number | null;
  nav_premium_discount: number | null;
  avg_daily_volume: number | null;
  bid_ask_spread: number | null;
  domicile: string | null;
  distribution_policy: string | null;
  top_10_holdings_weight: number | null;
  return_1y: number | null;
  return_3y: number | null;
  return_5y: number | null;
  volatility: number | null;
  tracking_error: number | null;
  exchange: string | null;
  // Crypto fields
  circulating_supply: number | null;
  max_supply: number | null;
  blockchain: string | null;
  // Commodity fields
  commodity_type: string | null;
  contract_size: number | null;
  delivery_month: string | null;
  // FX/Currency fields
  base_currency: string | null;
  quote_currency: string | null;
  spot_rate: number | null;
  base_interest_rate: number | null;
  quote_interest_rate: number | null;
  forward_rate_3m: number | null;
  forward_rate_12m: number | null;
  fx_volatility_30d: number | null;
  fx_atr: number | null;
  support_level: number | null;
  resistance_level: number | null;
  base_inflation_rate: number | null;
  quote_inflation_rate: number | null;
  base_current_account: number | null;
  quote_current_account: number | null;
  base_credit_rating: string | null;
  quote_credit_rating: string | null;
  // Analyst coverage fields
  analyst_target_price: number | null;
  analyst_target_high: number | null;
  analyst_target_low: number | null;
  analyst_count: number | null;
  analyst_last_month_count: number | null;
  analyst_last_month_avg: number | null;
  analyst_last_quarter_count: number | null;
  analyst_last_quarter_avg: number | null;
  analyst_publishers: string[] | null;
  recent_analyses: RecentAnalysis[] | null;
  // Price fields
  current_price: number | null;
  price_updated_at: string | null;
  // Price change fields
  change_1d: number | null;
  change_1w: number | null;
  change_ytd: number | null;
  created_at: string;
};

type StockPrice = {
  symbol: string;
  current_price: number;
  previous_close: number | null;
  change: number | null;
  change_percent: string | null;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  volume: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  year_high: number | null;
  year_low: number | null;
  date: string;
  fetched_at: string;
};

type SecurityFormData = {
  name: string;
  ticker: string;
  isin: string;
  currency: string;
  security_type: SecurityType;
  sector: string;
  industry: string;
  // Equity fields
  market_cap: string;
  eps: string;
  pe_ratio: string;
  pb_ratio: string;
  fcf: string;
  fcf_yield: string;
  roe: string;
  operating_margin: string;
  revenue_growth: string;
  debt_to_equity: string;
  interest_coverage: string;
  dividend_yield: string;
  payout_ratio: string;
  // Bond fields
  coupon_rate: string;
  maturity_date: string;
  credit_rating: string;
  yield_to_maturity: string;
  // ETF fields
  expense_ratio: string;
  aum: string;
  tracking_index: string;
  nav: string;
  nav_premium_discount: string;
  avg_daily_volume: string;
  bid_ask_spread: string;
  domicile: string;
  distribution_policy: string;
  top_10_holdings_weight: string;
  return_1y: string;
  return_3y: string;
  return_5y: string;
  volatility: string;
  tracking_error: string;
  exchange: string;
  // Crypto fields
  circulating_supply: string;
  max_supply: string;
  blockchain: string;
  // Commodity fields
  commodity_type: string;
  contract_size: string;
  delivery_month: string;
  // FX/Currency fields
  base_currency: string;
  quote_currency: string;
  spot_rate: string;
  base_interest_rate: string;
  quote_interest_rate: string;
  forward_rate_3m: string;
  forward_rate_12m: string;
  fx_volatility_30d: string;
  fx_atr: string;
  support_level: string;
  resistance_level: string;
  base_inflation_rate: string;
  quote_inflation_rate: string;
  base_current_account: string;
  quote_current_account: string;
  base_credit_rating: string;
  quote_credit_rating: string;
  // Analyst coverage fields
  analyst_target_price: string;
  analyst_target_high: string;
  analyst_target_low: string;
  analyst_count: string;
  analyst_last_month_count: string;
  analyst_last_month_avg: string;
  analyst_last_quarter_count: string;
  analyst_last_quarter_avg: string;
  analyst_publishers: string[];
  recent_analyses: RecentAnalysis[] | null;
  // Price field
  current_price: string;
  // Price change fields
  change_1d: string;
  change_1w: string;
  change_ytd: string;
};

const SECURITY_TYPES: { value: SecurityType; label: string }[] = [
  { value: "equity", label: "Equity" },
  { value: "etf", label: "ETF" },
  { value: "bond", label: "Bond" },
  { value: "commodity", label: "Commodity" },
  { value: "currency", label: "Currency" },
  { value: "crypto", label: "Crypto" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "BTC", "USDT"];

const formatCurrency = (value: number, currency: string = "EUR") => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency === "BTC" || currency === "USDT" ? "USD" : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(value);
};

const emptyFormData: SecurityFormData = {
  name: "",
  ticker: "",
  isin: "",
  currency: "EUR",
  security_type: "equity",
  sector: "",
  industry: "",
  market_cap: "",
  eps: "",
  pe_ratio: "",
  pb_ratio: "",
  fcf: "",
  fcf_yield: "",
  roe: "",
  operating_margin: "",
  revenue_growth: "",
  debt_to_equity: "",
  interest_coverage: "",
  dividend_yield: "",
  payout_ratio: "",
  coupon_rate: "",
  maturity_date: "",
  credit_rating: "",
  yield_to_maturity: "",
  expense_ratio: "",
  aum: "",
  tracking_index: "",
  nav: "",
  nav_premium_discount: "",
  avg_daily_volume: "",
  bid_ask_spread: "",
  domicile: "",
  distribution_policy: "",
  top_10_holdings_weight: "",
  return_1y: "",
  return_3y: "",
  return_5y: "",
  volatility: "",
  tracking_error: "",
  exchange: "",
  circulating_supply: "",
  max_supply: "",
  blockchain: "",
  commodity_type: "",
  contract_size: "",
  delivery_month: "",
  // FX/Currency fields
  base_currency: "",
  quote_currency: "",
  spot_rate: "",
  base_interest_rate: "",
  quote_interest_rate: "",
  forward_rate_3m: "",
  forward_rate_12m: "",
  fx_volatility_30d: "",
  fx_atr: "",
  support_level: "",
  resistance_level: "",
  base_inflation_rate: "",
  quote_inflation_rate: "",
  base_current_account: "",
  quote_current_account: "",
  base_credit_rating: "",
  quote_credit_rating: "",
  // Analyst coverage fields
  analyst_target_price: "",
  analyst_target_high: "",
  analyst_target_low: "",
  analyst_count: "",
  analyst_last_month_count: "",
  analyst_last_month_avg: "",
  analyst_last_quarter_count: "",
  analyst_last_quarter_avg: "",
  analyst_publishers: [],
  recent_analyses: null,
  // Price field
  current_price: "",
  // Price change fields
  change_1d: "",
  change_1w: "",
  change_ytd: "",
};

const parseNumber = (val: string | null | undefined | string[]): number | null => {
  if (val === null || val === undefined || Array.isArray(val)) return null;
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed.replace(",", "."));
  return isNaN(parsed) ? null : parsed;
};

const formatNumberField = (val: number | null): string => {
  if (val === null || val === undefined) return "";
  return val.toString().replace(".", ",");
};

const getTypeBadgeColor = (type: SecurityType | null) => {
  switch (type) {
    case "equity": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "etf": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "bond": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "commodity": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "currency": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "crypto": return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
    default: return "";
  }
};

export default function SecuritiesTable() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState<Security | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SecurityFormData>(emptyFormData);
  const [isLoadingSecurityData, setIsLoadingSecurityData] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["equity", "etf", "currency"])
  );

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  // n8n webhook URL for fetching security data
  const N8N_SECURITY_WEBHOOK = "https://n8n.gvvcapital.com/webhook/fetch-security";

  const handleFetchSecurityData = async () => {
    if (!formData.ticker.trim()) {
      toast.error("Insere um ticker primeiro");
      return;
    }

    setIsLoadingSecurityData(true);
    try {
      const ticker = encodeURIComponent(formData.ticker.trim().toUpperCase());
      const type = encodeURIComponent(formData.security_type);

      const response = await fetch(
        `${N8N_SECURITY_WEBHOOK}?ticker=${ticker}&type=${type}`,
        { method: "GET" }
      );

      const result = await response.json();

      if (result.success && result.data) {
        // Log para debug
        console.log(`[${formData.security_type}] Dados recebidos do n8n:`, result.data);
        
        // Helper para converter decimal para percentagem (ex: 0.0039 -> 0.39)
        const toPercent = (val: any): string => {
          if (val === null || val === undefined || val === "") return "";
          const num = parseFloat(val);
          if (isNaN(num)) return "";
          return (num * 100).toFixed(4).replace(".", ",");
        };

        setFormData(prev => ({
          ...prev,
          // Campos base
          name: result.data.name || prev.name,
          currency: result.data.currency || prev.currency,
          sector: result.data.sector || prev.sector,
          industry: result.data.industry || prev.industry,
          isin: result.data.isin || prev.isin,
          exchange: result.data.exchange || prev.exchange,
          
          // Campos Equity - valores absolutos
          market_cap: result.data.market_cap || result.data.marketCap || prev.market_cap,
          eps: result.data.eps || prev.eps,
          pe_ratio: result.data.pe_ratio || result.data.peRatio || prev.pe_ratio,
          pb_ratio: result.data.pb_ratio || result.data.pbRatio || prev.pb_ratio,
          fcf: result.data.fcf || prev.fcf,
          debt_to_equity: result.data.debt_to_equity || result.data.debtToEquity || prev.debt_to_equity,
          interest_coverage: result.data.interest_coverage || result.data.interestCoverage || prev.interest_coverage,
          
          // Campos Equity - percentagens (convertidas de decimal)
          fcf_yield: toPercent(result.data.fcf_yield || result.data.fcfYield) || prev.fcf_yield,
          roe: toPercent(result.data.roe || result.data.returnOnEquity) || prev.roe,
          operating_margin: toPercent(result.data.operating_margin || result.data.operatingMargin) || prev.operating_margin,
          revenue_growth: toPercent(result.data.revenue_growth || result.data.revenueGrowth) || prev.revenue_growth,
          dividend_yield: toPercent(result.data.dividend_yield || result.data.dividendYield) || prev.dividend_yield,
          payout_ratio: toPercent(result.data.payout_ratio || result.data.payoutRatio) || prev.payout_ratio,
          
          // Campos ETF - valores absolutos (aceitar múltiplos nomes possíveis)
          aum: (result.data.aum || result.data.totalAssets || result.data.AUM)?.toString() || prev.aum,
          nav: (result.data.nav || result.data.navPrice || result.data.NAV)?.toString().replace(".", ",") || prev.nav,
          tracking_index: result.data.tracking_index || result.data.trackingIndex || result.data.index || prev.tracking_index,
          avg_daily_volume: (result.data.avg_daily_volume || result.data.avgVolume || result.data.volume)?.toString() || prev.avg_daily_volume,
          domicile: result.data.domicile || result.data.country || prev.domicile,
          distribution_policy: result.data.distribution_policy || result.data.distributionPolicy || prev.distribution_policy,
          bid_ask_spread: result.data.bid_ask_spread || prev.bid_ask_spread,
          
          // Campos ETF - percentagens (convertidas de decimal, aceitar múltiplos nomes)
          expense_ratio: toPercent(result.data.expense_ratio || result.data.expenseRatio || result.data.ter) || prev.expense_ratio,
          return_1y: toPercent(result.data.return_1y || result.data.return1y || result.data.oneYearReturn) || prev.return_1y,
          return_3y: toPercent(result.data.return_3y || result.data.return3y || result.data.threeYearReturn) || prev.return_3y,
          return_5y: toPercent(result.data.return_5y || result.data.return5y || result.data.fiveYearReturn) || prev.return_5y,
          nav_premium_discount: toPercent(result.data.nav_premium_discount || result.data.navPremiumDiscount) || prev.nav_premium_discount,
          volatility: toPercent(result.data.volatility || result.data.standardDeviation) || prev.volatility,
          tracking_error: toPercent(result.data.tracking_error || result.data.trackingError) || prev.tracking_error,
          top_10_holdings_weight: toPercent(result.data.top_10_holdings_weight || result.data.top10HoldingsWeight) || prev.top_10_holdings_weight,
          
          // Analyst coverage fields (only for equities)
          analyst_target_price: result.data.analyst_target_price?.toString().replace(".", ",") || prev.analyst_target_price,
          analyst_target_high: result.data.analyst_target_high?.toString().replace(".", ",") || prev.analyst_target_high,
          analyst_target_low: result.data.analyst_target_low?.toString().replace(".", ",") || prev.analyst_target_low,
          analyst_count: result.data.analyst_count?.toString() || prev.analyst_count,
          analyst_last_month_count: result.data.analyst_last_month_count?.toString() || prev.analyst_last_month_count,
          analyst_last_month_avg: result.data.analyst_last_month_avg?.toString().replace(".", ",") || prev.analyst_last_month_avg,
          analyst_last_quarter_count: result.data.analyst_last_quarter_count?.toString() || prev.analyst_last_quarter_count,
          analyst_last_quarter_avg: result.data.analyst_last_quarter_avg?.toString().replace(".", ",") || prev.analyst_last_quarter_avg,
          analyst_publishers: result.data.analyst_publishers || prev.analyst_publishers || [],
          recent_analyses: result.data.recent_analyses?.map((a: any) => ({
            analyst: a.analyst || a.analystName,
            company: a.company || a.analystCompany,
            target: a.target || a.priceTarget,
            date: a.date || a.publishedDate,
            grade: a.grade || a.newGrade,
            previous_grade: a.previous_grade || a.previousGrade,
          })) || prev.recent_analyses,
          
          // Price field
          current_price: result.data.price?.toString().replace(".", ",") || prev.current_price,
          // Price change fields
          change_1d: result.data.change_1d?.toString().replace(".", ",") || prev.change_1d,
          change_1w: result.data.change_1w?.toString().replace(".", ",") || prev.change_1w,
          change_ytd: result.data.change_ytd?.toString().replace(".", ",") || prev.change_ytd,
        }));
        toast.success("Dados carregados do FMP");
      } else {
        toast.error(result.error || "Ticker não encontrado");
      }
    } catch (error) {
      toast.error("Falha ao contactar n8n");
    } finally {
      setIsLoadingSecurityData(false);
    }
  };

  // Fetch securities
  const { data: securities = [], isLoading: loadingSecurities } = useQuery({
    queryKey: ["securities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("*")
        .order("security_type")
        .order("name");
      if (error) throw error;
      // Map recent_analyses from JSON to proper type
      return (data || []).map(d => ({
        ...d,
        recent_analyses: d.recent_analyses as RecentAnalysis[] | null
      })) as Security[];
    },
  });

  // Fetch stock prices for all symbols
  const { data: stockPrices = [], isLoading: loadingPrices, dataUpdatedAt } = useQuery({
    queryKey: ["stock-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_prices")
        .select("*")
        .order("symbol");
      if (error) throw error;
      return data as StockPrice[];
    },
    refetchInterval: 60000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SecurityFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("securities").insert({
        name: data.name.trim(),
        ticker: data.ticker.trim() || null,
        isin: data.isin.trim() || null,
        currency: data.currency,
        security_type: data.security_type,
        sector: data.sector.trim() || null,
        industry: data.industry.trim() || null,
        market_cap: parseNumber(data.market_cap),
        eps: parseNumber(data.eps),
        pe_ratio: parseNumber(data.pe_ratio),
        pb_ratio: parseNumber(data.pb_ratio),
        fcf: parseNumber(data.fcf),
        fcf_yield: parseNumber(data.fcf_yield),
        roe: parseNumber(data.roe),
        operating_margin: parseNumber(data.operating_margin),
        revenue_growth: parseNumber(data.revenue_growth),
        debt_to_equity: parseNumber(data.debt_to_equity),
        interest_coverage: parseNumber(data.interest_coverage),
        dividend_yield: parseNumber(data.dividend_yield),
        payout_ratio: parseNumber(data.payout_ratio),
        coupon_rate: parseNumber(data.coupon_rate),
        maturity_date: data.maturity_date || null,
        credit_rating: data.credit_rating.trim() || null,
        yield_to_maturity: parseNumber(data.yield_to_maturity),
        expense_ratio: parseNumber(data.expense_ratio),
        aum: parseNumber(data.aum),
        tracking_index: data.tracking_index.trim() || null,
        nav: parseNumber(data.nav),
        nav_premium_discount: parseNumber(data.nav_premium_discount),
        avg_daily_volume: parseNumber(data.avg_daily_volume),
        bid_ask_spread: parseNumber(data.bid_ask_spread),
        domicile: data.domicile.trim() || null,
        distribution_policy: data.distribution_policy || null,
        top_10_holdings_weight: parseNumber(data.top_10_holdings_weight),
        return_1y: parseNumber(data.return_1y),
        return_3y: parseNumber(data.return_3y),
        return_5y: parseNumber(data.return_5y),
        volatility: parseNumber(data.volatility),
        tracking_error: parseNumber(data.tracking_error),
        exchange: data.exchange.trim() || null,
        circulating_supply: parseNumber(data.circulating_supply),
        max_supply: parseNumber(data.max_supply),
        blockchain: data.blockchain.trim() || null,
        commodity_type: data.commodity_type.trim() || null,
        contract_size: parseNumber(data.contract_size),
        delivery_month: data.delivery_month.trim() || null,
        // FX/Currency fields
        base_currency: data.base_currency.trim() || null,
        quote_currency: data.quote_currency.trim() || null,
        spot_rate: parseNumber(data.spot_rate),
        base_interest_rate: parseNumber(data.base_interest_rate),
        quote_interest_rate: parseNumber(data.quote_interest_rate),
        forward_rate_3m: parseNumber(data.forward_rate_3m),
        forward_rate_12m: parseNumber(data.forward_rate_12m),
        fx_volatility_30d: parseNumber(data.fx_volatility_30d),
        fx_atr: parseNumber(data.fx_atr),
        support_level: parseNumber(data.support_level),
        resistance_level: parseNumber(data.resistance_level),
        base_inflation_rate: parseNumber(data.base_inflation_rate),
        quote_inflation_rate: parseNumber(data.quote_inflation_rate),
        base_current_account: parseNumber(data.base_current_account),
        quote_current_account: parseNumber(data.quote_current_account),
        base_credit_rating: data.base_credit_rating.trim() || null,
        quote_credit_rating: data.quote_credit_rating.trim() || null,
        // Analyst coverage fields
        analyst_target_price: parseNumber(data.analyst_target_price),
        analyst_target_high: parseNumber(data.analyst_target_high),
        analyst_target_low: parseNumber(data.analyst_target_low),
        analyst_count: parseNumber(data.analyst_count),
        analyst_last_month_count: parseInt(data.analyst_last_month_count) || null,
        analyst_last_month_avg: parseNumber(data.analyst_last_month_avg),
        analyst_last_quarter_count: parseInt(data.analyst_last_quarter_count) || null,
        analyst_last_quarter_avg: parseNumber(data.analyst_last_quarter_avg),
        analyst_publishers: data.analyst_publishers.length > 0 ? data.analyst_publishers : null,
        recent_analyses: data.recent_analyses,
        // Price fields
        current_price: parseNumber(data.current_price),
        price_updated_at: data.current_price ? new Date().toISOString() : null,
        // Price change fields
        change_1d: parseNumber(data.change_1d),
        change_1w: parseNumber(data.change_1w),
        change_ytd: parseNumber(data.change_ytd),
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securities-list"] });
      toast.success("Título criado com sucesso");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar título: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SecurityFormData }) => {
      const { error } = await supabase
        .from("securities")
        .update({
          name: data.name.trim(),
          ticker: data.ticker.trim() || null,
          isin: data.isin.trim() || null,
          currency: data.currency,
          security_type: data.security_type,
          sector: data.sector.trim() || null,
          industry: data.industry.trim() || null,
          market_cap: parseNumber(data.market_cap),
          eps: parseNumber(data.eps),
          pe_ratio: parseNumber(data.pe_ratio),
          pb_ratio: parseNumber(data.pb_ratio),
          fcf: parseNumber(data.fcf),
          fcf_yield: parseNumber(data.fcf_yield),
          roe: parseNumber(data.roe),
          operating_margin: parseNumber(data.operating_margin),
          revenue_growth: parseNumber(data.revenue_growth),
          debt_to_equity: parseNumber(data.debt_to_equity),
          interest_coverage: parseNumber(data.interest_coverage),
          dividend_yield: parseNumber(data.dividend_yield),
          payout_ratio: parseNumber(data.payout_ratio),
          coupon_rate: parseNumber(data.coupon_rate),
          maturity_date: data.maturity_date || null,
          credit_rating: data.credit_rating.trim() || null,
          yield_to_maturity: parseNumber(data.yield_to_maturity),
          expense_ratio: parseNumber(data.expense_ratio),
          aum: parseNumber(data.aum),
          tracking_index: data.tracking_index.trim() || null,
          nav: parseNumber(data.nav),
          nav_premium_discount: parseNumber(data.nav_premium_discount),
          avg_daily_volume: parseNumber(data.avg_daily_volume),
          bid_ask_spread: parseNumber(data.bid_ask_spread),
          domicile: data.domicile.trim() || null,
          distribution_policy: data.distribution_policy || null,
          top_10_holdings_weight: parseNumber(data.top_10_holdings_weight),
          return_1y: parseNumber(data.return_1y),
          return_3y: parseNumber(data.return_3y),
          return_5y: parseNumber(data.return_5y),
          volatility: parseNumber(data.volatility),
          tracking_error: parseNumber(data.tracking_error),
          exchange: data.exchange.trim() || null,
          circulating_supply: parseNumber(data.circulating_supply),
          max_supply: parseNumber(data.max_supply),
          blockchain: data.blockchain.trim() || null,
          commodity_type: data.commodity_type.trim() || null,
          contract_size: parseNumber(data.contract_size),
          delivery_month: data.delivery_month.trim() || null,
          // FX/Currency fields
          base_currency: data.base_currency.trim() || null,
          quote_currency: data.quote_currency.trim() || null,
          spot_rate: parseNumber(data.spot_rate),
          base_interest_rate: parseNumber(data.base_interest_rate),
          quote_interest_rate: parseNumber(data.quote_interest_rate),
          forward_rate_3m: parseNumber(data.forward_rate_3m),
          forward_rate_12m: parseNumber(data.forward_rate_12m),
          fx_volatility_30d: parseNumber(data.fx_volatility_30d),
          fx_atr: parseNumber(data.fx_atr),
          support_level: parseNumber(data.support_level),
          resistance_level: parseNumber(data.resistance_level),
          base_inflation_rate: parseNumber(data.base_inflation_rate),
          quote_inflation_rate: parseNumber(data.quote_inflation_rate),
          base_current_account: parseNumber(data.base_current_account),
          quote_current_account: parseNumber(data.quote_current_account),
          base_credit_rating: data.base_credit_rating.trim() || null,
          quote_credit_rating: data.quote_credit_rating.trim() || null,
          // Analyst coverage fields
          analyst_target_price: parseNumber(data.analyst_target_price),
          analyst_target_high: parseNumber(data.analyst_target_high),
          analyst_target_low: parseNumber(data.analyst_target_low),
          analyst_count: parseNumber(data.analyst_count),
          analyst_last_month_count: parseInt(data.analyst_last_month_count) || null,
          analyst_last_month_avg: parseNumber(data.analyst_last_month_avg),
          analyst_last_quarter_count: parseInt(data.analyst_last_quarter_count) || null,
          analyst_last_quarter_avg: parseNumber(data.analyst_last_quarter_avg),
          analyst_publishers: data.analyst_publishers.length > 0 ? data.analyst_publishers : null,
          recent_analyses: data.recent_analyses,
          // Price fields
          current_price: parseNumber(data.current_price),
          price_updated_at: data.current_price ? new Date().toISOString() : null,
          // Price change fields
          change_1d: parseNumber(data.change_1d),
          change_1w: parseNumber(data.change_1w),
          change_ytd: parseNumber(data.change_ytd),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securities-list"] });
      toast.success("Título atualizado com sucesso");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar título: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("securities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securities-list"] });
      toast.success("Título eliminado com sucesso");
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao eliminar título: ${error.message}`);
    },
  });

  const handleOpenCreate = () => {
    setEditingSecurity(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (security: Security) => {
    setEditingSecurity(security);
    setFormData({
      name: security.name,
      ticker: security.ticker || "",
      isin: security.isin || "",
      currency: security.currency || "EUR",
      security_type: security.security_type || "equity",
      sector: security.sector || "",
      industry: security.industry || "",
      market_cap: formatNumberField(security.market_cap),
      eps: formatNumberField(security.eps),
      pe_ratio: formatNumberField(security.pe_ratio),
      pb_ratio: formatNumberField(security.pb_ratio),
      fcf: formatNumberField(security.fcf),
      fcf_yield: formatNumberField(security.fcf_yield),
      roe: formatNumberField(security.roe),
      operating_margin: formatNumberField(security.operating_margin),
      revenue_growth: formatNumberField(security.revenue_growth),
      debt_to_equity: formatNumberField(security.debt_to_equity),
      interest_coverage: formatNumberField(security.interest_coverage),
      dividend_yield: formatNumberField(security.dividend_yield),
      payout_ratio: formatNumberField(security.payout_ratio),
      coupon_rate: formatNumberField(security.coupon_rate),
      maturity_date: security.maturity_date || "",
      credit_rating: security.credit_rating || "",
      yield_to_maturity: formatNumberField(security.yield_to_maturity),
      expense_ratio: formatNumberField(security.expense_ratio),
      aum: formatNumberField(security.aum),
      tracking_index: security.tracking_index || "",
      nav: formatNumberField(security.nav),
      nav_premium_discount: formatNumberField(security.nav_premium_discount),
      avg_daily_volume: formatNumberField(security.avg_daily_volume),
      bid_ask_spread: formatNumberField(security.bid_ask_spread),
      domicile: security.domicile || "",
      distribution_policy: security.distribution_policy || "",
      top_10_holdings_weight: formatNumberField(security.top_10_holdings_weight),
      return_1y: formatNumberField(security.return_1y),
      return_3y: formatNumberField(security.return_3y),
      return_5y: formatNumberField(security.return_5y),
      volatility: formatNumberField(security.volatility),
      tracking_error: formatNumberField(security.tracking_error),
      exchange: security.exchange || "",
      circulating_supply: formatNumberField(security.circulating_supply),
      max_supply: formatNumberField(security.max_supply),
      blockchain: security.blockchain || "",
      commodity_type: security.commodity_type || "",
      contract_size: formatNumberField(security.contract_size),
      delivery_month: security.delivery_month || "",
      // FX/Currency fields
      base_currency: security.base_currency || "",
      quote_currency: security.quote_currency || "",
      spot_rate: formatNumberField(security.spot_rate),
      base_interest_rate: formatNumberField(security.base_interest_rate),
      quote_interest_rate: formatNumberField(security.quote_interest_rate),
      forward_rate_3m: formatNumberField(security.forward_rate_3m),
      forward_rate_12m: formatNumberField(security.forward_rate_12m),
      fx_volatility_30d: formatNumberField(security.fx_volatility_30d),
      fx_atr: formatNumberField(security.fx_atr),
      support_level: formatNumberField(security.support_level),
      resistance_level: formatNumberField(security.resistance_level),
      base_inflation_rate: formatNumberField(security.base_inflation_rate),
      quote_inflation_rate: formatNumberField(security.quote_inflation_rate),
      base_current_account: formatNumberField(security.base_current_account),
      quote_current_account: formatNumberField(security.quote_current_account),
      base_credit_rating: security.base_credit_rating || "",
      quote_credit_rating: security.quote_credit_rating || "",
      // Analyst coverage fields
      analyst_target_price: formatNumberField(security.analyst_target_price),
      analyst_target_high: formatNumberField(security.analyst_target_high),
      analyst_target_low: formatNumberField(security.analyst_target_low),
      analyst_count: formatNumberField(security.analyst_count),
      analyst_last_month_count: formatNumberField(security.analyst_last_month_count),
      analyst_last_month_avg: formatNumberField(security.analyst_last_month_avg),
      analyst_last_quarter_count: formatNumberField(security.analyst_last_quarter_count),
      analyst_last_quarter_avg: formatNumberField(security.analyst_last_quarter_avg),
      analyst_publishers: (security.analyst_publishers as string[]) || [],
      recent_analyses: security.recent_analyses,
      // Price field
      current_price: formatNumberField(security.current_price),
      // Price change fields
      change_1d: formatNumberField(security.change_1d),
      change_1w: formatNumberField(security.change_1w),
      change_ytd: formatNumberField(security.change_ytd),
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSecurity(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    if (editingSecurity) {
      updateMutation.mutate({ id: editingSecurity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Create a map of ticker -> price data
  const priceMap = stockPrices.reduce((acc, price) => {
    acc[price.symbol] = price;
    return acc;
  }, {} as Record<string, StockPrice>);

  // Merge securities with their prices
  const securitiesWithPrices = securities.map((sec) => {
    const price = sec.ticker ? priceMap[sec.ticker] : null;
    return { ...sec, price };
  });

  // Group securities by type
  const groupedSecurities = useMemo(() => {
    const groups: Record<string, { securities: typeof securitiesWithPrices; count: number }> = {};
    
    // Initialize all types
    SECURITY_TYPES.forEach(type => {
      groups[type.value] = { securities: [], count: 0 };
    });
    
    // Group securities
    securitiesWithPrices.forEach(sec => {
      const type = sec.security_type || "equity";
      if (groups[type]) {
        groups[type].securities.push(sec);
        groups[type].count++;
      }
    });
    
    return groups;
  }, [securitiesWithPrices]);

  // Also show FX rates (EUR* symbols)
  const fxRates = stockPrices.filter((p) => p.symbol.startsWith("EUR"));

  const isLoading = loadingSecurities || loadingPrices;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Helper to format percentage change
  const formatChange = (value: number | null) => {
    if (value === null) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number | null) => {
    if (value === null || value === 0) return "text-muted-foreground";
    return value > 0 ? "text-green-500" : "text-red-500";
  };

  const getTypeBarColor = (type: SecurityType | null) => {
    switch (type) {
      case "equity": return "bg-blue-500";
      case "etf": return "bg-purple-500";
      case "bond": return "bg-amber-500";
      case "commodity": return "bg-orange-500";
      case "currency": return "bg-green-500";
      case "crypto": return "bg-cyan-500";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* FX Rates Section */}
      {fxRates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Taxas de Câmbio</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {fxRates.map((fx) => {
              const currency = fx.symbol.replace("EUR", "");
              const changeNum = parseFloat(fx.change_percent?.replace("%", "") || "0");
              return (
                <div key={fx.symbol} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{currency}</span>
                    <Badge variant="outline" className="text-xs">FX</Badge>
                  </div>
                  <div className="text-lg font-bold">{fx.current_price.toFixed(4)}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {changeNum > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : changeNum < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={changeNum > 0 ? "text-green-500" : changeNum < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {fx.change_percent || "0%"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Securities Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Títulos</h3>
          <div className="flex items-center gap-3">
            {dataUpdatedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Atualizado: {format(new Date(dataUpdatedAt), "HH:mm", { locale: pt })}
              </span>
            )}
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right text-xs">1D</TableHead>
                <TableHead className="text-right text-xs">1W</TableHead>
                <TableHead className="text-right text-xs">YTD</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    A carregar...
                  </TableCell>
                </TableRow>
              ) : securitiesWithPrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum título registado
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedSecurities).map(([type, group]) => {
                  if (group.count === 0) return null;
                  const isExpanded = expandedGroups.has(type);
                  const typeInfo = SECURITY_TYPES.find(t => t.value === type);
                  
                  return (
                    <Fragment key={type}>
                      {/* Group Header Row */}
                      <TableRow
                        className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                        onClick={() => toggleGroup(type)}
                      >
                        <TableCell className="py-3">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-muted-foreground" />
                          ) : (
                            <ChevronRight size={16} className="text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell colSpan={7} className="py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(type as SecurityType)}`}>
                              {typeInfo?.label || type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({group.count} {group.count === 1 ? 'título' : 'títulos'})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>

                      {/* Security Rows */}
                      {isExpanded && group.securities.map((sec, index) => (
                        <TableRow key={sec.id} className="hover:bg-muted/50">
                          <TableCell className="py-2">
                            <div className={`w-1 h-6 rounded-full ml-2 ${getTypeBarColor(sec.security_type)}`} />
                          </TableCell>
                          <TableCell className="font-medium max-w-[180px] truncate" title={sec.name}>
                            <span className="text-xs text-muted-foreground mr-2">{index + 1}.</span>
                            {sec.name}
                          </TableCell>
                          <TableCell>
                            {sec.ticker ? (
                              <Badge variant="outline" className="text-xs">{sec.ticker}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{sec.currency || "EUR"}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {sec.current_price ? (
                              formatCurrency(sec.current_price, sec.currency || "EUR")
                            ) : sec.price ? (
                              formatCurrency(sec.price.current_price, sec.currency || "EUR")
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs ${getChangeColor(sec.change_1d)}`}>
                            {formatChange(sec.change_1d)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs ${getChangeColor(sec.change_1w)}`}>
                            {formatChange(sec.change_1w)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs ${getChangeColor(sec.change_ytd)}`}>
                            {formatChange(sec.change_ytd)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(sec);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(sec.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingSecurity ? "Editar Título" : "Novo Título"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="metrics">Métricas</TabsTrigger>
                <TabsTrigger value="type-specific">
                  {SECURITY_TYPES.find(t => t.value === formData.security_type)?.label || "Específico"}
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[400px] pr-4 mt-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  {/* Tipo + Ticker (com botão refresh) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="security_type">Tipo *</Label>
                      <Select
                        value={formData.security_type}
                        onValueChange={(value: SecurityType) => setFormData({ ...formData, security_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECURITY_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Ticker</Label>
                      <div className="flex gap-2">
                        <Input
                          id="ticker"
                          value={formData.ticker}
                          onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                          placeholder="Ex: AAPL"
                          maxLength={20}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleFetchSecurityData}
                          disabled={isLoadingSecurityData || !formData.ticker.trim()}
                          title="Obter dados do Ticket"
                        >
                          {isLoadingSecurityData ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Nome + Moeda */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Apple Inc."
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moeda</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* ISIN + Setor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="isin">ISIN</Label>
                      <Input
                        id="isin"
                        value={formData.isin}
                        onChange={(e) => setFormData({ ...formData, isin: e.target.value.toUpperCase() })}
                        placeholder="Ex: US0378331005"
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Setor</Label>
                      <Input
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Ex: Technology"
                      />
                    </div>
                  </div>
                  
                  {/* Indústria + Preço */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Indústria</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="Ex: Consumer Electronics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_price">Preço</Label>
                      <Input
                        id="current_price"
                        value={formData.current_price}
                        onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                        placeholder="Ex: 185,50"
                      />
                    </div>
                  </div>

                  {/* Variações de Preço */}
                  <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 mt-4">
                    Variações de Preço
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="change_1d">1 Dia (%)</Label>
                      <Input
                        id="change_1d"
                        value={formData.change_1d}
                        onChange={(e) => setFormData({ ...formData, change_1d: e.target.value })}
                        placeholder="Ex: 2,34"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="change_1w">1 Semana (%)</Label>
                      <Input
                        id="change_1w"
                        value={formData.change_1w}
                        onChange={(e) => setFormData({ ...formData, change_1w: e.target.value })}
                        placeholder="Ex: -1,12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="change_ytd">YTD (%)</Label>
                      <Input
                        id="change_ytd"
                        value={formData.change_ytd}
                        onChange={(e) => setFormData({ ...formData, change_ytd: e.target.value })}
                        placeholder="Ex: 45,67"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4 mt-0">
                  {(formData.security_type === "equity" || formData.security_type === "etf") && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Market Cap</Label>
                          <Input
                            value={formData.market_cap}
                            onChange={(e) => setFormData({ ...formData, market_cap: e.target.value })}
                            placeholder="Ex: 3000000000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>EPS</Label>
                          <Input
                            value={formData.eps}
                            onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                            placeholder="Ex: 6,42"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>P/E Ratio</Label>
                          <Input
                            value={formData.pe_ratio}
                            onChange={(e) => setFormData({ ...formData, pe_ratio: e.target.value })}
                            placeholder="Ex: 28,5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>P/B Ratio</Label>
                          <Input
                            value={formData.pb_ratio}
                            onChange={(e) => setFormData({ ...formData, pb_ratio: e.target.value })}
                            placeholder="Ex: 48,2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ROE (%)</Label>
                          <Input
                            value={formData.roe}
                            onChange={(e) => setFormData({ ...formData, roe: e.target.value })}
                            placeholder="Ex: 147,25"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>FCF</Label>
                          <Input
                            value={formData.fcf}
                            onChange={(e) => setFormData({ ...formData, fcf: e.target.value })}
                            placeholder="Ex: 99584000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>FCF Yield (%)</Label>
                          <Input
                            value={formData.fcf_yield}
                            onChange={(e) => setFormData({ ...formData, fcf_yield: e.target.value })}
                            placeholder="Ex: 3,32"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Margem Operacional (%)</Label>
                          <Input
                            value={formData.operating_margin}
                            onChange={(e) => setFormData({ ...formData, operating_margin: e.target.value })}
                            placeholder="Ex: 29,8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Crescimento Receita (%)</Label>
                          <Input
                            value={formData.revenue_growth}
                            onChange={(e) => setFormData({ ...formData, revenue_growth: e.target.value })}
                            placeholder="Ex: 8,5"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>D/E Ratio</Label>
                          <Input
                            value={formData.debt_to_equity}
                            onChange={(e) => setFormData({ ...formData, debt_to_equity: e.target.value })}
                            placeholder="Ex: 1,87"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Interest Coverage</Label>
                          <Input
                            value={formData.interest_coverage}
                            onChange={(e) => setFormData({ ...formData, interest_coverage: e.target.value })}
                            placeholder="Ex: 29,5"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dividend Yield (%)</Label>
                          <Input
                            value={formData.dividend_yield}
                            onChange={(e) => setFormData({ ...formData, dividend_yield: e.target.value })}
                            placeholder="Ex: 0,55"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payout Ratio (%)</Label>
                          <Input
                            value={formData.payout_ratio}
                            onChange={(e) => setFormData({ ...formData, payout_ratio: e.target.value })}
                            placeholder="Ex: 15,6"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {formData.security_type === "bond" && (
                    <p className="text-sm text-muted-foreground">Campos de bond disponíveis na tab específica.</p>
                  )}
                  {formData.security_type === "crypto" && (
                    <p className="text-sm text-muted-foreground">Campos de crypto disponíveis na tab específica.</p>
                  )}
                  {formData.security_type === "commodity" && (
                    <p className="text-sm text-muted-foreground">Campos de commodity disponíveis na tab específica.</p>
                  )}
                  {formData.security_type === "currency" && (
                    <p className="text-sm text-muted-foreground">Moedas não têm métricas adicionais.</p>
                  )}
                </TabsContent>

                <TabsContent value="type-specific" className="space-y-4 mt-0">
                  {formData.security_type === "bond" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Taxa de Cupão (%)</Label>
                          <Input
                            value={formData.coupon_rate}
                            onChange={(e) => setFormData({ ...formData, coupon_rate: e.target.value })}
                            placeholder="Ex: 4,5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maturidade</Label>
                          <Input
                            type="date"
                            value={formData.maturity_date}
                            onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rating de Crédito</Label>
                          <Input
                            value={formData.credit_rating}
                            onChange={(e) => setFormData({ ...formData, credit_rating: e.target.value })}
                            placeholder="Ex: AAA, AA+, BBB-"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>YTM (%)</Label>
                          <Input
                            value={formData.yield_to_maturity}
                            onChange={(e) => setFormData({ ...formData, yield_to_maturity: e.target.value })}
                            placeholder="Ex: 5,2"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {formData.security_type === "etf" && (
                    <>
                      {/* Estrutura e Custos */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Estrutura e Custos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>TER / Expense Ratio (%)</Label>
                          <Input
                            value={formData.expense_ratio}
                            onChange={(e) => setFormData({ ...formData, expense_ratio: e.target.value })}
                            placeholder="Ex: 0,07"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>AUM</Label>
                          <Input
                            value={formData.aum}
                            onChange={(e) => setFormData({ ...formData, aum: e.target.value })}
                            placeholder="Ex: 500000000000"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Domicílio</Label>
                          <Select
                            value={formData.domicile}
                            onValueChange={(value) => setFormData({ ...formData, domicile: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IE">Irlanda (IE)</SelectItem>
                              <SelectItem value="LU">Luxemburgo (LU)</SelectItem>
                              <SelectItem value="US">Estados Unidos (US)</SelectItem>
                              <SelectItem value="DE">Alemanha (DE)</SelectItem>
                              <SelectItem value="CH">Suíça (CH)</SelectItem>
                              <SelectItem value="UK">Reino Unido (UK)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Política de Distribuição</Label>
                          <Select
                            value={formData.distribution_policy}
                            onValueChange={(value) => setFormData({ ...formData, distribution_policy: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accumulating">Acumulativo (Acc)</SelectItem>
                              <SelectItem value="distributing">Distributivo (Dist)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Índice de Referência</Label>
                          <Input
                            value={formData.tracking_index}
                            onChange={(e) => setFormData({ ...formData, tracking_index: e.target.value })}
                            placeholder="Ex: S&P 500, MSCI World"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bolsa de Listagem</Label>
                          <Input
                            value={formData.exchange}
                            onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                            placeholder="Ex: XETRA, LSE, NYSE"
                          />
                        </div>
                      </div>

                      {/* NAV e Liquidez */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 pt-4">Valor e Liquidez</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>NAV por Cota</Label>
                          <Input
                            value={formData.nav}
                            onChange={(e) => setFormData({ ...formData, nav: e.target.value })}
                            placeholder="Ex: 523,45"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Premium/Desconto vs NAV (%)</Label>
                          <Input
                            value={formData.nav_premium_discount}
                            onChange={(e) => setFormData({ ...formData, nav_premium_discount: e.target.value })}
                            placeholder="Ex: -0,02"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Volume Médio Diário</Label>
                          <Input
                            value={formData.avg_daily_volume}
                            onChange={(e) => setFormData({ ...formData, avg_daily_volume: e.target.value })}
                            placeholder="Ex: 5000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bid-Ask Spread (%)</Label>
                          <Input
                            value={formData.bid_ask_spread}
                            onChange={(e) => setFormData({ ...formData, bid_ask_spread: e.target.value })}
                            placeholder="Ex: 0,01"
                          />
                        </div>
                      </div>

                      {/* Performance e Risco */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 pt-4">Performance e Risco</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Peso Top-10 Holdings (%)</Label>
                          <Input
                            value={formData.top_10_holdings_weight}
                            onChange={(e) => setFormData({ ...formData, top_10_holdings_weight: e.target.value })}
                            placeholder="Ex: 28,5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tracking Error (%)</Label>
                          <Input
                            value={formData.tracking_error}
                            onChange={(e) => setFormData({ ...formData, tracking_error: e.target.value })}
                            placeholder="Ex: 0,05"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Retorno 1 Ano (%)</Label>
                          <Input
                            value={formData.return_1y}
                            onChange={(e) => setFormData({ ...formData, return_1y: e.target.value })}
                            placeholder="Ex: 24,5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Retorno 3 Anos (%)</Label>
                          <Input
                            value={formData.return_3y}
                            onChange={(e) => setFormData({ ...formData, return_3y: e.target.value })}
                            placeholder="Ex: 12,8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Retorno 5 Anos (%)</Label>
                          <Input
                            value={formData.return_5y}
                            onChange={(e) => setFormData({ ...formData, return_5y: e.target.value })}
                            placeholder="Ex: 15,2"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Volatilidade Anualizada (%)</Label>
                        <Input
                          value={formData.volatility}
                          onChange={(e) => setFormData({ ...formData, volatility: e.target.value })}
                          placeholder="Ex: 18,5"
                        />
                      </div>
                    </>
                  )}

                  {formData.security_type === "crypto" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Circulating Supply</Label>
                          <Input
                            value={formData.circulating_supply}
                            onChange={(e) => setFormData({ ...formData, circulating_supply: e.target.value })}
                            placeholder="Ex: 19500000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Supply</Label>
                          <Input
                            value={formData.max_supply}
                            onChange={(e) => setFormData({ ...formData, max_supply: e.target.value })}
                            placeholder="Ex: 21000000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Blockchain</Label>
                        <Input
                          value={formData.blockchain}
                          onChange={(e) => setFormData({ ...formData, blockchain: e.target.value })}
                          placeholder="Ex: Bitcoin, Ethereum, Solana"
                        />
                      </div>
                    </>
                  )}

                  {formData.security_type === "commodity" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Commodity</Label>
                          <Input
                            value={formData.commodity_type}
                            onChange={(e) => setFormData({ ...formData, commodity_type: e.target.value })}
                            placeholder="Ex: Gold, Oil, Natural Gas"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tamanho do Contrato</Label>
                          <Input
                            value={formData.contract_size}
                            onChange={(e) => setFormData({ ...formData, contract_size: e.target.value })}
                            placeholder="Ex: 100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mês de Entrega</Label>
                        <Input
                          value={formData.delivery_month}
                          onChange={(e) => setFormData({ ...formData, delivery_month: e.target.value })}
                          placeholder="Ex: Dec 2025"
                        />
                      </div>
                    </>
                  )}

                  {formData.security_type === "equity" && (
                    <>
                      {/* Analyst Coverage */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Cobertura de Analistas</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Preço Alvo</Label>
                          <Input
                            value={formData.analyst_target_price}
                            onChange={(e) => setFormData({ ...formData, analyst_target_price: e.target.value })}
                            placeholder="Ex: 250,50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Target High</Label>
                          <Input
                            value={formData.analyst_target_high}
                            onChange={(e) => setFormData({ ...formData, analyst_target_high: e.target.value })}
                            placeholder="Ex: 300,00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Target Low</Label>
                          <Input
                            value={formData.analyst_target_low}
                            onChange={(e) => setFormData({ ...formData, analyst_target_low: e.target.value })}
                            placeholder="Ex: 200,00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nº Analistas</Label>
                          <Input
                            value={formData.analyst_count}
                            onChange={(e) => setFormData({ ...formData, analyst_count: e.target.value })}
                            placeholder="Ex: 35"
                          />
                        </div>
                      </div>
                      
                      {/* Analyst History - Mini table */}
                      {(formData.analyst_last_month_count || formData.analyst_last_quarter_count) && (
                        <>
                          <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 pt-4">Histórico de Análises</h4>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Período</TableHead>
                                  <TableHead className="text-xs text-center">Análises</TableHead>
                                  <TableHead className="text-xs text-right">Média</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="text-xs">Último mês</TableCell>
                                  <TableCell className="text-xs text-center font-mono">
                                    {formData.analyst_last_month_count || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-mono">
                                    {formData.analyst_last_month_avg 
                                      ? formatCurrency(parseNumber(formData.analyst_last_month_avg) || 0, formData.currency)
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-xs">Último trimestre</TableCell>
                                  <TableCell className="text-xs text-center font-mono">
                                    {formData.analyst_last_quarter_count || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-mono">
                                    {formData.analyst_last_quarter_avg 
                                      ? formatCurrency(parseNumber(formData.analyst_last_quarter_avg) || 0, formData.currency)
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}

                      {/* Publisher Badges */}
                      {formData.analyst_publishers && formData.analyst_publishers.length > 0 && (
                        <>
                          <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 pt-4">Fontes</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.analyst_publishers.map((publisher, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {publisher}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {formData.security_type === "currency" && (
                    <>
                      {/* Par e Estrutura */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Par e Estrutura</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Moeda Base</Label>
                          <Input
                            value={formData.base_currency}
                            onChange={(e) => setFormData({ ...formData, base_currency: e.target.value })}
                            placeholder="Ex: EUR"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Moeda Cotação</Label>
                          <Input
                            value={formData.quote_currency}
                            onChange={(e) => setFormData({ ...formData, quote_currency: e.target.value })}
                            placeholder="Ex: USD"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Spot Rate</Label>
                        <Input
                          value={formData.spot_rate}
                          onChange={(e) => setFormData({ ...formData, spot_rate: e.target.value })}
                          placeholder="Ex: 1,0850"
                        />
                      </div>

                      {/* Núcleo de Taxa de Juro */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 pt-4">Núcleo de Taxa de Juro</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Taxa Oficial Base (%)</Label>
                          <Input
                            value={formData.base_interest_rate}
                            onChange={(e) => setFormData({ ...formData, base_interest_rate: e.target.value })}
                            placeholder="Ex: 4,25"
                          />
                          <p className="text-xs text-muted-foreground">Policy rate do banco central</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Taxa Oficial Cotação (%)</Label>
                          <Input
                            value={formData.quote_interest_rate}
                            onChange={(e) => setFormData({ ...formData, quote_interest_rate: e.target.value })}
                            placeholder="Ex: 5,25"
                          />
                          <p className="text-xs text-muted-foreground">Policy rate do banco central</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Inflação Base (%)</Label>
                          <Input
                            value={formData.base_inflation_rate}
                            onChange={(e) => setFormData({ ...formData, base_inflation_rate: e.target.value })}
                            placeholder="Ex: 2,4"
                          />
                          <p className="text-xs text-muted-foreground">Inflação atual/esperada</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Inflação Cotação (%)</Label>
                          <Input
                            value={formData.quote_inflation_rate}
                            onChange={(e) => setFormData({ ...formData, quote_inflation_rate: e.target.value })}
                            placeholder="Ex: 3,2"
                          />
                          <p className="text-xs text-muted-foreground">Inflação atual/esperada</p>
                        </div>
                      </div>

                      {/* Métricas Derivadas (read-only) */}
                      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <h5 className="text-sm font-medium">Métricas Derivadas</h5>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Diferencial Taxa Nominal</span>
                            <p className="font-mono font-medium">
                              {formData.base_interest_rate && formData.quote_interest_rate
                                ? `${(parseFloat(formData.base_interest_rate.replace(",", ".")) - parseFloat(formData.quote_interest_rate.replace(",", "."))).toFixed(2).replace(".", ",")}%`
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">Base - Cotação</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Taxa Real Base</span>
                            <p className="font-mono font-medium">
                              {formData.base_interest_rate && formData.base_inflation_rate
                                ? `${(parseFloat(formData.base_interest_rate.replace(",", ".")) - parseFloat(formData.base_inflation_rate.replace(",", "."))).toFixed(2).replace(".", ",")}%`
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">Nominal - Inflação</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Taxa Real Cotação</span>
                            <p className="font-mono font-medium">
                              {formData.quote_interest_rate && formData.quote_inflation_rate
                                ? `${(parseFloat(formData.quote_interest_rate.replace(",", ".")) - parseFloat(formData.quote_inflation_rate.replace(",", "."))).toFixed(2).replace(".", ",")}%`
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">Nominal - Inflação</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground text-sm">Diferencial Taxa Real</span>
                          <p className="font-mono font-medium text-lg">
                            {formData.base_interest_rate && formData.quote_interest_rate && formData.base_inflation_rate && formData.quote_inflation_rate
                              ? (() => {
                                  const realBase = parseFloat(formData.base_interest_rate.replace(",", ".")) - parseFloat(formData.base_inflation_rate.replace(",", "."));
                                  const realQuote = parseFloat(formData.quote_interest_rate.replace(",", ".")) - parseFloat(formData.quote_inflation_rate.replace(",", "."));
                                  return `${(realBase - realQuote).toFixed(2).replace(".", ",")}%`;
                                })()
                              : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">Métrica central para tendência de médio/longo prazo</p>
                        </div>
                      </div>

                      {/* Credibilidade e Risco */}
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2 pt-4">Credibilidade e Risco</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rating Crédito Base</Label>
                          <Input
                            value={formData.base_credit_rating}
                            onChange={(e) => setFormData({ ...formData, base_credit_rating: e.target.value })}
                            placeholder="Ex: AAA"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rating Crédito Cotação</Label>
                          <Input
                            value={formData.quote_credit_rating}
                            onChange={(e) => setFormData({ ...formData, quote_credit_rating: e.target.value })}
                            placeholder="Ex: AA+"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Título</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este título? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              {deleteMutation.isPending ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
