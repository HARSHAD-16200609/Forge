import { useEffect, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Globe, Loader2, Lock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkspaceForm } from "../hooks/useWorkspaceForm";
import type { WorkspaceObject } from "../types";

const STEPS = [
    {
        title: "What should we call your workspace?",
        hint: "Give your team a name they'll recognize.",
    },
    {
        title: "Who can see this workspace?",
        hint: "Public workspaces are open to discovery, private ones stay invite-only.",
    },
    {
        title: "What does your team do?",
        hint: "A short pitch helps members get the gist.",
    },
] as const;

const VISIBILITY_OPTIONS = [
    {
        value: "PUBLIC" as const,
        icon: Globe,
        title: "Public",
        description: "Anyone in the org can find and join.",
    },
    {
        value: "PRIVATE" as const,
        icon: Lock,
        title: "Private",
        description: "Members join by invitation only.",
    },
];

type CreateWorkspaceFormProps = {
    onDone?: () => void;
    onClose?: () => void;
};

export function CreateWorkspaceForm({ onDone, onClose }: CreateWorkspaceFormProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const {
        register,
        setValue,
        workspaceName,
        visibility,
        description,
        errors,
        isPending,
        isSuccess,
        isError,
        submitForm,
    } = useWorkspaceForm();

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const step = STEPS[currentStep];

    const canContinue =
        currentStep === 0
            ? workspaceName.trim().length >= 8
            : currentStep === 1
              ? true
              : description.trim().length >= 12;

    const handleContinue = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            submitForm();
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Create a workspace"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1c1d]/50 px-4 py-10"
        >
            <div className="relative z-10 w-full max-w-md">
                <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-0 shadow-xl shadow-black/20">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                        <h2 className="text-lg font-semibold tracking-tight">
                            {isSuccess ? "Workspace created" : "Create a workspace"}
                        </h2>
                        {!isPending && onClose ? (
                            <button
                                onClick={onClose}
                                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        ) : (
                            <div className="size-8" />
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <SuccessView
                                key="success"
                                name={workspaceName.trim()}
                                onDone={onDone ?? onClose}
                            />
                        ) : (
                            <motion.div
                                key={`step-${currentStep}`}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="px-6 py-8"
                            >
                                {/* Step heading */}
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold tracking-tight text-balance">
                                        {step.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {step.hint}
                                    </p>
                                </div>

                                {/* Input area */}
                                <div className="mt-8 flex min-h-24 flex-col justify-center">
                                    {currentStep === 0 && (
                                        <NameStep
                                            register={register}
                                            value={workspaceName}
                                            error={errors.workspaceName?.message}
                                        />
                                    )}
                                    {currentStep === 1 && (
                                        <VisibilityStep
                                            value={visibility}
                                            onChange={(value) => setValue("visibility", value)}
                                        />
                                    )}
                                    {currentStep === 2 && (
                                        <DescriptionStep
                                            register={register}
                                            value={description}
                                            error={errors.description?.message}
                                        />
                                    )}
                                </div>

                                {/* Error */}
                                {isError ? (
                                    <p
                                        role="alert"
                                        className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                                    >
                                        Something went wrong creating your workspace. Please try
                                        again.
                                    </p>
                                ) : null}

                                {/* Actions */}
                                <div className="mt-8 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setCurrentStep((s) => s - 1)}
                                        disabled={currentStep === 0 || isPending}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground/70 transition-colors hover:text-foreground",
                                            currentStep === 0 && "invisible",
                                        )}
                                    >
                                        <ArrowLeft className="size-4" />
                                        Back
                                    </button>

                                    <Button
                                        onClick={handleContinue}
                                        disabled={!canContinue || isPending}
                                        size="lg"
                                        className="h-11 flex-1"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="animate-spin" />
                                                Creating workspace...
                                            </>
                                        ) : currentStep === STEPS.length - 1 ? (
                                            "Create workspace"
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight
                                                    className="size-4"
                                                    data-icon="inline-end"
                                                />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="relative z-10 mt-4 text-center text-xs text-foreground/60">
                    You can always rename or archive a workspace later.
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Name                                                       */
/* ------------------------------------------------------------------ */

function NameStep({
    register,
    value,
    error,
}: {
    register: UseFormRegister<WorkspaceObject>;
    value: string;
    error?: string;
}) {
    const fine = value.trim().length >= 8 && value.trim().length <= 20;

    return (
        <div className="space-y-1.5">
            <label htmlFor="workspace-name" className="text-sm font-medium text-muted-foreground">
                Workspace name
            </label>
            <Input
                id="workspace-name"
                {...register("workspaceName", {
                    minLength: {
                        value: 8,
                        message: "Needs at least 8 characters",
                    },
                    maxLength: {
                        value: 20,
                        message: "Cannot exceed 20 characters",
                    },
                })}
                maxLength={20}
                placeholder="e.g. Acme Rocketry"
                autoFocus
                className="h-12 text-base"
            />
            <p
                className={cn(
                    "text-xs tabular-nums",
                    error
                        ? "text-destructive"
                        : fine
                          ? "text-emerald-500"
                          : "text-muted-foreground",
                )}
            >
                {error ?? `${value.trim().length}/20`}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Visibility                                                 */
/* ------------------------------------------------------------------ */

function VisibilityStep({
    value,
    onChange,
}: {
    value: WorkspaceObject["visibility"];
    onChange: (value: WorkspaceObject["visibility"]) => void;
}) {
    return (
        <div className="space-y-3">
            {VISIBILITY_OPTIONS.map((option) => {
                const selected = option.value === value;
                const Icon = option.icon;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all duration-200",
                            selected
                                ? "border-primary bg-primary/5"
                                : "border-border/60 hover:border-border",
                        )}
                    >
                        <span
                            className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
                                selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            <Icon className="size-4" />
                        </span>
                        <span className="flex-1 space-y-0.5">
                            <span className="flex items-center gap-2 font-semibold">
                                {option.title}
                                {selected && (
                                    <Check className="size-4 text-primary" strokeWidth={2.5} />
                                )}
                            </span>
                            <span className="block text-sm leading-5 text-muted-foreground">
                                {option.description}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Description                                                */
/* ------------------------------------------------------------------ */

function DescriptionStep({
    register,
    value,
    error,
}: {
    register: UseFormRegister<WorkspaceObject>;
    value: string;
    error?: string;
}) {
    const fine = value.trim().length >= 12 && value.trim().length <= 100;

    return (
        <div className="space-y-1.5">
            <label
                htmlFor="workspace-description"
                className="text-sm font-medium text-muted-foreground"
            >
                Description
            </label>
            <textarea
                id="workspace-description"
                {...register("description", {
                    minLength: {
                        value: 12,
                        message: "Needs at least 12 characters",
                    },
                    maxLength: {
                        value: 100,
                        message: "Cannot exceed 100 characters",
                    },
                })}
                maxLength={100}
                placeholder="A space for shipping products, sharing ideas, and celebrating wins."
                rows={4}
                autoFocus
                className="w-full resize-none rounded-lg border border-border/60 bg-background p-3.5 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/50"
            />
            <p
                className={cn(
                    "text-right text-xs tabular-nums",
                    error
                        ? "text-destructive"
                        : fine
                          ? "text-emerald-500"
                          : "text-muted-foreground",
                )}
            >
                {error ?? `${value.trim().length}/100`}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Success view                                                        */
/* ------------------------------------------------------------------ */

function SuccessView({ name, onDone }: { name: string; onDone?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 px-6 py-10 text-center"
        >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-7" strokeWidth={2.5} />
            </div>

            <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight">Your workspace is ready</h3>
                <p className="text-sm text-muted-foreground">Welcome aboard.</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 px-5 py-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                    {name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-left">
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="block text-xs text-muted-foreground">
                        Ready to collaborate
                    </span>
                </span>
            </div>

            <Button size="lg" className="h-11 w-full" onClick={onDone}>
                Get started
                <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
        </motion.div>
    );
}
