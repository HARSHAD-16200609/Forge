import { fType, Prisma } from "../../../generated/prisma/client";
import { deleteFromCloudinary, uploadOnCloudinary } from "../../config/cloudinary";
import { getFileType, getResourceType } from "../../db/message.schema";
import { ConfilctError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { messageRepository } from "./message.repository";
import { messageService } from "./message.service";
import { uploadRepository, WorkspaceFileRow } from "./upload.repository";

class UploadService {
    async uploadAttachments(attachments: Express.Multer.File[], userId: string) {
        let attachmentData: {
            filename: string;
            url: string;
            publicId: string;
            mimeType: string;
            fileSize: number;
            fileType: fType;
            uploaderId: string;
        }[] = [];
        try {
            const uploadedAttachments = await Promise.all(
                attachments.map(async (attachment) => {
                    return uploadOnCloudinary(attachment.path, getResourceType(attachment.mimetype))
                })
            )


            if (uploadedAttachments.length === 0) throw new Error("Failed to upload attachments")

            attachmentData = uploadedAttachments.map((upload, index) => {
                const attachment = attachments[index]!;

                return {
                    filename: attachment.originalname,
                    url: upload.secure_url,
                    publicId: upload.public_id,
                    mimeType: attachment.mimetype,
                    fileSize: attachment.size,
                    fileType: getFileType(attachment.mimetype),
                    uploaderId: userId

                };
            });
            const uploads = uploadRepository.uploadAttachement(attachmentData)

            return uploads
        } catch (error) {
            if (attachmentData.length > 0) {

                const results = await Promise.allSettled(
                    attachmentData.map((attachment) => {
                        return deleteFromCloudinary(attachment.publicId, getResourceType(attachment.mimeType))
                    })
                )
                const failed = results.filter(
                    (result) => result.status === "rejected"
                );

                if (failed.length > 0) {
                    loggers.audit.error("UPLOAD_ROLLBACK_FAILED", {
                        failedCount: failed.length,
                    });
                }
            }
            throw error
        }

    }
    async deleteAttachments(messageId: string, uploads: string[], userId: string) {
        const uploadsToBEDeleted = await messageRepository.getMessageUploads(messageId, uploads)
        if (!uploadsToBEDeleted) throw new NotFoundError("No Uploads Found")
        if (uploadsToBEDeleted.senderId !== userId) throw new ForbiddenError("You are not allowed to perform this action")

        try {
            await uploadRepository.deleteAttachments(uploadsToBEDeleted.uploads.flatMap((upload) => upload.id))
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ConfilctError("Resource Already Deleted")
            }
            throw err
        }

        return




    }

    async getWorkspaceFiles(
        workspaceId: string,
        userId: string,
        pagination: { cursor?: string | undefined, limit: number, fileType?: fType | undefined, search?: string | undefined }
    ) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const scope = await uploadRepository.getScopeIds(workspaceId, userId)
        if (scope.channelIds.length === 0 && scope.conversationIds.length === 0) {
            return {
                files: [] as WorkspaceFileDTO[],
                hasMore: false,
                nextCursor: null,
            }
        }

        const uploads = await uploadRepository.getWorkspaceFiles(scope, pagination)

        const hasMore = uploads.length > pagination.limit
        const visible = hasMore ? uploads.slice(0, pagination.limit) : uploads

        return {
            files: visible.map((upload) => this.toWorkspaceFileDTO(upload)),
            hasMore,
            nextCursor: hasMore && visible.length > 0 ? visible[visible.length - 1]!.id : null,
        }
    }

    private toWorkspaceFileDTO(upload: WorkspaceFileRow): WorkspaceFileDTO {
        const uploader = upload.message?.sender ?? null;
        let source: WorkspaceFileDTO["source"];

        if (upload.channel) {
            source = {
                type: "channel",
                id: upload.channel.id,
                label: `#${upload.channel.channelName}`,
            };
        } else {
            const convo = upload.conversation;
            if (!convo) {
                source = { type: "conversation", id: "", label: "Unknown chat" };
            } else if (convo.type === "GDM") {
                source = {
                    type: "conversation",
                    id: convo.id,
                    label: convo.groupName ?? "Group chat",
                };
            } else {
                const other = convo.members.find((member) => member.user.id !== uploader?.id)?.user;
                source = {
                    type: "conversation",
                    id: convo.id,
                    label: other ? (other.name ?? other.username) : "Direct message",
                };
            }
        }

        return {
            id: upload.id,
            filename: upload.filename,
            url: upload.url,
            mimeType: upload.mimeType,
            fileSize: upload.fileSize,
            fileType: upload.fileType,
            uploadedAt: upload.uploadedAt,
            uploader: uploader
                ? {
                      id: uploader.id,
                      username: uploader.username,
                      name: uploader.name,
                      avatar: uploader.avatar,
                  }
                : null,
            source,
        };
    }
}



export const uploadService = new UploadService()

export interface WorkspaceFileDTO {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    fileSize: number;
    fileType: fType;
    uploadedAt: Date;
    uploader: { id: string, username: string, name: string | null, avatar: string | null } | null;
    source: {
        type: "channel" | "conversation";
        id: string;
        label: string;
    };
}