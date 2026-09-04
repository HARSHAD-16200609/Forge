import { Link } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    return (
        <AuthShell footer={<>© {new Date().getFullYear()} WorkSphere Labs. All rights reserved.</>}>
            <div className="flex flex-col gap-1.5 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your details below to create your account
                </p>
            </div>

            <RegisterForm />

            <div className="text-muted-foreground relative z-10 text-center text-sm">
                Already have an account?{" "}
                <Link
                    to="/auth/login"
                    className="underline underline-offset-4 hover:text-foreground"
                >
                    Log in
                </Link>
            </div>
        </AuthShell>
    );
}
