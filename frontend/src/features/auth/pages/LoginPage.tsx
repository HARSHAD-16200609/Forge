import { Link, Outlet } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import logo from "../../../assets/logo.png";
import "./auth.css";

export function LoginPage() {
    return (
        <div className="auth-page">
            <div className="auth-panel">
                <img className="auth-logo" src={logo} alt="WorkSphere" />
                <div className="auth-card">
                    <h1>Sign in to your workspace</h1>
                    <p className="auth-subtitle">Welcome back — pick up where you left off.</p>
                    <LoginForm />
                    <p className="auth-switch">
                        Don't have an account? <Link className="auth-link" to="/auth/register">Create one</Link>
                    </p>
                </div>
            </div>
            <aside className="auth-side">
                <div className="auth-shape auth-shape-1" />
                <div className="auth-shape auth-shape-2" />
                <div className="auth-shape auth-shape-3" />
                <div className="auth-shape auth-shape-4" />
                <h2>Where your team's work comes together</h2>
                <p>Channels, projects, and messages — organized in one calm, focused workspace.</p>
            </aside>
            <Outlet />
        </div>
    );
}
