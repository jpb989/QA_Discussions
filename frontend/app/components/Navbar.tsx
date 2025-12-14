
"use client"

import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownItem } from "./ui/dropdown-menu"
import { User, ChevronDown } from "lucide-react"

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const isAuthPage = pathname === "/login" || pathname === "/signup"
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    useEffect(() => {
        // Check initial state
        const token = localStorage.getItem("token")
        setIsLoggedIn(!!token)

        if (token) {
            // Check admin status for UI
            fetch(`${API_URL}/users/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data && data.is_admin) setIsAdmin(true)
                    else setIsAdmin(false)
                })
                .catch(() => setIsAdmin(false))
        }
    }, [pathname])

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user_email")
        setIsLoggedIn(false)
        router.push("/login")
    }

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block text-primary text-xl">
                            Live Q&A
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center space-x-2">
                        {isLoggedIn ? (
                            <DropdownMenu
                                trigger={
                                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Menu
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                }
                            >
                                <DropdownItem href="/my-questions">My Questions</DropdownItem>
                                <DropdownItem href="/my-answers">My Answers</DropdownItem>
                                {isAdmin && <DropdownItem href="/users">All Users</DropdownItem>}
                                <div className="h-px bg-border my-1" />
                                <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
                            </DropdownMenu>
                        ) : (
                            !isAuthPage && (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">Login</Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button variant="default" size="sm">Sign Up</Button>
                                    </Link>
                                </>
                            )
                        )}
                    </nav>
                </div>
            </div>
        </nav>
    )
}
