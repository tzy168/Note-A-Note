"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTitle } from "@/hooks/useTitle"

export default function RedirectClient() {
	const router = useRouter()

	useTitle("Note A Note")

	useEffect(() => {
		router.replace("/home")
	}, [router])

	return (
		<div className="flex min-h-screen items-center justify-center bg-secondary">
			<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	)
}
