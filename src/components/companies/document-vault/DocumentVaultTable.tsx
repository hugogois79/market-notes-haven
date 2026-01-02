import { useCallback, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Folder,
  Download,
  Trash2,
  Edit3,
  Eye,
  Loader2,
  FolderInput,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DocumentRow, FolderRow, SortField, SortDirection, ColumnOption, DEFAULT_CATEGORY_OPTIONS, DEFAULT_STATUS_OPTIONS } from "./types";

interface DocumentVaultTableProps {
  documents: DocumentRow[];
  folders: FolderRow[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  selectedIds: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelectAll: () => void;
  onSelectRow: (id: string) => void;
  onRowClick: (doc: DocumentRow) => void;
  onFolderClick: (folderId: string) => void;
  onDelete: (ids: string[]) => void;
  onDownload: (doc: DocumentRow) => void;
  onEdit: (doc: DocumentRow) => void;
  onUpdateField: (docId: string, field: string, value: string | number | null) => void;
  getCategoryOptions: (folderId: string | null) => ColumnOption[];
  getStatusOptions: (folderId: string | null) => ColumnOption[];
  setLoadMoreElement: (element: HTMLDivElement | null) => void;
  currentFolderId: string | null;
  onMoveToFolder?: (docIds: string[], targetFolderId: string | null) => void;
  onMoveFolder?: (folderId: string, targetFolderId: string | null) => void;
  allFolders?: FolderRow[];
}

const ROW_HEIGHT = 40;

// Get file icon based on mime type
const getFileIcon = (mimeType: string | null, fileName: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const iconClass = "h-4 w-4 flex-shrink-0";
  
  if (mimeType?.includes("pdf") || ext === "pdf") 
    return <FileText className={cn(iconClass, "text-red-500")} />;
  if (mimeType?.includes("word") || ext === "doc" || ext === "docx") 
    return <FileText className={cn(iconClass, "text-blue-600")} />;
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet") || ext === "xls" || ext === "xlsx") 
    return <FileSpreadsheet className={cn(iconClass, "text-green-600")} />;
  if (mimeType?.startsWith("image/")) 
    return <FileImage className={cn(iconClass, "text-purple-500")} />;
  
  return <File className={cn(iconClass, "text-muted-foreground")} />;
};

// Format currency
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

// Badge component for category/status
const StatusBadge = ({ value, options }: { value: string | null; options: ColumnOption[] }) => {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  
  const option = options.find(o => o.label === value);
  const bgColor = option?.color ? `${option.color}20` : "#e5e7eb";
  const textColor = option?.color || "#374151";
  
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {value}
    </span>
  );
};

export function DocumentVaultTable({
  documents,
  folders,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  selectedIds,
  sortField,
  sortDirection,
  onSort,
  onSelectAll,
  onSelectRow,
  onRowClick,
  onFolderClick,
  onDelete,
  onDownload,
  onEdit,
  onUpdateField,
  getCategoryOptions,
  getStatusOptions,
  setLoadMoreElement,
  currentFolderId,
  onMoveToFolder,
  onMoveFolder,
  allFolders = [],
}: DocumentVaultTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);
  const [folderToMove, setFolderToMove] = useState<FolderRow | null>(null);

  // Get available destinations for folder move (exclude self and descendants)
  const getAvailableDestinations = useCallback((folderId: string) => {
    const getDescendantIds = (parentId: string): string[] => {
      const children = allFolders.filter(f => f.parent_folder_id === parentId);
      return children.flatMap(c => [c.id, ...getDescendantIds(c.id)]);
    };
    const descendantIds = [folderId, ...getDescendantIds(folderId)];
    return allFolders.filter(f => !descendantIds.includes(f.id));
  }, [allFolders]);

  const handleOpenMoveFolder = useCallback((folder: FolderRow) => {
    setFolderToMove(folder);
    setMoveFolderOpen(true);
  }, []);

  const handleConfirmMoveFolder = useCallback((targetFolderId: string | null) => {
    if (folderToMove && onMoveFolder) {
      onMoveFolder(folderToMove.id, targetFolderId);
    }
    setMoveFolderOpen(false);
    setFolderToMove(null);
  }, [folderToMove, onMoveFolder]);

  // Combine folders and documents for the table
  const tableData = useMemo(() => {
    const folderRows = folders.map(f => ({ ...f, _type: "folder" as const }));
    const docRows = documents.map(d => ({ ...d, _type: "document" as const }));
    return [...folderRows, ...docRows];
  }, [folders, documents]);

  // Column definitions
  const columns = useMemo<ColumnDef<typeof tableData[0]>[]>(() => [
    // Select column (fixed left)
    {
      id: "select",
      size: 40,
      header: () => (
        <Checkbox
          checked={selectedIds.size > 0 && selectedIds.size === documents.length}
          onCheckedChange={onSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (item._type === "folder") {
          return <Checkbox disabled className="opacity-30" />;
        }
        return (
          <Checkbox
            checked={selectedIds.has(item.id)}
            onCheckedChange={() => onSelectRow(item.id)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
    },
    // File name column
    {
      id: "name",
      accessorKey: "name",
      header: () => (
        <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={onSort}>
          File
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const item = row.original;
        
        if (item._type === "folder") {
          return (
            <div 
              className={cn(
                "flex items-center gap-2 min-w-0 py-1 px-1 -mx-1 rounded transition-colors",
                dropTargetFolderId === item.id && "bg-primary/20 ring-2 ring-primary"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (draggedDocId) {
                  setDropTargetFolderId(item.id);
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDropTargetFolderId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (draggedDocId && onMoveToFolder) {
                  // Move selected docs if dragged doc is selected, otherwise just the dragged doc
                  const docsToMove = selectedIds.has(draggedDocId) 
                    ? Array.from(selectedIds) 
                    : [draggedDocId];
                  onMoveToFolder(docsToMove, item.id);
                }
                setDraggedDocId(null);
                setDropTargetFolderId(null);
              }}
            >
              <Folder className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                dropTargetFolderId === item.id ? "text-primary" : "text-amber-500"
              )} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFolderClick(item.id);
                      }}
                      className="font-medium text-primary hover:underline truncate"
                    >
                      {item.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{item.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        }

        const doc = item as DocumentRow;
        const displayName = doc.name.replace(/\.[^/.]+$/, '');
        
        return (
          <div 
            className="flex items-center gap-2 min-w-0"
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              setDraggedDocId(doc.id);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', doc.id);
            }}
            onDragEnd={() => {
              setDraggedDocId(null);
              setDropTargetFolderId(null);
            }}
          >
            {getFileIcon(doc.mime_type, doc.name)}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(doc);
                    }}
                    className="font-medium text-primary hover:underline truncate text-left"
                  >
                    {displayName}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{doc.name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    // Date column
    {
      id: "date",
      accessorKey: "created_at",
      size: 100,
      header: () => (
        <SortableHeader field="created_at" currentField={sortField} direction={sortDirection} onSort={onSort}>
          Date
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (item._type === "folder") return <span className="text-muted-foreground text-xs">—</span>;
        
        const doc = item as DocumentRow;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : "—"}
          </span>
        );
      },
    },
    // Category column
    {
      id: "category",
      accessorKey: "document_type",
      size: 120,
      header: () => <span className="text-xs uppercase">Category</span>,
      cell: ({ row }) => {
        const item = row.original;
        if (item._type === "folder") {
          const folder = item as FolderRow;
          return <StatusBadge value={folder.category} options={getCategoryOptions(folder.parent_folder_id)} />;
        }
        const doc = item as DocumentRow;
        const options = getCategoryOptions(currentFolderId);
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer hover:opacity-80" onClick={(e) => e.stopPropagation()}>
                <StatusBadge value={doc.document_type} options={options} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {options.map((opt) => (
                <DropdownMenuItem
                  key={opt.label}
                  onClick={() => onUpdateField(doc.id, "document_type", opt.label)}
                >
                  <StatusBadge value={opt.label} options={options} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    // Value column
    {
      id: "value",
      accessorKey: "financial_value",
      size: 110,
      header: () => (
        <SortableHeader field="financial_value" currentField={sortField} direction={sortDirection} onSort={onSort}>
          <span className="text-right w-full">Value</span>
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (item._type === "folder") return <span className="text-muted-foreground text-xs">—</span>;
        
        const doc = item as DocumentRow;
        return (
          <span className="text-sm font-mono text-right block tabular-nums">
            {formatCurrency(doc.financial_value)}
          </span>
        );
      },
    },
    // Status column
    {
      id: "status",
      accessorKey: "status",
      size: 110,
      header: () => <span className="text-xs uppercase">Status</span>,
      cell: ({ row }) => {
        const item = row.original;
        if (item._type === "folder") {
          const folder = item as FolderRow;
          return <StatusBadge value={folder.status} options={getStatusOptions(folder.parent_folder_id)} />;
        }
        const doc = item as DocumentRow;
        const options = getStatusOptions(currentFolderId);
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer hover:opacity-80" onClick={(e) => e.stopPropagation()}>
                <StatusBadge value={doc.status} options={options} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {options.map((opt) => (
                <DropdownMenuItem
                  key={opt.label}
                  onClick={() => onUpdateField(doc.id, "status", opt.label)}
                >
                  <StatusBadge value={opt.label} options={options} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    // Actions column (fixed right)
    {
      id: "actions",
      size: 50,
      header: () => null,
      cell: ({ row }) => {
        const item = row.original;
        if (item._type === "folder") {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onFolderClick(item.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                {onMoveFolder && (
                  <DropdownMenuItem onClick={() => handleOpenMoveFolder(item as FolderRow)}>
                    <FolderInput className="h-4 w-4 mr-2" />
                    Move to...
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        const doc = item as DocumentRow;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onRowClick(doc)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(doc)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Metadata
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(doc)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete([doc.id])}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [selectedIds, documents.length, sortField, sortDirection, currentFolderId, onSort, onSelectAll, onSelectRow, onRowClick, onFolderClick, onDelete, onDownload, onEdit, onUpdateField, getCategoryOptions, getStatusOptions]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  // Virtualization for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (folders.length === 0 && documents.length === 0) {
    return (
      <div className="border-2 border-dashed border-muted rounded-lg py-16 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No documents yet</p>
        <p className="text-xs mt-1">Drop files here or click upload</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Sticky header */}
      <div className="bg-muted/50 border-b sticky top-0 z-10">
        <div className="flex">
          {table.getHeaderGroups().map(headerGroup => (
            headerGroup.headers.map(header => (
              <div
                key={header.id}
                className={cn(
                  "px-3 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider",
                  header.id === "select" && "w-10 flex-shrink-0",
                  header.id === "actions" && "w-[50px] flex-shrink-0",
                  header.id === "name" && "flex-1 min-w-[200px]",
                  header.id === "date" && "w-[100px]",
                  header.id === "category" && "w-[120px]",
                  header.id === "value" && "w-[110px] text-right",
                  header.id === "status" && "w-[110px]",
                )}
                style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: `min(calc(100vh - 350px), ${(folders.length + documents.length) * ROW_HEIGHT + 100}px)`, maxHeight: "calc(100vh - 350px)" }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualRows.map(virtualRow => {
            const row = rows[virtualRow.index];
            const item = row.original;
            const isSelected = item._type === "document" && selectedIds.has(item.id);
            
            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className={cn(
                  "absolute left-0 w-full flex border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group",
                  isSelected && "bg-primary/5"
                )}
                style={{
                  height: `${ROW_HEIGHT}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => {
                  if (item._type === "document") {
                    onRowClick(item as DocumentRow);
                  }
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <div
                    key={cell.id}
                    className={cn(
                      "px-3 flex items-center overflow-hidden",
                      cell.column.id === "select" && "w-10 flex-shrink-0",
                      cell.column.id === "actions" && "w-[50px] flex-shrink-0 justify-end",
                      cell.column.id === "name" && "flex-1 min-w-[200px]",
                      cell.column.id === "date" && "w-[100px]",
                      cell.column.id === "category" && "w-[120px]",
                      cell.column.id === "value" && "w-[110px] justify-end",
                      cell.column.id === "status" && "w-[110px]",
                    )}
                    style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div
            ref={setLoadMoreElement}
            className="flex items-center justify-center py-4"
          >
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Move Folder Dialog */}
      <Dialog open={moveFolderOpen} onOpenChange={setMoveFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Folder "{folderToMove?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleConfirmMoveFolder(null)}
            >
              <Folder className="h-4 w-4 mr-2" />
              Documents (Root)
            </Button>
            {folderToMove && getAvailableDestinations(folderToMove.id).map(folder => (
              <Button
                key={folder.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleConfirmMoveFolder(folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sortable header component
function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
}: {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = field === currentField;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {children}
      <span className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")}>
        {isActive && direction === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}
