import { Link, Outlet } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";
import logo from "../../../assets/logo.png";
import "./auth.css";

export function RegisterPage() {
    return (
        <div className="auth-page">
            <div className="auth-panel">
                <img className="auth-logo" src={logo} alt="WorkSphere" />
                <div className="auth-card">
                    <h1>Create your account</h1>
                    <p className="auth-subtitle">Set up your workspace in a few minutes.</p>
                    <RegisterForm />
                    <p className="auth-switch">
                        Already have an account? <Link className="auth-link" to="/auth/login">Sign in</Link>
                    </p>
                </div>
            </div>
            <aside className="auth-side">
                <div className="auth-shape auth-shape-1" />
                <div className="auth-shape auth-shape-2" />
                <div className="auth-shape auth-shape-3" />
                <div className="auth-shape auth-shape-4" />
                <h2>Get your team organized in minutes</h2>
                <p>Create a workspace, invite your teammates, and start collaborating.</p>
            </aside>
            <Outlet />
        </div>
    );
}
