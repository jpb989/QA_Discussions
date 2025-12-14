"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface DropdownMenuProps {
    trigger: React.ReactNode
    children: React.ReactNode
    align?: "left" | "right"
}

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`absolute ${align === "right" ? "right-0" : "left-0"} z-50 mt-2 w-56 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border p-1`}
                >
                    <div className="py-1" role="none">
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}

export function DropdownItem({ children, onClick, href }: { children: React.ReactNode, onClick?: () => void, href?: string }) {
    const className = "block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"

    if (href) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        )
    }

    return (
        <div onClick={onClick} className={className}>
            {children}
        </div>
    )
}
