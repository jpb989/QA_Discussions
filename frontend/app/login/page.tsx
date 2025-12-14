"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const formData = new URLSearchParams()
        formData.append("username", email)
        formData.append("password", password)

        try {
            const data: any = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open("POST", `${API_URL}/token`)
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText))
                        } catch (e) {
                            reject(new Error("Invalid JSON response"))
                        }
                    } else {
                        reject(new Error("Invalid credentials"))
                    }
                }
                xhr.onerror = () => reject(new Error("Network error"))
                xhr.send(formData.toString())
            })

            localStorage.setItem("token", data.access_token)
            localStorage.setItem("user_email", email)

            // User fetch
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open("GET", `${API_URL}/users/me`)
                xhr.setRequestHeader("Authorization", `Bearer ${data.access_token}`)

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const userData = JSON.parse(xhr.responseText)
                        localStorage.setItem("user_name", userData.username)
                        resolve(userData)
                    } else {
                        resolve(null)
                    }
                }
                xhr.onerror = () => resolve(null)
                xhr.send()
            })

            router.push("/")
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                        <div className="mt-4 text-center text-sm">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-primary hover:underline">
                                Sign Up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
