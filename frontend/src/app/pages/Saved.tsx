import { Bookmark } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";

export function Saved() {
    return (
        <div className="mx-auto h-full max-w-2xl overflow-y-auto p-6">
            <PageHeader
                title="Saved items"
                description="Messages and files you've bookmarked for later."
            />
            <PageEmptyState
                icon={<Bookmark className="size-5" />}
                title="Nothing saved yet"
                description="Bookmark a message or file and it'll live here so you can find it again."
            />
        </div>
    );
}