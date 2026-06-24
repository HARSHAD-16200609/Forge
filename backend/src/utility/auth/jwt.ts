import jwt, { SignOptions } from "jsonwebtoken";




export function genJwtToken(payload : jwtPayload,expiry : SignOptions["expiresIn"] = "15m",secret : string){

    return jwt.sign(payload,
        secret
        ,{expiresIn: expiry})

}

export function compareToken(token : string){
     
}