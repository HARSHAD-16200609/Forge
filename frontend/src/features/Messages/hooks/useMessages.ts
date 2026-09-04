import { messageService, type getMessageParams } from "../message.service";

import { useInfiniteQuery } from "@tanstack/react-query";

export function useMessages(params: getMessageParams) {
    return useInfiniteQuery({
        queryKey: ["messages", params.channelId],

        queryFn: ({ pageParam }) =>
            messageService.getMessages({
                workspaceId: params.workspaceId,
                channelId: params.channelId,
                cursor: pageParam,
                limit: params.limit ?? 30,
            }),

        initialPageParam: undefined as string | undefined,

        getNextPageParam: (lastPage) => {
            if (!lastPage.hasMore) {
                return undefined;
            }

            return lastPage.nextCursor;
        },

        enabled: !!params.channelId,
    });
}
