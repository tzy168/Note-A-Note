"use client"

import { create } from "zustand"
import type { Note } from "../types/note"
import { mockNotes } from "../types/note"

interface NotesState {
	notes: Note[]
	loading: boolean
	fetchNotes: () => Promise<void>
	createNote: (title: string, content: string, folderId?: string) => Promise<Note | null>
	updateNote: (id: string, title: string, content: string) => Promise<void>
	deleteNote: (id: string) => Promise<void>
	getNote: (id: string) => Promise<Note | null>
}

export const useNotesStore = create<NotesState>((set, get) => ({
	notes: [],
	loading: false,

	fetchNotes: async () => {
		set({ loading: true })
		try {
			// Mock: 模拟异步获取笔记
			await new Promise((resolve) => setTimeout(resolve, 300))

			// 从 localStorage 读取笔记（如果有的话），否则使用 mock 数据
			const storedNotes = typeof window !== "undefined" ? localStorage.getItem("mock_notes") : null

			const notes = storedNotes ? JSON.parse(storedNotes) : [...mockNotes]
			set({ notes })
		} catch (error) {
			console.error("Error fetching notes:", error)
			set({ notes: [] })
		} finally {
			set({ loading: false })
		}
	},

	createNote: async (title, content, folderId) => {
		try {
			// Mock: 模拟创建笔记
			await new Promise((resolve) => setTimeout(resolve, 200))

			const newNote: Note = {
				id: `note-${Date.now()}`,
				title,
				content,
				folder_id: folderId || null,
				updated_at: new Date().toISOString(),
				user_id: "mock-user-001",
			}

			const updatedNotes = [newNote, ...get().notes]
			set({ notes: updatedNotes })

			// 保存到 localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("mock_notes", JSON.stringify(updatedNotes))
			}

			return newNote
		} catch (error) {
			console.error("Error creating note:", error)
			return null
		}
	},

	updateNote: async (id, title, content) => {
		try {
			// Mock: 模拟更新笔记
			await new Promise((resolve) => setTimeout(resolve, 200))

			const updatedNotes = get().notes.map((n) =>
				n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n
			)

			set({ notes: updatedNotes })

			// 保存到 localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("mock_notes", JSON.stringify(updatedNotes))
			}
		} catch (error) {
			console.error("Error updating note:", error)
		}
	},

	deleteNote: async (id) => {
		try {
			// Mock: 模拟删除笔记
			await new Promise((resolve) => setTimeout(resolve, 200))

			const updatedNotes = get().notes.filter((n) => n.id !== id)
			set({ notes: updatedNotes })

			// 保存到 localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("mock_notes", JSON.stringify(updatedNotes))
			}
		} catch (error) {
			console.error("Error deleting note:", error)
		}
	},

	getNote: async (id) => {
		const existingNote = get().notes.find((n) => n.id === id)
		if (existingNote) return existingNote

		try {
			// Mock: 如果内存中没有，尝试从 localStorage 获取
			await new Promise((resolve) => setTimeout(resolve, 100))

			const storedNotes = typeof window !== "undefined" ? localStorage.getItem("mock_notes") : null

			if (storedNotes) {
				const notes = JSON.parse(storedNotes)
				return notes.find((n: Note) => n.id === id) || null
			}

			return null
		} catch (error) {
			console.error("Error getting note:", error)
			return null
		}
	},
}))
