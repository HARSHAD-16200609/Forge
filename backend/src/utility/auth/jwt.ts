import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto"
import { env } from "../../config/env";
import { UnauthorizedAccessError } from "../errorHandling/customErrors";
import { authRepository } from "../../modules/Auth/auth.repository";



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

export async function verifyAccessToken(token: string, secret = env.JWT_SECRET) {
    try {
        const payload = jwt.verify(
            token,
            secret
        ) as jwtPayload;



        return payload

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


export async function validateSession(payload:jwtPayload) {
    const session = await authRepository.validateSession(payload.sessionId ?? "")

    if (!session) throw new UnauthorizedAccessError("Session Expired")

    if (session.userId !== payload.userId) throw new UnauthorizedAccessError("Invalid Token")


}