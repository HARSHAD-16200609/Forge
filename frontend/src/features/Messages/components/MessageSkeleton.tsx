export function MessageSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-6" aria-hidden="true">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-3">
                    <div className="size-10 shrink-0 animate-pulse rounded-lg bg-muted" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                            <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}
