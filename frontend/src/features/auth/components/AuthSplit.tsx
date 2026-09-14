"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { GrainGradient } from "@paper-design/shaders-react";

export function AuthSplit({
    title,
    subtitle,
    children,
    switchLink,
    footer,
    rightHeadline = (
<>
  Connect. Collaborate.
  <br />
  Your team, in sync.
</>
    ),
}: {
    title: string;
    subtitle?: ReactNode;
    children: ReactNode;
    switchLink?: ReactNode;
    footer?: ReactNode;
    rightHeadline?: ReactNode;
}) {
    const reduce = useReducedMotion();

    return (
        <section className="relative flex min-h-screen flex-col bg-black text-white antialiased [font-synthesis:none] dark:bg-[#050505]">
            <div className="grid flex-1 lg:grid-cols-[1.06fr_0.94fr] lg:min-h-0">
                <div className="relative flex min-h-[240px] overflow-hidden bg-black sm:min-h-[320px] lg:min-h-0">
                    <GrainGradient
                        speed={reduce ? 0 : 1}
                        scale={1}
                        rotation={0}
                        offsetX={0}
                        offsetY={0}
                        softness={0.5}
                        intensity={0.5}
                        noise={0.25}
                        shape="corners"
                        frame={2854.5}
                        colors={["#FFFFFF", "#309bff", "#1e9deb", "#FFFFFF"]}
                        colorBack="#00000000"
                        className="absolute inset-0 bg-black"
                    />
                    <div className="relative z-10 flex h-full w-full flex-col justify-between p-8 sm:p-12">
                        <h2 className="max-w-[620px] pt-0 text-4xl font-medium tracking-[-0.05em] text-white sm:text-5xl lg:pt-10 lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
                            {rightHeadline}
                        </h2>
                    </div>
                </div>

                <div className="auth-reveal flex min-h-0 items-start justify-center bg-black px-6 py-8 sm:px-10 lg:items-center lg:px-14 lg:py-10 xl:px-20">
                    <div className="dark mx-auto w-full max-w-[590px]">
                        <div className="mb-6 text-center lg:text-left">
                            <h1 className="text-2xl font-semibold tracking-tight text-white">
                                {title}
                            </h1>
                            {subtitle ? (
                                <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>
                            ) : null}
                        </div>
                        {children}
                        {switchLink ? (
                            <p className="mt-6 text-center text-sm text-white/60">
                                {switchLink}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
            {footer ? (
                <div className="mt-3 shrink-0 text-center text-xs text-white/40">
                    {footer}
                </div>
            ) : null}
        </section>
    );
}