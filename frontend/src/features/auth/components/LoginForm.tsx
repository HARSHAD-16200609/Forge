import { useLoginForm } from "../hooks/useLoginForm";

export function LoginForm() {
    const {
        register,
        handleSubmit,
        onSubmit,
        errors,
        isSubmitting,
    } = useLoginForm();

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="LoginForm">
            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                {...register("email", {
                    required: "Email is required",
                })}
            />
            {errors.email && <p>{errors.email.message}</p>}

            <label htmlFor="password">Password</label>
            <input
                id="password"
                type="password"
                {...register("password", {
                    required: "Password is required",
                })}
            />
            {errors.password && <p>{errors.password.message}</p>}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
            </button>
        </form>
    );
}