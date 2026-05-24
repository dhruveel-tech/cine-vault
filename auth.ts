import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import clientPromise from "@/lib/db";
import dbConnect from "@/lib/mongodb";
import { signInSchema } from "@/lib/validations/auth";
import User from "@/models/User";

type AppRole = "user" | "writer" | "moderator" | "admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase() })
          .select("+passwordHash name email avatar image role")
          .lean();

        if (!user || !user.passwordHash) return null;

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar || user.image,
          role: (user.role ?? "user") as AppRole
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: AppRole }).role ?? "user") as AppRole;
      }

      if (token.email && !token.role) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email })
          .select("role")
          .lean();
        token.role = (dbUser?.role ?? "user") as AppRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = (token.role ?? "user") as AppRole;
      }

      return session;
    }
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      await dbConnect();
      await User.updateOne(
        { email: user.email.toLowerCase() },
        {
          $set: {
            name: user.name,
            image: user.image,
            avatar: user.image
          },
          $setOnInsert: {
            role: "user"
          }
        },
        { upsert: true }
      );
    }
  }
});
