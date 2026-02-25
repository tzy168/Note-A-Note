import { AxiosError } from "axios"
import { http } from "@/lib/http/http"

const NOTE_ENDPOINTS = {
	create: "/notes/create",
	update: "/notes/update",
	delete: "/notes/delete",
	list: "/notes/list",
	detail: (id: string) => `/notes/detail/${id}`,
	addCollaborator: "/notes/collaborators/add",
	removeCollaborator: "/notes/collaborators/remove",
	listCollaborators: "/notes/collaborators",
}

type ApiEnvelope<T> = {
	status?: string
	code?: number
	data?: T
	message?: string
}

export type NoteItem = {
	id: string
	user_id: string
	title: string
	content: string
	created_by: string
	updated_by: string
	created_at: string
	updated_at: string
	deleted?: boolean
}

export type ListNotesParams = {
	page?: number
	pageSize?: number
	q?: string
	title?: string
	userId?: string
	from?: string
	to?: string
	sort?: string
}

export type ListNotesResult = {
	notes: NoteItem[]
	total: number
	page: number
	page_size: number
}

export type CreateNotePayload = {
	title: string
	content?: string
}

export type UpdateNotePayload = {
	id: string
	title?: string
	content?: string
	user_id: string
}

export type DeleteNotePayload = {
	id: string
}

export type AddCollaboratorPayload = {
	note_id: string
	owner_id: string
	collaborator_id: string
	role?: string
}

export type RemoveCollaboratorPayload = {
	note_id: string
	owner_id: string
	collaborator_id: string
}

export type NoteCollaborator = {
	id: string
	note_id: string
	user_id: string
	role: string
	created_at: string
}

const toErrorMessage = (error: unknown, fallback: string) => {
	if (error instanceof AxiosError) {
		const body = error.response?.data as { message?: unknown } | undefined
		if (typeof body?.message === "string" && body.message.length > 0) {
			return body.message
		}
	}

	if (error instanceof Error && error.message) {
		return error.message
	}

	return fallback
}

const unwrapEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
	if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
		const data = (payload as ApiEnvelope<T>).data
		if (typeof data !== "undefined") {
			return data
		}
	}
	return payload as T
}

export const noteService = {
	async createNote(payload: CreateNotePayload) {
		try {
			const response = await http.post<ApiEnvelope<NoteItem>, CreateNotePayload>(
				NOTE_ENDPOINTS.create,
				payload,
			)
			return unwrapEnvelope(response)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to create note"))
		}
	},

	async updateNote(payload: UpdateNotePayload) {
		try {
			const response = await http.post<ApiEnvelope<NoteItem>, UpdateNotePayload>(
				NOTE_ENDPOINTS.update,
				payload,
			)
			return unwrapEnvelope(response)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to update note"))
		}
	},

	async deleteNote(payload: DeleteNotePayload) {
		try {
			return await http.post<ApiEnvelope<Record<string, unknown>>, DeleteNotePayload>(
				NOTE_ENDPOINTS.delete,
				payload,
			)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to delete note"))
		}
	},

	async getNote(id: string, userId?: string) {
		try {
			const response = await http.get<ApiEnvelope<NoteItem>>(NOTE_ENDPOINTS.detail(id), {
				params: userId ? { user_id: userId } : undefined,
			})
			return unwrapEnvelope(response)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to get note"))
		}
	},

	async listNotes(params: ListNotesParams = {}) {
		try {
			const response = await http.post<
				ApiEnvelope<ListNotesResult>,
				{ page: number; page_size: number }
			>(
				NOTE_ENDPOINTS.list,
				{
					page: params.page ?? 1,
					page_size: params.pageSize ?? 20,
				},
				{
					params: {
						q: params.q,
						title: params.title,
						user_id: params.userId,
						from: params.from,
						to: params.to,
						sort: params.sort,
					},
				},
			)
			return unwrapEnvelope(response)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to list notes"))
		}
	},

	async addCollaborator(payload: AddCollaboratorPayload) {
		try {
			const response = await http.post<ApiEnvelope<NoteCollaborator>, AddCollaboratorPayload>(
				NOTE_ENDPOINTS.addCollaborator,
				payload,
			)
			return unwrapEnvelope(response)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to add collaborator"))
		}
	},

	async removeCollaborator(payload: RemoveCollaboratorPayload) {
		try {
			return await http.post<ApiEnvelope<Record<string, unknown>>, RemoveCollaboratorPayload>(
				NOTE_ENDPOINTS.removeCollaborator,
				payload,
			)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to remove collaborator"))
		}
	},

	async listCollaborators(noteId: string, userId: string) {
		try {
			const response = await http.get<ApiEnvelope<NoteCollaborator[]>>(
				NOTE_ENDPOINTS.listCollaborators,
				{
					params: { note_id: noteId, user_id: userId },
				},
			)
			return unwrapEnvelope(response)
		} catch (error) {
			throw new Error(toErrorMessage(error, "Failed to list collaborators"))
		}
	},
}
