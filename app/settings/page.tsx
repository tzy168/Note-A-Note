import type { Metadata } from "next"
import MainLayout from "@/components/MainLayout"
import SettingsClient from "./SettingsClient"

export const metadata: Metadata = {
	title: "Settings",
}

export default function Settings() {
	return (
		<MainLayout>
			<SettingsClient />
		</MainLayout>
	)
}
