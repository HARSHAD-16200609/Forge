import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/features/Notifications/notifications.service";

export function useUnreadCount() {
    return useQuery({
        queryKey: ["notifications-unread"],
        queryFn: () => notificationsService.unreadCount(),
        refetchInterval: 30_000,
        staleTime: 10_000,
    });
}