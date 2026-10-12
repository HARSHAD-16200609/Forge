import { fType, Prisma, StorageProvider, UploadStatus, Visibility } from "../../../generated/prisma/client"
import { prisma } from "../../config/prisma"

export interface PendingUploadInsert {
    filename: string;
    url?: string | null;
    publicId?: string | null;
    mimeType: string;
    fileSize: number;
    fileType: fType;
    uploaderId: string;
    channelId?: string | null;
    conversationId?: string | null;
    storageProvider: StorageProvider;
    storageKey: string;
}

class UploadRepository {

    async uploadAttachement(attachments: {
        url: string,
        filename: string
        publicId: string,
        mimeType: string,
        fileSize: number,
        fileType: fType,
        uploaderId: string,
        storageProvider: StorageProvider,
        storageKey?: string | null,
        status?: UploadStatus,
        channelId?: string | null,
        conversationId?: string | null

    }[]) {
        const uploads = await prisma.upload.createManyAndReturn({
            data: attachments.map((attachment) => ({
                ...attachment,
                storageProvider: attachment.storageProvider ?? StorageProvider.CLOUDINARY,
                storageKey: attachment.storageKey ?? attachment.publicId,
                status: attachment.status ?? UploadStatus.UPLOADED,
                channelId: attachment.channelId ?? null,
                conversationId: attachment.conversationId ?? null,
            })),
            select: {
                id: true,
                url: true,
                filename: true,
                mimeType: true,
                fileSize: true,
                fileType: true,
                publicId: true,
            }

        }
        )
        return uploads
    }

    async createPendingUploads(attachments: PendingUploadInsert[]) {
        const uploads = await prisma.upload.createManyAndReturn({
            data: attachments.map((attachment) => ({
                ...attachment,
                url: attachment.url ?? null,
                publicId: attachment.publicId ?? null,
                channelId: attachment.channelId ?? null,
                conversationId: attachment.conversationId ?? null,
                status: UploadStatus.PENDING,
            })),
            select: {
                id: true,
                status: true,
                storageProvider: true,
                storageKey: true,
            }
        })
        return uploads
    }

    async getUploadByIdForUser(uploadId: string, userId: string) {
        return prisma.upload.findFirst({
            where: {
                id: uploadId,
                uploaderId: userId,
            },
            select: {
                id: true,
                uploaderId: true,
                messageId: true,
                status: true,
                storageProvider: true,
                storageKey: true,
                mimeType: true,
                fileType: true,
                url: true,
                publicId: true,
            },
        })
    }

    async markUploaded(uploadId: string, userId: string, data: { url?: string | null, publicId?: string | null, storageKey?: string | null }) {
        return prisma.upload.updateMany({
            where: {
                id: uploadId,
                uploaderId: userId,
                messageId: null,
                status: UploadStatus.PENDING,
            },
            data: {
                ...(data.url !== undefined && { url: data.url }),
                ...(data.publicId !== undefined && { publicId: data.publicId }),
                ...(data.storageKey !== undefined && { storageKey: data.storageKey }),
                status: UploadStatus.UPLOADED,
            },
        })
    }

    async deleteAttachments(uploadIds: string[]) {
        await prisma.upload.updateMany({
            where: {
                id: {
                    in: uploadIds
                },
                deletedAt: null
            }, data: {
                deletedAt: new Date()
            }
        })
    }
    async hardDeleteAttachments(uploadIds: string[]) {
        const deletedAttachments = await prisma.upload.deleteMany({
            where: {
                id: {
                    in: uploadIds
                }
            }
        })
        return deletedAttachments
    }

    async getScopeIds(workspaceId: string, userId: string) {
        const workspaceMember = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: { userId, workspaceId },
            },
            select: { id: true },
        });

        if (!workspaceMember) return { channelIds: [] as string[], conversationIds: [] as string[] };

        const [channelRows, conversationRows] = await Promise.all([
            prisma.channel.findMany({
                where: {
                    workspaceId,
                    OR: [
                        { visibility: Visibility.PUBLIC },
                        {
                            visibility: Visibility.PRIVATE,
                            members: {
                                some: { workspaceMemberId: workspaceMember.id },
                            },
                        },
                    ],
                },
                select: { id: true },
            }),
            prisma.conversationMember.findMany({
                where: {
                    userId,
                    conversation: { workspaceId },
                },
                select: { convoId: true },
            }),
        ]);

        return {
            channelIds: channelRows.map((c) => c.id),
            conversationIds: conversationRows.map((c) => c.convoId),
        };
    }

    async getWorkspaceFiles(
        scope: { channelIds: string[]; conversationIds: string[] },
        pagination: { cursor?: string | undefined, limit: number, fileType?: fType | undefined, search?: string | undefined }
    ) {
        const where: Prisma.uploadWhereInput = {
            deletedAt: null,
            messageId: { not: null },
            message: { deletedAt: null },
            OR: [
                { channelId: { in: scope.channelIds } },
                { conversationId: { in: scope.conversationIds } },
            ],
        };

        if (pagination.fileType) where.fileType = pagination.fileType;
        if (pagination.search) where.filename = { contains: pagination.search, mode: "insensitive" };

        const uploads = await prisma.upload.findMany({
            where,
            take: pagination.limit + 1,
            ...(pagination.cursor && { cursor: { id: pagination.cursor }, skip: 1 }),
            orderBy: { uploadedAt: "desc" },
            include: {
                message: {
                    select: {
                        id: true,
                        deletedAt: true,
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true },
                        },
                    },
                },
                channel: { select: { id: true, channelName: true } },
                conversation: {
                    select: {
                        id: true,
                        type: true,
                        groupName: true,
                        members: {
                            select: {
                                user: { select: { id: true, username: true, name: true, avatar: true } },
                            },
                        },
                    },
                },
            },
        });

        return uploads;
    }
}


export const uploadRepository = new UploadRepository()

export type WorkspaceFileRow = Awaited<ReturnType<UploadRepository["getWorkspaceFiles"]>>[number]