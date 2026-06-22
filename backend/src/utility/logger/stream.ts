import logger from "./logger";


export const stream = {
    write : (message : string)=>{
        logger.http(message)
    }
} 