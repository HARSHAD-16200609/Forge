export interface LoginFormData {
    password: string;
    email: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    username: string;
    confirmPassword?: string;
}

export interface AuthenticatedUser {
    sessionId : string;
    username : string;
    

}