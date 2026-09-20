import type { ReactNode } from "react";
import {
    ArrowUpRight,
    Building2,
    FileQuestion,
    Hash,
    Lock,
    MessagesSquare,
    ShieldX,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { ErrorScreen } from "./ErrorScreen";

export function KineticArrow() {
    return (
        <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:scale-90"
        >
            <ArrowUpRight className="size-3.5" />
        </span>
    );
}

export function ChannelAccessDenied() {
    const navigate = useNavigate();
    const clearSelectedChannelId = useUIStore((s) => s.clearSelectedChannelId);

    return (
        <ErrorScreen
            statusCode="403 Forbidden"
            scope="ACCESS"
            icon={<Lock aria-hidden="true" />}
            title="You're not a member of this channel"
            highlight="member"
            description="This channel is private. Ask a workspace admin for an invite, then check your channel list."
            actions={
                <Button
                    className="group"
                    onClick={() => {
                        clearSelectedChannelId();
                        navigate("/app/home");
                    }}
                >
                    Back to #general
                    <KineticArrow />
                </Button>
            }
        />
    );
}

export function NotFoundContent({
    title = "Page not found",
    description = "The page you're looking for doesn't exist or may have moved.",
    className,
    standalone = false,
    actions,
}: {
    title?: string;
    description?: string;
    className?: string;
    standalone?: boolean;
    actions?: ReactNode;
}) {
    return (
        <ErrorScreen
            className={className}
            standalone={standalone}
            statusCode="404"
            scope="PAGE"
            icon={<FileQuestion aria-hidden="true" />}
            title={title}
            highlight="Page"
            description={description}
            actions={
                actions ?? (
                    <Link
                        to="/"
                        className={cn(buttonVariants({ variant: "default" }), "group")}
                    >
                        Back to home
                        <KineticArrow />
                    </Link>
                )
            }
        />
    );
}

export function ChannelNotFound() {
    const navigate = useNavigate();
    const clearSelectedChannelId = useUIStore((s) => s.clearSelectedChannelId);

    return (
        <ErrorScreen
            statusCode="404"
            scope="CHANNEL"
            icon={<Hash aria-hidden="true" />}
            title="Channel not found"
            highlight="Channel"
            description="This channel doesn't exist or was deleted. Head back to your workspace and pick another one."
            actions={
                <Button
                    className="group"
                    onClick={() => {
                        clearSelectedChannelId();
                        navigate("/app/home");
                    }}
                >
                    Back to workspace
                    <KineticArrow />
                </Button>
            }
        />
    );
}

export function ConversationNotFound() {
    const navigate = useNavigate();
    const clearSelectedConversation = useUIStore((s) => s.clearSelectedConversation);

    return (
        <ErrorScreen
            statusCode="404"
            scope="CONVERSATION"
            icon={<MessagesSquare aria-hidden="true" />}
            title="Conversation not found"
            highlight="Conversation"
            description="This conversation doesn't exist or is no longer available to you."
            actions={
                <Button
                    className="group"
                    onClick={() => {
                        clearSelectedConversation();
                        navigate("/app/dms");
                    }}
                >
                    Back to workspace
                    <KineticArrow />
                </Button>
            }
        />
    );
}

export function WorkspaceAccessDenied() {
    const navigate = useNavigate();
    const clearSelectedWorkspaceId = useWorkspaceStore(
        (s) => s.clearSelectedWorkspaceId,
    );

    return (
        <ErrorScreen
            statusCode="403"
            scope="ACCESS"
            icon={<ShieldX aria-hidden="true" />}
            title="You're not a member of this workspace"
            highlight="member"
            description="This workspace isn't on your list anymore. Ask a workspace admin for an invite to rejoin."
            actions={
                <Button
                    className="group"
                    onClick={() => {
                        clearSelectedWorkspaceId();
                        navigate("/app/workspaces");
                    }}
                >
                    Go to my workspaces
                    <KineticArrow />
                </Button>
            }
        />
    );
}

export function WorkspaceNotFound() {
    const navigate = useNavigate();
    const clearSelectedWorkspaceId = useWorkspaceStore(
        (s) => s.clearSelectedWorkspaceId,
    );

    return (
        <ErrorScreen
            statusCode="404"
            scope="WORKSPACE"
            icon={<Building2 aria-hidden="true" />}
            title="Workspace not found"
            highlight="Workspace"
            description="We couldn't find this workspace. It may have been deleted or renamed."
            actions={
                <Button
                    className="group"
                    onClick={() => {
                        clearSelectedWorkspaceId();
                        navigate("/app/workspaces");
                    }}
                >
                    Go to my workspaces
                    <KineticArrow />
                </Button>
            }
        />
    );
}