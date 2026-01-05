import type { Metadata } from "next"
import RedirectClient from "./components/RedirectClient"

export const metadata: Metadata = {
	title: "Note A Note",
}

export default function Home() {
	return <RedirectClient />
}
