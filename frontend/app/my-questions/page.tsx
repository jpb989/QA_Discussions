"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Question {
    id: number
    content: string
    status: string
    created_at: string
}

export default function MyQuestions() {
    const [questions, setQuestions] = useState<Question[]>([])
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }
        fetchMyQuestions(token)
    }, [])

    const fetchMyQuestions = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/users/me/questions`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setQuestions(data)
            } else if (res.status === 401) {
                localStorage.removeItem("token")
                localStorage.removeItem("user_email")
                localStorage.removeItem("user_name")
                router.push("/login")
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl min-h-screen">
            <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
                &larr; Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-6">My Questions</h1>

            <div className="space-y-4">
                {questions.length === 0 ? (
                    <p className="text-muted-foreground">You haven't asked any questions yet.</p>
                ) : (
                    questions.map((q) => (
                        <Card key={q.id} className="cursor-pointer hover:bg-secondary/10 transition-colors" onClick={() => router.push(`/question/${q.id}`)}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">#{q.id}</CardTitle>
                                <Badge variant={
                                    q.status === "Answered" ? "success" :
                                        q.status === "Escalated" ? "destructive" : "secondary"
                                }>
                                    {q.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p>{q.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(q.created_at).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
