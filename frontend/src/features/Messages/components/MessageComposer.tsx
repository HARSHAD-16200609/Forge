import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
} from "react";
import EditorJS from "@editorjs/editorjs";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import {
    AtSign,
    Bold,
    ChevronDown,
    Code,
    Italic,
    Link,
    List as ListIcon,
    ListOrdered,
    Mic,
    MoreHorizontal,
    Paperclip,
    Quote as QuoteIcon,
    Send,
    Smile,
    SquareCode,
    SquarePlus,
    Strikethrough,
    Underline,
    Video,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComposerStore } from "@/stores/composerStore";
import type { BlockToolConstructable, OutputData } from "@editorjs/editorjs";

function parseStoredBlocks(contentJson: string): OutputData | undefined {
    if (!contentJson) return undefined;
    try {
        const parsed: unknown = JSON.parse(contentJson);
        if (Array.isArray(parsed)) return { blocks: parsed as OutputData["blocks"] };
        const object = parsed as OutputData;
        if (parsed && typeof parsed === "object" && Array.isArray(object.blocks)) return object;
        return undefined;
    } catch {
        return undefined;
    }
}

type MessageComposerProps = {
    channelId?: string;
    channelName?: string;
    placeholder?: string;
    onChange?: (contentJson: string) => void;
    onSend?: (contentJson: string, files: File[]) => void;
    disabled?: boolean;
    className?: string;
};

function ToolbarButton({
    label,
    children,
    className,
    active,
    ...props
}: { label: string; children: ReactNode; active?: boolean } & ComponentProps<"button">) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            {...props}
            onMouseDown={(event) => {
                event.preventDefault();
                props.onMouseDown?.(event);
            }}
            className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                className,
            )}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />;
}

type ActiveInline = {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    code: boolean;
    link: boolean;
};

const emptyActiveInline: ActiveInline = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    link: false,
};

class CodeBlockTool extends CodeTool {
    static get conversionConfig() {
        return {
            export: (data: { code?: string }) => data.code ?? "",
            import: (text: string) => ({ code: text }),
        };
    }
}

export function MessageComposer({
    channelId,
    channelName,
    placeholder,
    onChange,
    onSend,
    disabled,
    className,
}: MessageComposerProps) {
    const editorHostRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorJS | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [inlineState, setInlineState] = useState<ActiveInline>(emptyActiveInline);
    const [blockState, setBlockState] = useState<string | null>(null);
    const [listStyle, setListStyle] = useState<"ordered" | "unordered" | null>(null);

    const onChangeRef = useRef(onChange);
    const placeholderRef = useRef(placeholder ?? `Message #${channelName ?? "new-channel"}`);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const readActiveStyles = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const selection = document.getSelection();
        const node = selection?.anchorNode;
        const element: Element | null =
            node instanceof Element ? node : (node?.parentElement ?? null);
        const blockEl = element?.closest<HTMLElement>(".ce-block");

        if (!blockEl) {
            setInlineState(emptyActiveInline);
            setBlockState(null);
            setListStyle(null);
            return;
        }

        let bold = false;
        let italic = false;
        let underline = false;
        let strike = false;
        try {
            bold = document.queryCommandState("bold");
            italic = document.queryCommandState("italic");
            underline = document.queryCommandState("underline");
            strike = document.queryCommandState("strikeThrough");
        } catch {
            /* queryCommandState can throw for non-editable selections */
        }

        let code = false;
        let link = false;
        for (let el: Element | null = element; el && el !== blockEl; el = el.parentElement) {
            if (el.tagName === "CODE") code = true;
            if (el.tagName === "A") link = true;
        }

        const index = editor.blocks.getCurrentBlockIndex();
        const block = index > -1 ? editor.blocks.getBlockByIndex(index) : undefined;
        const name = block?.name ?? null;

        let ordered = false;
        let unordered = false;
        if (name === "list" && blockEl) {
            ordered = blockEl.querySelector("ol") !== null;
            unordered = blockEl.querySelector("ul") !== null;
        }

        setInlineState({ bold, italic, underline, strike, code, link });
        setBlockState(name);
        setListStyle(ordered ? "ordered" : unordered ? "unordered" : null);
    }, []);

    const propagate = useCallback(async () => {
        try {
            const saved = await editorRef.current?.save();
            const contentJson = JSON.stringify(saved?.blocks ?? []);
            onChangeRef.current?.(contentJson);
            useComposerStore.getState().saveDraft(channelId ?? "", contentJson);
        } catch {
            /* ignore save errors while typing */
        }
        readActiveStyles();
    }, [readActiveStyles, channelId]);

    useEffect(() => {
        if (!editorHostRef.current) return;

        const editor = new EditorJS({
            holder: editorHostRef.current,
            placeholder: placeholderRef.current,
            autofocus: true,
            data: parseStoredBlocks(useComposerStore.getState().getDraft(channelId ?? "")),
            tools: {
                paragraph: {
                    class: Paragraph as unknown as BlockToolConstructable,
                    inlineToolbar: false,
                },
                list: {
                    class: List,
                    inlineToolbar: false,
                },
                quote: {
                    class: Quote,
                    inlineToolbar: false,
                },
                code: CodeBlockTool,
                header: {
                    class: Header,
                    inlineToolbar: false,
                    config: { levels: [2, 3, 4], defaultLevel: 3 },
                },
            },
            onChange: async () => {
                await propagate();
            },
        });

        editorRef.current = editor;

        let disposed = false;
        let destroyed = false;

        document.addEventListener("selectionchange", readActiveStyles);
        void editor.isReady.then(() => readActiveStyles());

        return () => {
            disposed = true;
            document.removeEventListener("selectionchange", readActiveStyles);
            editorRef.current = null;
            void editor.isReady.then(() => {
                if (destroyed) return;
                destroyed = true;
                if (!disposed) return;
                editor.destroy();
            });
        };
    }, [readActiveStyles, propagate, channelId]);

    function focusEditable() {
        editorHostRef.current?.querySelector<HTMLElement>("[contenteditable=true]")?.focus();
    }

    async function applyInline(command: string, value?: string) {
        focusEditable();
        document.execCommand(command, false, value);
        await propagate();
    }

    function currentBlockMeta(): {
        id: string;
        name: string;
        listStyle: "ordered" | "unordered" | null;
    } | null {
        const index = editorRef.current?.blocks.getCurrentBlockIndex();
        const block =
            index !== undefined && index > -1
                ? editorRef.current?.blocks.getBlockByIndex(index)
                : undefined;
        if (!block) return null;
        let listStyle: "ordered" | "unordered" | null = null;
        if (block.name === "list") {
            listStyle = block.holder.querySelector("ol")
                ? "ordered"
                : block.holder.querySelector("ul")
                  ? "unordered"
                  : null;
        }
        return { id: block.id, name: block.name, listStyle };
    }

    async function toggleBlock(tool: string, data?: unknown) {
        const meta = currentBlockMeta();
        const index = editorRef.current?.blocks.getCurrentBlockIndex() ?? 0;

        const clickedStyle = (data as { style?: string } | undefined)?.style ?? null;
        let target = tool;
        let targetData = data;

        if (meta) {
            if (tool === "list") {
                if (meta.name === "list" && meta.listStyle === clickedStyle) {
                    target = "paragraph";
                    targetData = undefined;
                } else if (meta.name === "list") {
                    targetData = { style: clickedStyle ?? "unordered" };
                }
            } else if (meta.name === tool) {
                target = "paragraph";
                targetData = undefined;
            }
        }

        try {
            if (meta) {
                await editorRef.current?.blocks.convert(meta.id, target, targetData as never);
            } else {
                throw new Error("No current block to convert");
            }
        } catch {
            await editorRef.current?.blocks.insert(target, targetData as never, undefined, index);
        }
        await propagate();
        focusEditable();
    }

    function handleInlineCode() {
        focusEditable();
        const selection = document.getSelection();
        const node = selection?.anchorNode;
        const element = node instanceof Element ? node : (node?.parentElement ?? null);
        const codeEl = element?.closest?.("code");

        if (codeEl && codeEl.parentElement) {
            codeEl.replaceWith(document.createTextNode(codeEl.textContent ?? ""));
            void propagate();
            return;
        }

        const text = selection?.toString();
        if (text) {
            document.execCommand("insertHTML", false, "<code>" + text + "</code>");
        }
        void propagate();
    }

    function handleLink() {
        focusEditable();
        if (inlineState.link) {
            document.execCommand("unlink");
            void propagate();
            return;
        }
        const url = window.prompt("Enter the URL");
        if (!url) return;
        document.execCommand("createLink", false, url);
        void propagate();
    }

    function handleAddFiles(list: FileList | null) {
        if (!list) return;
        setFiles((prev) => [...prev, ...Array.from(list)]);
    }

    function removeFile(index: number) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSend() {
        if (disabled) return;
        const blocks = await editorRef.current?.save();
        const contentJson = JSON.stringify(blocks?.blocks ?? []);
        onSend?.(contentJson, files);
    }

    return (
        <div className={cn("w-full rounded-lg border border-border bg-background", className)}>
            {/* Top formatting toolbar */}
            <div className="flex items-center gap-0.5 border-b border-border/60 px-2 py-1">
                <ToolbarButton
                    label="Bold"
                    active={inlineState.bold}
                    onClick={() => void applyInline("bold")}
                >
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Italic"
                    active={inlineState.italic}
                    onClick={() => void applyInline("italic")}
                >
                    <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Underline"
                    active={inlineState.underline}
                    onClick={() => void applyInline("underline")}
                >
                    <Underline className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Strikethrough"
                    active={inlineState.strike}
                    onClick={() => void applyInline("strikeThrough")}
                >
                    <Strikethrough className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Link" active={inlineState.link} onClick={handleLink}>
                    <Link className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Numbered list"
                    active={blockState === "list" && listStyle === "ordered"}
                    onClick={() => void toggleBlock("list", { style: "ordered" })}
                >
                    <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Bulleted list"
                    active={blockState === "list" && listStyle === "unordered"}
                    onClick={() => void toggleBlock("list", { style: "unordered" })}
                >
                    <ListIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Quote"
                    active={blockState === "quote"}
                    onClick={() => void toggleBlock("quote")}
                >
                    <QuoteIcon className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Inline code"
                    active={inlineState.code}
                    onClick={() => void handleInlineCode()}
                >
                    <Code className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Code block"
                    active={blockState === "code"}
                    onClick={() => void toggleBlock("code")}
                >
                    <SquareCode className="size-4" />
                </ToolbarButton>
            </div>

            {/* Main editor area */}
            <div>
                <div
                    ref={editorHostRef}
                    className="message-composer-editor min-h-24 max-h-60 overflow-y-auto px-2 py-2"
                />
            </div>

            {/* Selected attachments */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pb-1">
                    {files.map((file, index) => (
                        <span
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-1.5 rounded-full bg-muted pl-2 pr-1 py-0.5 text-xs text-muted-foreground"
                        >
                            <Paperclip className="size-3" />
                            <span className="max-w-40 truncate">{file.name}</span>
                            <button
                                type="button"
                                aria-label={`Remove ${file.name}`}
                                onClick={() => removeFile(index)}
                                className="flex size-4 items-center justify-center rounded-full hover:bg-foreground/10"
                            >
                                <X className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Bottom action toolbar */}
            <div className="flex items-center gap-0.5 border-t border-border/60 px-2 py-1.5">
                <ToolbarButton label="Add" onClick={() => fileInputRef.current?.click()}>
                    <SquarePlus className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddFiles(e.target.files)}
                />

                <ToolbarButton label="Text formatting">
                    <MoreHorizontal className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Emoji">
                    <Smile className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Mention">
                    <AtSign className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Video">
                    <Video className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Voice message">
                    <Mic className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton label="More actions">
                    <Paperclip className="size-4" onClick={() => fileInputRef.current?.click()} />
                </ToolbarButton>

                <div className="ml-auto flex items-center gap-0.5">
                    <button
                        type="button"
                        aria-label="Send message"
                        title="Send message"
                        onClick={handleSend}
                        disabled={disabled}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                        <Send className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Send options"
                        title="Send options"
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronDown className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
