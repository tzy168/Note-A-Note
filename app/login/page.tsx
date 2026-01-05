import type { Metadata } from "next"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
	title: "Login",
}

export default function Login() {
	return <LoginClient />
}
