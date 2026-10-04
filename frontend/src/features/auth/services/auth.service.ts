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

    async rerollAvatar() {
        const response = await api.post("/auth/user/avatar/reroll")
        return response.data
    }

    async uploadAvatar(file: File) {
        const formData = new FormData()
        formData.append("avatar", file)
        const response = await api.post("/auth/user/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return response.data
    }

    async removeAvatar() {
        const response = await api.delete("/auth/user/avatar")
        return response.data
    }

}

export const authService = new AuthService()