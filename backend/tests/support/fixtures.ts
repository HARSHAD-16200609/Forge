import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { prisma } from "./db";
import type { user, workspace } from "../../generated/prisma/client";

export type TestUser = Pick<user, "id" | "username" | "name" | "email">;

let seq = 0;

export async function createUser(): Promise<TestUser> {
  seq += 1;
  return prisma.user.create({
    data: {
      username: `e2e_user_${seq}`,
      name: `E2E User ${seq}`,
      email: `e2e_user_${seq}@test.dev`,
      password: "hashed-not-used",
    },
    select: { id: true, username: true, name: true, email: true },
  });
}

export async function createWorkspace(
  ownerUserId: string,
  name: string
): Promise<workspace> {
  return prisma.workspace.create({
    data: {
      workspaceName: `${name}_${crypto.randomUUID().slice(0, 8)}`,
      members: {
        create: { userId: ownerUserId, role: "OWNER" },
      },
    },
  });
}

export async function addWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<void> {
  await prisma.workspaceMember.create({
    data: { userId, workspaceId, role: "MEMBER" },
  });
}

export async function createChannel(
  workspaceId: string,
  createdByWorkspaceMemberId: string,
  channelName = "general"
): Promise<{ id: string }> {
  const channel = await prisma.channel.create({
    data: {
      workspaceId,
      channelName,
      createdByWorkspaceMemberId,
    },
    select: { id: true },
  });
  return channel;
}

export async function addChannelMember(
  workspaceMemberId: string,
  channelId: string
): Promise<void> {
  await prisma.channelMember.create({ data: { workspaceMemberId, channelId } });
}

export async function createDm(
  workspaceId: string,
  memberUserIds: string[]
): Promise<{ id: string }> {
  const dm = await prisma.conversation.create({
    data: {
      workspaceId,
      type: "DM",
      idempotencyKey: crypto.randomUUID(),
      members: { create: memberUserIds.map((userId) => ({ userId })) },
    },
    select: { id: true },
  });
  return dm;
}

export async function createGdm(
  workspaceId: string,
  memberUserIds: string[],
  groupName = "e2e-group"
): Promise<{ id: string }> {
  const gdm = await prisma.conversation.create({
    data: {
      workspaceId,
      type: "GDM",
      groupName,
      idempotencyKey: crypto.randomUUID(),
      members: { create: memberUserIds.map((userId) => ({ userId })) },
    },
    select: { id: true },
  });
  return gdm;
}

export async function createSession(userId: string): Promise<{ id: string }> {
  return prisma.session.create({
    data: {
      userId,
      refreshTokenHash: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    select: { id: true },
  });
}

export function accessTokenFor(
  user: TestUser,
  sessionId: string,
  expiresIn: jwt.SignOptions["expiresIn"] = "15m"
): string {
  return jwt.sign(
    { userId: user.id, username: user.username, sessionId },
    env.JWT_SECRET,
    { expiresIn }
  );
}

export interface ConfirmedUser {
  user: TestUser;
  sessionId: string;
  accessToken: string;
}

export async function createConfirmedUser(): Promise<ConfirmedUser> {
  const user = await createUser();
  const { id: sessionId } = await createSession(user.id);
  return { user, sessionId, accessToken: accessTokenFor(user, sessionId) };
}

export interface ChannelScene {
  workspace: { id: string };
  channel: { id: string };
  owner: ConfirmedUser;
  member: ConfirmedUser;
  outsider: ConfirmedUser;
}

export async function createChannelScene(): Promise<ChannelScene> {
  const owner = await createConfirmedUser();
  const member = await createConfirmedUser();
  const outsider = await createConfirmedUser();

  const workspace = await createWorkspace(owner.user.id, "channel-scene");

  await addWorkspaceMember(member.user.id, workspace.id);
  await addWorkspaceMember(outsider.user.id, workspace.id);

  const ownerMember = await prisma.workspaceMember.findUniqueOrThrow({
    where: { userId_workspaceId: { userId: owner.user.id, workspaceId: workspace.id } },
  });
  const memberRow = await prisma.workspaceMember.findUniqueOrThrow({
    where: { userId_workspaceId: { userId: member.user.id, workspaceId: workspace.id } },
  });

  const channel = await createChannel(workspace.id, ownerMember.id);

  await addChannelMember(ownerMember.id, channel.id);
  await addChannelMember(memberRow.id, channel.id);

  return { workspace, channel, owner, member, outsider };
}

export interface ConversationScene {
  workspace: { id: string };
  dm: { id: string };
  gdm: { id: string };
  alice: ConfirmedUser;
  bob: ConfirmedUser;
  carol: ConfirmedUser;
}

export async function createConversationScene(): Promise<ConversationScene> {
  const alice = await createConfirmedUser();
  const bob = await createConfirmedUser();
  const carol = await createConfirmedUser();

  const workspace = await createWorkspace(alice.user.id, "conversation-scene");

  await addWorkspaceMember(bob.user.id, workspace.id);
  await addWorkspaceMember(carol.user.id, workspace.id);

  const dm = await createDm(workspace.id, [alice.user.id, bob.user.id]);
  const gdm = await createGdm(workspace.id, [
    alice.user.id,
    bob.user.id,
    carol.user.id,
  ]);

  return { workspace, dm, gdm, alice, bob, carol };
}