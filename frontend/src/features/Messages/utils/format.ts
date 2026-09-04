export function formatMessageTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;

    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

    const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);

    if (dayDiff === 0) return `Today at ${time}`;
    if (dayDiff === 1) return `Yesterday at ${time}`;
    if (date.getFullYear() === now.getFullYear()) {
        const day = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        }).format(date);
        return `${day} at ${time}`;
    }

    const full = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
    return `${full} at ${time}`;
}

export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageType(fileType: string, mimeType?: string): boolean {
    const type = (fileType ?? "").toLowerCase();
    const mime = (mimeType ?? "").toLowerCase();
    return type === "image" || mime.startsWith("image/");
}
