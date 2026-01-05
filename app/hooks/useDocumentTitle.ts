"use client"

import { useEffect, useState } from "react"

export function useTitle(title: string) {
	const [titleState, setTitle] = useState(title)
	useEffect(() => {
		document.title = title
		return () => {
			document.title = "Note A Note"
		}
	}, [title])
}
