import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <input type="hidden" {...register("username")} value={username} />

            <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="Jane Cooper"
                    aria-invalid={Boolean(errors.name)}
                    {...register("name", {
                        required: "Full name is required",
                    })}
                />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    aria-invalid={Boolean(errors.email && errors.email.type !== "server")}
                    {...register("email", {
                        required: "Email is required",
                    })}
                />
                {errors.email?.type !== "server" && errors.email && (
                    <p className="text-destructive text-sm">{errors.email.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        className="pr-9"
                        aria-invalid={Boolean(errors.password)}
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 8, message: "Password must be at least 8 characters" },
                        })}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                </div>
                {errors.password && (
                    <p className="text-destructive text-sm">{errors.password.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        className="pr-9"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        {...register("confirmPassword", {
                            validate: (value) =>
                                value === watch("password") || "Passwords do not match",
                        })}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                </div>
                {errors.confirmPassword && (
                    <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
                )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
        </form>
    );
}
