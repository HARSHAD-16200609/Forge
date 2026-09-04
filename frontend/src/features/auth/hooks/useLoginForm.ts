import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { LoginFormData } from "../types";
import axios from "axios";

import useAuth from "./useAuth";

export function useLoginForm() {
    const navigate = useNavigate();
    const { setUser, setIsLoading, login } = useAuth();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {

            const response = await login(data);
            reset();
            setIsLoading(true);
            navigate("/app");
            setUser(response.data.user);
            setIsLoading(false);


        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.message ?? "Invalid email or password.";
                setError("email", {
                    type: "server",
                    message,
                });
                setError("password", {
                    type: "server",
                    message,
                });
            } else {
                setError("email", {
                    type: "server",
                    message: "Unable to connect to the server. Please try again later.",
                });
                setError("password", {
                    type: "server",
                    message: "Unable to connect to the server. Please try again later.",
                });
            }
        }
    };

    return {
        register,
        handleSubmit,
        onSubmit,
        reset,
        errors,
        isSubmitting,
    };
}
