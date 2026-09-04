import { cn } from "@/lib/utils";

type EditorBlock = {
    id?: string;
    type: string;
    data: Record<string, unknown>;
};

type BlocksRendererProps = {
    blocksJson?: string;
    className?: string;
};

export function BlocksRenderer({ blocksJson, className }: BlocksRendererProps) {
    if (!blocksJson) {
        return <p className={cn("mt-0.5 text-[15px] leading-6 break-words", className)} />;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(blocksJson);
    } catch {
        return (
            <p className={cn("mt-0.5 text-[15px] leading-6 break-words", className)}>
                {blocksJson}
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
                        return <p key={block.id}>{String(block.data.text ?? "")}</p>;
                    case "header": {
                        const level = Number(block.data.level ?? 3);
                        const Tag = (["h1", "h2", "h3", "h4", "h5", "h6"].find(
                            (_, i) => i + 1 === level,
                        ) ?? "h3") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
                        return <Tag key={block.id}>{String(block.data.text ?? "")}</Tag>;
                    }
                    case "list": {
                        const style = block.data.style ?? "unordered";
                        const items = Array.isArray(block.data.items)
                            ? (block.data.items as string[])
                            : [];
                        if (style === "ordered") {
                            return (
                                <ol key={block.id} className="list-decimal pl-5">
                                    {items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ol>
                            );
                        }
                        return (
                            <ul key={block.id} className="list-disc pl-5">
                                {items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        );
                    }
                    case "quote":
                        return (
                            <blockquote
                                key={block.id}
                                className="border-l-2 border-border pl-3 not-italic"
                            >
                                {String(block.data.text ?? "")}
                            </blockquote>
                        );
                    case "code":
                        return (
                            <pre
                                key={block.id}
                                className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-sm text-foreground dark:bg-zinc-950/70 dark:text-zinc-100"
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
