import { Link } from "react-router-dom";
import logo from "@/assets/forge.png";

export function LandingFooter() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="" className="h-9 w-auto object-contain" />
                    <p className="text-sm text-muted-foreground">
                        Real-time team communication, built for fast teams.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                    <a
                        href="#features"
                        className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        Features
                    </a>
                    <a
                        href="#product"
                        className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        Product
                    </a>
                    <Link
                        to="/auth/login"
                        className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/auth/register"
                        className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
            <div className="border-t px-6 py-4">
                <p className="mx-auto max-w-7xl text-xs text-muted-foreground">
                    © 2026 Forge. Built with React, Node.js, and WebSockets.
                </p>
            </div>
        </footer>
    );
}