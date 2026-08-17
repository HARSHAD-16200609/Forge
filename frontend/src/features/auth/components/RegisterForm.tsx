import { useRegisterForm } from "../hooks/useRegisterForm";

function usernameFromName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "");
}

export function RegisterForm() {
    const { register, handleSubmit, onSubmit, watch, errors, isSubmitting } = useRegisterForm();

    const username = usernameFromName(watch("name"));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
            <input type="hidden" {...register("username")} value={username} />

            <div className="auth-field">
                <label htmlFor="name">Full name</label>
                <input
                    id="name"
                    type="text"
                    placeholder="Jane Cooper"
                    className={errors.name ? "input-error" : ""}
                    {...register("name", {
                        required: "Full name is required",
                    })}
                />
                {errors.name && <p className="auth-field-error">{errors.name.message}</p>}
            </div>

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
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    className={errors.password ? "input-error" : ""}
                    {...register("password", {
                        required: "Password is required",
                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                />
                {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
            </div>

            <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    className={errors.confirmPassword ? "input-error" : ""}
                    {...register("confirmPassword", {
                        validate: (value) =>
                            value === watch("password") || "Passwords do not match",
                    })}
                />
                {errors.confirmPassword && (
                    <p className="auth-field-error">{errors.confirmPassword.message}</p>
                )}
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"}
            </button>
        </form>
    );
}
