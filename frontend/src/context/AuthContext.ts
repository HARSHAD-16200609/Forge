import type { UserProfile } from "@/features/auth/types";
import { createContext, type Dispatch, type SetStateAction } from "react";

type AuthContextType = {
  user: UserProfile | null;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  isAuthenticated : Boolean;
  isLoading : Boolean;
  setIsLoading: Dispatch<SetStateAction<Boolean>>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;