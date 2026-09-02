import { useInfiniteQuery } from "@tanstack/react-query";
import { messageService, type getConversationMessagesParams } from "../message.service";

export function useConversationMessages({
    workspaceId,
    conversationId,
    limit,
}: Omit<getConversationMessagesParams, "cursor">) {
    return useInfiniteQuery({
        queryKey: ["conversation-messages", conversationId],
        queryFn: ({ pageParam }) =>
            messageService.getConversationMessages({
                workspaceId,
                conversationId,
                cursor: pageParam,
                limit: limit ?? 30,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage.hasMore) {
                return undefined;
            }
            return lastPage.nextCursor;
        },
        enabled: !!conversationId,
    });
}
