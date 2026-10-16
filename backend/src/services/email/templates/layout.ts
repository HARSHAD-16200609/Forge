interface EmailLayoutInput {
  previewText: string;
  heading: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  footnote: string;
}

export function renderEmailLayout(input: EmailLayoutInput): string {
  const paragraphs = input.bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#3f3f46;">${line}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${input.previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 24px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Forge</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:#18181b;">${input.heading}</h1>
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;">
                <a href="${input.ctaUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">${input.ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #f4f4f5;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#a1a1aa;">${input.footnote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
