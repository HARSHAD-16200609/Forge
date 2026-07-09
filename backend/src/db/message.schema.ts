import emojiRegex from "emoji-regex";
import { z } from "zod";
import { rType } from "../config/cloudinary";
import { fType } from "../../generated/prisma/enums";

export const messageSchema = z.object({

  content: z
    .string()
    .trim()
    .min(0, "Message can be empty")
    .max(4000, "Message is too long"),

});

export const getMessagesSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});


const regex = emojiRegex();

export const emojiSchema = z.object({
  reaction: z.string().refine((value) => {
    const matches = value.match(regex);
    return (
      matches !== null &&
      matches.length === 1 &&
      matches[0] === value
    );
  }, "Reaction must be exactly one emoji"),
});

export const MIME_TO_RESOURCE_TYPE = new Map<string, "image" | "video" | "raw">([

  ["image/jpeg", "image"],
  ["image/png", "image"],
  ["image/webp", "image"],
  ["image/gif", "image"],


  ["video/mp4", "video"],
  ["video/webm", "video"],
  ["video/quicktime", "video"],


  ["audio/mpeg", "raw"],
  ["audio/wav", "raw"],
  ["application/pdf", "raw"],
  ["application/msword", "raw"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "raw"],
  ["application/vnd.ms-excel", "raw"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "raw"],
  ["application/vnd.ms-powerpoint", "raw"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "raw"],
  ["text/plain", "raw"],
  ["application/zip", "raw"],
  ["application/x-rar-compressed", "raw"],
]);

export function getFileType(mimeType: string): fType {
  if (mimeType.startsWith("image/")) return "IMAGE";

  if (mimeType.startsWith("video/")) return "VIDEO";

  if (mimeType.startsWith("audio/")) return "AUDIO";

  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "DOCUMENT";
  }

  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed"
  ) {
    return "ARCHIVE";
  }

  return "OTHER";
}

export const getResourceType = (mimeType: string): rType => {
  return MIME_TO_RESOURCE_TYPE.get(mimeType) || "auto"
}

export const delUploadParamsSchema = z.object({
  uploads: z.array(z.uuid()).min(1, "At least one upload ID is required")
})

export type Message = z.infer<typeof messageSchema>
export type getMessagesDTO = z.infer<typeof getMessagesSchema> 