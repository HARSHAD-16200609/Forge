import { Link } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";
import logo from "../../../assets/logo.png";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function RegisterPage() {
    return (
        <main className="bg-linear-to-b from-background to-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <img src={logo} alt="WorkSphere" className="h-24 w-auto rounded-2xl object-contain" />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Create your account</CardTitle>
                    <CardDescription>Set up your workspace in a few minutes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                </CardContent>
            </Card>
            <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link
                    className="text-foreground font-medium underline-offset-4 hover:underline"
                    to="/auth/login"
                >
                    Sign in
                </Link>
            </p>
        </main>
    );
}
