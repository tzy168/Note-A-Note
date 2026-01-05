"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Cloud } from "lucide-react"
import { useNotesStore } from "@/store/notesStore"
import { useDebounce } from "@/hooks/useDebounce"
import { formatDistanceToNow } from "date-fns"
import { useTitle } from "@/hooks/useTitle"

export default function EditorClient({ id }: { id: string }) {
	const router = useRouter()
	const { getNote, createNote, updateNote } = useNotesStore()

	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [lastSaved, setLastSaved] = useState<Date | null>(null)
	const [currentNoteId, setCurrentNoteId] = useState<string | null>(
		id === "new" ? null : id || null
	)

	const debouncedTitle = useDebounce(title, 1000)
	const debouncedContent = useDebounce(content, 1000)

	// Dynamic title based on note title and id
	const pageTitle = useMemo(() => {
		if (id === "new") {
			return "New Note - Note A Note"
		}
		if (title) {
			return `${title} - Note A Note`
		}
		return "Note A Note"
	}, [id, title])

	useTitle(pageTitle)

	// Load initial data
	useEffect(() => {
		const loadNote = async () => {
			if (id && id !== "new") {
				setIsLoading(true)
				const note = await getNote(id)
				if (note) {
					setTitle(note.title)
					setContent(note.content || "")
					setLastSaved(new Date(note.updated_at))
				}
				setIsLoading(false)
			}
		}
		loadNote()
	}, [id, getNote])

	// Handle Save
	const handleSave = useCallback(async () => {
		if (!title && !content) return

		setIsSaving(true)
		try {
			if (!currentNoteId) {
				// Create new note
				const newNote = await createNote(title || "Untitled", content)
				if (newNote) {
					setCurrentNoteId(newNote.id)
					// Don't navigate, just update URL to switch to "update" mode
					window.history.replaceState(null, "", `/editor/${newNote.id}`)
				}
			} else {
				// Update existing note
				await updateNote(currentNoteId, title, content)
			}
			setLastSaved(new Date())
		} catch (error) {
			console.error("Failed to save", error)
		} finally {
			setIsSaving(false)
		}
	}, [currentNoteId, title, content, createNote, updateNote])

	// Auto-save effect
	useEffect(() => {
		// Skip initial load
		if (isLoading) return

		// Skip if nothing changed (need more robust check in real app, but this works for now)
		// Actually, debounced values changing implies user typed something

		if (debouncedTitle || debouncedContent) {
			handleSave()
		}
	}, [debouncedTitle, debouncedContent, handleSave, isLoading])

	return (
		<div className="flex flex-col h-full bg-secondary/30">
			{/* Toolbar */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-white/60 backdrop-blur-xl z-10 sticky top-0">
				<div className="flex items-center gap-4 flex-1">
					<button
						onClick={() => router.back()}
						className="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-600"
					>
						<ArrowLeft size={20} />
					</button>
					<input
						type="text"
						placeholder="Untitled Note"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="text-xl font-bold bg-transparent outline-none text-gray-800 placeholder-gray-400 w-full"
					/>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-xs text-gray-500 flex items-center gap-1.5 bg-white/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
						{isSaving ? (
							<>
								<div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
								Saving...
							</>
						) : lastSaved ? (
							<>
								<Cloud size={14} className="text-primary" />
								Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
							</>
						) : (
							<span className="text-gray-400">Unsaved</span>
						)}
					</div>
				</div>
			</div>

			{/* Editor Area */}
			<div className="flex-1 overflow-y-auto p-4 md:p-8">
				<div className="max-w-4xl mx-auto min-h-[calc(100vh-140px)] bg-white/70 backdrop-blur-md rounded-2xl shadow-sm p-8 md:p-12 border border-white/60">
					{isLoading ? (
						<div className="flex justify-center items-center h-40">
							<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : (
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="w-full h-full bg-transparent resize-none outline-none text-gray-700 leading-relaxed text-lg placeholder-gray-300 font-sans"
							placeholder="Start writing your thoughts..."
						/>
					)}
				</div>
			</div>
		</div>
	)
}
