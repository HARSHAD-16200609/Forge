import { useForm } from "react-hook-form";
import type { WorkspaceObject } from "../types";
import { useCreateWorkspace } from "./useWorkspaces";

export function useWorkspaceForm() {
    const mutation = useCreateWorkspace();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<WorkspaceObject>({
        defaultValues: {
            workspaceName: "",
            visibility: "PUBLIC",
            description: "",
        },
    });

    const onSubmit = async (data: WorkspaceObject) => {
        try {
            await mutation.mutateAsync(data);
} catch {
            console.log("Mutation Error ", mutation.error)
        }
    };

    return {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        reset,
        workspaceName: watch("workspaceName"),
        visibility: watch("visibility"),
        description: watch("description"),
        errors,
        isSubmitting,
        isPending: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        submitForm: handleSubmit(onSubmit),
    };
}