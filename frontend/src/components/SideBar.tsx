import { useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Settings as SettingsIcon, AddLarge } from "@carbon/icons-react";
import { useUIStore } from "@/stores/uiStore";
import {
    Archive,
    AtSign,
    Bell,
    Bookmark,
    Building2,
    Check,
    ChevronDown,
    CirclePlus,
    Hash,
    Home,
    Mail,
    MessageSquare,
    Plus,
    Users,
} from "lucide-react";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/forge.png";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { CreateWorkspaceForm } from "@/features/Workspaces/components/CreateWorkspaceForm";
import { useDms } from "@/features/Messages/hooks/useDms";
import { usePresenceStore } from "@/realtime/presenceStore";
import type { Conversation } from "@/features/Messages/types";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ----------------------------- Workspace Switcher ------------------------ */

const tileColors = [
    "bg-brand",
    "bg-[oklch(0.52_0.13_185)]",
    "bg-[oklch(0.52_0.16_293)]",
    "bg-[oklch(0.55_0.12_35)]",
    "bg-[oklch(0.49_0.13_320)]",
    "bg-[oklch(0.45_0.04_262)]",
];

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function WorkspaceSwitcher() {
    const Workspaces = useWorkspaces();
    const {
        selectedWorkspaceId,
        showCreateWorkspaceForm,
        setShowCreateWorkspaceForm,
        setSelectedWorkspaceId,
    } = useWorkspaceStore();

    const active =
        Workspaces?.data?.find((w) => w.workspace.id === selectedWorkspaceId)?.workspace ??
        Workspaces?.data?.[0]?.workspace ??
        null;

    const isLoading = Workspaces.isLoading;
    const isError = Workspaces.isError;

    if (isLoading) {
        return (
            <div className="flex w-full shrink-0 items-center gap-2 rounded-lg px-2 py-1.5">
                <span className="size-8 shrink-0 animate-pulse rounded-lg bg-sidebar-accent" />
                <span className="h-4 flex-1 animate-pulse rounded bg-sidebar-accent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex w-full shrink-0 items-center gap-2 rounded-lg px-2 py-1.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-brand-foreground">
                    {getInitials(active?.workspaceName ?? "Workspace")}
                </span>
                <span className="truncate text-[15px] text-sidebar-foreground">Error</span>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="group flex w-full shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-200 hover:bg-sidebar-accent focus:outline-none focus:ring-0"
                >
                    <span
                        className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white",
                            tileColors[
                                (Workspaces.data?.findIndex((w) => w.workspace.id === active?.id) ??
                                    -1) % tileColors.length
                            ] ?? tileColors[0],
                        )}
                    >
                        {active ? getInitials(active.workspaceName) : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] leading-[20px] text-sidebar-foreground">
                            {active?.workspaceName ?? "No workspace"}
                        </span>
                        <span className="block truncate text-[11px] leading-[14px] text-sidebar-foreground/50">
                            Workspace
                        </span>
                    </span>
                    <ChevronDown
                        size={16}
                        className="shrink-0 text-sidebar-foreground/50 transition-colors group-hover:text-sidebar-foreground"
                    />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" sideOffset={6} className="w-72 p-2">
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Your workspaces
                </DropdownMenuLabel>

                {Workspaces?.data?.map((w, i) => {
                    const isActive = w.workspace.id === selectedWorkspaceId;
                    return (
                        <DropdownMenuItem
                            key={w.workspace.id}
                            onSelect={() => setSelectedWorkspaceId(w.workspace.id)}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2"
                        >
                            <span
                                className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white",
                                    tileColors[i % tileColors.length],
                                )}
                            >
                                {getInitials(w.workspace.workspaceName)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                                {w.workspace.workspaceName}
                            </span>
                            {isActive && <Check className="size-4 shrink-0 text-brand" />}
                        </DropdownMenuItem>
                    );
                })}

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-muted-foreground"
                    onSelect={() => setShowCreateWorkspaceForm(true)}
                >
                    <Plus className="size-4 shrink-0" />
                    <span className="text-[14px]">Create a new workspace</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-muted-foreground">
                    <CirclePlus className="size-4 shrink-0" />
                    <span className="text-[14px]">Add workspaces</span>
                </DropdownMenuItem>
            </DropdownMenuContent>

            {showCreateWorkspaceForm && (
                <CreateWorkspaceForm
                    onDone={() => setShowCreateWorkspaceForm(false)}
                    onClose={() => setShowCreateWorkspaceForm(false)}
                />
            )}
        </DropdownMenu>
    );
}

/* ------------------------------ Static Data ------------------------------- */

type NavItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
};

const navItems: NavItem[] = [
    { id: "home", label: "Home", icon: <Home size={18} /> },
    { id: "dms", label: "Direct Messages", icon: <MessageSquare size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "activity", label: "Activity", icon: <Archive size={18} /> },
    { id: "saved", label: "Saved Items", icon: <Bookmark size={18} /> },
    { id: "members", label: "Members", icon: <Users size={18} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

// const groupDms = [
//     { name: "Design Team", memberCount: 5, initials: "DT" },
//     { name: "Frontend Crew", memberCount: 3, initials: "FC" },
// ];

// const allMembers = [
//     { name: "Jane Cooper", online: false, role: "Member", initials: "JC" },
//     { name: "Mike Johnson", online: true, role: "Member", initials: "MJ" },
//     { name: "Sarah Chen", online: true, role: "Member", initials: "SC" },
//     { name: "Tom Lee", online: false, role: "Member", initials: "TL" },
//     { name: "Harshad", online: true, role: "Owner", initials: "HD" },
// ];

const activityItems = [
    { name: "Mike Johnson mentioned you", meta: "#general · 2h", icon: <AtSign size={16} /> },
    {
        name: "Sarah Chen reacted to your message",
        meta: "#design-review · 4h",
        icon: <Users size={16} />,
    },
    {
        name: "Tom Lee commented in a thread",
        meta: "#engineering · 1d",
        icon: <MessageSquare size={16} />,
    },
];

const savedItems = [
    { name: "Slack onboarding doc", meta: "Saved · 1d ago" },
    { name: "Design principles", meta: "Saved · 3d ago" },
    { name: "Q3 roadmap notes", meta: "Saved · last week" },
];

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
    children,
    isActive = false,
    onClick,
    ariaLabel,
}: {
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    ariaLabel?: string;
}) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            className={cn(
                "relative flex size-10 min-w-10 items-center justify-center rounded-lg transition-colors duration-200",
                isActive
                    ? "bg-brand/10 text-brand"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground/70",
            )}
            onClick={onClick}
        >
            <span className="relative">{children}</span>
            {isActive && (
                <motion.span
                    layoutId="nav-tick"
                    className="bg-brand absolute inset-y-2 left-0 w-0.5 rounded-full"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                />
            )}
        </button>
    );
}

function IconNavigation({
    activeSection,
    onSectionChange,
}: {
    activeSection: string;
    onSectionChange: (section: string) => void;
}) {
    return (
        <div className="bg-sidebar flex flex-col gap-2 items-center p-4 w-16 h-full border-r border-sidebar-border rounded-l-2xl">
            <div className="mb-2 size-10 flex items-center justify-center">
                <div className="size-7">
                    <img src={logoUrl} alt="Forge" className="size-full object-contain" />
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full items-center">
                {navItems.map((item) => (
                    <IconNavButton
                        key={item.id}
                        isActive={activeSection === item.id}
                        onClick={() => onSectionChange(item.id)}
                        ariaLabel={item.label}
                    >
                        {item.icon}
                    </IconNavButton>
                ))}
            </div>

            <div className="flex-1" />
        </div>
    );
}

/* ------------------------------ Search Input ----------------------------- */

function SearchContainer({ collapsed = false }: { collapsed?: boolean }) {
    const searchValue = useUIStore((s) => s.searchValue);
    const setSearchValue = useUIStore((s) => s.setSearchValue);

    if (collapsed) {
        return (
            <div className="w-full flex justify-center shrink-0">
                <div className="bg-sidebar h-10 w-10 rounded-lg flex items-center justify-center">
                    <SearchIcon size={16} className="text-sidebar-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative shrink-0 w-full">
            <div className="bg-sidebar h-10 relative rounded-lg flex items-center w-full">
                <div className="flex items-center justify-center shrink-0 px-1">
                    <div className="size-8 flex items-center justify-center">
                        <SearchIcon size={16} className="text-sidebar-foreground" />
                    </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <input
                        type="text"
                        placeholder="Search Forge"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-[14px] text-sidebar-foreground placeholder:text-sidebar-foreground/50 leading-[20px]"
                        tabIndex={0}
                    />
                </div>
                <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg border border-sidebar-border pointer-events-none"
                />
            </div>
        </div>
    );
}

/* ------------------------- Sections / Rows ---------------------------------- */

function SectionHeader({
    title,
    icon,
    collapseIcon = false,
    collapsed = false,
    onToggle,
}: {
    title: string;
    icon: React.ReactNode;
    collapseIcon?: boolean;
    collapsed?: boolean;
    onToggle?: () => void;
}) {
    const isToggle = collapseIcon || !!onToggle;
    return (
        <div className="flex items-center justify-between w-full pl-2 pr-1 h-7">
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 select-none",
                    isToggle && "flex-1 text-left hover:text-sidebar-foreground transition-colors",
                )}
            >
                {isToggle && (
                    <ChevronDown
                        size={12}
                        className={cn(
                            "transition-transform duration-200",
                            !collapsed && "rotate-0",
                            collapsed && "-rotate-90",
                        )}
                    />
                )}
                {icon}
                {title}
            </button>
            {!isToggle && (
                <button
                    type="button"
                    className="flex items-center justify-center rounded-md size-5 hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground"
                    aria-label={`Add to ${title}`}
                >
                    <AddLarge size={14} />
                </button>
            )}
        </div>
    );
}

function ChannelRow({
    name,
    channelId,
}: {
    name: string;
    channelId: string;
}) {
    const { setSelectedChannelId, selectedChannelId, setActiveSection } = useUIStore();
    const navigate = useNavigate();
    const isActive = selectedChannelId === channelId;
    return (
        <div
            className={cn(
                "relative flex items-center w-full h-9 px-2 rounded-lg cursor-pointer transition-colors",
                isActive ? "bg-brand/10" : "hover:bg-sidebar-accent",
            )}
            onClick={() => {
                setSelectedChannelId(channelId);
                setActiveSection("home");
                navigate("/app");
            }}
        >
            <span
                className={cn(
                    "flex items-center justify-center shrink-0 size-5 [&>svg]:size-4 transition-colors",
                    isActive ? "text-brand" : "text-sidebar-foreground/50",
                )}
            >
                <Hash />
            </span>
            <span
                className={cn(
                    "text-[14px] truncate ml-2 flex-1 transition-colors",
                    isActive ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/80",
                )}
            >
                {name}
            </span>
            {isActive && (
                <motion.span
                    layoutId="channel-tick"
                    className="bg-brand absolute inset-y-1.5 right-0 w-0.5 rounded-full"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
            )}
        </div>
    );
}

function DMRow({
    dm,
    online,
    onSelect,
}: {
    dm: Conversation;
    online: boolean;
    onSelect?: () => void;
}) {
    const selectedConversationId = useUIStore((s) => s.selectedConversationId);
    const isActive = selectedConversationId === dm.id;
    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative flex items-center w-full h-9 px-2 rounded-lg cursor-pointer transition-colors",
                isActive ? "bg-brand/10" : "hover:bg-sidebar-accent",
            )}
        >
            <AvatarDot avatar={dm.avatar} online={online} name={dm.displayName} type="dm" />
            <span
                className={cn(
                    "text-[14px] truncate ml-2 transition-colors",
                    isActive ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/80",
                )}
            >
                {dm.displayName}
            </span>
        </div>
    );
}

function PresenceDMRow({
    workspaceId,
    dm,
    onSelect,
}: {
    workspaceId?: string | null;
    dm: Conversation;
    onSelect?: () => void;
}) {
    const online = usePresenceStore((state) =>
        workspaceId && dm.receiverId ? state.isOnline(workspaceId, dm.receiverId) : false,
    );
    return <DMRow dm={dm} online={online} onSelect={onSelect} />;
}
function AvatarDot({
    avatar,
    online,
    name,
    type,
}: {
    avatar?: string;
    online: boolean;
    name?: string;
    type?: "dm" | "gdm";
}) {
    const initials = (name ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <span className="relative flex size-6 shrink-0 items-center justify-center overflow-visible rounded-full">
            {avatar ? (
                <img
                    src={avatar}
                    alt={name ?? "avatar"}
                    className="size-6 rounded-full object-cover"
                />
            ) : (
                <span
                    className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold",
                        type === "gdm"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-violet-500/20 text-violet-600",
                    )}
                >
                    {type === "gdm" && !initials ? <Users className="size-3.5" /> : initials}
                </span>
            )}

            <span
                className={cn(
                    "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-sidebar",
                    online ? "bg-emerald-500" : "bg-sidebar-foreground/30",
                )}
            />
        </span>
    );
}

function QuickLink({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}) {
    return (
        <div
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors"
            onClick={onClick}
        >
            <span className="shrink-0 text-sidebar-foreground/60 [&>svg]:size-4">{icon}</span>
            <span className="text-[14px] text-sidebar-foreground/80 truncate">
                {label}
            </span>
        </div>
    );
}

function GroupDMRow({ gdm, onSelect }: { gdm: Conversation; onSelect?: () => void }) {
    const selectedConversationId = useUIStore((s) => s.selectedConversationId);
    const isActive = selectedConversationId === gdm.id;
    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative flex items-center w-full h-9 px-2 rounded-lg cursor-pointer transition-colors",
                isActive ? "bg-brand/10" : "hover:bg-sidebar-accent",
            )}
        >
            <AvatarDot avatar={gdm.avatar} online={true} name={gdm.groupName} type="gdm" />
            <span
                className={cn(
                    "text-[14px] truncate ml-2 transition-colors",
                    isActive ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/80",
                )}
            >
                {gdm.groupName}
            </span>
        </div>
    );
}

// function MemberRow({
//     name,
//     online,
//     role,
//     initials,
// }: {
//     name: string;
//     online: boolean;
//     role: string;
//     initials: string;
// }) {
//     return (
//         <div className="rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent flex items-center w-full h-9 px-2 group">
//             <AvatarDot initials={initials} online={online} />
//             <span className="font-['Lexend:Regular',_sans-serif] text-[14px] text-sidebar-foreground/80 truncate ml-2 flex-1">
//                 {name}
//             </span>
//             {role === "Owner" && (
//                 <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded px-1.5 py-0.5">
//                     Owner
//                 </span>
//             )}
//         </div>
//     );
// }

function ActivityRow({ name, meta, icon }: { name: string; meta: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent flex items-start gap-2 w-full px-2 py-2">
            <span className="mt-0.5 shrink-0 text-sidebar-foreground/60 [&>svg]:size-4">
                {icon}
            </span>
            <div className="min-w-0">
                <div className="text-[13px] text-sidebar-foreground/85 leading-[18px]">
                    {name}
                </div>
                <div className="text-[11px] text-sidebar-foreground/40 leading-[15px]">
                    {meta}
                </div>
            </div>
        </div>
    );
}

function SavedRow({ name, meta }: { name: string; meta: string }) {
    return (
        <div className="rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent flex items-center gap-2 w-full px-2 py-2">
            <span className="shrink-0 text-sidebar-foreground/60 [&>svg]:size-4">
                <Bookmark size={16} />
            </span>
            <div className="min-w-0">
                <div className="text-[13px] text-sidebar-foreground/85 leading-[18px] truncate">
                    {name}
                </div>
                <div className="text-[11px] text-sidebar-foreground/40 leading-[15px]">
                    {meta}
                </div>
            </div>
        </div>
    );
}

type Section = {
    title: string;
    icon?: React.ReactNode;
    kind: "channels" | "dms" | "groups" | "members" | "activity" | "saved" | "quick";
    rows?: { label: string; meta?: string; icon?: React.ReactNode; to?: string }[];
};

const sectionContent: Record<string, Section[]> = {
    home: [
        {
            title: "Quick Access",
            kind: "quick",
            rows: [
                { label: "Mentions & reactions", icon: <AtSign size={16} /> },
                { label: "Drafts", icon: <Building2 size={16} /> },
                { label: "Archive", icon: <Archive size={16} /> },
            ],
        },
        { title: "Channels", kind: "channels", icon: <Hash size={14} /> },
        { title: "Direct Messages", kind: "dms", icon: <Mail size={14} /> },
    ],
    dms: [
        { title: "Direct Messages", kind: "dms", icon: <MessageSquare size={14} /> },
        { title: "Group Direct Messages", kind: "groups", icon: <Users size={14} /> },
        {
            title: "New Message",
            kind: "quick",
            rows: [{ label: "Compose new message", icon: <MessageSquare size={16} /> }],
        },
    ],
    activity: [
        {
            title: "All Activity",
            kind: "activity",
            rows: activityItems.map((a) => ({ label: a.name, meta: a.meta, icon: a.icon })),
        },
    ],
    saved: [
        {
            title: "Saved Items",
            kind: "saved",
            rows: savedItems.map((s) => ({ label: s.name, meta: s.meta })),
        },
        {
            title: "Reminders",
            kind: "quick",
            rows: [{ label: "No reminders", icon: <Bell size={16} /> }],
        },
    ],
    members: [
        { title: "All Members", kind: "members", icon: <Users size={14} /> },
        {
            title: "Invite",
            kind: "quick",
            rows: [{ label: "Invite people to Forge", icon: <Users size={16} />, to: "/app/invites" }],
        },
    ],
    settings: [
        {
            title: "Workspace",
            kind: "quick",
            rows: [
                { label: "Profile", icon: <Users size={16} /> },
                { label: "Preferences", icon: <SettingsIcon size={16} /> },
                { label: "Sign out", icon: <Archive size={16} /> },
            ],
        },
    ],
};

/* ------------------------------ Detail Panel ------------------------------ */

function DetailSidebar({
    width,
    onResize,
    activeSection,
}: {
    width: number;
    onResize: (w: number) => void;
    activeSection: string;
}) {
    const reduce = useReducedMotion();
    const navigate = useNavigate();
    const {
        selectedWorkspaceId,
        setSelectedWorkspaceId,
        showCreateWorkspaceForm,
        setShowCreateWorkspaceForm,
    } = useWorkspaceStore();
    const Workspaces = useWorkspaces();

    const activeWorkspaceId = useMemo(() => {
        const listed = Workspaces?.data?.some((w) => w.workspace.id === selectedWorkspaceId);
        if (selectedWorkspaceId && listed !== false) return selectedWorkspaceId;
        return Workspaces?.data?.[0]?.workspace?.id ?? null;
    }, [Workspaces?.data, selectedWorkspaceId]);

    useEffect(() => {
        if (activeWorkspaceId && selectedWorkspaceId !== activeWorkspaceId) {
            setSelectedWorkspaceId(activeWorkspaceId);
        }
    }, [activeWorkspaceId, selectedWorkspaceId, setSelectedWorkspaceId]);

    const WorkspaceDetails = useWorkspace(activeWorkspaceId ?? "");
    const chats = useDms(activeWorkspaceId ?? "");
    const collapsedSections = useUIStore((s) => s.collapsedSections);
    const toggleSection = useUIStore((s) => s.toggleSection);
    const setActiveSection = useUIStore((s) => s.setActiveSection);
    const setSelectedConversation = useUIStore((s) => s.setSelectedConversation);
    const conversations = chats.data?.conversations ?? [];
    const dms = conversations.filter((convo) => convo.type === "DM");
    const gdms = conversations.filter((convo) => convo.type === "GDM");

    const startResize = (e: React.PointerEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = width;
        const move = (ev: PointerEvent) => {
            const next = startWidth + (ev.clientX - startX);
            onResize(Math.min(Math.max(next, 220), 420));
        };
        const up = () => {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    const sections = sectionContent[activeSection] || sectionContent.home;

    const renderRow = (
        row: { label: string; meta?: string; icon?: React.ReactNode; to?: string },
        kind: Section["kind"],
    ) => {
        switch (kind) {
            case "quick":
                return (
                    <QuickLink
                        key={row.label}
                        icon={row.icon}
                        label={row.label}
                        onClick={row.to ? () => navigate(row.to!) : undefined}
                    />
                );
            case "activity":
                return (
                    <ActivityRow
                        key={row.label}
                        name={row.label}
                        meta={row.meta || ""}
                        icon={row.icon}
                    />
                );
            case "saved":
                return <SavedRow key={row.label} name={row.label} meta={row.meta || ""} />;
            default:
                return null;
        }
    };

    const renderKindSection = (section: Section, collapsed: boolean) => {
        switch (section.kind) {
            case "channels":
                if (collapsed) return null;
                return (WorkspaceDetails.data?.channels ?? []).map((c) => (
                    <ChannelRow key={c.id} name={c.channelName} channelId={c.id} />
                ));
            case "dms":
                if (collapsed) return null;
                return dms?.map((d) => (
                    <PresenceDMRow
                        key={d.id}
                        dm={d}
                        workspaceId={activeWorkspaceId}
                        onSelect={() => {
                            setSelectedConversation(d.id, "DM");
                            setActiveSection("dms");
                            navigate("/app");
                        }}
                    />
                ));
            case "groups":
                if (collapsed) return null;
                return gdms?.map((g) => (
                    <GroupDMRow
                        key={g.id}
                        gdm={g}
                        onSelect={() => {
                            setSelectedConversation(g.id, "GDM");
                            setActiveSection("dms");
                            navigate("/app");
                        }}
                    />
                ));
            case "members":
                if (collapsed) return null;
                return (
                    <div className="flex flex-col items-center gap-2 rounded-lg bg-sidebar-accent/60 px-3 py-4 text-center">
                        <Users className="size-4 text-sidebar-foreground/40" />
                        <p className="text-[12px] leading-[16px] text-sidebar-foreground/55">
                            Members show up here once your workspace has people.
                        </p>
                    </div>
                );
            default:
                if (collapsed) return null;
                return (section.rows || []).map((row) => renderRow(row, section.kind));
        }
    };

    const hasNoWorkspaces =
        !Workspaces.isLoading && Workspaces.isSuccess && !(Workspaces?.data?.length ?? 0);

    return (
        <div className="relative flex h-full min-w-0">
            <div
                className="bg-sidebar flex flex-col items-start p-4 gap-3 rounded-r-2xl h-full overflow-hidden"
                style={{ width }}
            >
                <WorkspaceSwitcher />
                <SearchContainer />

                {Workspaces.isError ? (
                    <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
                        <div className="space-y-1 text-center">
                            <p className="text-[15px] font-semibold text-sidebar-foreground">
                                Couldn't load your workspaces
                            </p>
                            <p className="text-[13px] leading-5 text-sidebar-foreground/50">
                                Check your connection and try again.
                            </p>
                        </div>
                        <Button
                            onClick={() => void Workspaces.refetch()}
                            size="lg"
                            variant="outline"
                            className="h-10 w-full"
                        >
                            Retry
                        </Button>
                    </div>
                ) : hasNoWorkspaces ? (
                    <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                            <Building2 className="size-6" />
                        </span>
                        <div className="space-y-1 text-center">
                            <p className="text-[15px] font-semibold text-sidebar-foreground">
                                You're not in any workspace yet
                            </p>
                            <p className="text-[13px] leading-5 text-sidebar-foreground/50">
                                Create a workspace to start collaborating with your team.
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowCreateWorkspaceForm(true)}
                            size="lg"
                            className="h-11 w-full"
                        >
                            <Plus className="size-4" />
                            Create your first workspace
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 w-full min-h-0 flex-1 overflow-y-auto pb-2">
                        {sections.map((section, index) => {
                            const isCollapsible = true;
                            const collapsed = isCollapsible && !!collapsedSections[section.title];
                            return (
                                <div
                                    key={`${activeSection}-${index}`}
                                    className="flex flex-col gap-0.5 w-full"
                                >
                                    <SectionHeader
                                        title={section.title}
                                        icon={section.icon}
                                        collapseIcon={isCollapsible}
                                        collapsed={collapsed}
                                        onToggle={
                                            isCollapsible
                                                ? () => toggleSection(section.title)
                                                : undefined
                                        }
                                    />
                                    <AnimatePresence initial={false}>
                                        {!collapsed && (
                                            <motion.div
                                                initial={reduce ? false : { opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={reduce ? undefined : { opacity: 0, y: -4 }}
                                                transition={{ duration: 0.18, ease: EASE_OUT }}
                                                className="flex flex-col gap-0.5"
                                            >
                                                {renderKindSection(section, collapsed)}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showCreateWorkspaceForm && (
                    <CreateWorkspaceForm
                        onDone={() => setShowCreateWorkspaceForm(false)}
                        onClose={() => setShowCreateWorkspaceForm(false)}
                    />
                )}
            </div>

            {/* Resize handle */}
            <div
                role="separator"
                aria-orientation="vertical"
                onPointerDown={startResize}
                className="group flex h-full w-2 cursor-col-resize items-center justify-center -ml-1"
            >
                <div className="h-0 w-1 rounded-full transition-all group-hover:h-8 group-hover:bg-sidebar-border" />
            </div>
        </div>
    );
}

/* ------------------------------- Root Frame ------------------------------ */

const sectionRouteMap: Record<string, string> = {
    home: "/app",
    dms: "/app",
    notifications: "/app/notifications",
    activity: "/app/activity",
    saved: "/app/saved",
    members: "/app/members",
    invites: "/app/invites",
    settings: "/app/settings",
};

const routeSectionMap: Record<string, string> = {
    "/app/notifications": "notifications",
    "/app/activity": "activity",
    "/app/saved": "saved",
    "/app/members": "members",
    "/app/invites": "invites",
    "/app/settings": "settings",
};

export function Frame760() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeSection = useUIStore((s) => s.activeSection);
    const setActiveSection = useUIStore((s) => s.setActiveSection);
    const clearSelectedConversation = useUIStore((s) => s.clearSelectedConversation);
    const sidebarWidth = useUIStore((s) => s.sidebarWidth);
    const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);

    useEffect(() => {
        const section = routeSectionMap[location.pathname];
        if (section && section !== activeSection) {
            setActiveSection(section);
        }
    }, [location.pathname, activeSection, setActiveSection]);

    const handleSectionChange = useCallback(
        (section: string) => {
            setActiveSection(section);
            if (section === "home" || section === "dms") {
                clearSelectedConversation();
            }
            navigate(sectionRouteMap[section] ?? "/app");
        },
        [navigate, setActiveSection, clearSelectedConversation],
    );

    return (
        <div className="bg-sidebar flex h-full">
            <IconNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />
            <DetailSidebar
                width={sidebarWidth}
                onResize={setSidebarWidth}
                activeSection={activeSection}
            />
        </div>
    );
}

export default Frame760;
