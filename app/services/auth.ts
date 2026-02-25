import { AxiosError } from "axios"
import { authApi, authToken } from "@/lib/http"
import { http } from "@/lib/http/http"

const AUTH_ENDPOINTS = {
	sendCode: "/auth/send-code",
	signUp: "/auth/signup",
	signIn: "/auth/login",
	logout: "/auth/logout",
	refresh: "/auth/refresh",
}

type ApiEnvelope<T> = {
	status?: string
	code?: number
	data?: T
	message?: string
}

type RegisterPayload = {
	email: string
	username: string
	password: string
	code: string
}

type LoginPayload = {
	usernameOrEmail: string
	password: string
}

type TokenResponse = {
	accessToken?: string
	refreshToken?: string
	access_token?: string
	refresh_token?: string
}

type RefreshApiResponse = ApiEnvelope<TokenResponse> | TokenResponse
type JwtPayload = {
	userId?: string
	user_id?: string
	sub?: string
}

const extractTokenResponse = (payload: RefreshApiResponse): TokenResponse => {
	if ("data" in payload && payload.data && typeof payload.data === "object") {
		return payload.data
	}
	return payload as TokenResponse
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
	const parts = token.split(".")
	if (parts.length < 2) return null

	try {
		const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
		const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
		const decoded = atob(padded)
		return JSON.parse(decoded) as JwtPayload
	} catch {
		return null
	}
}

const toErrorMessage = (error: unknown, fallback: string) => {
	if (error instanceof AxiosError) {
		const body = error.response?.data as { message?: unknown } | undefined
		if (typeof body?.message === "string" && body.message.length > 0) {
			return body.message
		}
	}

	if (error instanceof Error && error.message) {
		return error.message
	}

	return fallback
}

export const authService = {
	async sendEmailCode(email: string) {
		try {
			await authApi.sendCode(AUTH_ENDPOINTS.sendCode, { email })
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to send verification code"))
		}
	},

	getCurrentUserId() {
		const accessToken = authToken.getAccessToken()
		if (!accessToken) return null
		const payload = decodeJwtPayload(accessToken)
		if (!payload) return null
		return payload.userId ?? payload.user_id ?? payload.sub ?? null
	},

	async signUp(payload: RegisterPayload) {
		try {
			await authApi.signUp(AUTH_ENDPOINTS.signUp, payload)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Sign up failed"))
		}
	},

	async signIn(payload: LoginPayload) {
		try {
			return await authApi.signIn(AUTH_ENDPOINTS.signIn, {
				username_or_email: payload.usernameOrEmail,
				password: payload.password,
			})
		} catch (error) {
			throw new Error(toErrorMessage(error, "Sign in failed"))
		}
	},

	async logout() {
		const refreshToken = authToken.getRefreshToken()
		if (!refreshToken) {
			authToken.clear()
			return
		}

		try {
			await authApi.logout(AUTH_ENDPOINTS.logout, { refresh_token: refreshToken })
		} catch (error) {
			throw new Error(toErrorMessage(error, "Logout failed"))
		}
	},

	async refresh() {
		const refreshToken = authToken.getRefreshToken()
		if (!refreshToken) {
			throw new Error("Missing refresh token")
		}

		const response = await http.post<RefreshApiResponse, { refresh_token: string }>(
			AUTH_ENDPOINTS.refresh,
			{ refresh_token: refreshToken },
			{ skipAuth: true, skipRefresh: true },
		)
		const tokenData = extractTokenResponse(response)
		const accessToken = tokenData.accessToken ?? tokenData.access_token ?? ""
		const nextRefreshToken = tokenData.refreshToken ?? tokenData.refresh_token ?? refreshToken
		if (!accessToken) {
			throw new Error("Invalid refresh response")
		}
		authToken.setTokens({ accessToken, refreshToken: nextRefreshToken })
		return accessToken
	},
}

export type { LoginPayload, RegisterPayload }
