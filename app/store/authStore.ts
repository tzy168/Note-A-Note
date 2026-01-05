"use client"

import { create } from "zustand"
import type { User } from "../types/user"
import { mockUser } from "../types/user"

interface AuthState {
	user: User | null
	loading: boolean
	setUser: (user: User | null) => void
	setLoading: (loading: boolean) => void
	checkUser: () => Promise<void>
	signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	loading: true,
	setUser: (user) => set({ user }),
	setLoading: (loading) => set({ loading }),

	checkUser: async () => {
		try {
			set({ loading: true })

			// Mock: 模拟检查用户会话
			// 从 localStorage 读取登录状态（模拟 session）
			await new Promise((resolve) => setTimeout(resolve, 300))

			const isLoggedIn =
				typeof window !== "undefined"
					? localStorage.getItem("mock_user_logged_in") === "true"
					: false

			set({ user: isLoggedIn ? mockUser : null })
		} catch (error) {
			console.error("Error checking user:", error)
			set({ user: null })
		} finally {
			set({ loading: false })
		}
	},

	signOut: async () => {
		// Mock: 模拟登出
		await new Promise((resolve) => setTimeout(resolve, 200))

		if (typeof window !== "undefined") {
			localStorage.removeItem("mock_user_logged_in")
		}

		set({ user: null })
	},
}))
