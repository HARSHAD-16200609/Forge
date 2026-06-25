
import { StatementSync } from "node:sqlite";
import { createWorkspaceDTO, workspaceMemberDTO, workspaceMemberSchema, workspaceSchema, wsMemberDeleteUpdateDTO } from "../../db/workspace";
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


        const workspace = await workspaceRepository.createWorkspace(Workspace, user)


        return workspace
    }

    async getAllWorkspaces(User: jwtPayload) {
        try {

            const workspaces = await workspaceRepository.getAllWorkspaces(User)

            return workspaces
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
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


        if (!canWorkspace(User.role, "workspaceMember", "create")) throw new ForbiddenError("You are not allowed to  perform this Action")


        const user = await authRepository.userExists(Member.userName)

        if (!user) throw new NotFoundError("User Not Found !!")
        const id = await workspaceRepository.memberExists(user.id, Member.workspaceId)
        if (id) {
            throw new ConfilctError("User is Already Part of the Workspace")
        }


        const member = await workspaceRepository.addUserToWorkspace({ role: Member.role, userId: user.id, workspaceId: Member.workspaceId })

        return member




    }

    async getWorkspace(workspaceId: string, userId: string) {

        const member = await workspaceRepository.memberExists(userId, workspaceId)

        if (!member) throw new ForbiddenError("YOu are not an Member of this Workspace")

        try {
            const workspace = await workspaceRepository.getWorkspace(workspaceId)
            return workspace
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new NotFoundError("Workspace not Found")
        }
    }

    async getaAllMembers(workspaceId: string, userId: string) {


        const member = await workspaceRepository.memberExists(userId, workspaceId)

        if (!member) throw new ForbiddenError("You are not an Member of this Workspace")

        const role = await workspaceRepository.getRole(userId, workspaceId)

        if (!canWorkspace(role ?? "MEMBER", "workspaceMember", "read")) throw new ForbiddenError("You are not allowed to  perform this Action")

        const membersArray = await workspaceRepository.getAllMembers(workspaceId)
        const members = membersArray.map(u => ({
            ...u.user,
            role: u.role,
        }));


        return members



    }

    async deleteWSMember(User: wsMemberDeleteUpdateDTO, OwnerAdminId: string) {

        const member = await workspaceRepository.memberExists(OwnerAdminId, User.workspaceId)
        if (!member) throw new UnauthorizedAccessError("You Are Not an Member of this Workspace")
        const UserRole = await workspaceRepository.getRole(OwnerAdminId, User.workspaceId)
        const userToDeleteRole = await workspaceRepository.getRole(User.userId, User.workspaceId)
        if (!canWorkspace(UserRole ?? "MEMBER", "workspaceMember", "delete")) throw new ForbiddenError("You are not allowed to perform this Action")
        if (UserRole === userToDeleteRole || (UserRole === "ADMIN" && userToDeleteRole === "OWNER")) throw new ForbiddenError("You are not allowed to perform this Action")
        try {

            await workspaceRepository.deleteWSMember(User.userId, User.workspaceId)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("Member Dosen't Exists")
            }
        }



    }

}

export const workspaceService = new WorkspaceService()