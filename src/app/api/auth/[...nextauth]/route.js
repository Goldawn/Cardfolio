// import NextAuth from "next-auth";
// import GoogleProvider from "next-auth/providers/google"; // ou GitHub, etc.
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { prisma } from "@/lib/prisma";

import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers