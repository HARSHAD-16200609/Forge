import { ArrowRight, Lock, Globe, Crown, Users, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Workspace, WorkspaceListProps } from "../types";
import { useDeleteWorkspace } from "../hooks/useWorkspaces";
import { APP_EASE } from "@/components/ui/app-motion";

export function WorkspaceList({
    workspaces,
    onWorkspaceClick,
}: WorkspaceListProps) {
    const reduce = useReducedMotion();
    return (
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Your Workspaces
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Select a workspace to continue collaborating with your team.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces?.length ? (
                    workspaces.map(({ role, workspace }, i) => (
                        <motion.div
                            key={workspace.id}
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: APP_EASE,
                                delay: i * 0.05,
                            }}
                            className="h-full"
                        >
                            <WorkspaceCard
                                workspace={workspace}
                                role={role}
                                onClick={() => onWorkspaceClick?.(workspace)}
                            />
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 text-center">
                        <p className="text-muted-foreground">No workspaces found.</p>
                        <p className="mt-1 text-sm text-muted-foreground/70">
                            Create or join a workspace to get started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface WorkspaceCardProps {
    workspace: Workspace["workspace"];
    role: Workspace["role"];
    onClick?: () => void;
}

function WorkspaceCard({ workspace, role, onClick }: WorkspaceCardProps) {
    const handleDelete = useDeleteWorkspace();
    const reduce = useReducedMotion();

    function confirmDelete() {
        if (window.confirm(`Delete "${workspace.workspaceName}"? This cannot be undone.`)) {
            void handleDelete.mutateAsync(workspace.id);
        }
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl",
                "border border-border/60 bg-card",
                "p-5",
                "transition-all duration-300",
                "hover:-translate-y-1 hover:border-border",
                "hover:shadow-xl hover:shadow-black/5",
                reduce && "motion-reduce:transform-none",
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div
                    className={cn(
                        "flex size-12 shrink-0 items-center justify-center",
                        "rounded-xl text-lg font-semibold",
                        role === "OWNER"
                            ? "bg-brand/10 text-brand"
                            : "bg-muted text-muted-foreground",
                    )}
                >
                    {workspace.workspaceName.charAt(0).toUpperCase()}
                </div>

                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full",
                        "px-2.5 py-1 text-xs font-medium",
                        role === "OWNER"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    )}
                >
                    {role === "OWNER" ? <Crown className="size-3" /> : <Users className="size-3" />}

                    {role === "OWNER" ? "Owner" : "Member"}
                </span>
            </div>

            <div className="mt-5">
                <h3 className="truncate text-lg font-semibold">
                    {workspace.workspaceName}
                </h3>

                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                    {workspace.description}
                </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {workspace.visibility === "PUBLIC" ? (
                        <>
                            <Globe className="size-3.5" />
                            Public
                        </>
                    ) : (
                        <>
                            <Lock className="size-3.5" />
                            Private
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label={`Delete ${workspace.workspaceName}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete();
                        }}
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                            "text-muted-foreground/0 transition-all duration-200",
                            "focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:outline-none",
                            "group-hover:text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                        )}
                    >
                        <Trash2 className="size-4" />
                    </button>

                    <button
                        type="button"
                        aria-label={`Open ${workspace.workspaceName}`}
                        onClick={onClick}
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full",
                            "bg-muted transition-all duration-300",
                            "group-hover:bg-brand group-hover:text-brand-foreground",
                            "group-hover:translate-x-0.5",
                            "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                        )}
                    >
                        <ArrowRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}