import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Folder,
  FileText,
  Download,
  ChevronRight,
  HardDrive,
  File,
  FileSpreadsheet,
  FileImage,
  Mail,
} from "lucide-react";

interface FileItem {
  name: string;
  type: "file" | "dir";
  size: number | null;
  sizeFormatted: string | null;
  modified: string;
}

interface ServerFileBrowserProps {
  folderPaths: { folder_path: string; label: string | null }[];
}

const DRIVE_URL = "https://drive.robsonway.com";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return <FileText className="h-4 w-4 text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FileText className="h-4 w-4 text-blue-500" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <FileImage className="h-4 w-4 text-purple-500" />;
  if (["eml", "msg"].includes(ext)) return <Mail className="h-4 w-4 text-amber-500" />;
  return <File className="h-4 w-4 text-slate-400" />;
}

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SingleFolderBrowser({ basePath, label }: { basePath: string; label: string | null }) {
  const [currentPath, setCurrentPath] = useState(basePath);

  const { data, isLoading, error } = useQuery({
    queryKey: ["legal-files", currentPath],
    queryFn: async () => {
      const res = await fetch(`/api/legal-files/list?folder=${encodeURIComponent(currentPath)}`);
      if (!res.ok) throw new Error("Failed to load files");
      return res.json();
    },
  });

  const items: FileItem[] = data?.items || [];
  const pathParts = currentPath.split("/").filter(Boolean);

  const navigateTo = (subFolder: string) => {
    setCurrentPath(currentPath === "." ? subFolder : `${currentPath}/${subFolder}`);
  };

  const navigateToIndex = (index: number) => {
    if (index < 0) {
      setCurrentPath(basePath);
    } else {
      setCurrentPath(pathParts.slice(0, index + 1).join("/"));
    }
  };

  const getDownloadUrl = (fileName: string) => {
    const encodedPath = currentPath.split("/").map(encodeURIComponent).join("/");
    return `${DRIVE_URL}/${encodedPath}/${encodeURIComponent(fileName)}`;
  };

  const fileCount = items.filter((i) => i.type === "file").length;
  const dirCount = items.filter((i) => i.type === "dir").length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-slate-500" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer text-xs"
                  onClick={() => setCurrentPath(basePath)}
                >
                  {basePath}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathParts.slice(1).map((part, i) => (
                <BreadcrumbItem key={i}>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  {i === pathParts.length - 2 ? (
                    <BreadcrumbPage className="text-xs">{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer text-xs"
                      onClick={() => navigateToIndex(i + 1)}
                    >
                      {part}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {label && <Badge variant="outline" className="text-xs">{label}</Badge>}
          <span className="text-xs text-muted-foreground">
            {fileCount} ficheiro{fileCount !== 1 ? "s" : ""}{dirCount > 0 ? `, ${dirCount} pasta${dirCount !== 1 ? "s" : ""}` : ""}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">Carregando ficheiros...</div>
      ) : error ? (
        <div className="text-center py-6 text-sm text-destructive">Erro ao carregar ficheiros</div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">Pasta vazia</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[100px]">Tamanho</TableHead>
              <TableHead className="w-[110px]">Modificado</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.name} className="group">
                <TableCell>
                  {item.type === "dir" ? (
                    <button
                      onClick={() => navigateTo(item.name)}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ) : (
                    <a
                      href={getDownloadUrl(item.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      {getFileIcon(item.name)}
                      <span className="truncate">{item.name}</span>
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.sizeFormatted || "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(item.modified)}
                </TableCell>
                <TableCell>
                  {item.type === "file" && (
                    <a href={getDownloadUrl(item.name)} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function ServerFileBrowser({ folderPaths }: ServerFileBrowserProps) {
  if (folderPaths.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
        <HardDrive className="h-5 w-5 mx-auto mb-2 text-muted-foreground/50" />
        Nenhuma pasta do servidor mapeada para este caso.
        <br />
        <span className="text-xs">Configure em Gerir Casos → Settings → Folder Mapping.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {folderPaths.map((fp) => (
        <SingleFolderBrowser
          key={fp.folder_path}
          basePath={fp.folder_path}
          label={fp.label}
        />
      ))}
    </div>
  );
}
