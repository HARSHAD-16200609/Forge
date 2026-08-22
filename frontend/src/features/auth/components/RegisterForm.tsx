import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";

import { useRegisterForm } from "../hooks/useRegisterForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function usernameFromName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "");
}

export function RegisterForm() {
    const { register, handleSubmit, onSubmit, watch, errors, isSubmitting } = useRegisterForm();
    const [showPassword, setShowPassword] = useState(false);

    const username = usernameFromName(watch("name"));
    const password = watch("password") ?? "";

    const checks = useMemo(
        () => [
            { label: "At least 8 characters", valid: password.length >= 8 },
            { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
            { label: "One number", valid: /\d/.test(password) },
        ],
        [password],
    );

    const errorMessage =
        errors.name?.message ??
        errors.email?.message ??
        errors.password?.message ??
        errors.confirmPassword?.message;

    return (
        <Card>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <input type="hidden" {...register("username")} value={username} />
                    <div className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                placeholder="Jane Doe"
                                autoComplete="name"
                                aria-invalid={Boolean(errors.name)}
                                {...register("name", {
                                    required: "Name is required",
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                autoComplete="email"
                                aria-invalid={Boolean(errors.email)}
                                {...register("email", {
                                    required: "Email is required",
                                })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    className="pr-10"
                                    aria-invalid={Boolean(errors.password)}
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 8,
                                            message: "Must be at least 8 characters",
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <ul className="mt-1 grid gap-1.5 text-xs text-muted-foreground">
                                {checks.map((check) => (
                                    <li key={check.label} className="flex items-center gap-1.5">
                                        {check.valid ? (
                                            <Check className="text-primary size-3.5" />
                                        ) : (
                                            <X className="size-3.5" />
                                        )}
                                        <span
                                            className={cn(
                                                check.valid &&
                                                    "text-foreground decoration-primary/50 line-through",
                                            )}
                                        >
                                            {check.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <Input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.confirmPassword)}
                                {...register("confirmPassword", {
                                    validate: (value) =>
                                        value === watch("password") || "Passwords do not match",
                                })}
                            />
                        </div>

                        {errorMessage || errors.email?.type === "server" ? (
                            <p role="alert" className="text-destructive text-sm">
                                {errorMessage ?? errors.email?.message}
                            </p>
                        ) : null}

                        <Button type="submit" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" data-icon="inline-start" />
                                    Creating account...
                                </>
                            ) : (
                                "Create account"
                            )}
                        </Button>

                        <p className="text-muted-foreground text-center text-xs">
                            By creating an account, you agree to our{" "}
                            <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className="underline underline-offset-4 hover:text-foreground"
                            >
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className="underline underline-offset-4 hover:text-foreground"
                            >
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
