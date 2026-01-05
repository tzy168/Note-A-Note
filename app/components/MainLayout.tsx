"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
	Layout,
	FileText,
	Settings as SettingsIcon,
	Folder,
	Search,
	Menu,
	LucideIcon,
} from "lucide-react"
import clsx from "clsx"

// NavItem 组件需要在外部定义
const NavItem = ({
	href,
	icon: Icon,
	label,
	isActive,
}: {
	href: string
	icon: LucideIcon
	label: string
	isActive: boolean
}) => (
	<Link
		href={href}
		className={clsx(
			"flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
			isActive
				? "bg-primary/10 text-primary font-medium shadow-sm"
				: "text-gray-600 hover:bg-white/50 hover:text-gray-900"
		)}
	>
		<Icon className="w-5 h-5" /> {label}
	</Link>
)

const MainLayout = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const isActive = (path: string) => pathname?.startsWith(path)

	return (
		<div className="flex h-screen bg-secondary overflow-hidden">
			{/* Sidebar */}
			<aside
				className={clsx(
					"fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/40 transform transition-transform duration-300 md:relative md:translate-x-0",
					isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				)}
			>
				<div className="p-6 flex items-center justify-between">
					<h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
						<div className="p-1.5 bg-primary rounded-lg text-white">
							<Layout className="w-5 h-5" />
						</div>
						NoteNote
					</h1>
					<button className="md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
						<ArrowLeftIcon className="w-5 h-5" />
					</button>
				</div>

				<div className="px-4 mb-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search notes..."
							className="w-full pl-9 pr-4 py-2 bg-white/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
						/>
					</div>
				</div>

				<nav className="px-3 space-y-1">
					<NavItem href="/home" icon={FileText} label="All Notes" isActive={isActive("/home")} />

					<div className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
						Folders
					</div>
					<NavItem
						href="/folder/personal"
						icon={Folder}
						label="Personal"
						isActive={isActive("/folder/personal")}
					/>
					<NavItem
						href="/folder/work"
						icon={Folder}
						label="Work"
						isActive={isActive("/folder/work")}
					/>
					<NavItem
						href="/folder/ideas"
						icon={Folder}
						label="Ideas"
						isActive={isActive("/folder/ideas")}
					/>

					<div className="mt-8 pt-4 border-t border-gray-200/50">
						<NavItem
							href="/settings"
							icon={SettingsIcon}
							label="Settings"
							isActive={isActive("/settings")}
						/>
					</div>
				</nav>
			</aside>

			{/* Mobile Overlay */}
			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}

			{/* Main Content */}
			<main className="flex-1 flex flex-col min-w-0 bg-secondary/50 h-full relative">
				{/* Mobile Header */}
				<header className="md:hidden flex items-center p-4 bg-white/60 backdrop-blur-md border-b border-white/40">
					<button className="p-2 -ml-2 text-gray-600" onClick={() => setIsMobileMenuOpen(true)}>
						<Menu className="w-6 h-6" />
					</button>
					<span className="font-semibold ml-2 text-gray-800">NoteNote</span>
				</header>

				<div className="flex-1 overflow-y-auto">{children}</div>
			</main>
		</div>
	)
}

// Helper component for mobile menu close button
const ArrowLeftIcon = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="m12 19-7-7 7-7" />
		<path d="M19 12H5" />
	</svg>
)

export default MainLayout
