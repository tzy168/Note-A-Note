import axios, {
	AxiosError,
	AxiosHeaders,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios"
import { tokenStorage } from "./tokenStorage"
import type {
	AuthRequestConfig,
	AuthRequestOptions,
	HttpClientOptions,
	RefreshResponse,
	RefreshResult,
	TokenPair,
} from "./types"

const DEFAULT_REFRESH_PATH = "/auth/refresh"
const DEFAULT_TIMEOUT = 15000

const defaultMapRefreshResponse = (response: RefreshResponse): RefreshResult => {
	const payload = (response as { data?: unknown }).data ?? response
	const asRecord = payload as Record<string, unknown>
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
		throw new Error("Refresh response missing access token")
	}

	return { accessToken, refreshToken }
}

const defaultRefreshPayload = (refreshToken?: string) => ({ refresh_token: refreshToken })

export const createHttpClient = (options: HttpClientOptions = {}) => {
	const instance = axios.create({
		baseURL: options.baseURL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
		timeout: options.timeout ?? DEFAULT_TIMEOUT,
	})

	let refreshPromise: Promise<string> | null = null

	const runRefresh = async () => {
		const currentRefreshToken = tokenStorage.getRefreshToken()

		if (!currentRefreshToken) {
			throw new Error("Missing refresh token")
		}

		const refreshResponse = await instance.request<RefreshResponse>({
			url: options.refreshPath ?? DEFAULT_REFRESH_PATH,
			method: options.refreshMethod ?? "POST",
			data: (options.getRefreshPayload ?? defaultRefreshPayload)(currentRefreshToken),
			skipAuth: true,
			skipRefresh: true,
		} as AuthRequestConfig)

		const mapper = options.mapRefreshResponse ?? defaultMapRefreshResponse
		const nextTokens = mapper(refreshResponse.data)

		const tokenPair: TokenPair = {
			accessToken: nextTokens.accessToken,
			refreshToken: nextTokens.refreshToken ?? currentRefreshToken,
		}
		tokenStorage.setTokens(tokenPair)
		return tokenPair.accessToken
	}

	const withAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
		const headers = config.headers ?? {}
		const normalizedHeaders = AxiosHeaders.from(headers)
		normalizedHeaders.set("Authorization", `Bearer ${token}`)
		config.headers = normalizedHeaders
	}

	instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
		const authConfig = config as AuthRequestConfig
		if (authConfig.skipAuth) return authConfig
		const accessToken = tokenStorage.getAccessToken()
		if (accessToken) {
			withAuthHeader(authConfig, accessToken)
		}
		return authConfig
	})

	instance.interceptors.response.use(
		(response) => response,
		async (error: AxiosError) => {
			const config = error.config as AuthRequestConfig | undefined
			if (!config) throw error

			const shouldTryRefresh =
				error.response?.status === 401 && !config._retry && !config.skipRefresh

			if (!shouldTryRefresh) {
				if (error.response?.status === 401) {
					options.onUnauthorized?.(error)
				}
				throw error
			}

			config._retry = true

			try {
				if (!refreshPromise) {
					refreshPromise = runRefresh()
				}

				const freshAccessToken = await refreshPromise
				withAuthHeader(config, freshAccessToken)
				return instance.request(config)
			} catch (refreshError) {
				const normalizedError = refreshError as AxiosError
				tokenStorage.clearTokens()
				options.onRefreshFail?.(normalizedError)
				options.onUnauthorized?.(normalizedError)
				throw refreshError
			} finally {
				refreshPromise = null
			}
		},
	)

	const request = async <TResponse = unknown, D = unknown>(config: AuthRequestOptions<D>) => {
		const response = await instance.request<TResponse, AxiosResponse<TResponse>, D>(config)
		return response.data
	}

	return {
		instance,
		refreshAccessToken: runRefresh,
		request,
		get: <TResponse = unknown>(url: string, config?: AuthRequestOptions) =>
			request<TResponse>({ ...config, method: "GET", url }),
		post: <TResponse = unknown, D = unknown>(
			url: string,
			data?: D,
			config?: AuthRequestOptions<D>,
		) => request<TResponse, D>({ ...config, method: "POST", url, data }),
		put: <TResponse = unknown, D = unknown>(
			url: string,
			data?: D,
			config?: AuthRequestOptions<D>,
		) => request<TResponse, D>({ ...config, method: "PUT", url, data }),
		patch: <TResponse = unknown, D = unknown>(
			url: string,
			data?: D,
			config?: AuthRequestOptions<D>,
		) => request<TResponse, D>({ ...config, method: "PATCH", url, data }),
		delete: <TResponse = unknown>(url: string, config?: AuthRequestOptions) =>
			request<TResponse>({ ...config, method: "DELETE", url }),
	}
}
