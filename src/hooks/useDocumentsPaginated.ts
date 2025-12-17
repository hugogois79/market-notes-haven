import { useState, useCallback, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SortField = "name" | "updated_at" | "created_at" | "file_size" | "document_type" | "status" | "financial_value";
export type SortDirection = "asc" | "desc";

interface UseDocumentsPaginatedParams {
  companyId: string | undefined;
  folderId: string | null;
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  pageSize?: number;
}

interface DocumentRow {
  id: string;
  name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  document_type: string | null;
  status: string | null;
  tags: string[] | null;
  notes: string | null;
  financial_value: number | null;
  file_hash: string | null;
  folder_id: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}

export function useDocumentsPaginated({
  companyId,
  folderId,
  searchQuery,
  typeFilter,
  statusFilter,
  sortField,
  sortDirection,
  pageSize = 50,
}: UseDocumentsPaginatedParams) {
  const queryClient = useQueryClient();
  const [totalCount, setTotalCount] = useState<number>(0);

  // Build query key that includes all filter/sort params
  const queryKey = [
    "company-documents-paginated",
    companyId,
    folderId,
    searchQuery,
    typeFilter,
    statusFilter,
    sortField,
    sortDirection,
  ];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!companyId) return { documents: [], nextPage: null, count: 0 };

      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Build the query with server-side filtering
      let query = supabase
        .from("company_documents")
        .select("*", { count: "exact" })
        .eq("company_id", companyId);

      // Folder filter
      if (folderId) {
        query = query.eq("folder_id", folderId);
      } else {
        query = query.is("folder_id", null);
      }

      // Search filter (using ilike for case-insensitive search)
      if (searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      }

      // Type filter
      if (typeFilter && typeFilter !== "All") {
        query = query.eq("document_type", typeFilter);
      }

      // Status filter
      if (statusFilter && statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }

      // Server-side sorting - map frontend field names to DB columns
      const dbSortField = sortField === "updated_at" ? "updated_at" : 
                          sortField === "created_at" ? "created_at" :
                          sortField === "file_size" ? "file_size" :
                          sortField === "document_type" ? "document_type" :
                          sortField === "status" ? "status" :
                          sortField === "financial_value" ? "financial_value" :
                          "name";
      
      // Handle null values for financial_value
      if (sortField === "financial_value") {
        query = query.order(dbSortField, { 
          ascending: sortDirection === "asc",
          nullsFirst: sortDirection === "asc" // Nulls first when ascending, last when descending
        });
      } else {
        query = query.order(dbSortField, { ascending: sortDirection === "asc" });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data: documents, error, count } = await query;

      if (error) throw error;

      return {
        documents: documents as DocumentRow[],
        nextPage: documents && documents.length === pageSize ? pageParam + 1 : null,
        count: count || 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!companyId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // Update total count when data changes
  useEffect(() => {
    if (data?.pages[0]?.count !== undefined) {
      setTotalCount(data.pages[0].count);
    }
  }, [data?.pages]);

  // Flatten all pages into single array
  const documents = data?.pages.flatMap((page) => page.documents) || [];

  // Invalidate and refetch when needed
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKey.slice(0, 2) }); // Invalidate all variations
  }, [queryClient, queryKey]);

  // Load more documents (for infinite scroll)
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    documents,
    totalCount,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    refetch,
    invalidate,
  };
}
