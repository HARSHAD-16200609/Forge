import { createAvatar } from "@dicebear/core"
import * as avataaars from "@dicebear/avataaars"
import * as micah from "@dicebear/micah"
import * as bottts from "@dicebear/bottts"
import * as funEmoji from "@dicebear/fun-emoji"

export const DICEBEAR_STYLES = [avataaars, micah, bottts, funEmoji] as const

type DicebearStyle = (typeof DICEBEAR_STYLES)[number]

const FNV_OFFSET_BASIS = BigInt("2166136261")
const FNV_PRIME = BigInt(16777619)

function fnv1a32(seed: string): number {
    let hash = 0x811c9dc5
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
        hash >>>= 0
    }
    return hash
}

function pickStyle(seed: string): DicebearStyle {
    const h = fnv1a32(seed)
    const index = h % DICEBEAR_STYLES.length
    return DICEBEAR_STYLES[index]
}

export interface DicebearOptions {
    seed: string
    size?: number
    radius?: number
}

export function dicebearAvatar(options: DicebearOptions): string {
    const { seed, size = 128, radius = 50 } = options
    const style = pickStyle(seed)
    const avatar = createAvatar(style, {
        seed,
        size,
        radius,
        backgroundType: ["gradientLinear"],
        randomizeIds: false,
    })
    return avatar.toDataUri()
}

export interface DicebearUserLike {
    id: string
    avatarSeed?: string | null
    avatar?: string | null
}

export function dicebearUrlFor(user: DicebearUserLike): string {
    const seed = user.avatarSeed ?? user.id
    return dicebearAvatar({ seed })
}
