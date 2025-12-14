"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { ajaxRequest } from "../utils/ajax"

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
    answers?: Answer[]
}

interface QuestionListProps {
    questions: Question[]
    isAdmin?: boolean
    onDeleteQuestion?: (id: number) => void
    onDeleteAnswer?: (id: number) => void
}

export function QuestionList({ questions, isAdmin, onDeleteQuestion, onDeleteAnswer }: QuestionListProps) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    const handleDeleteQ = async (e: React.MouseEvent, id: number) => {
        e.preventDefault()
        if (!confirm("Are you sure you want to delete this question?")) return

        try {
            const token = localStorage.getItem("token")
            await ajaxRequest("DELETE", `${API_URL}/questions/${id}`, null, {
                "Authorization": `Bearer ${token}`
            })
            if (onDeleteQuestion) onDeleteQuestion(id)
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteA = async (e: React.MouseEvent, id: number) => {
        e.preventDefault()
        if (!confirm("Delete this answer?")) return

        try {
            const token = localStorage.getItem("token")
            await ajaxRequest("DELETE", `${API_URL}/answers/${id}`, null, {
                "Authorization": `Bearer ${token}`
            })
            if (onDeleteAnswer) onDeleteAnswer(id)
        } catch (err) {
            console.error(err)
        }
    }

    if (questions.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                No questions yet. Be the first to ask!
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {questions.map((q) => (
                <Card key={q.id} className="w-full hover:bg-secondary/10 transition-colors group relative">
                    <Link href={`/question/${q.id}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Badge variant={
                                q.status === "Answered" ? "success" :
                                    q.status === "Escalated" ? "destructive" : "secondary"
                            }>
                                {q.status}
                            </Badge>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white -mr-2"
                                    onClick={(e) => handleDeleteQ(e, q.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">{q.content}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-muted-foreground">
                                    Posted by <span className="font-semibold text-foreground">{q.display_name || "Anonymous"}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(q.created_at).toLocaleString()}
                                </p>
                            </div>

                            {q.answers && q.answers.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-muted-foreground font-semibold">
                                        {q.answers.length} Answer{q.answers.length > 1 ? "s" : ""}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Link>
                </Card>
            ))}
        </div>
    )
}
