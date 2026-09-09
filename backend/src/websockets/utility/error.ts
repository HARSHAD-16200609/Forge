import { ZodError } from "zod/v4";

export function formatValidationError(error: ZodError): string {
    const details = error.issues.map((issue) => {
        const field = issue.path.length > 0 ? issue.path.join(".") : "payload";
        return `${field}: ${issue.message}`;
    });
    return details.join(" | ") || "Invalid payload";
}