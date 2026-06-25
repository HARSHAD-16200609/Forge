export type loginInput = {
    username: string | undefined
    email: string | undefined
    password: string
}

export type session = {
    userId: string
    refreshToken: string
    expiresAt: Date
    createdAt: Date
}

export type Params = {

}