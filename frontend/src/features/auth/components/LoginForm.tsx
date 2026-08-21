import { useState } from "react";
import { CircleAlert, Eye, EyeOff, X } from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
    const { register, handleSubmit, onSubmit, errors, isSubmitting } = useLoginForm();
    const [showPassword, setShowPassword] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(true);

    const hasServerError = errors.email?.type === "server";
    const emailError = errors.email?.type !== "server" ? errors.email : undefined;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {hasServerError && bannerVisible && (
                <Alert variant="destructive">
                    <CircleAlert />
                    <AlertDescription>Incorrect email or password.</AlertDescription>
                    <AlertAction>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Dismiss"
                            onClick={() => setBannerVisible(false)}
                        >
                            <X />
                        </Button>
                    </AlertAction>
                </Alert>
            )}

            <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    aria-invalid={Boolean(emailError)}
                    {...register("email", {
                        required: "Email is required",
                    })}
                />
                {emailError && <p className="text-destructive text-sm">{emailError.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pr-9"
                        aria-invalid={Boolean(errors.password)}
                        {...register("password", {
                            required: "Password is required",
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

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    );
}
