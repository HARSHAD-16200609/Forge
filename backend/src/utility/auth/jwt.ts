import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

type jwtPayload = {
    userId : string,
    username:string
}

export function genJwtToken(payload : jwtPayload,expiry : SignOptions["expiresIn"] = "15m"){

    return jwt.sign(payload,
        env.JWT_SECRET
        ,{expiresIn: expiry})

}