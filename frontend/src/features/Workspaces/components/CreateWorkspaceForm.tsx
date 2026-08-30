import { useEffect, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Check,
    Globe,
    Loader2,
    Lock,
    PenLine,
    Sparkles,
    Users,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { useWorkspaceForm } from "../hooks/useWorkspaceForm";
import type { WorkspaceObject } from "../types";

const STEPS = [
    {
        title: "What should we call your workspace?",
        hint: "Give your team a name to rally around. 8–20 characters.",
        icon: PenLine,
    },
    {
        title: "Who can see this workspace?",
        hint: "Public workspaces are open to discovery, private ones stay invite-only.",
        icon: Users,
    },
    {
        title: "What does your team do?",
        hint: "A short pitch helps members get the gist. 12–100 characters.",
        icon: Sparkles,
    },
] as const;

const VISIBILITY_OPTIONS = [
    {
        value: "PUBLIC" as const,
        icon: Globe,
        title: "Public",
        description: "Open to the whole org. Anyone can find and join it.",
    },
    {
        value: "PRIVATE" as const,
        icon: Lock,
        title: "Private",
        description: "Hidden from discovery. Members join by invitation only.",
    },
];

const NAME_COLORS = [
    "from-violet-500 to-fuchsia-500",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-rose-500",
];

function colorFor(name: string) {
    const clean = name.trim();
    if (!clean) return NAME_COLORS[0];
    let hash = 0;
    for (const char of clean) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
    return NAME_COLORS[hash % NAME_COLORS.length];
}

type CreateWorkspaceFormProps = {
    onDone?: () => void;
    onClose?: () => void;
};

export function CreateWorkspaceForm({
    onDone,
    onClose,
}: CreateWorkspaceFormProps) {
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

    const progress = ((currentStep + 1) / STEPS.length) * 100;
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4 py-10 backdrop-blur-md"
        >
            {/* Graphics */}
            <DotPattern className="fill-slate-500/40 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_15%_20%,oklch(0.55_0.11_162/0.08),transparent),radial-gradient(45%_40%_at_85%_80%,oklch(0.55_0.11_162/0.06),transparent)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-2xl shadow-black/20">
                    {/* Close button */}
                    {!isPending &&
                        (onClose ? (
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:bg-muted hover:text-foreground absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        ) : null)}

                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
                    />

                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <SuccessView
                                key="success"
                                name={workspaceName.trim()}
                                color={colorFor(workspaceName)}
                                onDone={onDone ?? onClose}
                            />
                        ) : (
                            <motion.div
                                key={`step-${currentStep}`}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                {/* Stepper */}
                                <Stepper
                                    currentStep={currentStep}
                                    onSelect={setCurrentStep}
                                    initials={
                                        workspaceName.trim().slice(0, 2).toUpperCase() || "WS"
                                    }
                                />

                                {/* Progress */}
                                <div className="h-[2px] overflow-hidden rounded-full bg-muted/60">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {/* Question */}
                                <div className="flex items-start gap-4">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <step.icon className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-semibold tracking-tight text-balance">
                                            {step.title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {step.hint}
                                        </p>
                                    </div>
                                </div>

                                {/* Input area */}
                                <div className="flex min-h-40 flex-col justify-center">
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
                                            onChange={(value) =>
                                                setValue("visibility", value)
                                            }
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

                                {/* Actions */}
                                <div className="space-y-3">
                                    {isError ? (
                                        <p
                                            role="alert"
                                            className="text-destructive text-sm"
                                        >
                                            Something went wrong creating your workspace.
                                            Please try again.
                                        </p>
                                    ) : null}

                                    <Button
                                        onClick={handleContinue}
                                        disabled={!canContinue || isPending}
                                        size="lg"
                                        className="group h-12 w-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="animate-spin" />
                                                Creating workspace...
                                            </>
                                        ) : (
                                            <>
                                                {currentStep === STEPS.length - 1
                                                    ? "Create workspace"
                                                    : "Continue"}
                                                <ArrowRight
                                                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                                                    data-icon="inline-end"
                                                />
                                            </>
                                        )}
                                    </Button>

                                    {currentStep > 0 && (
                                        <button
                                            onClick={() =>
                                                setCurrentStep((s) => s - 1)
                                            }
                                            disabled={isPending}
                                            className="w-full text-center text-sm text-muted-foreground/70 transition-colors hover:text-foreground"
                                        >
                                            Go back
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="relative z-10 mt-4 text-center text-xs text-muted-foreground">
                    You can always rename or archive a workspace later.
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                            */
/* ------------------------------------------------------------------ */

function Stepper({
    currentStep,
    onSelect,
    initials,
}: {
    currentStep: number;
    onSelect: (index: number) => void;
    initials: string;
}) {
    return (
        <div className="flex items-center justify-center gap-3">
            {STEPS.map((s, index) => (
                <div key={s.title} className="flex items-center gap-3">
                    <motion.button
                        type="button"
                        onClick={() => index < currentStep && onSelect(index)}
                        disabled={index > currentStep}
                        initial={false}
                        animate={{
                            scale: index === currentStep ? 1.08 : 1,
                            opacity: index >= currentStep ? 1 : 0.7,
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "relative flex size-9 items-center justify-center rounded-full transition-colors duration-500",
                            "disabled:cursor-not-allowed",
                            index < currentStep &&
                                "bg-primary/10 text-primary",
                            index === currentStep &&
                                "bg-foreground text-background shadow-[0_0_24px_-6px_rgba(0,0,0,0.4)]",
                            index > currentStep &&
                                "bg-muted/60 text-muted-foreground/40",
                        )}
                        title={s.title}
                    >
                        {index === 0 ? (
                            <span className="text-[11px] font-bold">
                                {initials}
                            </span>
                        ) : index < currentStep ? (
                            <Check className="size-4" strokeWidth={2.5} />
                        ) : (
                            <span className="text-sm font-medium tabular-nums">
                                {index + 1}
                            </span>
                        )}
                        {index === currentStep && (
                            <span className="absolute inset-0 animate-pulse rounded-full bg-foreground/20 blur-md" />
                        )}
                    </motion.button>

                    {index < STEPS.length - 1 && (
                        <div className="relative h-[1.5px] w-10 md:w-14">
                            <div className="absolute inset-0 bg-border/60" />
                            <div
                                className="absolute inset-0 origin-left bg-foreground/40 transition-transform duration-700 ease-out"
                                style={{
                                    transform: `scaleX(${index < currentStep ? 1 : 0})`,
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
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
    const color = colorFor(value);
    const fine = value.trim().length >= 8 && value.trim().length <= 20;

    return (
        <div className="flex items-center gap-4">
            <motion.div
                key={color}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-lg",
                    color,
                )}
            >
                {value.trim().slice(0, 2).toUpperCase() || "WS"}
            </motion.div>

            <div className="min-w-0 flex-1 space-y-1.5">
                <Input
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
                    className="h-13 border-border/60 bg-background/60 text-base transition-all duration-500 focus:border-primary/40"
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
        <div className="grid gap-3 sm:grid-cols-2">
            {VISIBILITY_OPTIONS.map((option) => {
                const selected = option.value === value;
                const Icon = option.icon;
                return (
                    <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-300",
                            selected
                                ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5 ring-2 ring-primary/30"
                                : "border-border/60 bg-background/40 hover:border-border",
                        )}
                    >
                        {selected && (
                            <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="size-3" strokeWidth={3} />
                            </span>
                        )}
                        <span
                            className={cn(
                                "flex size-10 items-center justify-center rounded-xl transition-colors",
                                selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            <Icon className="size-5" />
                        </span>
                        <span className="space-y-0.5">
                            <span className="block font-semibold">
                                {option.title}
                            </span>
                            <span className="block text-xs leading-4 text-muted-foreground">
                                {option.description}
                            </span>
                        </span>
                    </motion.button>
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
            <textarea
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
                className="w-full resize-none rounded-xl border border-border/60 bg-background/60 p-3.5 text-sm leading-6 transition-all duration-500 outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-primary/10"
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

function SuccessView({
    name,
    color,
    onDone,
}: {
    name: string;
    color: string;
    onDone?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 py-6 text-center"
        >
            <div className="relative">
                <span className="absolute -inset-3 animate-ping rounded-full bg-primary/10" />
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-8 animate-in zoom-in-95 duration-500" strokeWidth={2.5} />
                </div>
            </div>

            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Your workspace is ready
                </h2>
                <p className="text-muted-foreground text-sm">
                    Welcome aboard.
                </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-5 py-3">
                <span
                    className={cn(
                        "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white",
                        color,
                    )}
                >
                    {name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-left">
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="text-muted-foreground block text-xs">
                        Ready to collaborate
                    </span>
                </span>
            </div>

            <Button size="lg" className="h-12 w-full" onClick={onDone}>
                Get started
                <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
        </motion.div>
    );
}