import { createHttpClient } from "./client"
import type { HttpClientOptions } from "./types"

export const createHttp = (options?: HttpClientOptions) => createHttpClient(options)

export const http = createHttp({
	onUnauthorized: () => {
		if (typeof window !== "undefined") {
			window.location.href = "/login"
		}
	},
})
