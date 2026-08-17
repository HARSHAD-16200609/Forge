import { Outlet } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    return (
        <div className="Register-cont">
            
             <RegisterForm/>
            <Outlet />
        </div>
    );
}

