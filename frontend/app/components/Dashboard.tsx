"use client"

import { useEffect, useState, useRef } from "react"
import { QuestionForm } from "./QuestionForm"
import { QuestionList } from "./QuestionList"
import { Button } from "./ui/button"
import { Select } from "./ui/select"
import { ajaxRequest } from "../utils/ajax"

interface Answer {
    id: number
    content: string
    display_name: string
    created_at: string
    question_id: number
}

interface Question {
    id: number
    content: string
    status: string
    created_at: string
    display_name: string
    answers: Answer[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Dashboard() {
    const [questions, setQuestions] = useState<Question[]>([])
    const ws = useRef<WebSocket | null>(null)
    const [page, setPage] = useState(1)
    const [filter, setFilter] = useState("All")
    const limit = 10
    const [isAdmin, setIsAdmin] = useState(false)

    // Check admin status on mount
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            fetch(`${API_URL}/users/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data && data.is_admin) setIsAdmin(true)
                })
                .catch(console.error)
        }
    }, [])


    useEffect(() => {
        fetchQuestions()
    }, [page, filter])

    const fetchQuestions = async () => {
        try {
            const query = new URLSearchParams({
                skip: ((page - 1) * limit).toString(),
                limit: limit.toString()
            })
            if (filter !== "All") {
                query.append("status", filter)
            }

            const res = await fetch(`${API_URL}/questions/?${query.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setQuestions(data)
            }
        } catch (e) {
            console.error("Failed to fetch questions", e)
        }
    }

    // WebSocket Init
    useEffect(() => {
        const wsUrl = API_URL.replace("http", "ws") + "/ws"
        ws.current = new WebSocket(wsUrl)

        ws.current.onopen = () => console.log("Connected to WebSocket")
        ws.current.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data))

        return () => ws.current?.close()
    }, [])

    const handleWebSocketMessage = (message: any) => {
        if (message.type === "new_question") {
            const newQ = message.data
            if (filter === "All" || filter === newQ.status) {
                setQuestions((prev) => {
                    if (prev.find(q => q.id === newQ.id)) return prev
                    return [newQ, ...prev]
                })
            }
        } else if (message.type === "update_question") {
            setQuestions((prev) => prev.map(q =>
                q.id === message.data.id ? { ...q, status: message.data.status } : q
            ))
            if (filter !== "All") {
                setQuestions(prev => prev.filter(q => {
                    if (q.id === message.data.id) return message.data.status === filter
                    return true
                }))
            }
        } else if (message.type === "new_answer") {
            setQuestions((prev) => prev.map(q => {
                if (q.id === message.data.question_id) {
                    const currentAnswers = q.answers || []
                    return { ...q, answers: [...currentAnswers, message.data] }
                }
                return q
            }))
        } else if (message.type === "delete_question") {
            setQuestions(prev => prev.filter(q => q.id !== message.data.id))
        }
    }

    const handleQuestionSubmit = async (text: string, displayName: string) => {
        const token = localStorage.getItem("token")
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`

        await ajaxRequest("POST", `${API_URL}/questions/`, {
            content: text,
            display_name: displayName || "Anonymous"
        }, headers)
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <QuestionForm onSubmit={handleQuestionSubmit} />

            <div className="mt-8 flex items-center justify-between">
                <h2 className="text-xl font-bold">Recent Questions</h2>
                <div className="flex gap-2 items-center">
                    <Select
                        value={filter}
                        onChange={(val) => { setFilter(val); setPage(1); }}
                        options={[
                            { label: "All Status", value: "All" },
                            { label: "Pending", value: "Pending" },
                            { label: "Answered", value: "Answered" },
                            { label: "Escalated", value: "Escalated" },
                        ]}
                    />
                </div>
            </div>

            <div className="mt-4">
                <QuestionList
                    questions={questions}
                    isAdmin={isAdmin}
                    onDeleteQuestion={(id) => setQuestions(prev => prev.filter(q => q.id !== id))}
                />
            </div>

            <div className="flex justify-between mt-4">
                <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="flex items-center">Page {page}</span>
                <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={questions.length < limit}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
