
export const WsError = {
    UserInputValidationError: "Invalid-Input",
    Forbidden: "You are not Authorized for this Action",

    BadRequest: "Bad-request",
    NotFound: "Not-Found",
    MessageDelete: "message.delete",

    CloseConnection : "connection-close"
} as const;

export type WsError =
    typeof WsError[keyof typeof WsError];


    