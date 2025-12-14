"use client"
import { Trash2 } from "lucide-react"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Label } from "@/app/components/ui/label"
import { ajaxRequest } from "@/app/utils/ajax"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Answer {
    id: number
    content: string
    display_name: string
    created_at: string
}

interface Question {
    id: number
    content: string
    status: string
    created_at: string
    display_name: string
    answers: Answer[]
}

export default function QuestionDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [question, setQuestion] = useState<Question | null>(null)
    const [answerText, setAnswerText] = useState("")
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userName, setUserName] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchQuestion()
        checkAuth()
    }, [id])

    const checkAuth = async () => {
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                const user = await res.json()
                setIsLoggedIn(true)
                setUserName(user.full_name || user.email)
                setIsAdmin(user.is_admin)
            } else {
                // Token invalid
                localStorage.removeItem("token")
                setIsLoggedIn(false)
                setIsAdmin(false)
                setUserName("")
            }
        } catch (e) {
            console.error("Auth check failed", e)
        }
    }

    const fetchQuestion = async () => {
        try {
            const res = await fetch(`${API_URL}/questions/${id}`)
            if (res.ok) {
                setQuestion(await res.json())
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleAnswerSubmit = async () => {
        if (!answerText.trim()) return

        try {
            let finalName = "Anonymous"
            if (isLoggedIn && !isAnonymous) {
                finalName = userName || "User"
            }

            const headers: Record<string, string> = {}
            if (isLoggedIn) {
                const token = localStorage.getItem("token")
                if (token) headers["Authorization"] = `Bearer ${token}`
            }

            await ajaxRequest("POST", `${API_URL}/answers/`, {
                content: answerText,
                display_name: finalName,
                question_id: parseInt(id)
            }, headers)

            setAnswerText("")
            fetchQuestion()
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkAnswered = async () => {
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            await ajaxRequest("PUT", `${API_URL}/questions/${id}/status`, {
                status: "Answered"
            }, { "Authorization": `Bearer ${token}` })

            fetchQuestion()
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteAnswer = async (answerId: number) => {
        if (!confirm("Delete this answer?")) return
        const token = localStorage.getItem("token")
        try {
            await ajaxRequest("DELETE", `${API_URL}/answers/${answerId}`, null, {
                "Authorization": `Bearer ${token}`
            })
            setQuestion(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    answers: prev.answers.filter(a => a.id !== answerId)
                }
            })
        } catch (e) {
            console.error(e)
        }
    }

    if (!question) return <div className="container mx-auto p-8">Loading...</div>

    return (
        <div className="container mx-auto max-w-4xl p-4 min-h-screen">
            <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
                &larr; Back to Dashboard
            </Button>

            <Card className="mb-8">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Badge variant={
                        question.status === "Answered" ? "success" :
                            question.status === "Escalated" ? "destructive" : "secondary"
                    }>
                        {question.status}
                    </Badge>
                    {isAdmin && question.status !== "Answered" && question.answers.length > 0 && (
                        <Button size="sm" onClick={handleMarkAnswered} variant="outline">
                            Mark as Answered
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <h1 className="text-2xl font-bold mb-2">{question.content}</h1>
                    <div className="flex justify-between items-center text-muted-foreground text-sm">
                        <span>Posted by {question.display_name || "Anonymous"}</span>
                        <span>{new Date(question.created_at).toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Answers ({question.answers.length})</h2>

                {/* Answer List */}
                <div className="space-y-6">
                    {question.answers?.map((answer) => (
                        <Card key={answer.id} className="relative group hover:bg-secondary/10 transition-colors">
                            <CardContent className="px-6 pb-6 pt-10">
                                <p className="text-lg">{answer.content}</p>
                                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                    <span>By {answer.display_name}</span>
                                    <span>{new Date(answer.created_at).toLocaleString()}</span>
                                </div>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                        onClick={() => handleDeleteAnswer(answer.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Answer Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Post an Answer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-4">
                            <Input
                                placeholder="Type your answer here..."
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                            />

                            <div className="flex justify-between items-center">
                                {isLoggedIn ? (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="anon-answer"
                                            checked={isAnonymous}
                                            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                                        />
                                        <Label htmlFor="anon-answer" className="text-sm cursor-pointer">Post Anonymously</Label>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">Posting as Anonymous</span>
                                )}

                                <Button onClick={handleAnswerSubmit} disabled={!answerText.trim()}>
                                    Post Answer
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
