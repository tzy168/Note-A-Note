import type { Metadata } from "next"
import MainLayout from "@/components/MainLayout"
import EditorClient from "./EditorClient"

type Props = {
	params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params

	if (id === "new") {
		return {
			title: "New Note",
		}
	}

	return {
		title: "Editor",
	}
}

export default async function Editor({ params }: Props) {
	const { id } = await params

	return (
		<MainLayout>
			<EditorClient id={id} />
		</MainLayout>
	)
}
