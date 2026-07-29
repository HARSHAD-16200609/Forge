import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../../generated/prisma/client";
import { loginSchema, loginUserInput, registerSchema, registerUserInput } from "../../db/auth-schema";
import { authRepository } from "./auth.repository"
import bcrypt from "bcryptjs";
import { ApiError } from "../../utility/errorHandling/ApiError";
import { prisma } from "../../config/prisma";
import { BadRequestError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import type { loginInput } from "../../types/auth"
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

        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) {
            throw new UnauthorizedAccessError("Invalid Credentials !!!")
        }


        const refreshToken = genJwtToken({ userId: existingUser.id, username: existingUser.username! }, env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"], env.REFRESH_TOKEN_SECRET)
        const refreshTokenHash = hashToken(refreshToken)


        const sessionInfo = {
            email: existingUser.email,
            userId: existingUser.id,
            refreshToken
        }
        try {
            const session = {
                userId: existingUser.id,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + Number((env.REFRESH_TOKEN_EXPIRES_IN).split("d")[0]) * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                ipAddress: userMetaData.ip,
                userAgent: userMetaData.userAgent,

            }
            const sessionId = await authRepository.createSession(session)

            const accessToken = genJwtToken({ userId: existingUser.id, username: existingUser.username! ,sessionId:sessionId.id }
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

}

export const authService = new AuthService()