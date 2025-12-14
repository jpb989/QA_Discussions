"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "./button"

interface SelectOption {
    label: string
    value: string
}

interface SelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
}

export function Select({ value, onChange, options, placeholder = "Select...", className }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (newValue: string) => {
        onChange(newValue)
        setIsOpen(false)
    }

    return (
        <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-48 justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedLabel}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md border bg-popover/80 backdrop-blur-md text-popover-foreground shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in-80 zoom-in-95">
                    <div className="p-1">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50
                                    ${value === option.value ? "bg-accent text-accent-foreground" : ""}
                                `}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className="flex h-3.5 w-3.5 items-center justify-center mr-2">
                                    {value === option.value && <Check className="h-4 w-4" />}
                                </span>
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
