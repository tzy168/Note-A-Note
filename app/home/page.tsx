import type { Metadata } from "next"
import MainLayout from "@/components/MainLayout"
import HomeClient from "./HomeClient"

export const metadata: Metadata = {
	title: "My Notes",
}

export default function Home() {
	return (
		<MainLayout>
			<HomeClient />
		</MainLayout>
	)
}
