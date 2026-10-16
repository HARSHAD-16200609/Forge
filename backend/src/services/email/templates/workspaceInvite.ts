import { escapeHtml, renderEmailLayout, type RenderedEmail } from "./layout";

export interface WorkspaceInviteEmailInput {
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  expiresInDays: number;
}

export function workspaceInviteTemplate(input: WorkspaceInviteEmailInput): RenderedEmail {
  const inviter = escapeHtml(input.inviterName);
  const workspace = escapeHtml(input.workspaceName);

  return {
    subject: `${input.inviterName} invited you to join ${input.workspaceName} on Forge`,
    html: renderEmailLayout({
      previewText: `${inviter} invited you to join ${workspace}`,
      heading: `Join ${workspace} on Forge`,
      bodyLines: [
        `<strong>${inviter}</strong> has invited you to join the <strong>${workspace}</strong> workspace.`,
        "Forge is where your team chats, shares files, and stays in sync.",
      ],
      ctaLabel: "Join workspace",
      ctaUrl: input.inviteUrl,
      footnote: `This invite expires in ${input.expiresInDays} days. If you weren't expecting this, you can safely ignore this email.`,
    }),
    text: [
      `${input.inviterName} invited you to join ${input.workspaceName} on Forge.`,
      "",
      `Join here: ${input.inviteUrl}`,
      "",
      `This invite expires in ${input.expiresInDays} days. If you weren't expecting this, you can safely ignore this email.`,
    ].join("\n"),
  };
}
