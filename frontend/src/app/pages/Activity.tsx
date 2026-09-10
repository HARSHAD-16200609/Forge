import { Activity as ActivityIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";

export function Activity() {
    return (
        <div className="mx-auto h-full max-w-2xl overflow-y-auto p-6">
            <PageHeader
                title="Activity"
                description="Messages and threads we think you'll want to get back to."
            />
            <PageEmptyState
                icon={<ActivityIcon className="size-5" />}
                title="Nothing to revisit"
                description="When messages are marked as worth revisiting, they'll be collected here."
            />
        </div>
    );
}