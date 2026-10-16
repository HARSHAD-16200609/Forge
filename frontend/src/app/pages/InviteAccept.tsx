import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import useAuth from "@/features/auth/hooks/useAuth";
import { invitationService } from "@/features/Invitations/invitation.service";
import { getApiError } from "@/lib/errorMessage";
import Swirling from "@/components/ui/Swirling";
import { Button } from "@/components/ui/button";

export function InviteAccept() {
    const { token = "" } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, user, logout } = useAuth();
    const [accepted, setAccepted] = useState(false);

    const preview = useQuery({
        queryKey: ["invite-preview", token],
        queryFn: () => invitationService.previewInvite(token),
        enabled: token.length > 0,
        retry: false,
        staleTime: 30_000,
    });

    const accept = useMutation({
        mutationFn: () => invitationService.acceptInviteToken(token),
        onSuccess: () => {
            setAccepted(true);
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
    });

    useEffect(() => {
        if (!accepted) return;
        const timer = setTimeout(() => navigate("/app", { replace: true }), 1200);
        return () => clearTimeout(timer);
    }, [accepted, navigate]);

    const redirectTarget = `/invite/${token}`;
    const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`;
    const registerHref = `/auth/register?redirect=${encodeURIComponent(redirectTarget)}`;

    return (
        <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
            <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Forge
                </p>

                {preview.isPending ? (
                    <div className="flex justify-center py-12">
                        <Swirling className="size-12 text-brand" />
                    </div>
                ) : preview.isError ? (
                    <InviteMessage
                        title="Invite not found"
                        description={getApiError(preview.error).message}
                    >
                        <Link
                            to="/"
                            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                            Go home
                        </Link>
                    </InviteMessage>
                ) : preview.data && preview.data.status !== "PENDING" ? (
                    <InviteMessage
                        title={
                            preview.data.status === "EXPIRED"
                                ? "This invite has expired"
                                : preview.data.status === "REVOKED"
                                  ? "This invite was revoked"
                                  : "This invite was already used"
                        }
                        description={
                            preview.data.status === "EXPIRED"
                                ? "Ask the person who invited you to send a new one."
                                : preview.data.status === "REVOKED"
                                  ? "The workspace admins have disabled this invite."
                                  : "It looks like it has already been accepted."
                        }
                    >
                        <Link
                            to={isAuthenticated ? "/app" : "/auth/login"}
                            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                            {isAuthenticated ? "Open Forge" : "Sign in"}
                        </Link>
                    </InviteMessage>
                ) : preview.data ? (
                    <div className="mt-4">
                        <h1 className="text-xl font-semibold text-foreground">
                            {preview.data.kind === "channel_invite"
                                ? `Join #${preview.data.channelName}`
                                : `Join ${preview.data.workspaceName}`}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {preview.data.kind === "workspace_link" ? (
                                <>
                                    You've been invited to join{" "}
                                    <span className="font-medium text-foreground">
                                        {preview.data.workspaceName}
                                    </span>
                                    {typeof preview.data.memberCount === "number"
                                        ? ` — ${preview.data.memberCount} ${
                                              preview.data.memberCount === 1
                                                  ? "member"
                                                  : "members"
                                          } and counting`
                                        : ""}
                                    .
                                </>
                            ) : (
                                <>
                                    <span className="font-medium text-foreground">
                                        {preview.data.inviterName ?? "A teammate"}
                                    </span>{" "}
                                    invited you to{" "}
                                    {preview.data.kind === "channel_invite" ? (
                                        <>
                                            the private channel{" "}
                                            <span className="font-medium text-foreground">
                                                #{preview.data.channelName}
                                            </span>{" "}
                                            in{" "}
                                        </>
                                    ) : (
                                        "the "
                                    )}
                                    <span className="font-medium text-foreground">
                                        {preview.data.workspaceName}
                                    </span>{" "}
                                    workspace on Forge.
                                </>
                            )}
                        </p>

                        {preview.data.email ? (
                            <p className="mt-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                This invite was sent to{" "}
                                <span className="font-medium text-foreground">
                                    {preview.data.email}
                                </span>
                                .{" "}
                                {isAuthenticated && user
                                    ? `You're signed in as ${user.email}.`
                                    : ""}
                            </p>
                        ) : null}

                        {accepted ? (
                            <p className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                                You're in! Taking you to {preview.data.workspaceName}…
                            </p>
                        ) : !isAuthenticated ? (
                            <div className="mt-6 flex flex-col gap-2">
                                <Link
                                    to={loginHref}
                                    className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                                >
                                    Sign in to accept
                                </Link>
                                <Link
                                    to={registerHref}
                                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted/50"
                                >
                                    Create an account
                                </Link>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <Button
                                    size="lg"
                                    className="w-full"
                                    disabled={accept.isPending}
                                    onClick={() => accept.mutate()}
                                >
                                    {accept.isPending ? (
                                        <>
                                            <Loader2
                                                className="animate-spin"
                                                data-icon="inline-start"
                                            />
                                            Joining…
                                        </>
                                    ) : (
                                        "Accept invite"
                                    )}
                                </Button>

                                {accept.isError ? (
                                    <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
                                        {getApiError(accept.error).message}
                                    </div>
                                ) : null}

                                {accept.isError &&
                                getApiError(accept.error).status === 403 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logout().finally(() => {
                                                navigate(loginHref);
                                            });
                                        }}
                                        className="mt-3 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                                    >
                                        Sign out and sign in with the invited email
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function InviteMessage({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="mt-4">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            {children ? <div className="mt-4">{children}</div> : null}
        </div>
    );
}
