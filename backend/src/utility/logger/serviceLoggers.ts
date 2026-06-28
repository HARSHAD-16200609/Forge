import logger from "./logger";


export const loggers = {
  auth: logger.child({ service: "AUTH" }),
  db: logger.child({ service: "DATABASE" }),
  workspace: logger.child({ service: "WORKSPACE" }),
  security: logger.child({ service: "SECURITY" }),
  audit: logger.child({ service: "AUDIT" }),
};

export function getCurrentTime():string{
   
   return  new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })
}