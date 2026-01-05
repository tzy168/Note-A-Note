"use client"

import { useTitle } from "@/hooks/useTitle"

export default function FolderClient({ id }: { id: string }) {
	useTitle(`Folder: ${id} - Note A Note`)

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4 text-text">Folder: {id}</h1>
			<div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow glass">
				<p>No notes in this folder yet.</p>
			</div>
		</div>
	)
}
