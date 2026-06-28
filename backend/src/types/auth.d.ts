export type loginInput = {
    username: string | undefined
    email: string | undefined
    password: string
}

export type session = {
    userId: string
    refreshTokenHash: string
    expiresAt: Date
    createdAt: Date,
    ipAddress : string,
    userAgent : string
}

export type Params = {

}