import { ArrowRight, Lock, Globe, Crown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workspace, WorkspaceListProps } from "../types";



export function WorkspaceList({
    workspaces,
    onWorkspaceClick,
}: WorkspaceListProps) {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Your Workspaces
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Select a workspace to continue collaborating with your team.
                </p>
            </div>

            {/* Workspace Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces?.length ? (
                    workspaces.map(({ role, workspace }) => (
                        <WorkspaceCard
                            key={workspace.id}
                            workspace={workspace}
                            role={role}
                            onClick={() => onWorkspaceClick?.(workspace)}
                        />
                    ))
                ) : (
                    <div className="flex min-h-[300px] ">
                        <p className="text-muted-foreground">
                            No workspaces found.
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

function WorkspaceCard({
    workspace,
    role,
    onClick,
}: WorkspaceCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl",
                "border border-border/60 bg-card",
                "p-5",
                "transition-all duration-300",
                "hover:-translate-y-1 hover:border-border",
                "hover:shadow-xl hover:shadow-black/5"
            )}
        >
            {/* Top */}
            <div className="flex items-start justify-between gap-4">
                {/* Workspace Icon */}
                <div
                    className={cn(
                        "flex size-12 shrink-0 items-center justify-center",
                        "rounded-xl text-lg font-semibold",
                        role === "OWNER"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    {workspace.workspaceName.charAt(0).toUpperCase()}
                </div>

                {/* Role */}
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full",
                        "px-2.5 py-1 text-xs font-medium",
                        role === "OWNER"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                >
                    {role === "OWNER" ? (
                        <Crown className="size-3" />
                    ) : (
                        <Users className="size-3" />
                    )}

                    {role === "OWNER" ? "Owner" : "Member"}
                </span>
            </div>

            {/* Content */}
            <div className="mt-5">
                <h3 className="truncate text-lg font-semibold">
                    {workspace.workspaceName}
                </h3>

                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                    {workspace.description}
                </p>
            </div>

            {/* Bottom */}
            <div className="mt-5 flex items-center justify-between">
                {/* Visibility */}
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

                {/* Open */}
                <div
                    className={cn(
                        "flex size-8 items-center justify-center rounded-full",
                        "bg-muted transition-all duration-300",
                        "group-hover:bg-primary group-hover:text-primary-foreground",
                        "group-hover:translate-x-0.5"
                    )}
                >
                    <ArrowRight className="size-4" />
                </div>
            </div>
        </div>
    );
}