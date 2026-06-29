
import { StatementSync } from "node:sqlite";
import { createWorkspaceDTO, roleDTO, workspaceMemberDTO, workspaceMemberSchema, workspaceSchema, wsMemberDeleteUpdateDTO } from "../../db/workspace";
import { ApiError } from "../../utility/errorHandling/ApiError";
import { BadGatewayError, BadRequestError, ConfilctError, ForbiddenError, NotFoundError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { workspaceRepository } from "./workspace.repository";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../config/prisma";
import { authRepository } from "../Auth/auth.repository";
import { Prisma, Role } from "../../../generated/prisma/client";
import { equal } from "node:assert";
import { is } from "zod/v4/locales";
import { loggers } from "../../utility/logger/serviceLoggers";
import { canWorkspace } from "../../utility/Authorization/Permissions";
import { throwDeprecation } from "node:process";


class WorkspaceService {

    async createWorkspace(Workspace: createWorkspaceDTO, user: { userId: string, username: string }) {
        const ws = await workspaceRepository.workspaceExists(Workspace.workspaceName)
        if (!ws) {
            const workspace = await workspaceRepository.createWorkspace(Workspace, user)


            return workspace
        }
        else {
            const owner = await workspaceRepository.memberExists(user.userId, ws.id)
            if (owner) {
                throw new ConfilctError(`Workspace named ${Workspace.workspaceName} already exists`)
            }
            const workspace = await workspaceRepository.createWorkspace(Workspace, user)


            return workspace

        }



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

        const User = await workspaceRepository.memberExists(userId, Member.workspaceId)

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

    async getAllMembers(workspaceId: string, userId: string,Pagination:{page:number,limit:number}) {


        const member = await workspaceRepository.memberExists(userId, workspaceId)

        if (!member) throw new ForbiddenError("You are not an Member of this Workspace")

        const role = await workspaceRepository.getRole(userId, workspaceId)

        if (!canWorkspace(role ?? "MEMBER", "workspaceMember", "read")) throw new ForbiddenError("You are not authorized to  perform this Action")

        const WSmembers = await workspaceRepository.getAllMembers(workspaceId,Pagination)
        const members = WSmembers.wsMembers.map(u => ({
            ...u.user,
            role: u.role,
        }));


        return {workspaceMembers :members,hasMore:WSmembers.hasMore,toal:WSmembers.total}



    }

    async deleteWSMember(User: wsMemberDeleteUpdateDTO, requesterId: string) {

        const requester = await workspaceRepository.memberExists(requesterId, User.workspaceId)
        if (!requester) throw new UnauthorizedAccessError("You Are Not an Member of this Workspace")
        const userToDelete = await workspaceRepository.memberExists(User.memberId, User.workspaceId)
        if (!userToDelete) throw new NotFoundError("User Not Found")
        if (!canWorkspace(requester.role ?? "MEMBER", "workspaceMember", "delete")) throw new ForbiddenError("You are not authorized to perform this Action")
        if (requester.role === userToDelete.role || (requester.role === "ADMIN" && userToDelete.role === "OWNER")) {

            throw new ForbiddenError("You are not authorized to perform this Action")
        }
        try {
            await workspaceRepository.deleteWSMember(User.memberId, User.workspaceId)
            console.log("User Deleted")
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("Member Dosen't Exists")
            }

        }



    }
    async updateRole(User: wsMemberDeleteUpdateDTO, role: Role, requesterId: string) {


        const requester = await workspaceRepository.memberExists(requesterId, User.workspaceId)
        if (!requester) throw new UnauthorizedAccessError("You Are Not an Member of this Workspace")
        const userToUpdate = await workspaceRepository.memberExists(User.memberId, User.workspaceId)
        if (!userToUpdate) throw new NotFoundError("User id not an Member of this Workspace")

        if (!canWorkspace(requester.role ?? "MEMBER", "workspaceMember", "manageRoles")) throw new ForbiddenError("You are not authorized to perform this Action")
        if (role === userToUpdate.role) throw new ConfilctError(`User  already has the role ${role}`)
        try {
            const updatedMember = await workspaceRepository.updateRole(User.memberId, User.workspaceId, role)
            const formatedMember = { ...updatedMember.user, ...updatedMember.workspace, role: updatedMember.role }
            return formatedMember
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("Member Dosen't Exists")
            }
        }

    }



}

export const workspaceService = new WorkspaceService()