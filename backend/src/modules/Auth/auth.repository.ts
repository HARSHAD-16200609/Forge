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
      }, select: {
        id: true,
        username: true
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
}

export const authRepository =
  new AuthRepository();