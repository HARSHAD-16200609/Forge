import { prisma } from "../../config/prisma";
import { Visibility } from "../../../generated/prisma/enums";
import { userInfo } from "node:os";
import { Role } from "../../../generated/prisma/enums";
import { equal } from "node:assert";
import { roleDTO, workspaceMemberDTO } from "../../db/workspace";
import { SrvRecord } from "node:dns";
import { tr } from "zod/locales";
import { deleteChannel } from "../Channel/channel.controller";


class WorkspaceRepository {

  async createWorkspace(
    workspace: {
      workspaceName: string;
      visibility: Visibility;
      description: string;
    },
    user: { userId: string; username: string }
  ) {
    const Workspace = await prisma.$transaction(async (tx) => {

      const ws = await tx.workspace.create({
        data: {
          workspaceName: workspace.workspaceName,
          visibility: workspace.visibility,
          description: workspace.description,
        },
      });

      const owner = await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId: user.userId,
          role: Role.OWNER,
        },
      });

      const generalChannel = await tx.channel.create({
        data: {
          workspaceId: ws.id,
          channelName: "general",
          description: "General discussions",
          visibility: Visibility.PUBLIC,
          isDefault: true,
          createdByWorkspaceMemberId: owner.id,
        },
      });

      await tx.channelMember.create({
        data: {
          channelId: generalChannel.id,
          workspaceMemberId: owner.id,
          isCreator: true,
        },
      });


      return ws;
    });
    return Workspace

  }

  async findworkspaceByName(workspaceName: string) {

    const workspace = await prisma.workspace.findFirst({
      where: {
        workspaceName
      }
    })

    return workspace

  }
  async getWorkspace(workspaceId: string) {

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId
      }, include: {
        channels: {
          select: {
            channelName: true,
          }
        },
        members: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                timezone: true
              }
            }


          }
        }, _count: {
          select: {
            members: true
          }
        }

      }
    })

    const response = {
      ...workspace,
      memberCount: workspace?._count.members,
    };

    delete response._count;

    return response

  }

  async workspaceExists(workspaceName: string) {
    const id = await prisma.workspace.findFirst({
      where: {
        workspaceName
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
        workspace: {
          omit: {
            createdAt: true,
            updatedAt: true

          }
        }
      }
    })
    return workspaces
  }

  async addUserToWorkspace(workspaceMember: {
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

  async memberExists(userId: string, workspaceId: string) {
    const user = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      }, select: {
        id: true, role: true
      }
    });
    return user;
  }
  async getRole(userId: string, workspaceId: string) {
    const user = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      }, select: {
        role: true
      }
    });
    return user?.role;
  }
  async getAllMembers(workspaceId: string, pagination: { page: number, limit: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = {
      workspaceId
    }
    const [wsMembers, total] = await Promise.all([prisma.workspaceMember.findMany({
      where, skip,
      take: limit,
      select: {
        role: true,
        user: {
          select: {
            username: true,
            avatar: true
          },


        }
      }, orderBy: {
        role: "desc"
      }
    }), prisma.workspaceMember.count({ where })])

    return { wsMembers, hasMore: skip + wsMembers.length < total, total }
  }

  async deleteWSMember(userId: string, workspaceId: string) {
    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: { userId, workspaceId }
      }
    })
    return
  }
  async updateRole(userId: string, workspaceId: string, role: Role) {
    const user = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId, workspaceId
        }
      }, data:
        { role },
      select: {
        role: true,
        user: {
          select: {
            username: true,
            name: true,

          }
        },
        workspace: {
          select: {
            workspaceName: true,
            description: true
          }
        }
      }

    });
    return user
  }
  async getUserByworkspceMemberId(id: string) {
    return await prisma.workspaceMember.findUnique({
      where: {
        id
      }
    })
  }

  async getWorkspaceMembers(memberIds: string[],workspaceId:string) {
    const members = await prisma.workspaceMember.findMany({
      where: {

        userId: {
          in: memberIds
        },workspaceId
      }
    })

    return members

  }



}



export const workspaceRepository = new WorkspaceRepository()