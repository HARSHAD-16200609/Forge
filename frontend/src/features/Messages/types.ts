// "id": "e115c812-7559-44b6-9a5a-0db54c1460d4",
//     "content": "Hii",
//         "senderId": "1785a112-bf0e-409c-a4f2-467d45dd7ae7",
//             "sentAt": "2026-08-31T20:27:51.365Z",
//                 "editedAt": null,
//                     "parentMsgId": null,
//                         "sender": {
//     "username": "karan_d",
//         "avatar": "https://i.pravatar.cc/300?img=18"
// }

export interface Message {
    id: string;
    content: string;
    senderId: string;
    sentAt: string;
    editedAt: string;
    parentMsgId: string;
    sender: Sender;
    uploads?: MessageAttachment[];
}

export interface Sender {
    username: string;
    avatar: string;
}

export interface MessageAttachment {
    filename: string;
    url: string;
    mimeType: string;
    fileSize: number;
    fileType: string;
}

export interface paginatedMessages {
    messages: Message[];
    hasMore: boolean;
    nextCursor?: string;
}
