import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Link2, Loader2, UserPlus, Users, X } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { invitationService } from "@/features/Invitations/invitation.service";
import { getApiError } from "@/lib/errorMessage";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

export function Invites() {
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();
    const queryClient = useQueryClient();

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? "";

    const { data: details } = useWorkspace(activeWorkspaceId);

    const [email, setEmail] = useState("");
    const [feedback, setFeedback] = useState<{ kind: "success" | "warning" | "error"; text: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const linkQuery = useQuery({
        queryKey: ["workspace-invite-link", activeWorkspaceId],
        queryFn: () => invitationService.getWorkspaceInviteLink(activeWorkspaceId),
        enabled: Boolean(activeWorkspaceId),
    });

    const sentInvitesQuery = useQuery({
        queryKey: ["workspace-invites-sent", activeWorkspaceId],
        queryFn: () => invitationService.listSentWorkspaceInvites("PENDING"),
        enabled: Boolean(activeWorkspaceId),
    });

    const pendingInvites = useMemo(
        () =>
            (sentInvitesQuery.data?.invites ?? []).filter(
                (invite) => invite.workspaceId === activeWorkspaceId,
            ),
        [sentInvitesQuery.data, activeWorkspaceId],
    );

    const sendInvite = useMutation({
        mutationFn: (targetEmail: string) =>
            invitationService.createWorkspaceInvite(activeWorkspaceId, targetEmail),
        onSuccess: (result) => {
            setEmail("");
            setFeedback(
                result.emailSent
                    ? { kind: "success", text: `Invitation email sent to ${result.invite.receiverEmail}.` }
                    : {
                          kind: "warning",
                          text: `Invite created for ${result.invite.receiverEmail}, but the email could not be sent. Try again later.`,
                      },
            );
            queryClient.invalidateQueries({ queryKey: ["workspace-invites-sent", activeWorkspaceId] });
        },
        onError: (err) => {
            setFeedback({ kind: "error", text: getApiError(err).message });
        },
    });

    const createLink = useMutation({
        mutationFn: () => invitationService.createWorkspaceInviteLink(activeWorkspaceId),
        onSuccess: (link) => {
            setFeedback(null);
            queryClient.setQueryData(["workspace-invite-link", activeWorkspaceId], link);
        },
        onError: (err) => {
            setFeedback({ kind: "error", text: getApiError(err).message });
        },
    });

    const revokeLink = useMutation({
        mutationFn: () => invitationService.revokeWorkspaceInviteLink(activeWorkspaceId),
        onSuccess: () => {
            queryClient.setQueryData(["workspace-invite-link", activeWorkspaceId], null);
        },
        onError: (err) => {
            setFeedback({ kind: "error", text: getApiError(err).message });
        },
    });

    const cancelInvite = useMutation({
        mutationFn: (inviteId: string) => invitationService.cancelWorkspaceInvite(inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspace-invites-sent", activeWorkspaceId] });
        },
        onError: (err) => {
            setFeedback({ kind: "error", text: getApiError(err).message });
        },
    });

    const inviteLink = linkQuery.data?.url ?? "";

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
                            if (!email.trim() || sendInvite.isPending) return;
                            setFeedback(null);
                            sendInvite.mutate(email.trim());
                        }}
                    >
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            disabled={sendInvite.isPending}
                            className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-muted/40 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            disabled={sendInvite.isPending || !activeWorkspaceId}
                            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {sendInvite.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <UserPlus className="size-4" />
                            )}
                            Send invite
                        </button>
                    </form>
                    {feedback ? (
                        <p
                            role="status"
                            className={cn(
                                "mt-3 rounded-lg border px-3 py-2 text-xs",
                                feedback.kind === "success" &&
                                    "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                                feedback.kind === "warning" &&
                                    "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
                                feedback.kind === "error" &&
                                    "border-destructive/30 bg-destructive/5 text-destructive",
                            )}
                        >
                            {feedback.text}
                        </p>
                    ) : null}
                </section>

                <section className="rounded-2xl border border-border/60 bg-card p-5">
                    <h2 className="text-sm font-semibold text-foreground">Invite via link</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Anyone with this link can join {details?.workspaceName ?? "your workspace"}.
                    </p>

                    {linkQuery.isPending ? (
                        <div className="mt-4 flex h-9 items-center justify-center">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : linkQuery.isError ? (
                        <p className="mt-3 text-xs text-destructive">
                            {getApiError(linkQuery.error).message}
                        </p>
                    ) : linkQuery.data ? (
                        <>
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
                            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>
                                    Expires {formatDate(linkQuery.data.expiresAt)} · joined{" "}
                                    {linkQuery.data.useCount}{" "}
                                    {linkQuery.data.useCount === 1 ? "time" : "times"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => revokeLink.mutate()}
                                    disabled={revokeLink.isPending}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                                >
                                    {revokeLink.isPending ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <X className="size-3" />
                                    )}
                                    Revoke
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => createLink.mutate()}
                                disabled={createLink.isPending || !activeWorkspaceId}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {createLink.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Link2 className="size-4" />
                                )}
                                Generate invite link
                            </button>
                        </div>
                    )}
                </section>
            </div>

            <section className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Pending invites</h2>
                {sentInvitesQuery.isPending ? (
                    <div className="flex h-20 items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : pendingInvites.length === 0 ? (
                    <PageEmptyState
                        icon={<Users className="size-5" />}
                        title="No pending invites"
                        description="Invites you send will show up here, so you can track who hasn't joined yet."
                    />
                ) : (
                    <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
                        {pendingInvites.map((invite) => (
                            <li
                                key={invite.id}
                                className="flex items-center justify-between gap-4 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {invite.receiverEmail}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Sent {formatDate(invite.sentAt)} · expires{" "}
                                        {formatDate(invite.expiresAt)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => cancelInvite.mutate(invite.id)}
                                    disabled={cancelInvite.isPending}
                                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {cancelInvite.isPending &&
                                    cancelInvite.variables === invite.id ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <X className="size-3" />
                                    )}
                                    Revoke
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function DividerIcon() {
    return <Link2 className="size-4 text-muted-foreground" />;
}
