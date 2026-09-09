import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../../generated/prisma/client";
import { loginSchema, loginUserInput, registerSchema, registerUserInput } from "../../db/auth-schema";
import { authRepository } from "./auth.repository"
import bcrypt from "bcryptjs";
import { ApiError } from "../../utility/errorHandling/ApiError";
import { prisma } from "../../config/prisma";
import { BadRequestError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import type { loginInput, OAuthProfile } from "../../types/auth"
import { genJwtToken, hashToken } from "../../utility/auth/jwt";
import { env } from "../../config/env";
import { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken"



class AuthService {

    async Register(User: registerUserInput) {

        const { username, password, email } = User


        const existingUser = await authRepository.findUserByUsernameorEmail(username, email)

        if (existingUser) {
            throw new ApiError(StatusCodes.CONFLICT, "User Already Exist's")
        }
        const hashedPass = await bcrypt.hash(password, 12)

        try {
            User.password = hashedPass
            const user = await authRepository.createUser(User)

            return user
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new ApiError(StatusCodes.CONFLICT, "User already exists");
            }
            throw err;
        }

    }
    async Login(User: loginUserInput, userMetaData: { ip: string, userAgent: string }) {

        const { username, password, email } = User
        const identifier = username ?? email ?? "";

        if (identifier.trim().length === 0) throw new BadRequestError("Please Enter Username Or Email")

        const existingUser = await authRepository.findUserForLogin(identifier)


        if (!existingUser) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Invalid Credentials !!!")
        }

        if (!existingUser.password) {
            throw new UnauthorizedAccessError("Invalid Credentials !!!")
        }

        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) {
            throw new UnauthorizedAccessError("Invalid Credentials !!!")
        }

        return this.createUserSession(existingUser.id, existingUser.username!, existingUser.email, userMetaData)
    }

    private async createUserSession(userId: string, username: string, email: string, userMetaData: { ip: string, userAgent: string }) {

        const refreshToken = genJwtToken({ userId, username }, env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"], env.REFRESH_TOKEN_SECRET)
        const refreshTokenHash = hashToken(refreshToken)

        const sessionInfo = {
            email,
            userId,
            refreshToken
        }
        try {
            const session = {
                userId,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + Number((env.REFRESH_TOKEN_EXPIRES_IN).split("d")[0]) * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                ipAddress: userMetaData.ip,
                userAgent: userMetaData.userAgent,

            }
            const sessionId = await authRepository.createSession(session)

            const accessToken = genJwtToken({ userId, username, sessionId: sessionId.id }
                , env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
                env.JWT_SECRET)

            return { ...sessionInfo, sessionId, accessToken }
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                throw new ApiError(StatusCodes.CONFLICT, "Already Logged In")
            }
            return
        }

    }

    async oauthLogin(profile: OAuthProfile, userMetaData: { ip: string, userAgent: string }) {

        const { provider, providerId, email, name, picture } = profile;

        const existingOAuth = await authRepository.getOAuthUser(provider, providerId);

        let userId: string;
        let username: string;

        if (existingOAuth?.user) {
            userId = existingOAuth.user.id;
            username = existingOAuth.user.username;
        } else {
            let user = await authRepository.findUserByEmail(email);

            if (!user) {
                const generatedUsername = await this.generateUniqueUsername(name);
                user = await authRepository.createOAuthUserWithAccount({
                    username: generatedUsername,
                    name,
                    email,
                    avatar: picture ?? null,
                }, { provider, providerId });
            } else {
                try {
                    await authRepository.createOAuthAccount({ provider, providerId, userId: user.id });
                } catch (err) {
                    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                        throw new BadRequestError("Account already linked with another acoount")
                    } else {
                        throw err;
                    }
                }
            }

            userId = user.id;
            username = user.username;
        }

        return this.createUserSession(userId, username, email, userMetaData)
    }

    private async generateUniqueUsername(email: string) {

        const prefix = email.split("@")[0] ?? "";
        const raw = prefix.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 15) || "user";
        const base = raw.length < 6 ? raw.padEnd(6, "_") : raw;

        let candidate = base;
        let suffix = 1;

        while (await authRepository.findUserByUsername(candidate)) {
            candidate = `${base}_${suffix}`
            suffix += 1;
        }

        return candidate
    }

    async Refresh(refreshToken: string) {

        if (!refreshToken) {
            throw new UnauthorizedAccessError("Invalid or Expired Token")
        }
        const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as jwtPayload

        const refreshTokenHash = hashToken(refreshToken)
        const now = new Date()
        const session = await authRepository.findSession(refreshTokenHash, now)

        if (!session || session.userId !== decoded.userId) {
            throw new UnauthorizedAccessError("Invalid or Expired Token")
        }

        const accessToken = genJwtToken({ userId: decoded.userId, username: decoded.username,sessionId:session.id }, env.JWT_EXPIRES_IN as SignOptions["expiresIn"], env.JWT_SECRET)

        return accessToken

    }
    async Logout(refreshToken: string) {
        const refreshTokenHash = hashToken(refreshToken)

        const session = await authRepository.findSession(refreshTokenHash)

        if (!session) {
            throw new UnauthorizedAccessError("Invalid Token")
        }

        try {
            await authRepository.deleteSession(refreshTokenHash)

        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ApiError(404, "Already Logged Out")
            }
            throw err
        }
    }

    async LogoutFromAllDevices(userId: string) {
        try {
            await authRepository.deleteAllSession(userId)

        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ApiError(404, "Already Logged Out")
            }
            throw err
        }
    }
    async getUser(userId : string){
        const user = await authRepository.getUser(userId)
        return user
    }

}

export const authService = new AuthService()