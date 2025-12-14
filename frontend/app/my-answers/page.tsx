"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Answer {
    id: number
    content: string
    created_at: string
    question_id: number
    question?: {
        id: number
        content: string
    }
}

export default function MyAnswers() {
    const [answers, setAnswers] = useState<Answer[]>([])
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }
        fetchMyAnswers(token)
    }, [])

    const fetchMyAnswers = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/users/me/answers`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setAnswers(data)
            } else if (res.status === 401) {
                localStorage.removeItem("token")
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
            <h1 className="text-3xl font-bold mb-6">My Answers</h1>

            <div className="space-y-4">
                {answers.length === 0 ? (
                    <p className="text-muted-foreground">You haven't posted any answers yet.</p>
                ) : (
                    answers.map((a) => (
                        <Card key={a.id} className="cursor-pointer hover:bg-secondary/10 transition-colors" onClick={() => router.push(`/question/${a.question_id}`)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-normal text-muted-foreground flex items-center gap-2">
                                    Reply to: <span className="font-semibold text-foreground truncate max-w-md">{a.question?.content || `Question #${a.question_id}`}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{a.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(a.created_at).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
