export type FileCategory = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER";

export interface WorkspaceFile {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    fileSize: number;
    fileType: FileCategory;
    uploadedAt: string;
    uploader: {
        id: string;
        username: string;
        name: string | null;
        avatar: string | null;
    } | null;
    source: {
        type: "channel" | "conversation";
        id: string;
        label: string;
    };
}

export interface paginatedFiles {
    files: WorkspaceFile[];
    hasMore: boolean;
    nextCursor: string | null;
}