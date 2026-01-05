import type { Metadata } from "next"
import MainLayout from "@/components/MainLayout"
import FolderClient from "./FolderClient"

type Props = {
	params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params

	return {
		title: `Folder: ${id}`,
	}
}

export default async function Folder({ params }: Props) {
	const { id } = await params

	return (
		<MainLayout>
			<FolderClient id={id} />
		</MainLayout>
	)
}
