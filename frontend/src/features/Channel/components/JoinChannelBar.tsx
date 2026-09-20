import { Button } from "@/components/ui/button";
import { Hash, Loader2, UserPlus } from "lucide-react";
import { useJoinPublicChannel } from "../hooks/useChannel";

interface JoinChannelBarProps {
    workspaceId: string;
    channelId: string;
    channelName: string;
}

export function JoinChannelBar({ workspaceId, channelId, channelName }: JoinChannelBarProps) {
    const join = useJoinPublicChannel(workspaceId, channelId);

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center px-4 pb-5 backdrop-blur-[3px]">
            <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-border/60 bg-background/75 px-4 py-3.5 shadow-lg shadow-black/10">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15">
                    <Hash className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">Join #{channelName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        You&apos;re previewing this channel. Join to start sending messages.
                    </p>
                </div>
                <Button onClick={() => join.mutate()} disabled={join.isPending}>
                    {join.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <UserPlus className="size-4" />
                    )}
                    Join
                </Button>
            </div>
        </div>
    );
}