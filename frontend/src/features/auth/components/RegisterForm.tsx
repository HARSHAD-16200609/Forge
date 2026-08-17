import { useRegisterForm } from "../hooks/useRegisterForm";

export function RegisterForm() {
    const {
        register,
        handleSubmit,
        onSubmit,
        errors,
        isSubmitting,
    } = useRegisterForm();

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="RegisterForm">

            <label htmlFor="username">Username</label>
            <input
                id="username"
                type="text"
                {...register("username", {
                    required: "Username is required",
                })}
            />
            {errors.username && <p>{errors.username.message}</p>}
            <label htmlFor="name">Name</label>
            <input
                id="name"
                type="text"
                {...register("name", {
                    required: "Name is required",
                })}
            />
            {errors.name && <p>{errors.name.message}</p>}


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
                {isSubmitting ? "Registering..." : "Register"}
            </button>
        </form>
    );
}