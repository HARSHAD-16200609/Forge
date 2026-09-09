import { useMemo } from "react";
import { useTypingStore } from "@/realtime/typingStore";

export function TypingIndicator({ entityId }: { entityId: string }) {
    const typing = useTypingStore((state) => state.typing[entityId]);

    const names = useMemo(() => Object.values(typing ?? {}), [typing]);

    if (names.length === 0) return null;

    const label =
        names.length === 1 ? `${names[0]} is typing…` : `${names.length} people are typing…`;

    return (
        <div className="px-4 pb-1 text-xs italic text-muted-foreground">{label}</div>
    );
}