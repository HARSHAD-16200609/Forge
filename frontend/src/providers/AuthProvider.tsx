import { useEffect, useState, type ReactNode } from 'react'
import Auth from "@/context/AuthContext"
import type { UserProfile } from '@/features/auth/types'
import { api } from '@/lib/api'
import { AxiosError } from 'axios'




function AuthProvider({ children }: { children: ReactNode }) {


    const [user, setUser] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const isAuthenticated = user !== null;

    const fetchUser = async () => {
        try {

            let response = await api.get("auth/user");
            setUser(response.data.data);
            setIsLoading(false)



        } catch (e) {
            if (e instanceof AxiosError && Number(e.response?.status) === 401) {
                try {
                    await api.post("auth/refresh")
                    let response = await api.get("auth/user");
                    setUser(response.data.data);
                    setIsLoading(false)

                } catch (e) {
                    console.log("Refresh failed");
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    useEffect(() => {
        fetchUser();
    }, [])


    return (
        <Auth.Provider value={{ user, setUser, isLoading,  setIsLoading, isAuthenticated }}>
            {children}
        </Auth.Provider>
    )
}

export default AuthProvider