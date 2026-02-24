import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"

export type TokenPair = {
	accessToken: string
	refreshToken?: string
}

export type RefreshResponse = TokenPair | { data?: TokenPair } | Record<string, unknown>

export type RefreshResult = {
	accessToken: string
	refreshToken?: string
}

export type RefreshPayloadBuilder = (refreshToken?: string) => unknown

export type RefreshResponseMapper = (response: RefreshResponse) => RefreshResult

export interface AuthRequestConfig extends InternalAxiosRequestConfig {
	skipAuth?: boolean
	skipRefresh?: boolean
	_retry?: boolean
}

export interface AuthRequestOptions<D = unknown> extends AxiosRequestConfig<D> {
	skipAuth?: boolean
	skipRefresh?: boolean
}

export interface HttpClientOptions {
	baseURL?: string
	timeout?: number
	refreshPath?: string
	refreshMethod?: "POST" | "PUT" | "PATCH"
	getRefreshPayload?: RefreshPayloadBuilder
	mapRefreshResponse?: RefreshResponseMapper
	onRefreshFail?: (error: AxiosError) => void
	onUnauthorized?: (error: AxiosError) => void
}
