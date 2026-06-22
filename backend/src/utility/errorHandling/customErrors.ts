import { ApiError } from "./ApiError";
import { StatusCodes } from "http-status-codes"

export class UnauthorizedAccessError extends ApiError {
 
    constructor(message: string) {
        super(StatusCodes.UNAUTHORIZED, message)
        this.name = "UnAuthorizedAcess"
    }
}

export class ForbiddenError extends ApiError {

    constructor(message: string) {
        super(StatusCodes.FORBIDDEN, message)
        this.name = "Forbidden"

    }
}

export class BadRequestError extends ApiError {
   
    constructor(message: string) {
        super(StatusCodes.BAD_REQUEST, message)
this.name = "BadRequest"
    }
}


export class NotFoundError extends ApiError {
   
    constructor(message: string) {
        super(StatusCodes.NOT_FOUND, message)
this.name = "NotFound"
    }
}


export class InvalidMethodError extends ApiError {
  
    constructor(message: string) {
        super(StatusCodes.METHOD_NOT_ALLOWED, message)
this.name = "InvalidMethod"
    }
}


export class DuplicatePostRequestError extends ApiError {
   
    constructor(message: string) {
        super(409, message)
this.name = "DuplicatePostRequest"
    }
}


export class TooManyRequestsError extends ApiError {
  
    constructor( message: string) {
        super(StatusCodes.TOO_MANY_REQUESTS, message)
this.name = "TooManyRequests"
    }
}

export class BadGatewayError extends ApiError {

    constructor(message: string) {
        super(StatusCodes.BAD_GATEWAY, message)
this.name = "BadGateway"
    }
}

export class ServiceUnavailableError extends ApiError {
    
    constructor(message: string) {
        super(StatusCodes.SERVICE_UNAVAILABLE, message)
this.name = "ServiceUnavailable"
    }
}

export class GatewayTimeoutError extends ApiError {
   
    constructor(message: string) {
        super(StatusCodes.GATEWAY_TIMEOUT, message)
this.name = "GatewayTimeout"
    }
}

export class UserInputValidationError extends ApiError {
    invalidationReason: object;
    constructor(message : string,invalidationReason : object){
        super(StatusCodes.BAD_REQUEST,message)
        this.invalidationReason = invalidationReason
    }
}