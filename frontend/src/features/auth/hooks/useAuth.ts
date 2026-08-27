import { useContext } from "react"
import Auth from "@/context/AuthContext"

const useAuth = () => {
    const context = useContext(Auth)

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;

}

export default useAuth