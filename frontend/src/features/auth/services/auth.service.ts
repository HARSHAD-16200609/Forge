import { api } from "@/lib/api";
import type { LoginFormData, RegisterFormData } from "../types";

export async function login(data: LoginFormData) {
    const response = await api.post("/auth/login", data);

    return response.data;
}

export async function registerUser(data: RegisterFormData) {
    const response = await api.post("/auth/register", data);
    return response.data;
}

export async function logout () : Promise<void>{
    await api.post("/auth/logout")
} 