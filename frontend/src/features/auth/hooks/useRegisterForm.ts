import { useNavigate } from "react-router-dom";
import type { RegisterFormData } from "../types";
import { useForm } from "react-hook-form";
import axios from "axios";
import { registerUser } from "../services/auth.service";

export function useRegisterForm() {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            username: "",
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        delete data.confirmPassword;
        try {
            await registerUser(data);
            reset();
            navigate("/auth/login");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError("email", {
                    type: "server",
                    message:
                        error.response?.data?.message ?? "Registration failed. Please try again.",
                });
            } else {
                setError("email", {
                    type: "server",
                    message: "Something went wrong. Please try again.",
                });
            }
        }
    };

    return {
        register,
        handleSubmit,
        onSubmit,
        reset,
        watch,
        errors,
        isSubmitting,
    };
}
