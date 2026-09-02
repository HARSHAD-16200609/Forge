import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import type { ConversationDetail } from "@/features/Messages/types";

export function EmptyConversation({
    detail,
    type,
    name,
}: {
    detail?: ConversationDetail;
    type: "DM" | "GDM" | null;
    name: string;
}) {
    const members = detail?.members ?? [];
    const peerMember =
        type === "DM" ? members.find((m) => m.user.username === detail?.displayName) : undefined;
    const peerName = peerMember?.user.username ?? name;
    const peerAvatar = peerMember?.user.avatar ?? null;

    return (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div
                className={cn(
                    "mb-6 flex size-20 items-center justify-center rounded-full",
                    type === "GDM"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-violet-500/15 text-violet-600",
                )}
            >
                {type === "GDM" ? (
                    <Users className="size-9" />
                ) : peerAvatar ? (
                    <img
                        src={peerAvatar}
                        alt={peerName}
                        className="size-20 rounded-full object-cover"
                    />
                ) : (
                    <span className="text-3xl font-bold">{peerName.charAt(0).toUpperCase()}</span>
                )}
            </div>

            <h2 className="text-xl font-bold text-foreground">{peerName}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {type === "GDM"
                    ? "This is the beginning of your group. Send a message to kick off the conversation."
                    : `This is the beginning of your conversation with ${peerName}. Say hi and get started.`}
            </p>
        </div>
    );
}
