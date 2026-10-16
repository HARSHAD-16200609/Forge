import { escapeHtml, renderEmailLayout, type RenderedEmail } from "./layout";

export interface ChannelInviteEmailInput {
  inviterName: string;
  workspaceName: string;
  channelName: string;
  inviteUrl: string;
  expiresInDays: number;
}

export function channelInviteTemplate(input: ChannelInviteEmailInput): RenderedEmail {
  const inviter = escapeHtml(input.inviterName);
  const workspace = escapeHtml(input.workspaceName);
  const channel = escapeHtml(input.channelName);

  return {
    subject: `${input.inviterName} invited you to #${input.channelName} in ${input.workspaceName}`,
    html: renderEmailLayout({
      previewText: `${input.inviterName} invited you to #${input.channelName}`,
      heading: `Join #${channel}`,
      bodyLines: [
        `<strong>${inviter}</strong> has invited you to the private channel <strong>#${channel}</strong> in the <strong>${workspace}</strong> workspace.`,
        "Accept the invite to start chatting with the team.",
      ],
      ctaLabel: "Join channel",
      ctaUrl: input.inviteUrl,
      footnote: `This invite expires in ${input.expiresInDays} days. If you weren't expecting this, you can safely ignore this email.`,
    }),
    text: [
      `${input.inviterName} invited you to #${input.channelName} in ${input.workspaceName}.`,
      "",
      `Accept here: ${input.inviteUrl}`,
      "",
      `This invite expires in ${input.expiresInDays} days. If you weren't expecting this, you can safely ignore this email.`,
    ].join("\n"),
  };
}
