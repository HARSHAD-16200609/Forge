export type loginInput = {
    username: string | null
    email: string | null
    password: string
}

export type session = {
    userId: string
    refreshToken: string
    expiresAt: Date
    createdAt: Date
}