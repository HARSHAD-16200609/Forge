import { useState } from "react";
import { Check, Copy, Link2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";

export function Invites() {
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? "";

    const { data: details } = useWorkspace(activeWorkspaceId);

    const [email, setEmail] = useState("");
    const [copied, setCopied] = useState(false);

    const inviteLink =
        typeof window !== "undefined"
            ? `${window.location.origin}/invite/${activeWorkspaceId}`
            : "";

    const copyLink = () => {
        if (!inviteLink) return;
        navigator.clipboard?.writeText(inviteLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <PageHeader
                title="Invite people"
                description={`Add teammates to ${details?.workspaceName ?? "your workspace"}.`}
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <section className="rounded-2xl border border-border/60 bg-card p-5">
                    <h2 className="text-sm font-semibold text-foreground">Invite by email</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        We'll send an email with a link to join {details?.workspaceName ?? "your workspace"}.
                    </p>
                    <form
                        className="mt-4 flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setEmail("");
                        }}
                    >
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-muted/40 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Send invite
                        </button>
                    </form>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Invite emails aren't wired to the backend yet — no emails will be sent
                        while that's in progress.
                    </p>
                </section>

                <section className="rounded-2xl border border-border/60 bg-card p-5">
                    <h2 className="text-sm font-semibold text-foreground">Invite via link</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Anyone with this link can request to join your workspace.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <DividerIcon />
                        <input
                            readOnly
                            value={inviteLink}
                            onFocus={(e) => e.target.select()}
                            className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-muted/40 px-3 font-mono text-xs text-muted-foreground outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                        />
                        <button
                            type="button"
                            onClick={copyLink}
                            className={cn(
                                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                                copied
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "border-border bg-background hover:bg-muted/50",
                            )}
                        >
                            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>
                </section>
            </div>

            <section className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Pending invites</h2>
                <PageEmptyState
                    icon={<Users className="size-5" />}
                    title="No pending invites"
                    description="Invites you send will show up here, so you can track who hasn't joined yet."
                />
            </section>
        </div>
    );
}

function DividerIcon() {
    return <Link2 className="size-4 text-muted-foreground" />;
}