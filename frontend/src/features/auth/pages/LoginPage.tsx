import { Outlet } from "react-router-dom";
import {LoginForm} from "../components/LoginForm";

export function LoginPage() {
    return (
        <div className="Login-cont">
            <LoginForm/>
            <Outlet />
        </div>
    );
}
