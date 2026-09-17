import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { splitMentionText, type MentionToken } from "@/features/Messages/utils/mentions";
import { UserPopup } from "./UserPopup";

type EditorBlock = {
    id?: string;
    type: string;
    data: Record<string, unknown>;
};

type BlocksRendererProps = {
    blocksJson?: string;
    className?: string;
    workspaceId?: string;
};

function MentionText({ token, workspaceId }: { token: MentionToken; workspaceId?: string }) {
    if (token.type !== "mention") {
        return <span dangerouslySetInnerHTML={{ __html: token.value }} />;
    }

    const label = <>@{token.username}</>;
    if (!workspaceId) {
        return (
            <span className="rounded bg-brand/10 font-medium text-brand">{label}</span>
        );
    }

    return (
        <UserPopup userId={token.id} workspaceId={workspaceId}>
            <button
                type="button"
                className="rounded bg-brand/10 px-0.5 font-medium text-brand transition-colors hover:bg-brand/15 hover:underline"
            >
                {label}
            </button>
        </UserPopup>
    );
}

function RichText({ text, workspaceId }: { text: string; workspaceId?: string }) {
    return (
        <>
            {splitMentionText(text).map((token, index) => (
                <Fragment key={index}>
                    <MentionText token={token} workspaceId={workspaceId} />
                </Fragment>
            ))}
        </>
    );
}

export function BlocksRenderer({ blocksJson, className, workspaceId }: BlocksRendererProps) {
    if (!blocksJson) {
        return <p className={cn("mt-0.5 text-[15px] leading-6 break-words", className)} />;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(blocksJson);
    } catch {
        return (
            <p className={cn("mt-0.5 text-[15px] leading-6 break-words", className)}>
                <RichText text={blocksJson} workspaceId={workspaceId} />
            </p>
        );
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        return <p className={cn("mt-0.5 text-[15px] leading-6 break-words", className)} />;
    }

    const blocks = parsed as EditorBlock[];

    return (
        <div className={cn("mt-0.5 space-y-2 text-[15px] leading-6 break-words", className)}>
            {blocks.map((block) => {
                switch (block.type) {
                    case "paragraph":
                        return (
                            <p key={block.id}>
                                <RichText text={String(block.data.text ?? "")} workspaceId={workspaceId} />
                            </p>
                        );
                    case "header": {
                        const level = Number(block.data.level ?? 3);
                        const Tag = (["h1", "h2", "h3", "h4", "h5", "h6"].find(
                            (_, i) => i + 1 === level,
                        ) ?? "h3") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
                        return (
                            <Tag key={block.id}>
                                <RichText text={String(block.data.text ?? "")} workspaceId={workspaceId} />
                            </Tag>
                        );
                    }
                    case "list": {
                        const style = block.data.style ?? "unordered";
                        const items = Array.isArray(block.data.items)
                            ? (block.data.items as string[])
                            : [];
                        const ListTag = style === "ordered" ? "ol" : "ul";
                        return (
                            <ListTag
                                key={block.id}
                                className={cn("pl-5", style === "ordered" ? "list-decimal" : "list-disc")}
                            >
                                {items.map((item, i) => (
                                    <li key={i}>
                                        <RichText text={item} workspaceId={workspaceId} />
                                    </li>
                                ))}
                            </ListTag>
                        );
                    }
                    case "quote":
                        return (
                            <blockquote
                                key={block.id}
                                className="border-l-2 border-border pl-3 not-italic"
                            >
                                <RichText text={String(block.data.text ?? "")} workspaceId={workspaceId} />
                            </blockquote>
                        );
                    case "code":
                        return (
                            <pre
                                key={block.id}
                                className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-sm text-foreground"
                            >
                                <code>{String(block.data.code ?? "")}</code>
                            </pre>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}