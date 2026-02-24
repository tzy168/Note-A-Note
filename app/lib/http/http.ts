import { createHttpClient } from "./client"
import type { HttpClientOptions } from "./types"

export const createHttp = (options?: HttpClientOptions) => createHttpClient(options)

export const http = createHttp()
