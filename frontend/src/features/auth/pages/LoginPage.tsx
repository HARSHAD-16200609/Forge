import { Link } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import logo from "../../../assets/logo.png";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function LoginPage() {
    return (
        <main className="bg-linear-to-b from-background to-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <img src={logo} alt="WorkSphere" className="h-24 w-auto rounded-2xl object-contain" />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Sign in to your workspace</CardTitle>
                    <CardDescription>Welcome back — pick up where you left off.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
            <p className="text-muted-foreground text-sm">
                Don't have an account?{" "}
                <Link
                    className="text-foreground font-medium underline-offset-4 hover:underline"
                    to="/auth/register"
                >
                    Create one
                </Link>
            </p>
        </main>
    );
}
