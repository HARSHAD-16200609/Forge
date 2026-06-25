import { prisma } from "../../config/prisma";
import { Visibility } from "../../../generated/prisma/enums";
import { userInfo } from "node:os";
import { Role } from "../../../generated/prisma/enums";
import { equal } from "node:assert";
import { workspaceMemberDTO } from "../../db/workspace";
import { SrvRecord } from "node:dns";
import { tr } from "zod/locales";


class WorkspaceRepository {

  async createWorkspace(
    workspace: {
      workspaceName: string;
      visibility: Visibility;
      description: string;
    },
    user: { userId: string; username: string }
  ) {
    const ws = await prisma.workspace.create({
      data: {
        ...workspace,
        members: {
          create: {
            userId: user.userId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    }
    );

    return ws;
  }

  async findworkspaceByName(workspaceName: string) {

    const workspace = await prisma.workspace.findFirst({
      where: {
        workspaceName
      }
    })

    return workspace

  }

  async workspaceExists(workspaceId: string, userId: string) {
    const id = await prisma.workspaceMember.findFirst({
      where: {

        workspaceId, userId
      },
      select: {
        id: true
      }
    })
    return id
  }

  async getAllWorkspaces(User: jwtPayload) {
    const workspaces = await prisma.workspaceMember.findMany({
      where: {
        userId: User.userId
      },
      select: {
        role: true,
        workspace: true
      }
    })
    return workspaces
  }

  async addMembertoWorkspace(workspaceMember: {
    role: Role,
    userId: string,
    workspaceId: string
  }) {
    const member = await prisma.workspaceMember.create({
      data: workspaceMember,
      select: {
        user: {
          select: {
            username: true,
          }, 
         },
          workspace: {
            select: {
              workspaceName: true,
            }
          }, role: true,
      
      }
    })

    return member
  }

  async memberExists(userId: string,  workspaceId :string) {
    const user = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId } ,
      }, select: {
        id: true
      }
    });
    return user;
  }
}



export const workspaceRepository = new WorkspaceRepository()