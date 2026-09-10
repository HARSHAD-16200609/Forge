import { useState } from "react";
import { Bell, AtSign, Inbox, Link2, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "unread", label: "Unread", icon: Inbox },
    { id: "mentions", label: "Mentions", icon: AtSign },
    { id: "activity", label: "Activity", icon: Bell },
    { id: "invites", label: "Invites", icon: Link2 },
] as const;

export function Notifications() {
    const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("unread");

    return (
        <div className="h-full overflow-y-auto p-6">
            <PageHeader
                title="Notifications"
                description="Everything you've been tagged in and all the noise you've turned on."
            />

            <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                            tab === id
                                ? "bg-brand/10 text-brand"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="size-4" />
                        {label}
                    </button>
                ))}
            </div>

            {tab === "unread" ? (
                <PageEmptyState
                    icon={<Inbox className="size-5" />}
                    title="You're all caught up"
                    description="No unread notifications right now. When you're mentioned or an invite arrives, it'll show up here."
                    action={
                        <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3.5 text-sm font-medium">
                            <MessageSquare className="mr-2 size-4 text-muted-foreground" />
                            Star onboarding
                        </span>
                    }
                />
            ) : (
                <PageEmptyState
                    icon={tab === "mentions" ? <AtSign className="size-5" /> : tab === "invites" ? <Link2 className="size-5" /> : <Bell className="size-5" />}
                    title={
                        tab === "mentions"
                            ? "No mentions yet"
                            : tab === "invites"
                              ? "No invites"
                              : "No activity yet"
                    }
                    description="Notifications aren't wired to the backend just yet. Once they are, everything that needs your attention will land here."
                />
            )}
        </div>
    );
}