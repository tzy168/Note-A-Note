"use client"

import { useTheme } from "@/hooks/useTheme"
import { useTitle } from "@/hooks/useTitle"

export default function SettingsClient() {
	const { colorTheme, changeColorTheme } = useTheme()

	useTitle("Settings - Note A Note")

	const themes = [
		{ name: "amber", color: "bg-yellow-500", label: "Amber (Default)" },
		{ name: "blue", color: "bg-blue-500", label: "Blue" },
		{ name: "emerald", color: "bg-emerald-500", label: "Emerald" },
		{ name: "purple", color: "bg-purple-500", label: "Purple" },
	] as const

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6 text-text">Settings</h1>

			<div className="space-y-6 max-w-2xl">
				<section className="bg-white rounded-xl shadow p-6 glass">
					<h2 className="text-lg font-semibold mb-4 text-gray-800">Theme</h2>
					<div className="flex gap-4">
						{themes.map((theme) => {
							const ringColors = {
								amber: "ring-yellow-500/30 hover:ring-yellow-500/30",
								blue: "ring-blue-500/30 hover:ring-blue-500/30",
								emerald: "ring-emerald-500/30 hover:ring-emerald-500/30",
								purple: "ring-purple-500/30 hover:ring-purple-500/30",
							}[theme.name]

							return (
								<button
									key={theme.name}
									onClick={() => changeColorTheme(theme.name)}
									className={`w-12 h-12 rounded-full ${
										theme.color
									} cursor-pointer transition-all hover:scale-105 ${
										colorTheme === theme.name
											? `ring-4 ring-offset-2 ${ringColors}`
											: `hover:ring-4 hover:ring-offset-2 ${ringColors}`
									}`}
									title={theme.label}
									aria-label={theme.label}
								></button>
							)
						})}
					</div>
				</section>

				<section className="bg-white rounded-xl shadow p-6 glass">
					<h2 className="text-lg font-semibold mb-4 text-gray-800">Account</h2>
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
							G
						</div>
						<div>
							<p className="font-medium text-gray-900">Guest User</p>
							<p className="text-sm text-gray-500">Not logged in</p>
						</div>
					</div>
					<button className="btn-primary glass-hover w-full sm:w-auto">Sign In / Register</button>
				</section>

				<section className="bg-white rounded-xl shadow p-6 glass">
					<h2 className="text-lg font-semibold mb-4 text-gray-800">Data & Sync</h2>
					<div className="flex items-center justify-between py-3 border-b border-gray-100">
						<div>
							<p className="font-medium text-gray-700">Auto-sync</p>
							<p className="text-xs text-gray-500">Sync changes automatically when online</p>
						</div>
						<div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
							<div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
						</div>
					</div>
					<div className="flex items-center justify-between py-3">
						<div>
							<p className="font-medium text-gray-700">Clear Local Data</p>
							<p className="text-xs text-gray-500">Remove all locally stored notes</p>
						</div>
						<button className="text-red-500 text-sm font-medium hover:text-red-600">Clear</button>
					</div>
				</section>
			</div>
		</div>
	)
}
