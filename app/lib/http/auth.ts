import { http } from "./http"
import { tokenStorage } from "./tokenStorage"
import type { TokenPair } from "./types"

type TokenLikeResponse = TokenPair | { data?: TokenPair } | Record<string, unknown>

const mapTokenPair = (payload: TokenLikeResponse): TokenPair => {
	const source = (payload as { data?: unknown }).data ?? payload
	const asRecord = source as Record<string, unknown>

	const accessToken =
		(typeof asRecord.accessToken === "string" && asRecord.accessToken) ||
		(typeof asRecord.access_token === "string" && asRecord.access_token) ||
		(typeof asRecord.token === "string" && asRecord.token) ||
		""

	const refreshToken =
		(typeof asRecord.refreshToken === "string" && asRecord.refreshToken) ||
		(typeof asRecord.refresh_token === "string" && asRecord.refresh_token) ||
		undefined

	if (!accessToken) {
		throw new Error("Login response missing access token")
	}

	return { accessToken, refreshToken }
}

export const authApi = {
	async signIn<TBody = Record<string, unknown>>(url: string, body: TBody) {
		const response = await http.post<TokenLikeResponse, TBody>(url, body, {
			skipAuth: true,
			skipRefresh: true,
		})
		const tokens = mapTokenPair(response)
		tokenStorage.setTokens(tokens)
		return tokens
	},

	async signUp<TBody = Record<string, unknown>>(url: string, body: TBody) {
		return http.post<Record<string, unknown>, TBody>(url, body, {
			skipAuth: true,
			skipRefresh: true,
		})
	},

	async sendCode<TBody = Record<string, unknown>>(url: string, body: TBody) {
		return http.post<Record<string, unknown>, TBody>(url, body, {
			skipAuth: true,
			skipRefresh: true,
		})
	},

	async logout<TBody = Record<string, unknown>>(url: string, body: TBody) {
		try {
			return await http.post<Record<string, unknown>, TBody>(url, body, {
				skipAuth: false,
				skipRefresh: true,
			})
		} finally {
			tokenStorage.clearTokens()
		}
	},
}
