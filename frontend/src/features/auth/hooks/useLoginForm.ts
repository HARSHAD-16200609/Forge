import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { LoginFormData } from "../types";
import axios from "axios";
import { login } from "../services/auth.service";
import useAuth from "./useAuth";

export function useLoginForm() {
    const navigate = useNavigate();
    const { setUser, setIsLoading } = useAuth();
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
            console.log("Axios error")
            console.log(error)
            if (axios.isAxiosError(error)) {
                setError("email", {
                    type: "server",
                    message:
                        error.response?.data?.message ??
                        "Login failed. Please check your credentials.",
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
        errors,
        isSubmitting,
    };
}
