import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from 'bcrypt';
import { sql } from "@vercel/postgres";
import { User } from '@/app/lib/definitions';

async function getUser(email: string) {
    try {
        const users = await sql<User>`SELECT * from users WHERE email = ${email} `;
        return users.rows[0];
    } catch (error) {
        console.log('Failed to get user by email:', error);
        throw new Error('Failed to fetch user.')
    }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
        async authorize(credentials) {
            const parsedCredentials = z
            .object({
                email: z.string().email(),
                password: z.string().min(6)
            })
            .safeParse(credentials);

            if (parsedCredentials.success) {
                const {email, password} = parsedCredentials.data;
                const user = await getUser(email);
                if (!user) {
                    return null;
                }
                const passwordsMatch = await bcrypt.compare(password, user.password);
                if (passwordsMatch) {
                    return user;
                }
            }
            return null;
        },
    })
],
});
