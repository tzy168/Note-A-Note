// Mock Note 类型定义
export interface Note {
	id: string
	title: string
	content: string
	folder_id: string | null
	updated_at: string
	user_id: string
}

// Mock 笔记数据
export const mockNotes: Note[] = [
	{
		id: "note-1",
		title: "欢迎使用 NoteNote",
		content: "# 欢迎\n\n这是一个演示笔记应用。你可以在这里记录你的想法、待办事项和任何重要的信息。",
		folder_id: null,
		updated_at: new Date().toISOString(),
		user_id: "mock-user-001",
	},
	{
		id: "note-2",
		title: "待办事项",
		content:
			"- [ ] 完成项目重构\n- [ ] 学习 Next.js App Router\n- [ ] 编写文档\n- [ ] 测试所有功能",
		folder_id: "folder-1",
		updated_at: new Date(Date.now() - 86400000).toISOString(),
		user_id: "mock-user-001",
	},
	{
		id: "note-3",
		title: "技术笔记",
		content:
			"## React 最佳实践\n\n1. 使用函数组件\n2. 善用 hooks\n3. 组件拆分要合理\n4. 注意性能优化",
		folder_id: "folder-1",
		updated_at: new Date(Date.now() - 172800000).toISOString(),
		user_id: "mock-user-001",
	},
]
