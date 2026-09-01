import type { ComponentProps, ReactNode } from "react";
import {
    AtSign,
    Bold,
    ChevronDown,
    Code,
    Italic,
    Link,
    List,
    ListOrdered,
    Mic,
    MoreHorizontal,
    Paperclip,
    Quote,
    Send,
    Smile,
    SquarePlus,
    Strikethrough,
    Underline,
    Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MessageComposerProps = {
    channelName?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    onSend?: () => void;
    className?: string;
};

function ToolbarButton({
    label,
    children,
    className,
    ...props
}: { label: string; children: ReactNode } & ComponentProps<"button">) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            {...props}
            className={cn(
                "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
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

export function MessageComposer({
    channelName,
    onChange,
    placeholder,
    onSend,
    className,
}: MessageComposerProps) {
    return (
        <div
            className={cn(
                "w-full rounded-lg border border-border bg-background",
                className,
            )}
        >
            {/* Top formatting toolbar */}
            <div className="flex items-center gap-0.5 border-b border-border/60 px-2 py-1">
                <ToolbarButton label="Bold">
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Italic">
                    <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Underline">
                    <Underline className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Strikethrough">
                    <Strikethrough className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Link">
                    <Link className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton label="Numbered list">
                    <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Bulleted list">
                    <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Quote">
                    <Quote className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton label="Inline code">
                    <Code className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Code block">
                    <Code className="size-4" />
                </ToolbarButton>
            </div>

            {/* Main editor area */}
            <div
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="Message composer"
                data-placeholder={placeholder ?? `Message #${channelName ?? "new-channel"}`}
                onInput={(event) => onChange?.((event.target as HTMLElement).textContent ?? "")}
                className="min-h-24 cursor-text px-3 py-2 text-[15px] leading-6 text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/70"
            />

            {/* Bottom action toolbar */}
            <div className="flex items-center gap-0.5 border-t border-border/60 px-2 py-1.5">
                <ToolbarButton label="Add">
                    <SquarePlus className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

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
                    <Paperclip className="size-4" />
                </ToolbarButton>

                <div className="ml-auto flex items-center gap-0.5">
                    <button
                        type="button"
                        aria-label="Send message"
                        title="Send message"
                        onClick={onSend}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
