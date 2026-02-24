import { authApi } from "./auth"
import { createHttp, http } from "./http"
import { tokenStorage } from "./tokenStorage"
import type { TokenPair } from "./types"

export const authToken = {
	getAccessToken: tokenStorage.getAccessToken,
	getRefreshToken: tokenStorage.getRefreshToken,
	setTokens: (tokens: TokenPair) => tokenStorage.setTokens(tokens),
	clear: () => tokenStorage.clearTokens(),
}

export { authApi, createHttp, http }
export type { AuthRequestOptions, HttpClientOptions, TokenPair } from "./types"
