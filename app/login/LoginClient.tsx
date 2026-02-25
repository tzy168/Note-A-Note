"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useTitle } from "@/hooks/useTitle"
import { authService } from "@/services/auth"

export default function LoginClient() {
	const router = useRouter()
	const [isSignUp, setIsSignUp] = useState(false)
	const [username, setUsername] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [code, setCode] = useState("")
	const [loading, setLoading] = useState(false)
	const [codeLoading, setCodeLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)

	useTitle("Login - Note A Note")

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setMessage(null)

		try {
			if (isSignUp) {
				if (!username || !email || !password || !code) {
					throw new Error("Username, email, password and verification code are required")
				}
				await authService.signUp({ username, email, password, code })
				setMessage("Registration successful. Please sign in.")
				setIsSignUp(false)
				setCode("")
				return
			}

			if (!email || !password) {
				throw new Error("Email and password are required")
			}

			await authService.signIn({ usernameOrEmail: email, password })
			router.push("/home")
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}

	const handleSendCode = async () => {
		if (!email) {
			setError("Email is required")
			return
		}

		setCodeLoading(true)
		setError(null)
		setMessage(null)

		try {
			await authService.sendEmailCode(email)
			setMessage("Verification code sent. Please check your email.")
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to send verification code")
		} finally {
			setCodeLoading(false)
		}
	}

	const handleOAuthLogin = async () => {
		setError("OAuth login is not wired to backend yet")
	}

	const handleGuestLogin = () => {
		router.push("/home")
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-secondary">
			<div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-md">
				<h1 className="mb-2 text-center text-3xl font-bold text-primary">NoteNote</h1>
				<p className="mb-8 text-center text-gray-500">Your thoughts, organized.</p>

				{error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500">{error}</div>}
				{message && (
					<div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">{message}</div>
				)}

				<form onSubmit={handleEmailAuth} className="mb-6 space-y-4">
					{isSignUp && (
						<input
							type="text"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
							required
						/>
					)}

					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
						required
					/>

					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
						required
					/>

					{isSignUp && (
						<div className="flex gap-2">
							<input
								type="text"
								placeholder="Verification Code"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
								required
							/>
							<button
								type="button"
								onClick={handleSendCode}
								disabled={codeLoading}
								className="rounded-lg border border-gray-300 px-4 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{codeLoading ? "..." : "Send"}
							</button>
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-primary py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
					</button>
				</form>

				<div className="mb-6 text-center">
					<button
						type="button"
						onClick={() => {
							setIsSignUp(!isSignUp)
							setError(null)
							setMessage(null)
						}}
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
						<span className="bg-white/80 px-2 text-gray-500">Or continue with</span>
					</div>
				</div>

				<div className="mb-6 grid grid-cols-2 gap-4">
					<button
						type="button"
						onClick={handleOAuthLogin}
						className="flex items-center justify-center rounded-lg border border-gray-300 bg-white/50 px-4 py-2 transition-colors hover:bg-gray-50"
					>
						Google
					</button>
					<button
						type="button"
						onClick={handleOAuthLogin}
						className="flex items-center justify-center rounded-lg border border-gray-300 bg-white/50 px-4 py-2 transition-colors hover:bg-gray-50"
					>
						GitHub
					</button>
				</div>

				<div className="border-t border-gray-200 pt-4 text-center">
					<button
						type="button"
						onClick={handleGuestLogin}
						className="text-sm font-medium text-gray-500 transition-colors hover:text-primary"
					>
						Continue as Guest
					</button>
				</div>
			</div>
		</div>
	)
}
