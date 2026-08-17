import { useState } from "react";
import { useLoginForm } from "../hooks/useLoginForm";

export function LoginForm() {
    const { register, handleSubmit, onSubmit, errors, isSubmitting } = useLoginForm();
    const [bannerVisible, setBannerVisible] = useState(true);

    const hasServerError = errors.email?.type === "server";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
            {hasServerError && bannerVisible && (
                <div className="auth-banner" role="alert">
                    <span>Incorrect email or password.</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setBannerVisible(false)}>
                        ×
                    </button>
                </div>
            )}

            <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className={errors.email ? "input-error" : ""}
                    {...register("email", {
                        required: "Email is required",
                    })}
                />
                {errors.email?.type !== "server" && errors.email && (
                    <p className="auth-field-error">{errors.email.message}</p>
                )}
            </div>

            <div className="auth-field">
                <div className="auth-field-label-row">
                    <label htmlFor="password">Password</label>
                    <button type="button" className="auth-link">
                        Forgot password?
                    </button>
                </div>
                <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className={errors.password ? "input-error" : ""}
                    {...register("password", {
                        required: "Password is required",
                    })}
                />
                {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}
