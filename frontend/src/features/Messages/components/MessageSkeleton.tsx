export function MessageSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-6" aria-hidden="true">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-3">
                    <div className="skeleton size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="skeleton h-3.5 w-24 rounded" />
                            <div className="skeleton h-2.5 w-16 rounded" />
                        </div>
                        <div className="skeleton h-3.5 w-3/4 rounded" />
                        <div className="skeleton h-3.5 w-1/2 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}