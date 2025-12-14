"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useRouter } from "next/navigation"
import { ajaxRequest } from "../utils/ajax"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface User {
    id: number
    username: string
    email: string
    full_name: string
    is_admin: boolean
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchUsers()
        fetchCurrentUser()
    }, [])

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCurrentUser(data)
                // Admin Check
                if (!data.is_admin) {
                    router.push("/")
                }
            } else {
                router.push("/login")
            }
        } catch (error) {
            console.error(error)
            router.push("/login")
        }
    }

    const fetchUsers = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }

        try {
            const res = await fetch(`${API_URL}/users/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            } else if (res.status === 401) {
                localStorage.removeItem("token")
                router.push("/login")
            } else {
                console.error("Failed to fetch users")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handlePromote = async (userId: number) => {
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            await ajaxRequest("PUT", `${API_URL}/users/${userId}/promote`, null, {
                "Authorization": `Bearer ${token}`
            })
            // Refresh list
            fetchUsers()
        } catch (error: any) {
            if (error.status === 403) {
                alert("Access Denied: You must be an administrator to promote users.")
            } else {
                alert("Failed to promote user.")
            }
        }
    }


    const handleRevoke = async (userId: number) => {
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            await ajaxRequest("PUT", `${API_URL}/users/${userId}/revoke`, null, {
                "Authorization": `Bearer ${token}`
            })
            fetchUsers()
        } catch (error: any) {
            if (error.status === 403) {
                alert("Access Denied: You must be an administrator to revoke privilages.")
            } else if (error.status === 400) {
                alert("Operation Failed: You cannot revoke your own admin status.")
            } else {
                alert("Failed to revoke admin status.")
            }
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading users...</div>
    }

    return (
        <div className="container max-w-4xl py-8">
            <h1 className="text-3xl font-bold mb-6">All Users</h1>
            <div className="grid gap-4">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                {user.username}
                                {user.is_admin && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>}
                                {currentUser?.id === user.id && <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">You</span>}
                            </CardTitle>
                            {currentUser?.id !== user.id && (
                                !user.is_admin ? (
                                    <Button size="sm" variant="outline" onClick={() => handlePromote(user.id)}>
                                        Make Admin
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="destructive" onClick={() => handleRevoke(user.id)}>
                                        Remove Admin
                                    </Button>
                                )
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                {user.full_name} ({user.email})
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
