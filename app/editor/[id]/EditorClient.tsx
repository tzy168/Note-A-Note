"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Cloud } from "lucide-react"
import { useNotesStore } from "@/store/notesStore"
import { formatDistanceToNow } from "date-fns"
import { useTitle } from "@/hooks/useTitle"
import { authService } from "@/services/auth"

const SAVE_INTERVAL_MS = 60 * 1000

export default function EditorClient({ id }: { id: string }) {
	const router = useRouter()
	const { getNote, createNote, updateNote } = useNotesStore()

	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [lastSaved, setLastSaved] = useState<Date | null>(null)
	const [currentNoteId, setCurrentNoteId] = useState<string | null>(
		id === "new" ? null : id || null,
	)

	const saveTimerRef = useRef<number | null>(null)
	const isSavingRef = useRef(false)
	const dirtyRef = useRef(false)
	const latestRef = useRef({
		title: "",
		content: "",
		currentNoteId: id === "new" ? null : id || null,
	})

	const pageTitle = useMemo(() => {
		if (id === "new") return "New Note - Note A Note"
		if (title) return `${title} - Note A Note`
		return "Note A Note"
	}, [id, title])

	useTitle(pageTitle)

	useEffect(() => {
		latestRef.current = { title, content, currentNoteId }
	}, [title, content, currentNoteId])

	const clearScheduledSave = useCallback(() => {
		if (saveTimerRef.current !== null) {
			window.clearTimeout(saveTimerRef.current)
			saveTimerRef.current = null
		}
	}, [])

	const performSave = useCallback(
		async (force = false) => {
			if (isSavingRef.current) return
			if (!force && !dirtyRef.current) return

			const snapshot = latestRef.current
			if (!snapshot.title && !snapshot.content) return

			isSavingRef.current = true
			setIsSaving(true)

			try {
				const userId = authService.getCurrentUserId() || ""
				if (!snapshot.currentNoteId) {
					const newNote = await createNote(snapshot.title || "Untitled", snapshot.content)
					if (newNote) {
						setCurrentNoteId(newNote.id)
						latestRef.current.currentNoteId = newNote.id
						window.history.replaceState(null, "", `/editor/${newNote.id}`)
					}
				} else {
					await updateNote(snapshot.currentNoteId, userId, snapshot.title, snapshot.content)
				}
				dirtyRef.current = false
				setLastSaved(new Date())
			} catch (error) {
				console.error("Failed to save", error)
			} finally {
				isSavingRef.current = false
				setIsSaving(false)
			}
		},
		[createNote, updateNote],
	)

	const scheduleThrottledSave = useCallback(() => {
		if (saveTimerRef.current !== null) return
		saveTimerRef.current = window.setTimeout(() => {
			saveTimerRef.current = null
			void performSave()
		}, SAVE_INTERVAL_MS)
	}, [performSave])

	const markDirtyAndSchedule = useCallback(() => {
		dirtyRef.current = true
		scheduleThrottledSave()
	}, [scheduleThrottledSave])

	const handleManualSave = useCallback(async () => {
		clearScheduledSave()
		await performSave(true)
	}, [clearScheduledSave, performSave])

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
				dirtyRef.current = false
				setIsLoading(false)
			}
		}
		void loadNote()
	}, [id, getNote])

	useEffect(() => {
		const saveBeforeLeave = () => {
			if (!dirtyRef.current) return
			clearScheduledSave()
			void performSave(true)
		}

		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				saveBeforeLeave()
			}
		}

		window.addEventListener("beforeunload", saveBeforeLeave)
		window.addEventListener("pagehide", saveBeforeLeave)
		document.addEventListener("visibilitychange", onVisibilityChange)

		return () => {
			window.removeEventListener("beforeunload", saveBeforeLeave)
			window.removeEventListener("pagehide", saveBeforeLeave)
			document.removeEventListener("visibilitychange", onVisibilityChange)
			clearScheduledSave()
		}
	}, [clearScheduledSave, performSave])

	return (
		<div className="flex h-full flex-col bg-secondary/30">
			<div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/20 bg-white/60 px-6 py-4 backdrop-blur-xl">
				<div className="flex flex-1 items-center gap-4">
					<button
						onClick={() => router.back()}
						className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white/50"
					>
						<ArrowLeft size={20} />
					</button>
					<input
						type="text"
						placeholder="Untitled Note"
						value={title}
						onChange={(e) => {
							setTitle(e.target.value)
							markDirtyAndSchedule()
						}}
						className="w-full bg-transparent text-xl font-bold text-gray-800 outline-none placeholder:text-gray-400"
					/>
				</div>
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => void handleManualSave()}
						disabled={isSaving}
						className="rounded-lg border border-gray-300 bg-white/60 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						Save
					</button>
					<div className="flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1.5 text-xs text-gray-500 backdrop-blur-sm">
						{isSaving ? (
							<>
								<div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
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

			<div className="flex-1 overflow-y-auto p-4 md:p-8">
				<div className="mx-auto min-h-[calc(100vh-140px)] max-w-4xl rounded-2xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur-md md:p-12">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
						</div>
					) : (
						<textarea
							value={content}
							onChange={(e) => {
								setContent(e.target.value)
								markDirtyAndSchedule()
							}}
							className="h-full w-full resize-none bg-transparent font-sans text-lg leading-relaxed text-gray-700 outline-none placeholder:text-gray-300"
							placeholder="Start writing your thoughts..."
						/>
					)}
				</div>
			</div>
		</div>
	)
}
