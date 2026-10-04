import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Globe, Hash, Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getApiError } from "@/lib/errorMessage";
import { useCreateChannel } from "../hooks/useChannel";
import {
    CHANNEL_DESCRIPTION_MAX,
    CHANNEL_NAME_MAX,
    isValidChannelName,
    normalizeChannelName,
    type ChannelVisibility,
} from "../types";

interface CreateChannelModalProps {
    open: boolean;
    workspaceId: string;
    onClose: () => void;
}

const VISIBILITY_OPTIONS = [
    {
        value: "PUBLIC" as const,
        icon: Globe,
        title: "Public",
        description: "Anyone in the workspace can find and join this channel.",
    },
    {
        value: "PRIVATE" as const,
        icon: Lock,
        title: "Private",
        description: "Members can join this channel by invitation only.",
    },
];

export function CreateChannelModal({ open, workspaceId, onClose }: CreateChannelModalProps) {
    const createChannel = useCreateChannel(workspaceId);
    const { reset: resetCreateChannel } = createChannel;
    const titleId = useId();
    const nameId = useId();
    const descriptionId = useId();

    const [channelName, setChannelName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<ChannelVisibility>("PUBLIC");

    const slug = useMemo(() => normalizeChannelName(channelName), [channelName]);
    const nameError =
        channelName.trim().length > 0 && !slug ? "Channel name cannot be empty." : null;
    const canSubmit = isValidChannelName(channelName);

    const resetForm = useCallback(() => {
        setChannelName("");
        setDescription("");
        setVisibility("PUBLIC");
        resetCreateChannel();
    }, [resetCreateChannel]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    useEffect(() => {
        if (!open) return;

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") handleClose();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, handleClose]);

    useEffect(() => {
        if (!open) return;

        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    const submit = async () => {
        if (!canSubmit || createChannel.isPending) return;

        try {
            await createChannel.mutateAsync({ channelName, description, visibility });
            handleClose();
        } catch {
            // Surfaced through createChannel.isError below.
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold">
                        <Hash className="size-4 text-muted-foreground" />
                        Create a channel
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor={nameId}
                            className="block text-xs font-medium text-muted-foreground"
                        >
                            Name
                        </label>
                        <Input
                            id={nameId}
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                            maxLength={CHANNEL_NAME_MAX}
                            placeholder="e.g. design-review"
                            aria-invalid={Boolean(nameError)}
                            aria-describedby={nameError ? undefined : `${nameId}-hint`}
                            className="h-9"
                        />
                        {nameError ? (
                            <p className="text-xs text-destructive">{nameError}</p>
                        ) : (
                            <p id={`${nameId}-hint`} className="text-xs text-muted-foreground">
                                Channels are always lowercase. Spaces become dashes.
                                {slug && (
                                    <span className="ml-1 font-medium text-foreground/70">#{slug}</span>
                                )}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor={descriptionId}
                            className="block text-xs font-medium text-muted-foreground"
                        >
                            Description
                            <span className="ml-1 font-normal text-muted-foreground/60">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            id={descriptionId}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={CHANNEL_DESCRIPTION_MAX}
                            placeholder="What's this channel about?"
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border/60 bg-background p-3 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/50"
                        />
                        <p className="text-right text-xs tabular-nums text-muted-foreground">
                            {description.trim().length}/{CHANNEL_DESCRIPTION_MAX}
                        </p>
                    </div>

                    <fieldset className="space-y-3">
                        <legend className="mb-2 text-xs font-medium text-muted-foreground">
                            Visibility
                        </legend>
                        {VISIBILITY_OPTIONS.map((option) => {
                            const selected = option.value === visibility;
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setVisibility(option.value)}
                                    className={cn(
                                        "flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all duration-200",
                                        selected
                                            ? "border-primary bg-primary/5"
                                            : "border-border/60 hover:border-border",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                                            selected
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium">
                                            {option.title}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {option.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </fieldset>

                    {createChannel.isError && (
                        <Alert
                            variant="destructive"
                            className="border-destructive/30 bg-destructive/10"
                        >
                            <AlertDescription>
                                {getApiError(createChannel.error).message}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                    <Button variant="ghost" onClick={handleClose} disabled={createChannel.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit || createChannel.isPending}>
                        {createChannel.isPending && <Loader2 className="size-4 animate-spin" />}
                        Create channel
                    </Button>
                </div>
            </div>
        </div>
    );
}