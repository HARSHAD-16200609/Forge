import { fType, StorageProvider, Prisma, UploadStatus, Visibility } from "../../../generated/prisma/client";
import { deleteFromCloudinary, uploadOnCloudinary } from "../../config/cloudinary";
import { getFileType, getResourceType } from "../../db/message.schema";
import { storageStrategy } from "../../storage";
import { ConfilctError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { messageRepository } from "../Messages/message.repository";
import { messageService } from "../Messages/message.service";
import { channelRepository } from "../Channel/channel.repository";
import { conversationRepository } from "../Conversations/conversations.repository";
import { uploadRepository, WorkspaceFileRow } from "./upload.repository";

export interface CreateUploadIntentsParams {
    workspaceId: string;
    files: { filename: string; mimeType: string; fileSize: number }[];
    channelId?: string | undefined;
    conversationId?: string | undefined;
}

export interface CompleteUploadParams {
    publicId?: string | undefined;
    secureUrl?: string | undefined;
}

class UploadService {
    async createUploadIntents(params: CreateUploadIntentsParams, userId: string) {
        const scope = params.channelId
            ? { type: "channel" as const, id: params.channelId }
            : { type: "conversation" as const, id: params.conversationId! };

        await this.assertScopeAccess(userId, params.workspaceId, scope);

        const inputs = params.files.map((file) => ({
            filename: file.filename,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            fileType: getFileType(file.mimeType),
            scope,
            userId,
        }));

        const intents = await storageStrategy.createUploadIntents(inputs);

        const rows = await uploadRepository.createPendingUploads(
            inputs.map((input, index) => ({
                filename: input.filename,
                url: null,
                publicId: null,
                mimeType: input.mimeType,
                fileSize: input.fileSize,
                fileType: input.fileType,
                uploaderId: userId,
                channelId: scope.type === "channel" ? scope.id : null,
                conversationId: scope.type === "conversation" ? scope.id : null,
                storageProvider: intents[index]!.provider,
                storageKey: intents[index]!.key,
            })),
        );

        return rows.map((row, index) => ({
            uploadId: row.id,
            provider: intents[index]!.provider,
            uploadUrl: intents[index]!.uploadUrl,
            method: intents[index]!.method,
            headers: intents[index]!.headers,
            fields: intents[index]!.fields,
            expiresAt: intents[index]!.expiresAt,
        }));
    }

    async completeUpload(uploadId: string, userId: string, body: CompleteUploadParams) {
        const upload = await uploadRepository.getUploadByIdForUser(uploadId, userId)
        if (!upload) throw new NotFoundError("Upload Not Found")
        if (upload.status !== UploadStatus.PENDING) throw new ConfilctError("Upload is already confirmed")
        if (upload.messageId) throw new ConfilctError("Upload is already attached to a message")
        if (!upload.storageKey) throw new ConfilctError("Upload is missing a storage key")

        const confirmed = await storageStrategy.confirmUpload(upload.storageProvider, {
            key: upload.storageKey,
            mimeType: upload.mimeType,
            fileType: upload.fileType,
            publicId: body.publicId,
            secureUrl: body.secureUrl,
        })

        if (!confirmed.verified) throw new NotFoundError("Storage provider could not verify the upload")

        const updated = await uploadRepository.markUploaded(uploadId, userId, {
            url: confirmed.url ?? null,
            publicId: confirmed.publicId ?? null,
            storageKey: confirmed.storageKey ?? upload.storageKey,
        })

        if (updated.count === 0) throw new ConfilctError("Upload is already confirmed")

        return { id: uploadId }
    }

    async uploadAttachments(attachments: Express.Multer.File[], userId: string, scope?: { channelId?: string, conversationId?: string }) {
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
            const uploads = await uploadRepository.uploadAttachement(attachmentData.map((a) => ({
                ...a,
                storageProvider: StorageProvider.CLOUDINARY,
                channelId: scope?.channelId ?? null,
                conversationId: scope?.conversationId ?? null,
            })))

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

        const files = await Promise.all(visible.map((upload) => this.toWorkspaceFileDTO(upload)))

        return {
            files,
            hasMore,
            nextCursor: hasMore && visible.length > 0 ? visible[visible.length - 1]!.id : null,
        }
    }

    private async toWorkspaceFileDTO(upload: WorkspaceFileRow): Promise<WorkspaceFileDTO> {
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
            url: upload.url ?? await this.resolveReadUrl(upload),
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

    private async resolveReadUrl(upload: { storageProvider: StorageProvider, storageKey: string | null, url: string | null, mimeType: string }) {
        if (upload.url) return upload.url
        if (upload.storageKey) {
            try {
                return await storageStrategy.getReadUrl(upload.storageProvider, upload.storageKey, { mimeType: upload.mimeType })
            } catch (err) {
                loggers.db.error("WORKSPACE_FILE_READ_URL_FAILED", {
                    error: err instanceof Error ? err.message : String(err),
                })
            }
        }
        return ""
    }

    private async assertScopeAccess(userId: string, workspaceId: string, scope: { type: "channel" | "conversation", id: string }) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        if (scope.type === "channel") {
            const channel = await channelRepository.channelExists(scope.id, workspaceId)
            if (!channel) throw new NotFoundError("Channel Not Found")
            const channelMember = await channelRepository.memberExists(workspaceMember.id, scope.id)
            if (!channelMember && channel.visibility === Visibility.PRIVATE) {
                throw new ForbiddenError("You are not a member of this channel")
            }
            return
        }

        const conversation = await conversationRepository.conversationExists(scope.id, userId)
        if (!conversation) throw new NotFoundError("Conversation Not Found")
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