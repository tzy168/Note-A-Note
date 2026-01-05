"use client"

import { useEffect } from "react"
import { Plus, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotesStore } from "@/store/notesStore"
import { formatDistanceToNow } from "date-fns"
import { useTitle } from "@/hooks/useTitle"

export default function HomeClient() {
	const router = useRouter()
	const { notes, fetchNotes, loading } = useNotesStore()

	useTitle("My Notes - Note A Note")

	useEffect(() => {
		fetchNotes()
	}, [fetchNotes])

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold text-gray-800">My Notes</h1>
					<p className="text-gray-500 mt-1">Welcome back! Here are your recent notes.</p>
				</div>
				<button
					onClick={() => router.push("/editor/new")}
					className="btn-primary flex items-center gap-2 glass-hover shadow-lg shadow-primary/20"
				>
					<Plus size={20} />
					New Note
				</button>
			</div>

			{loading ? (
				<div className="flex justify-center py-12">
					<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			) : notes.length === 0 ? (
				<div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40">
					<div className="text-gray-400 mb-4">No notes found</div>
					<button
						onClick={() => router.push("/editor/new")}
						className="text-primary hover:underline font-medium"
					>
						Create your first note
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{notes.map((note) => (
						<div
							key={note.id}
							onClick={() => router.push(`/editor/${note.id}`)}
							className="group p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
							<div className="relative z-10">
								<h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-primary transition-colors line-clamp-1">
									{note.title || "Untitled"}
								</h3>
								<p className="text-gray-500 text-sm line-clamp-3 mb-4 h-15">
									{note.content || "No content"}
								</p>
								<div className="flex items-center text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100">
									<Clock size={12} className="mr-1" />
									{note.updated_at
										? formatDistanceToNow(new Date(note.updated_at), {
												addSuffix: true,
										  })
										: "Just now"}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
