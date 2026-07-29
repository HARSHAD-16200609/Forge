import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto"
import { env } from "../../config/env";
import { BadRequestError, UnauthorizedAccessError } from "../errorHandling/customErrors";
import { prisma } from "../../config/prisma";


export function genJwtToken(payload: jwtPayload, expiry: SignOptions["expiresIn"] = "15m", secret: string) {

    return jwt.sign(payload,
        secret
        , { expiresIn: expiry })

}

export function hashToken(refreshToken: string): string {
    return crypto.createHash("sha256")
        .update(refreshToken)
        .digest("hex");
}

export async function verifyAccessToken(token: string) {
    try {
        const payload = jwt.verify(
            token,
            env.JWT_SECRET
        ) as jwtPayload  ;
        const user = await prisma.user.findFirst({
            where: {
                id: payload.userId
            }, select: {
                id: true,
                username: true
            }
        })


        return {...user,sessionId:payload.sessionId}

    } catch (err) {
        if (
            err instanceof jwt.TokenExpiredError ||
            err instanceof jwt.JsonWebTokenError
        ) {
            throw new UnauthorizedAccessError(
                "Invalid or expired access token"
            );
        }

        throw err;
    }
}