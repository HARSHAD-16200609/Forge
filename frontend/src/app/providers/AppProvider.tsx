import type { ReactNode } from "react";

import { QueryProvider } from "./QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { RealtimeProvider } from "@/realtime/RealtimeProvider";

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <QueryProvider>
                    <RealtimeProvider>{children}</RealtimeProvider>
                </QueryProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
