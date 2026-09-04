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

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    name: string;
    avatar: string;
    timezone:string
}