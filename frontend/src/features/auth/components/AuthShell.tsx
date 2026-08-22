import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";

type AuthShellProps = {
    children: ReactNode;
    footer?: ReactNode;
};

export function AuthShell({ children, footer }: AuthShellProps) {
    return (
        <div className="bg-background relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_20%_15%,oklch(0.55_0.11_162/0.07),transparent),radial-gradient(45%_40%_at_80%_85%,oklch(0.55_0.11_162/0.05),transparent)]"
            />
            <div className="auth-reveal relative z-10 flex w-full max-w-sm flex-col gap-6 p-6">
                <Link
                    to="/"
                    className="flex items-center justify-center gap-2 self-center font-medium"
                >
                    <img src={logo} alt="" className="h-7 w-auto object-contain" />
                    <span className="text-base font-semibold tracking-tight">WorkSphere</span>
                </Link>
                {children}
            </div>
            {footer ? (
                <div className="text-muted-foreground relative z-10 text-center text-xs text-balance">
                    {footer}
                </div>
            ) : null}
        </div>
    );
}
