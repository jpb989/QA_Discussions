"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function QuestionForm({ onSubmit }: { onSubmit: (text: string, displayName: string) => Promise<void> }) {
    const [text, setText] = useState("")
    const [loading, setLoading] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userName, setUserName] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            setIsLoggedIn(true)
            const name = localStorage.getItem("user_name")
            const email = localStorage.getItem("user_email")
            setUserName(name || email || "")
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim()) return

        setLoading(true)
        try {
            let finalName = "Anonymous"
            if (isLoggedIn && !isAnonymous) {
                finalName = userName || "User"
            }

            await onSubmit(text, finalName)
            setText("")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full mb-8 border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's on your mind?..."
                        className="flex-1"
                        disabled={loading}
                    />

                    <div className="flex justify-between items-center">
                        {isLoggedIn ? (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="anonymous"
                                    checked={isAnonymous}
                                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                                />
                                <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                                    Post Anonymously
                                </Label>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground italic">Posting as Anonymous</span>
                        )}

                        <Button type="submit" disabled={loading || !text.trim()}>
                            {loading ? "Posting..." : "Ask"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
