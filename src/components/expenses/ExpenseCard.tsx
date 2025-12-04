import { useNavigate } from "react-router-dom";
import { Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface ExpenseCardProps {
  claim: {
    id: string;
    claim_number: number;
    created_at: string;
    claim_type: string;
    description: string | null;
    total_amount: number;
    status: string;
  };
}

const ExpenseCard = ({ claim }: ExpenseCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      rascunho: "bg-muted text-muted-foreground",
      submetido: "bg-blue-500/20 text-blue-400",
      aprovado: "bg-green-500/20 text-green-400",
      pago: "bg-emerald-500/20 text-emerald-400",
      rejeitado: "bg-destructive/20 text-destructive",
    };

    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      submetido: "Submetido",
      aprovado: "Aprovado",
      pago: "Pago",
      rejeitado: "Rejeitado",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "reembolso" ? "Reembolso" : "Justificação Cartão";
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        {/* Header: Date and Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {format(new Date(claim.created_at), "dd/MM/yyyy")}
          </span>
          {getStatusBadge(claim.status)}
        </div>

        {/* Body: Description and Type */}
        <div className="space-y-1">
          <p className="font-medium text-foreground line-clamp-2">
            {claim.description || `Requisição #${claim.claim_number}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {getTypeBadge(claim.claim_type)}
          </p>
        </div>

        {/* Footer: Total and Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(Number(claim.total_amount))}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/expenses/${claim.id}`)}
              className="h-9 w-9 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {claim.status === "rascunho" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/expenses/${claim.id}/edit`)}
                className="h-9 w-9 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
