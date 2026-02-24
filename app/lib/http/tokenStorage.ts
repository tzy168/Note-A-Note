import type { TokenPair } from "./types"

const ACCESS_TOKEN_KEY = "auth_access_token"
const REFRESH_TOKEN_KEY = "auth_refresh_token"

let accessTokenMemory: string | null = null
let refreshTokenMemory: string | null = null

const canUseStorage = () => typeof window !== "undefined"

const getStorageValue = (key: string) => {
	if (!canUseStorage()) return null
	return localStorage.getItem(key)
}

const setStorageValue = (key: string, value: string) => {
	if (!canUseStorage()) return
	localStorage.setItem(key, value)
}

const removeStorageValue = (key: string) => {
	if (!canUseStorage()) return
	localStorage.removeItem(key)
}

export const tokenStorage = {
	getAccessToken() {
		if (accessTokenMemory) return accessTokenMemory
		const token = getStorageValue(ACCESS_TOKEN_KEY)
		accessTokenMemory = token
		return token
	},

	getRefreshToken() {
		if (refreshTokenMemory) return refreshTokenMemory
		const token = getStorageValue(REFRESH_TOKEN_KEY)
		refreshTokenMemory = token
		return token
	},

	setTokens(tokens: TokenPair) {
		accessTokenMemory = tokens.accessToken
		setStorageValue(ACCESS_TOKEN_KEY, tokens.accessToken)

		if (typeof tokens.refreshToken === "string" && tokens.refreshToken.length > 0) {
			refreshTokenMemory = tokens.refreshToken
			setStorageValue(REFRESH_TOKEN_KEY, tokens.refreshToken)
		}
	},

	clearTokens() {
		accessTokenMemory = null
		refreshTokenMemory = null
		removeStorageValue(ACCESS_TOKEN_KEY)
		removeStorageValue(REFRESH_TOKEN_KEY)
	},
}
