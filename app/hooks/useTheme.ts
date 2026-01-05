"use client"

import { useState, useEffect } from "react"

type Theme = "light" | "dark"
type ColorTheme = "amber" | "blue" | "emerald" | "purple"

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => {
		// 只在客户端执行
		if (typeof window === "undefined") {
			return "light"
		}

		const savedTheme = localStorage.getItem("theme") as Theme
		if (savedTheme) {
			return savedTheme
		}
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
	})

	const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
		if (typeof window === "undefined") {
			return "amber"
		}
		const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme
		return savedColorTheme || "amber"
	})

	useEffect(() => {
		document.documentElement.classList.remove("light", "dark")
		document.documentElement.classList.add(theme)
		localStorage.setItem("theme", theme)
	}, [theme])

	useEffect(() => {
		document.documentElement.classList.remove("amber", "blue", "emerald", "purple")
		document.documentElement.classList.add(colorTheme)
		localStorage.setItem("colorTheme", colorTheme)
	}, [colorTheme])

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
	}

	const changeColorTheme = (color: ColorTheme) => {
		setColorTheme(color)
	}

	return {
		theme,
		toggleTheme,
		isDark: theme === "dark",
		colorTheme,
		changeColorTheme,
	}
}
