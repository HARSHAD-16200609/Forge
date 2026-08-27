import { useState, type ReactNode } from 'react'
import Auth from "@/context/AuthContext"
import type { UserProfile } from '@/features/auth/types'



function AuthProvider({ children }: { children: ReactNode }) {


    const [user, setUser] = useState<UserProfile | null>(null)

    return (
        <Auth.Provider value={{ user, setUser }}>
            {children}
        </Auth.Provider>
    )
}

export default AuthProvider