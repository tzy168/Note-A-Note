"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { authToken } from "@/lib/http"
import { authService } from "./services/auth"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [checking, setChecking] = useState(true)
	const isPublicRoute = pathname === "/login"

	useEffect(() => {
		let active = true

		if (isPublicRoute) {
			return () => {
				active = false
			}
		}

		const ensureAuth = async () => {
			const accessToken = authToken.getAccessToken()
			if (accessToken) {
				if (active) setChecking(false)
				return
			}

			const refreshToken = authToken.getRefreshToken()
			if (!refreshToken) {
				router.replace("/login")
				if (active) setChecking(false)
				return
			}

			try {
				await authService.refresh()
				if (active) setChecking(false)
			} catch {
				authToken.clear()
				router.replace("/login")
				if (active) setChecking(false)
			}
		}

		void ensureAuth()
	return () => {
			active = false
		}
	}, [isPublicRoute, pathname, router])

	if (isPublicRoute) return <>{children}</>
	if (checking) return null
	return <>{children}</>
}
