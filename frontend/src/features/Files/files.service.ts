import { api } from "@/lib/api";
import type { FileCategory, paginatedFiles } from "./files.types";

export interface getFilesParams {
    workspaceId: string;
    fileType?: FileCategory;
    search?: string;
    limit?: number;
    cursor?: string;
}

class FilesService {
    async getFiles(params: getFilesParams): Promise<paginatedFiles> {
        const queryParams = new URLSearchParams();

        queryParams.set("limit", String(params.limit ?? 30));

        if (params.cursor) {
            queryParams.set("cursor", params.cursor);
        }

        if (params.fileType) {
            queryParams.set("fileType", params.fileType);
        }

        if (params.search) {
            queryParams.set("search", params.search);
        }

        const files = await api.get(
            `/workspace/${params.workspaceId}/files?${queryParams.toString()}`,
        );

        return files.data.data;
    }
}

export const filesService = new FilesService();