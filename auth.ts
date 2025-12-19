import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Email from "next-auth/providers/email";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import type { JWT } from "next-auth/jwt";
import * as bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import { logActivity } from "@/lib/activity-service";

// Define custom properties on the session and user objects
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      phone: string | null;
      isNewUser: boolean;
      lastLogin: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    isNewUser: boolean;
    lastLogin: Date | null;
  }
}

// Define custom properties on the JWT
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    isNewUser: boolean;
    lastLogin: Date | null;
  }
}

// ✅ CORRECT PATTERN FOR NEXTAUTH V4
// In NextAuth v4.24.7, NextAuth() returns handler directly usable as GET/POST
// Configure the base URL for callbacks
const baseUrl = process.env.NEXTAUTH_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // Magic links expire in 10 minutes
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user?.hashedPassword && (await bcrypt.compare(credentials.password, user.hashedPassword))) {
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName,
            phone: user.phone,
            isNewUser: user.isNewUser,
            lastLogin: user.lastLogin,
          };
        }
        
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      // When the user signs in, the `user` object from the database is passed.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.companyName = user.companyName;
        token.phone = user.phone;
        token.isNewUser = user.isNewUser;
        token.lastLogin = user.lastLogin;

        // Mark user as not new on first successful login and update lastLogin
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        if (user.isNewUser || !user.lastLogin) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isNewUser: false,
              lastLogin: new Date(),
            },
          });
          token.isNewUser = false;
          token.lastLogin = new Date();
          
          // Log activity for first login
          await logActivity(userId, 'login', { isFirstLogin: true });
        } else {
          // Log regular login activity
          await logActivity(userId, 'login', { isFirstLogin: false });
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // The `session` callback is called after the `jwt` callback.
      // We can transfer the custom properties from the token to the session.
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.companyName = token.companyName;
        session.user.phone = token.phone;
        session.user.isNewUser = token.isNewUser;
        session.user.lastLogin = token.lastLogin;

        // Combine firstName and lastName for the default `name` property
        session.user.name = [token.firstName, token.lastName]
          .filter(Boolean)
          .join(" ");
      }
      return session;
    },
  },
});

// ✅ NEXTAUTH V4 EXPORTS
// Export handler for GET/POST routes and wrap in a handlers object
export const handlers = {
  GET: handler,
  POST: handler,
};

// For server-side usage of auth()
export const auth = (handler as any).auth;

// For client-side redirects/actions
export const signIn = (handler as any).signIn;
export const signOut = (handler as any).signOut;
