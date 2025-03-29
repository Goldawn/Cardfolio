"use client"

import { signIn } from "next-auth/react"

const Login = () => {
  return (
    <div>
        <button onClick={() => signIn("github", { redirectTo: "/" })}>
            Sign in with GitHub
        </button>

        <button onClick={() => signIn("google", { redirectTo: "/" })}>
            Sign in with Google
        </button>
    </div>
  )
}

export default Login