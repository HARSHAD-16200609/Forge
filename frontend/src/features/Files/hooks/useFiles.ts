import { useInfiniteQuery } from "@tanstack/react-query";
import type { FileCategory } from "../files.types";
import { filesService } from "../files.service";

export interface useFilesParams {
    workspaceId: string;
    fileType?: FileCategory;
    search?: string;
    limit?: number;
    enabled?: boolean;
}

export function useFiles({
    workspaceId,
    fileType,
    search,
    limit = 30,
    enabled = true,
}: useFilesParams) {
    return useInfiniteQuery({
        queryKey: ["workspace-files", workspaceId, fileType ?? "ALL", search ?? ""],
        enabled: enabled && !!workspaceId,
        queryFn: ({ pageParam }) =>
            filesService.getFiles({
                workspaceId,
                fileType,
                search,
                limit,
                cursor: pageParam ?? undefined,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
            if ((error as { response?: { status?: number } })?.response?.status === 401) {
                return false;
            }

            return failureCount < 3;
        },
    });
}