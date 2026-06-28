import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto"


export function genJwtToken(payload : jwtPayload,expiry : SignOptions["expiresIn"] = "15m",secret : string){

    return jwt.sign(payload,
        secret
        ,{expiresIn: expiry})

}

export function hashToken(refreshToken : string) :string{
     return crypto.createHash("sha256")
     .update(refreshToken)
            .digest("hex");
}