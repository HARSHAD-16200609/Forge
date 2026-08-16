import { Outlet } from "react-router-dom";

export function LoginPage() {
  return (<div>
        <h1>Login</h1>  
        <Outlet />
    </div>);
}