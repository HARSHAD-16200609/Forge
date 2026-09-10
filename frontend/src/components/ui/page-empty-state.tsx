import type { ReactNode } from "react";

export function PageEmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                {icon}
            </span>
            <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
            <p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}