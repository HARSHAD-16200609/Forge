import { api } from "@/lib/api";
import type { LoginFormData, RegisterFormData } from "../types";



class AuthService {
    async login(data: LoginFormData) {
        const response = await api.post("/auth/login", data);

        return response.data;
    }

    async registerUser(data: RegisterFormData) {
        const response = await api.post("/auth/register", data);
        return response.data;
    }

    async logout(): Promise<void> {
        await api.post("/auth/logout")
    }

}

export const authService = new AuthService()