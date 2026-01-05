// Mock User 类型定义（替代 Supabase User）
export interface User {
	id: string
	email: string
	name?: string
	created_at: string
}

// Mock 用户数据
export const mockUser: User = {
	id: "mock-user-001",
	email: "demo@notenote.com",
	name: "Demo User",
	created_at: new Date().toISOString(),
}
