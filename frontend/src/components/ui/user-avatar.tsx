import * as React from "react"

import { cn } from "@/lib/utils"
import { dicebearUrlFor } from "@/lib/dicebear"

const sizeClasses = {
    sm: "size-6 text-[11px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
    xl: "size-14 text-base",
    "2xl": "size-20 text-xl",
} as const

export type UserAvatarSize = keyof typeof sizeClasses

export interface UserAvatarProps extends Omit<React.ComponentProps<"span">, "id"> {
    id?: string | null
    name?: string | null
    username?: string | null
    avatarUrl?: string | null
    avatarSeed?: string | null
    size?: UserAvatarSize
    shape?: "circle" | "rounded"
    fallbackChar?: string | null
}

export function getAvatarInitials(name?: string | null, username?: string | null): string {
    const source = (name ?? username ?? "").trim()
    if (!source) return ""
    const parts = source.split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0]?.toUpperCase() ?? "") + (parts[1][0]?.toUpperCase() ?? "")
    }
    return source.charAt(0).toUpperCase()
}

export const UserAvatar = React.forwardRef<HTMLSpanElement, UserAvatarProps>(
    (
        {
            id,
            name,
            username,
            avatarUrl,
            avatarSeed,
            size = "md",
            shape = "circle",
            fallbackChar,
            className,
            ...props
        },
        ref,
    ) => {
        const [hasRealFailed, setHasRealFailed] = React.useState(false)

        const initials = React.useMemo(() => {
            const c = fallbackChar ?? getAvatarInitials(name, username)
            return c || "?"
        }, [fallbackChar, name, username])

        const shapeClass = shape === "rounded" ? "rounded-lg" : "rounded-full"

        const showReal = Boolean(avatarUrl && !hasRealFailed)
        const showGenerated = !showReal && id !== null && id !== undefined && id !== ""
        const generatedSrc = React.useMemo(
            () => (showGenerated ? dicebearUrlFor({ id, avatarSeed }) : ""),
            [showGenerated, id, avatarSeed],
        )

        const handleRealError = React.useCallback(() => {
            setHasRealFailed(true)
        }, [])

        const handleGeneratedError = React.useCallback(() => {
            setHasRealFailed(false)
        }, [])

        return (
            <span
                ref={ref}
                data-slot="user-avatar"
                className={cn(
                    "relative flex shrink-0 items-center justify-center overflow-hidden bg-brand-soft text-brand",
                    sizeClasses[size],
                    shapeClass,
                    className,
                )}
                {...props}
            >
                {showReal ? (
                    <img
                        src={avatarUrl ?? ""}
                        alt={name ?? username ?? "avatar"}
                        className={cn("size-full object-cover", shapeClass)}
                        onError={handleRealError}
                        loading="lazy"
                        decoding="async"
                    />
                ) : showGenerated ? (
                    <img
                        src={generatedSrc}
                        alt={name ?? username ?? "avatar"}
                        className={cn("size-full object-cover", shapeClass)}
                        onError={handleGeneratedError}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="flex size-full items-center justify-center font-semibold">
                        {initials}
                    </span>
                )}
            </span>
        )
    },
)

UserAvatar.displayName = "UserAvatar"

export default UserAvatar
