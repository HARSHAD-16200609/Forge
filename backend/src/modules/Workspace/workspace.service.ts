
import { StatementSync } from "node:sqlite";
import { createWorkspaceDTO, workspaceMemberDTO, workspaceMemberSchema, workspaceSchema } from "../../db/workspace";
import { ApiError } from "../../utility/errorHandling/ApiError";
import { BadGatewayError, BadRequestError, ConfilctError, ForbiddenError, NotFoundError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { workspaceRepository } from "./workspace.repository";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../config/prisma";
import { authRepository } from "../auth/auth.repository";
import { Prisma } from "../../../generated/prisma/client";
import { equal } from "node:assert";
import { is } from "zod/v4/locales";
import { loggers } from "../../utility/logger/serviceLoggers";
import { canWorkspace } from "../../utility/Authorization/Permissions";


class WorkspaceService {

    async createWorkspace(Workspace: createWorkspaceDTO, user: { userId: string, username: string }) {
        const result = workspaceSchema.safeParse(Workspace)

        if (!result.success) {

            throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)
        }

        const workspace = await workspaceRepository.createWorkspace(Workspace, user)
        return workspace
    }

    async getAllWorkspaces(User: jwtPayload) {
        try {

            const workspaces = await workspaceRepository.getAllWorkspaces(User)

            return workspaces
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "2025") {
                throw new NotFoundError("No Workspaces Found ...")
            }
            return
        }



    }
    async addUserToWorkspace(Member: workspaceMemberDTO, userId: string) {

        const User = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: Member.workspaceId,
                userId
            }, select: {
                id: true,
                role: true
            }
        })

        if (!User) {  
            throw new UnauthorizedAccessError(
                "You are Not a Member of this Workspace "
            );
        }


        if (!canWorkspace(User.role, "workspaceMember", "create")) throw new ForbiddenError("You are not allowed to add members in the workspace")


        const user = await authRepository.userExists(Member.userName)

        if (!user) throw new NotFoundError("User Not Found !!")
        const id = await workspaceRepository.memberExists(user.id, Member.workspaceId)
        if (id) {
            throw new ConfilctError("User is Already Part of the Workspace")
        }


        const member = await workspaceRepository.addMembertoWorkspace({ role: Member.role, userId: user.id, workspaceId: Member.workspaceId })

        return member




    }
}

export const workspaceService = new WorkspaceService()