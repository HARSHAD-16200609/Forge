import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { registerUserInput } from "../../db/auth-schema";
import { session } from "../../types/auth"
export class AuthRepository {

  async createUser(userData: registerUserInput) {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        avatar: userData.avatar ?? null,
        timezone: userData.timezone ?? null
      }, select: {
        email: true,
        username: true
      }
    });

    return user
  }

  async findUserByUsernameorEmail(username: string, email: string) {

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username }, { email }
        ]

      }, select:
      {
        id: true,
        name: true,
        email: true,
      }

    })
    return user

  }


  async findUserForLogin(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        name: true,
        avatar: true
      }
    });
  }

  async findUserByUsername(username: string) {

    const user = await prisma.user.findFirst({
      where: {

        username

      }, select:
      {
        id: true,
        name: true,
        email: true,
      }

    })
    return user

  }


  async findUserByEmail(email: string) {

    const user = await prisma.user.findFirst({
      where: {

        email

      }, select:
      {
        id: true,
        username: true,
        name: true,
      }

    })

    return user
  }

  async createSession(session: session) {
    return await prisma.session.create({
      data: session,
      select: {
        id: true
      }
    })
  }
  async findSession(refreshTokenHash: string, expiry?: Date) {
    const refreshToken = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        ...(expiry && {
          expiresAt: {
            gt: expiry,
          },
        }),
      }, select: {
        id: true,
        userId: true
      }
    })
    return refreshToken
  }
  async getSessionById(sessionId: string) {
    return await prisma.session.findUnique({
      where: {
        id: sessionId
      },
      select: {
        id: true,
        userId: true
      }
    })
  }
  async deleteSession(refreshTokenHash: string) {
    await prisma.session.delete({
      where: {
        refreshTokenHash
      }
    })
  }

  async deleteAllSession(userId: string) {
    await prisma.session.deleteMany({
      where: {
        userId
      }
    })
  }
  async userExists(username: string) {
    const id = await prisma.user.findFirst({
      where: {
        username
      }, select: {
        id: true
      }
    })
    return id
  }
  async getById(id: string) {
    return await prisma.user.findUnique({
      where: {
        id
      },omit :{
         timezone:true,
         password:true,
         
      }
    })
  }
  async validateSession(sessionId: string) {

    return await prisma.session.findUnique({
      where: {
        id: sessionId
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true
          }

        }

      }
    })

  }


  async getOAuthUser(provider: "Google" | "Github", providerId: string) {
    return await prisma.oAuthAccount.findUnique({
      where: {

        provider_providerId: {
          provider, providerId

        }
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          }
        }
      }
    })

  }

  async createOAuthUserWithAccount(data: { username: string, name: string, email: string, avatar?: string | null }, accountData: { provider: "Google" | "Github", providerId: string }) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          name: data.name,
          email: data.email,
          password: null,
          avatar: data.avatar ?? null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
        }
      });

      await tx.oAuthAccount.create({
        data: {
          provider: accountData.provider,
          providerId: accountData.providerId,
          userId: user.id,
        },
        select: {
          id: true,
          userId: true,
        }
      });

      return user;
    })
  }

  async createOAuthAccount(data: { provider: "Google" | "Github", providerId: string, userId: string }) {
    return await prisma.oAuthAccount.create({
      data,
      select: {
        id: true,
        userId: true,
      }
    })
  }
}

export const authRepository =
  new AuthRepository();