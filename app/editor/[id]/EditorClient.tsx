"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import type {
	ReactNode,
	CSSProperties,
	Dispatch,
	SetStateAction,
	RefObject,
	MouseEvent,
} from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
	ArrowLeft,
	Cloud,
	Bold,
	Italic,
	Underline as UnderlineIcon,
	List,
	ListOrdered,
	ListTodo,
	Link2,
	Image as ImageIcon,
	Table as TableIcon,
	Type,
	Palette,
	Highlighter,
	Undo2,
	Redo2,
	ChevronDown,
} from "lucide-react"
import { useNotesStore } from "@/store/notesStore"
import { formatDistanceToNow } from "date-fns"
import { useTitle } from "@/hooks/useTitle"
import { authService } from "@/services/auth"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import TextAlign from "@tiptap/extension-text-align"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import FontFamily from "@tiptap/extension-font-family"
import Underline from "@tiptap/extension-underline"
import { Extension } from "@tiptap/core"

const SAVE_INTERVAL_MS = 60 * 1000
const RECENT_COLORS_LIMIT = 6
const FONT_OPTIONS = [
	"Inter",
	"Georgia, serif",
	"Times New Roman, serif",
	"Courier New, monospace",
	"JetBrains Mono, monospace",
]
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"]
const LINE_HEIGHTS = ["1.2", "1.4", "1.6", "1.8", "2"]
const COLOR_SWATCHES = [
	"#111827",
	"#1F2937",
	"#374151",
	"#6B7280",
	"#EF4444",
	"#F97316",
	"#F59E0B",
	"#10B981",
	"#3B82F6",
	"#6366F1",
	"#A855F7",
	"#EC4899",
	"#0EA5E9",
	"#14B8A6",
	"#22C55E",
]

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fontSize: {
			setFontSize: (size: string) => ReturnType
			unsetFontSize: () => ReturnType
		}
		lineHeight: {
			setLineHeight: (value: string) => ReturnType
			unsetLineHeight: () => ReturnType
		}
		indent: {
			indent: () => ReturnType
			outdent: () => ReturnType
		}
	}
}

const FontSize = Extension.create({
	name: "fontSize",
	addGlobalAttributes() {
		return [
			{
				types: ["textStyle"],
				attributes: {
					fontSize: {
						default: null,
						parseHTML: (element) => element.style.fontSize || null,
						renderHTML: (attributes) =>
							attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
					},
				},
			},
		]
	},
	addCommands() {
		return {
			setFontSize:
				(size: string) =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: size }).run(),
			unsetFontSize:
				() =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
		}
	},
})

const LineHeight = Extension.create({
	name: "lineHeight",
	addGlobalAttributes() {
		return [
			{
				types: ["paragraph", "heading"],
				attributes: {
					lineHeight: {
						default: null,
						parseHTML: (element) => element.style.lineHeight || null,
						renderHTML: (attributes) =>
							attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {},
					},
				},
			},
		]
	},
	addCommands() {
		return {
			setLineHeight:
				(value: string) =>
				({ chain }) =>
					chain()
						.updateAttributes("paragraph", { lineHeight: value })
						.updateAttributes("heading", { lineHeight: value })
						.run(),
			unsetLineHeight:
				() =>
				({ chain }) =>
					chain()
						.updateAttributes("paragraph", { lineHeight: null })
						.updateAttributes("heading", { lineHeight: null })
						.run(),
		}
	},
})

const Indent = Extension.create({
	name: "indent",
	addGlobalAttributes() {
		return [
			{
				types: ["paragraph", "heading"],
				attributes: {
					indent: {
						default: 0,
						parseHTML: (element) => {
							const value = element.style.paddingLeft || ""
							const parsed = Number.parseFloat(value)
							return Number.isNaN(parsed) ? 0 : parsed / 1
						},
						renderHTML: (attributes) =>
							attributes.indent ? { style: `padding-left: ${attributes.indent}em` } : {},
					},
				},
			},
		]
	},
	addCommands() {
		return {
			indent:
				() =>
				({ state, chain }) => {
					const type = state.selection.$from.parent.type.name
					if (type !== "paragraph" && type !== "heading") return false
					const current = state.selection.$from.parent.attrs.indent || 0
					const next = Math.min(8, current + 1)
					return chain().updateAttributes(type, { indent: next }).run()
				},
			outdent:
				() =>
				({ state, chain }) => {
					const type = state.selection.$from.parent.type.name
					if (type !== "paragraph" && type !== "heading") return false
					const current = state.selection.$from.parent.attrs.indent || 0
					const next = Math.max(0, current - 1)
					return chain().updateAttributes(type, { indent: next }).run()
				},
		}
	},
})

export default function EditorClient({ id }: { id: string }) {
	const router = useRouter()
	const { getNote, createNote, updateNote } = useNotesStore()

	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [lastSaved, setLastSaved] = useState<Date | null>(null)
	const [currentNoteId, setCurrentNoteId] = useState<string | null>(
		id === "new" ? null : id || null,
	)
	const [menuOpen, setMenuOpen] = useState(false)
	const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
	const menuRef = useRef<HTMLDivElement | null>(null)
	const [activeMenu, setActiveMenu] = useState<string | null>(null)
	const [activeTopMenu, setActiveTopMenu] = useState<string | null>(null)
	const [recentColors, setRecentColors] = useState<string[]>([])

	const saveTimerRef = useRef<number | null>(null)
	const isSavingRef = useRef(false)
	const dirtyRef = useRef(false)
	const latestRef = useRef({
		title: "",
		content: "",
		currentNoteId: id === "new" ? null : id || null,
	})

	const pageTitle = useMemo(() => {
		if (id === "new") return "New Note - Note A Note"
		if (title) return `${title} - Note A Note`
		return "Note A Note"
	}, [id, title])

	useTitle(pageTitle)

	useEffect(() => {
		latestRef.current = { title, content, currentNoteId }
	}, [title, content, currentNoteId])

	const clearScheduledSave = useCallback(() => {
		if (saveTimerRef.current !== null) {
			window.clearTimeout(saveTimerRef.current)
			saveTimerRef.current = null
		}
	}, [])

	const performSave = useCallback(
		async (force = false) => {
			if (isSavingRef.current) return
			if (!force && !dirtyRef.current) return

			const snapshot = latestRef.current
			if (!snapshot.title && !snapshot.content) return

			isSavingRef.current = true
			setIsSaving(true)

			try {
				const userId = authService.getCurrentUserId() || ""
				if (!snapshot.currentNoteId) {
					const newNote = await createNote(snapshot.title || "Untitled", snapshot.content)
					if (newNote) {
						setCurrentNoteId(newNote.id)
						latestRef.current.currentNoteId = newNote.id
						window.history.replaceState(null, "", `/editor/${newNote.id}`)
					}
				} else {
					await updateNote(snapshot.currentNoteId, userId, snapshot.title, snapshot.content)
				}
				dirtyRef.current = false
				setLastSaved(new Date())
			} catch (error) {
				console.error("Failed to save", error)
			} finally {
				isSavingRef.current = false
				setIsSaving(false)
			}
		},
		[createNote, updateNote],
	)

	const scheduleThrottledSave = useCallback(() => {
		if (saveTimerRef.current !== null) return
		saveTimerRef.current = window.setTimeout(() => {
			saveTimerRef.current = null
			void performSave()
		}, SAVE_INTERVAL_MS)
	}, [performSave])

	const markDirtyAndSchedule = useCallback(() => {
		dirtyRef.current = true
		scheduleThrottledSave()
	}, [scheduleThrottledSave])

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				history: {},
			}),
			Placeholder.configure({
				placeholder: "Start writing your thoughts...",
			}),
			TextStyle,
			Color,
			Highlight.configure({ multicolor: true }),
			FontFamily,
			FontSize,
			LineHeight,
			Indent,
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
				defaultProtocol: "https",
			}),
			Image.configure({
				allowBase64: false,
			}),
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableHeader,
			TableCell,
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			Underline,
		],
		content: "",
		editorProps: {
			attributes: {
				class:
					"tiptap min-h-[calc(100vh-220px)] w-full bg-transparent font-sans text-lg leading-relaxed text-gray-700 outline-none",
			},
		},
		onUpdate: ({ editor }) => {
			const html = editor.getHTML()
			setContent(html)
			markDirtyAndSchedule()
		},
	})

	const handleManualSave = useCallback(async () => {
		clearScheduledSave()
		await performSave(true)
	}, [clearScheduledSave, performSave])

	const applyLink = useCallback(() => {
		if (!editor) return
		const previousUrl = editor.getAttributes("link").href as string | undefined
		const url = window.prompt("Link URL", previousUrl || "https://")
		if (url === null) return
		if (url.trim() === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run()
			return
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
	}, [editor])

	const insertImage = useCallback(() => {
		if (!editor) return
		const url = window.prompt("Image URL", "https://")
		if (!url) return
		editor.chain().focus().setImage({ src: url }).run()
	}, [editor])

	const addRecentColor = useCallback((color: string) => {
		setRecentColors((prev) => {
			const next = [color, ...prev.filter((c) => c !== color)]
			return next.slice(0, RECENT_COLORS_LIMIT)
		})
	}, [])

	const runAndClose = useCallback(
		(action: () => void, onClose?: () => void) => {
			action()
			onClose?.()
		},
		[],
	)

	const ToolButton = ({
		onClick,
		active,
		title,
		children,
	}: {
		onClick: () => void
		active?: boolean
		title?: string
		children: ReactNode
	}) => (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 ${
				active ? "bg-primary/20 text-primary" : ""
			}`}
		>
			{children}
		</button>
	)

	const ToolDivider = () => <span className="mx-1 h-4 w-px bg-gray-200" />

	type MenuState = {
		active: string | null
		setActive: Dispatch<SetStateAction<string | null>>
	}

	const ToolDropdown = ({
		menuId,
		label,
		icon,
		children,
		menuState,
	}: {
		menuId: string
		label: string
		icon?: ReactNode
		children: ReactNode
		menuState: MenuState
	}) => (
		<div
			className="relative"
			onMouseEnter={() => menuState.setActive(menuId)}
			onMouseLeave={() =>
				menuState.setActive((prev) => (prev === menuId ? null : prev))
			}
		>
			<button
				type="button"
				className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100"
				title={label}
			>
				{icon}
				<span>{label}</span>
				<ChevronDown size={12} />
			</button>
			{menuState.active === menuId && (
				<div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
					{children}
				</div>
			)}
		</div>
	)

	const ColorPalette = ({
		onPick,
		onClear,
	}: {
		onPick: (color: string) => void
		onClear: () => void
	}) => (
		<>
			{recentColors.length > 0 && (
				<div className="mb-2">
					<div className="mb-1 text-[10px] uppercase text-gray-400">Recent</div>
					<div className="flex flex-wrap gap-1">
						{recentColors.map((color) => (
							<button
								key={color}
								type="button"
								className="h-5 w-5 rounded border border-gray-200"
								style={{ backgroundColor: color }}
								onClick={() => {
									onPick(color)
									addRecentColor(color)
								}}
							/>
						))}
					</div>
				</div>
			)}
			<div className="mb-1 text-[10px] uppercase text-gray-400">Palette</div>
			<div className="flex flex-wrap gap-1">
				{COLOR_SWATCHES.map((color) => (
					<button
						key={color}
						type="button"
						className="h-5 w-5 rounded border border-gray-200"
						style={{ backgroundColor: color }}
						onClick={() => {
							onPick(color)
							addRecentColor(color)
						}}
					/>
				))}
			</div>
			<button
				type="button"
				className="mt-2 w-full rounded px-2 py-1 text-left hover:bg-gray-100 text-gray-500"
				onClick={onClear}
			>
				Default
			</button>
		</>
	)

	const handleContextMenu = useCallback(
		(event: React.MouseEvent) => {
			if (!editor) return
			event.preventDefault()
			const selection = editor.state.selection
			let anchorX = event.clientX
			let anchorY = event.clientY

			if (selection && !selection.empty) {
				const rangeCoords = editor.view.coordsAtPos(selection.to)
				anchorX = rangeCoords.right + 8
				anchorY = rangeCoords.top
			} else {
				const coords = { left: event.clientX, top: event.clientY }
				const pos = editor.view.posAtCoords(coords)
				if (pos) {
					editor.commands.setTextSelection(pos.pos)
				}
			}

			setMenuPos({ x: anchorX, y: anchorY })
			setActiveMenu(null)
			setMenuOpen(true)
		},
		[editor],
	)

	useEffect(() => {
		if (!menuOpen) return
		const close = () => setMenuOpen(false)
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				close()
			}
		}
		window.addEventListener("click", close)
		window.addEventListener("keydown", onKeyDown)
		return () => {
			window.removeEventListener("click", close)
			window.removeEventListener("keydown", onKeyDown)
		}
	}, [menuOpen])

	useEffect(() => {
		if (!menuOpen || !menuRef.current) return
		const rect = menuRef.current.getBoundingClientRect()
		const padding = 8
		let nextX = menuPos.x
		let nextY = menuPos.y

		if (nextX + rect.width + padding > window.innerWidth) {
			nextX = menuPos.x - rect.width - 12
		}
		if (nextY + rect.height + padding > window.innerHeight) {
			nextY = menuPos.y - rect.height - 12
		}

		const maxX = window.innerWidth - rect.width - padding
		const maxY = window.innerHeight - rect.height - padding
		nextX = Math.max(padding, Math.min(nextX, maxX))
		nextY = Math.max(padding, Math.min(nextY, maxY))
		if (nextX !== menuPos.x || nextY !== menuPos.y) {
			setMenuPos({ x: nextX, y: nextY })
		}
	}, [menuOpen, menuPos.x, menuPos.y])

	useEffect(() => {
		if (!editor || !menuOpen) return
		const update = () => {
			const selection = editor.state.selection
			if (!selection || selection.empty) return
			const rangeCoords = editor.view.coordsAtPos(selection.to)
			setMenuPos({ x: rangeCoords.right + 8, y: rangeCoords.top })
		}
		editor.on("selectionUpdate", update)
		return () => {
			editor.off("selectionUpdate", update)
		}
	}, [editor, menuOpen])

	useEffect(() => {
		const loadNote = async () => {
			if (id && id !== "new") {
				setIsLoading(true)
				const note = await getNote(id)
				if (note) {
					setTitle(note.title)
					setContent(note.content || "")
					if (editor) {
						editor.commands.setContent(note.content || "", false)
					}
					setLastSaved(new Date(note.updated_at))
				}
				dirtyRef.current = false
				setIsLoading(false)
			}
		}
		void loadNote()
	}, [id, getNote, editor])

	useEffect(() => {
		const saveBeforeLeave = () => {
			if (!dirtyRef.current) return
			clearScheduledSave()
			void performSave(true)
		}

		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				saveBeforeLeave()
			}
		}

		window.addEventListener("beforeunload", saveBeforeLeave)
		window.addEventListener("pagehide", saveBeforeLeave)
		document.addEventListener("visibilitychange", onVisibilityChange)

		return () => {
			window.removeEventListener("beforeunload", saveBeforeLeave)
			window.removeEventListener("pagehide", saveBeforeLeave)
			document.removeEventListener("visibilitychange", onVisibilityChange)
			clearScheduledSave()
		}
	}, [clearScheduledSave, performSave])

	const renderToolbar = ({
		menuState,
		onClose,
		className,
		style,
		onMouseLeave,
		menuRef,
		onClick,
	}: {
		menuState: MenuState
		onClose?: () => void
		className: string
		style?: CSSProperties
		onMouseLeave?: () => void
		menuRef?: RefObject<HTMLDivElement>
		onClick?: (event: MouseEvent<HTMLDivElement>) => void
	}) => {
		const run = (action: () => void) => runAndClose(action, onClose)

		return (
			<div
				ref={menuRef}
				className={className}
				style={style}
				onMouseLeave={onMouseLeave}
				onClick={onClick}
			>
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().undo().run())}
				title="Undo (Ctrl+Z)"
			>
				<Undo2 size={14} />
			</ToolButton>
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().redo().run())}
				title="Redo (Ctrl+Y)"
			>
				<Redo2 size={14} />
			</ToolButton>
			<ToolDivider />
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().toggleBold().run())}
				active={editor?.isActive("bold")}
				title="Bold (Ctrl+B)"
			>
				<Bold size={14} />
			</ToolButton>
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}
				active={editor?.isActive("italic")}
				title="Italic (Ctrl+I)"
			>
				<Italic size={14} />
			</ToolButton>
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().toggleUnderline().run())}
				active={editor?.isActive("underline")}
				title="Underline (Ctrl+U)"
			>
				<UnderlineIcon size={14} />
			</ToolButton>
			<ToolDivider />
			<ToolDropdown menuId="font" label="Font" icon={<Type size={14} />} menuState={menuState}>
				{FONT_OPTIONS.map((font) => (
					<button
						key={font}
						type="button"
						className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
						style={{ fontFamily: font }}
						onClick={() =>
							runAndClose(
								() => editor?.chain().focus().setFontFamily(font).run(),
								() => menuState.setActive(null),
							)
						}
					>
						{font.split(",")[0]}
					</button>
				))}
				<button
					type="button"
					className="w-full rounded px-2 py-1 text-left hover:bg-gray-100 text-gray-500"
					onClick={() =>
						runAndClose(
							() => editor?.chain().focus().unsetFontFamily().run(),
							() => menuState.setActive(null),
						)
					}
				>
					Default
				</button>
			</ToolDropdown>
			<ToolDropdown menuId="size" label="Size" icon={null} menuState={menuState}>
				{FONT_SIZES.map((size) => (
					<button
						key={size}
						type="button"
						className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() =>
							runAndClose(
								() => editor?.chain().focus().setFontSize(size).run(),
								() => menuState.setActive(null),
							)
						}
					>
						{size}
					</button>
				))}
				<button
					type="button"
					className="w-full rounded px-2 py-1 text-left hover:bg-gray-100 text-gray-500"
					onClick={() =>
						runAndClose(
							() => editor?.chain().focus().unsetFontSize().run(),
							() => menuState.setActive(null),
						)
					}
				>
					Default
				</button>
			</ToolDropdown>
			<ToolDropdown
				menuId="textColor"
				label="Text"
				icon={<Palette size={14} />}
				menuState={menuState}
			>
			<ColorPalette
					onPick={(color) => {
						run(() => editor?.chain().focus().setColor(color).run())
						menuState.setActive(null)
					}}
					onClear={() => {
						run(() => editor?.chain().focus().unsetColor().run())
						menuState.setActive(null)
					}}
				/>
			</ToolDropdown>
			<ToolDropdown
				menuId="highlight"
				label="Bg"
				icon={<Highlighter size={14} />}
				menuState={menuState}
			>
			<ColorPalette
					onPick={(color) => {
						run(() => editor?.chain().focus().setHighlight({ color }).run())
						menuState.setActive(null)
					}}
					onClear={() => {
						run(() => editor?.chain().focus().unsetHighlight().run())
						menuState.setActive(null)
					}}
				/>
			</ToolDropdown>
			<ToolDivider />
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())}
				active={editor?.isActive("bulletList")}
				title="Bullet List"
			>
				<List size={14} />
			</ToolButton>
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())}
				active={editor?.isActive("orderedList")}
				title="Numbered List"
			>
				<ListOrdered size={14} />
			</ToolButton>
			<ToolButton
				onClick={() => run(() => editor?.chain().focus().toggleTaskList().run())}
				active={editor?.isActive("taskList")}
				title="Task List"
			>
				<ListTodo size={14} />
			</ToolButton>
			<ToolDivider />
			<ToolButton onClick={() => run(() => applyLink())} title="Link">
				<Link2 size={14} />
			</ToolButton>
			<ToolButton onClick={() => run(() => insertImage())} title="Image">
				<ImageIcon size={14} />
			</ToolButton>
			<ToolButton
				onClick={() =>
					run(() =>
						editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
					)
				}
				title="Insert Table"
			>
				<TableIcon size={14} />
			</ToolButton>
			<ToolDivider />
			<ToolDropdown menuId="more" label="More" icon={null} menuState={menuState}>
				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().toggleBlockquote().run(), onClose)}
					>
						Quote
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().toggleCodeBlock().run(), onClose)}
					>
						Code
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), onClose)}
					>
						Heading
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().setHorizontalRule().run(), onClose)}
					>
						Divider
					</button>
				</div>
				<div className="my-2 h-px bg-gray-200" />
				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().setTextAlign("left").run(), onClose)}
					>
						Align Left
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().setTextAlign("center").run(), onClose)}
					>
						Align Center
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().setTextAlign("right").run(), onClose)}
					>
						Align Right
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().setTextAlign("justify").run(), onClose)}
					>
						Justify
					</button>
				</div>
				<div className="my-2 h-px bg-gray-200" />
				<div className="grid grid-cols-2 gap-1">
					{LINE_HEIGHTS.map((line) => (
						<button
							key={line}
							type="button"
							className="rounded px-2 py-1 text-left hover:bg-gray-100"
							onClick={() =>
								runAndClose(() => editor?.chain().focus().setLineHeight(line).run(), onClose)
							}
						>
							Line {line}
						</button>
					))}
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100 text-gray-500"
						onClick={() =>
							runAndClose(() => editor?.chain().focus().unsetLineHeight().run(), onClose)
						}
					>
						Line Default
					</button>
				</div>
				<div className="my-2 h-px bg-gray-200" />
				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().indent().run(), onClose)}
					>
						Indent
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().outdent().run(), onClose)}
					>
						Outdent
					</button>
				</div>
				<div className="my-2 h-px bg-gray-200" />
				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() =>
							runAndClose(
								() =>
									editor
										?.chain()
										.focus()
										.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
										.run(),
								onClose,
							)
						}
					>
						Insert Table
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().addRowAfter().run(), onClose)}
					>
						Add Row
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() =>
							runAndClose(() => editor?.chain().focus().addColumnAfter().run(), onClose)
						}
					>
						Add Column
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-left hover:bg-gray-100"
						onClick={() => runAndClose(() => editor?.chain().focus().deleteTable().run(), onClose)}
					>
						Delete Table
					</button>
				</div>
			</ToolDropdown>
		</div>
	)
}

	return (
		<div className="flex h-full flex-col bg-secondary/30">
			<div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/20 bg-white/60 px-6 py-4 backdrop-blur-xl">
				<div className="flex flex-1 items-center gap-4">
					<button
						onClick={() => router.back()}
						className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white/50"
					>
						<ArrowLeft size={20} />
					</button>
					<input
						type="text"
						placeholder="Untitled Note"
						value={title}
						onChange={(e) => {
							setTitle(e.target.value)
							markDirtyAndSchedule()
						}}
						className="w-full bg-transparent text-xl font-bold text-gray-800 outline-none placeholder:text-gray-400"
					/>
				</div>
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => void handleManualSave()}
						disabled={isSaving}
						className="rounded-lg border border-gray-300 bg-white/60 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						Save
					</button>
					<div className="flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1.5 text-xs text-gray-500 backdrop-blur-sm">
						{isSaving ? (
							<>
								<div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
								Saving...
							</>
						) : lastSaved ? (
							<>
								<Cloud size={14} className="text-primary" />
								Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
							</>
						) : (
							<span className="text-gray-400">Unsaved</span>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4 md:p-8">
				<div className="mx-auto min-h-[calc(100vh-140px)] max-w-4xl rounded-2xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur-md md:p-12">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
						</div>
					) : (
						<div className="space-y-4">
							{renderToolbar({
								menuState: { active: activeTopMenu, setActive: setActiveTopMenu },
								className:
									"flex flex-wrap items-center gap-1 rounded-xl border border-white/60 bg-white/60 p-2 text-xs text-gray-600 shadow-sm",
							})}
							<div className="relative" onContextMenu={handleContextMenu}>
								<EditorContent editor={editor} />
								{menuOpen && typeof document !== "undefined" &&
									createPortal(
										renderToolbar({
											menuState: { active: activeMenu, setActive: setActiveMenu },
											onClose: () => setMenuOpen(false),
											className:
												"fixed z-[100] flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white/95 px-2 py-1 text-xs shadow-xl backdrop-blur",
											style: { left: menuPos.x, top: menuPos.y },
											onMouseLeave: () => setActiveMenu(null),
											menuRef,
											onClick: (e) => e.stopPropagation(),
										}),
										document.body,
									)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
