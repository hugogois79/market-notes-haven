
import { Badge } from "@/components/ui/badge";
import { Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
}

const TagBadge = ({ tag, count, selected = false, onClick }: TagBadgeProps) => {
  return (
    <Badge 
      variant={selected ? "default" : "secondary"}
      className={cn(
        "text-sm py-1 px-3 cursor-pointer hover:bg-opacity-90 transition-all flex items-center gap-1",
        selected ? 'bg-[#1EAEDB]' : '',
        onClick ? 'cursor-pointer' : 'cursor-default'
      )}
      onClick={onClick}
    >
      <TagIcon size={12} className="mr-1" />
      {tag}
      {count !== undefined && (
        <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
          {count}
        </span>
      )}
    </Badge>
  );
};

export default TagBadge;
