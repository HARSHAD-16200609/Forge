import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
    CornerUpLeft,
    Italic,
    Link,
    List as ListIcon,
    ListOrdered,
    Loader2,
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
import { APP_EASE } from "@/components/ui/app-motion";
import { Component as EmojiPicker } from "@/components/ui/emoji-picker";
import { realtimeActions } from "@/realtime/realtimeActions";
import type { WsMessageEntityType } from "@/features/Messages/types";
import type { BlockToolConstructable, OutputData } from "@editorjs/editorjs";
import {
    buildMentionHtml,
    extractMentionIds,
    type MentionMember,
} from "@/features/Messages/utils/mentions";

const inlineTextSanitize = {
    br: true,
    b: true,
    strong: true,
    i: true,
    em: true,
    u: true,
    s: true,
    strike: true,
    del: true,
    code: true,
    mark: true,
    a: { href: true, class: true, "data-mention-id": true },
};

const quoteTextSanitize = {
    text: inlineTextSanitize,
    caption: { br: true },
};

function findTextPosition(root: Node, charIndex: number): { node: Node; offset: number } {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let remaining = Math.max(0, charIndex);
    while (node) {
        const length = node.textContent?.length ?? 0;
        if (remaining <= length) {
            return { node, offset: remaining };
        }
        remaining -= length;
        node = walker.nextNode();
    }
    return { node: root, offset: 0 };
}

function caretOffsetIn(editable: HTMLElement): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return -1;
    const range = selection.getRangeAt(0);
    const pre = document.createRange();
    pre.setStart(editable, 0);
    try {
        pre.setEnd(range.startContainer, range.startOffset);
    } catch {
        return -1;
    }
    return pre.toString().length;
}

function rangeFromTo(editable: HTMLElement, start: number, end: number): Range {
    const startPos = findTextPosition(editable, start);
    const endPos = findTextPosition(editable, end);
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);
    return range;
}

function getActiveEditable(editorHost: HTMLElement): HTMLElement | null {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const selector = "[contenteditable=true]";
    if (anchorNode) {
        const element =
            anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
        const editable = element?.closest<HTMLElement>(selector) ?? null;
        if (editable && editorHost.contains(editable)) return editable;
    }
    return editorHost.querySelector<HTMLElement>(selector);
}

function getMentionCaret(editorHost: HTMLElement | null): { query: string; deleteStart: number } | null {
    if (!editorHost) return null;
    const editable = getActiveEditable(editorHost);
    const selection = window.getSelection();
    if (!editable || !selection || selection.rangeCount === 0 || !selection.isCollapsed) {
        return null;
    }
    const caretOffset = caretOffsetIn(editable);
    if (caretOffset < 0) return null;

    const textBefore = (editable.textContent ?? "").slice(0, caretOffset);
    const match = /(?:^|\s)@([\w.-]*)$/.exec(textBefore);
    if (!match) return null;

    const atIndex =
        caretOffset - match[0].length + (match[0][0] === "@" ? 0 : 1);
    return { query: match[1], deleteStart: atIndex };
}

function MentionAvatar({ member }: { member: MentionMember }) {
    if (member.avatar) {
        return (
            <img
                src={member.avatar}
                alt={member.username}
                className="size-5 shrink-0 rounded-full object-cover"
            />
        );
    }
    return (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
            {(member.name || member.username).charAt(0).toUpperCase()}
        </span>
    );
}

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
    initialContent?: string;
    typingTarget?: {
        workspaceId: string;
        entityId: string;
        entityType: WsMessageEntityType;
    };
    onChange?: (contentJson: string) => void;
    onSend?: (
        contentJson: string,
        files: File[],
        replyToId?: string | null,
        mentions?: string[],
    ) => void | Promise<unknown>;
    disabled?: boolean;
    className?: string;
    replyTo?: { id: string; sender: string } | null;
    onCancelReply?: () => void;
    members?: MentionMember[];
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
    initialContent,
    typingTarget,
    onChange,
    onSend,
    disabled,
    className,
    replyTo,
    onCancelReply,
    members,
}: MessageComposerProps) {
    const editorHostRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorJS | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [hasContent, setHasContent] = useState(!!initialContent);
    const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
    const reduce = useReducedMotion();
    const [inlineState, setInlineState] = useState<ActiveInline>(emptyActiveInline);
    const [blockState, setBlockState] = useState<string | null>(null);
    const [listStyle, setListStyle] = useState<"ordered" | "unordered" | null>(null);

    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionHighlight, setMentionHighlight] = useState(0);
    const mentionOpenRef = useRef(false);
    const mentionHighlightRef = useRef(0);
    const mentionResultsRef = useRef<MentionMember[]>([]);
    const membersRef = useRef<MentionMember[]>(members ?? []);
    const mentionIdsRef = useRef<Set<string>>(new Set());
    const propagateRef = useRef<() => void>(() => {});

    useEffect(() => {
        membersRef.current = members ?? [];
    }, [members]);

    const filteredMentions = useMemo(() => {
        const list = members ?? [];
        const query = mentionQuery.trim().toLowerCase();
        if (!query) return list;
        return list.filter(
            (member) =>
                member.username.toLowerCase().includes(query) ||
                (member.name ?? "").toLowerCase().includes(query),
        );
    }, [members, mentionQuery]);

    useEffect(() => {
        if (!mentionOpen) return;
        mentionResultsRef.current = filteredMentions;
        if (mentionHighlightRef.current >= filteredMentions.length) {
            mentionHighlightRef.current = 0;
            setMentionHighlight(0);
        }
    }, [filteredMentions, mentionOpen]);

    const onChangeRef = useRef(onChange);
    const placeholderRef = useRef(placeholder ?? `Message #${channelName ?? "new-channel"}`);
    const handleSendRef = useRef<() => void>(() => {});
    const typingTargetRef = useRef(typingTarget);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingRef = useRef(0);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        typingTargetRef.current = typingTarget;
    }, [typingTarget]);

    const sendTyping = useCallback((start: boolean) => {
        const target = typingTargetRef.current;
        if (!target) return;
        if (start) {
            realtimeActions.typingStart(target.entityType, target.workspaceId, target.entityId);
        } else {
            realtimeActions.typingStop(target.entityType, target.workspaceId, target.entityId);
        }
    }, []);

    const handleTypingActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingRef.current > 1500) {
            lastTypingRef.current = now;
            sendTyping(true);
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => sendTyping(false), 3000);
    }, [sendTyping]);

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
            setHasContent((saved?.blocks.length ?? 0) > 0 || files.length > 0);
            onChangeRef.current?.(contentJson);
            useComposerStore.getState().saveDraft(channelId ?? "", contentJson);
        } catch {
            /* ignore save errors while typing */
        }
        readActiveStyles();
        handleTypingActivity();
    }, [readActiveStyles, channelId, handleTypingActivity, files.length]);

    useEffect(() => {
        propagateRef.current = propagate;
    }, [propagate, files.length]);

    function handleKeyDown(event: KeyboardEvent) {
        if (mentionOpenRef.current) {
            const results = mentionResultsRef.current;
            const count = results.length;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                const next = count === 0 ? 0 : (mentionHighlightRef.current + 1) % count;
                mentionHighlightRef.current = next;
                setMentionHighlight(next);
                return;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                const next = count === 0 ? 0 : (mentionHighlightRef.current - 1 + count) % count;
                mentionHighlightRef.current = next;
                setMentionHighlight(next);
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                if (count > 0) {
                    const member = results[mentionHighlightRef.current % count];
                    if (member) insertMention(member);
                }
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                closeMentionPicker();
                return;
            }
        }

        if (event.key !== "Enter") return;
        if (event.shiftKey) return;
        event.preventDefault();
        handleSendRef.current();
    }

    useEffect(() => {
        const editorHost = editorHostRef.current;
        if (!editorHost) return;

        const editor = new EditorJS({
            holder: editorHost,
            placeholder: placeholderRef.current,
            autofocus: true,
            data: parseStoredBlocks(
                useComposerStore.getState().getDraft(channelId ?? "") ||
                    initialContent ||
                    "",
            ),
            tools: {
                paragraph: {
                    class: Paragraph as unknown as BlockToolConstructable,
                    inlineToolbar: false,
                    sanitize: { text: inlineTextSanitize },
                },
                list: {
                    class: List,
                    inlineToolbar: false,
                },
                quote: {
                    class: Quote,
                    inlineToolbar: false,
                    sanitize: quoteTextSanitize,
                },
                code: CodeBlockTool,
                header: {
                    class: Header,
                    inlineToolbar: false,
                    config: { levels: [2, 3, 4], defaultLevel: 3 },
                    sanitize: { text: inlineTextSanitize },
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
        document.addEventListener("selectionchange", handleSelectionChange);
        void editor.isReady.then(() => readActiveStyles());
        void editor.isReady.then(() => {
            editorHost.addEventListener("keydown", handleKeyDown);
            editorHost.addEventListener("keyup", handleEditableKeyUp);
            editorHost.addEventListener("input", handleEditableInput);
        });

        return () => {
            disposed = true;
            document.removeEventListener("selectionchange", readActiveStyles);
            document.removeEventListener("selectionchange", handleSelectionChange);
            editorRef.current = null;
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            sendTyping(false);
            void editor.isReady.then(() => {
                editorHost.removeEventListener("keydown", handleKeyDown);
                editorHost.removeEventListener("keyup", handleEditableKeyUp);
                editorHost.removeEventListener("input", handleEditableInput);
                if (destroyed) return;
                destroyed = true;
                if (!disposed) return;
                editor.destroy();
            });
        };
    }, [readActiveStyles, propagate, channelId, sendTyping, initialContent]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor?.readOnly) return;
        void editor.readOnly.toggle(disabled);
    }, [disabled]);

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
        setFiles((prev) => {
            const next = [...prev, ...Array.from(list)];
            setHasContent(next.length > 0);
            return next;
        });
    }

    function removeFile(index: number) {
        setFiles((prev) => {
            const next = prev.filter((_, i) => i !== index);
            setHasContent(next.length > 0 || hasContent);
            return next;
        });
    }

    async function handleSend() {
        if (disabled) return;
        const blocks = await editorRef.current?.save();
        const contentJson = JSON.stringify(blocks?.blocks ?? []);
        const domMentions = extractMentionIds(contentJson);
        const tracked = [...mentionIdsRef.current];
        const union = [...new Set([...tracked, ...domMentions])];
        const mentions = union;
        const replyToId = replyTo?.id;
        try {
            await onSend?.(contentJson, files, replyToId, mentions);
            await editorRef.current?.clear();
            setFiles([]);
            setHasContent(false);
            useComposerStore.getState().clearDraft(channelId ?? "");
            onChangeRef.current?.(JSON.stringify([]));
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            sendTyping(false);
        } catch {
            /* keep editor content so the user can retry on failure */
        }
    }

    useEffect(() => {
        handleSendRef.current = handleSend;
    });

    function handleEmojiSelect(emoji: { native: string }) {
        focusEditable();
        document.execCommand("insertText", false, emoji.native);
        void propagate();
        setShowEmojiDrawer(false);
    }

    function openMentionPicker() {
        const host = editorHostRef.current;
        const caret = getMentionCaret(host);
        if (!caret) return;
        setMentionQuery(caret.query);
        mentionHighlightRef.current = 0;
        setMentionHighlight(0);
        setMentionOpen(true);
        mentionOpenRef.current = true;
    }

    function closeMentionPicker() {
        setMentionOpen(false);
        setMentionQuery("");
        mentionOpenRef.current = false;
    }

    function handleMentionButton() {
        if (mentionOpenRef.current) {
            closeMentionPicker();
            return;
        }
        focusEditable();
        document.execCommand("insertText", false, "@");
        openMentionPicker();
    }

    function handleEditableKeyUp(event: KeyboardEvent) {
        if (event.key === "@") {
            openMentionPicker();
        }
    }

    function handleSelectionChange() {
        if (!mentionOpenRef.current) return;
        const host = editorHostRef.current;
        if (!host) return;
        const editable = getActiveEditable(host);
        const selection = window.getSelection();
        if (!editable || !selection || !selection.rangeCount || !selection.isCollapsed) {
            return;
        }
        if (!editable.contains(selection.anchorNode)) {
            closeMentionPicker();
            return;
        }
        if (!getMentionCaret(host)) {
            closeMentionPicker();
        }
    }

    function handleEditableInput() {
        if (!mentionOpenRef.current) return;
        const host = editorHostRef.current;
        if (!host || membersRef.current.length === 0) {
            closeMentionPicker();
            return;
        }
        const caret = getMentionCaret(host);
        if (!caret) {
            closeMentionPicker();
            return;
        }
        mentionHighlightRef.current = 0;
        setMentionHighlight(0);
        setMentionQuery(caret.query);
    }

    function insertMention(member: MentionMember) {
        const host = editorHostRef.current;
        const selection = window.getSelection();
        if (!host || !selection) {
            closeMentionPicker();
            return;
        }

        const editable = getActiveEditable(host);
        const caret = getMentionCaret(host);

        let inserted = false;
        try {
            if (editable && caret) {
                const end = caretOffsetIn(editable);
                const range = rangeFromTo(editable, caret.deleteStart, end);
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand(
                    "insertHTML",
                    false,
                    buildMentionHtml(member) + "\u00A0",
                );
                inserted = true;
            }
        } catch {
            /* keep the typed text so the user can retry */
        }

        if (!inserted) {
            closeMentionPicker();
            return;
        }

        focusEditable();
        mentionIdsRef.current.add(member.id);
        closeMentionPicker();
        void propagateRef.current();
    }

    function handleMentionSelect(member: MentionMember) {
        insertMention(member);
    }

    return (
        <div
            className={cn(
                "relative w-full rounded-lg border border-border bg-background transition-shadow duration-200",
                "focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/20",
                className,
            )}
        >
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

            <AnimatePresence initial={false}>
                    {replyTo && (
                        <motion.div
                            initial={reduce ? false : { opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? undefined : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.14, ease: APP_EASE }}
                            className="flex items-center gap-2 border-b border-border/60 bg-accent/40 px-3 py-1.5 text-xs"
                        >
                            <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                                <CornerUpLeft className="size-3.5 text-brand" />
                                Replying to{" "}
                                <span className="font-semibold text-foreground">
                                    @{replyTo.sender}
                                </span>
                            </span>
                            <button
                                type="button"
                                aria-label="Cancel reply"
                                title="Cancel reply"
                                onClick={onCancelReply}
                                className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            {/* Main editor area */}
            <div>
                <div
                    ref={editorHostRef}
                    className="message-composer-editor min-h-24 max-h-60 overflow-y-auto px-2 py-2 text-black"
                />
            </div>

            {/* Sending / uploading state */}
            {disabled && (
                <div className="flex items-center gap-2 border-t border-border/60 bg-accent/50 px-3 py-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{files.length > 0 ? "Uploading attachments…" : "Sending message…"}</span>
                </div>
            )}

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
                <ToolbarButton label="Emoji" onClick={() => setShowEmojiDrawer((prev) => !prev)}>
                    <Smile className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Mention" onClick={() => handleMentionButton()}>
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
                            className={cn(
                                "flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-40",
                                hasContent
                                    ? "bg-brand text-brand-foreground hover:bg-brand/90"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            {disabled ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
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

            <AnimatePresence>
                {showEmojiDrawer && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: APP_EASE }}
                        className="absolute inset-x-0 bottom-full z-30 w-80"
                    >
                        <EmojiPicker
                            isOpen={showEmojiDrawer}
                            onClose={() => setShowEmojiDrawer(false)}
                            onEmojiSelect={handleEmojiSelect}
                            variant="drawer"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {mentionOpen && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: APP_EASE }}
                        className="absolute bottom-full left-1 z-30 w-80 overflow-hidden rounded-lg border border-border/70 bg-popover shadow-xl"
                    >
                        <div className="flex items-center justify-between border-b border-border/60 bg-accent/50 px-3 py-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                                {mentionQuery ? `Mention @${mentionQuery}` : "Mention someone"}
                            </span>
                            <kbd className="rounded border border-border bg-background px-1 text-[10px] text-muted-foreground">
                                esc
                            </kbd>
                        </div>
                        <ul className="max-h-64 overflow-y-auto p-1">
                            {filteredMentions.length === 0 ? (
                                <li className="flex items-center justify-center px-2 py-3 text-sm text-muted-foreground">
                                    No one found
                                </li>
                            ) : (
                                filteredMentions.map((member, index) => (
                                    <li key={member.id}>
                                        <button
                                            type="button"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                handleMentionSelect(member);
                                                
                                            }}
                                            onMouseEnter={() => {
                                                mentionHighlightRef.current = index;
                                                setMentionHighlight(index);
                                            }}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                                                index === mentionHighlight
                                                    ? "bg-brand/10 text-brand"
                                                    : "text-foreground hover:bg-muted",
                                            )}
                                        >
                                            <MentionAvatar member={member} />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">
                                                    @{member.username}
                                                </span>
                                                {member.name && (
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {member.name}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
