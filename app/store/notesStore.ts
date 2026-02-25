"use client"

import { create } from "zustand"
import type { Note } from "../types/note"
import { ListNotesParams, NoteItem, noteService } from "@/services/note"

const toNote = (item: NoteItem): Note => ({
	id: item.id,
	title: item.title,
	content: item.content,
	folder_id: null,
	updated_at: item.updated_at,
	user_id: item.user_id,
})

interface NotesState {
	notes: Note[]
	loading: boolean
	fetchNotes: (params?: ListNotesParams) => Promise<void>
	createNote: (title: string, content: string, folderId?: string) => Promise<Note | null>
	updateNote: (id: string, user_id: string, title: string, content: string) => Promise<void>
	deleteNote: (id: string) => Promise<void>
	getNote: (id: string) => Promise<Note | null>
}

export const useNotesStore = create<NotesState>((set, get) => ({
	notes: [],
	loading: false,

	fetchNotes: async (params?: ListNotesParams) => {
		set({ loading: true })
		try {
			const res = await noteService.listNotes(params)

			const notes = res.notes.map((note) => toNote(note))
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
			const created = await noteService.createNote({
				title,
				content,
			})
			const newNote = { ...toNote(created), folder_id: folderId || null }
			const updatedNotes = [newNote, ...get().notes]
			set({ notes: updatedNotes })

			return newNote
		} catch (error) {
			console.error("Error creating note:", error)
			return null
		}
	},

	updateNote: async (id, user_id, title, content) => {
		try {
			const updated = await noteService.updateNote({
				id,
				user_id,
				title,
				content,
			})

			const updatedNote = toNote(updated)
			const updatedNotes = get().notes.map((n) => (n.id === id ? { ...n, ...updatedNote } : n))

			set({ notes: updatedNotes })
		} catch (error) {
			console.error("Error updating note:", error)
		}
	},

	deleteNote: async (id) => {
		try {
			await noteService.deleteNote({ id })

			const updatedNotes = get().notes.filter((n) => n.id !== id)
			set({ notes: updatedNotes })
		} catch (error) {
			console.error("Error deleting note:", error)
		}
	},

	getNote: async (id) => {
		const existingNote = get().notes.find((n) => n.id === id)
		if (existingNote) return existingNote

		try {
			const note = await noteService.getNote(id)
			return toNote(note)
		} catch (error) {
			console.error("Error getting note:", error)
			return null
		}
	},
}))
