"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useTitle } from "@/hooks/useTitle"

export default function LoginClient() {
	const router = useRouter()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const [isSignUp, setIsSignUp] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useTitle("Login - Note A Note")

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		try {
			// 这里用 mock 代替 supabase 调用，但流程保持一致
			await new Promise((resolve) => setTimeout(resolve, 500))

			if (isSignUp) {
				// 注册成功后的提示保持不变
				alert("Registration successful! Please check your email to verify your account.")
				// 原来是等待邮箱验证后再进入应用，这里不自动跳转
			} else {
				// 登录成功后直接跳转 /home，等价于原来的 navigate("/home")
				if (!email || !password) {
					throw new Error("Email and password are required")
				}
				router.push("/home")
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}

	const handleOAuthLogin = async (provider: "google" | "github") => {
		try {
			// 原来是调用 supabase OAuth 并 redirect 到 /home，
			// 这里直接模拟成功并跳转 /home，交互体验保持一致
			await new Promise((resolve) => setTimeout(resolve, 400))
			router.push("/home")
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "An error occurred")
		}
	}

	const handleGuestLogin = () => {
		// 保持原来的行为：直接进入 /home
		router.push("/home")
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-secondary">
			<div className="p-8 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl max-w-md w-full">
				<h1 className="text-3xl font-bold text-center text-primary mb-2">NoteNote</h1>
				<p className="text-center text-gray-500 mb-8">Your thoughts, organized.</p>

				{error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

				<form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
					<div>
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
							required
						/>
					</div>
					<div>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
					</button>
				</form>

				<div className="text-center mb-6">
					<button
						type="button"
						onClick={() => setIsSignUp(!isSignUp)}
						className="text-sm text-primary hover:underline"
					>
						{isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
					</button>
				</div>

				<div className="relative mb-6">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300"></div>
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-transparent text-gray-500 bg-white/80">Or continue with</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4 mb-6">
					<button
						onClick={() => handleOAuthLogin("google")}
						className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white/50"
					>
						Google
					</button>
					<button
						onClick={() => handleOAuthLogin("github")}
						className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white/50"
					>
						GitHub
					</button>
				</div>

				<div className="text-center border-t border-gray-200 pt-4">
					<button
						onClick={handleGuestLogin}
						className="text-sm text-gray-500 hover:text-primary transition-colors font-medium"
					>
						Continue as Guest
					</button>
				</div>
			</div>
		</div>
	)
}
