import NextAuth from "next-auth";
import Github from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// Создаём и экспортируем экземпляр NextAuth
export const { auth, handlers, signIn, signOut } = NextAuth({
    // Используем JWT вместо хранения сессии в базе данных.
    // Это быстрее и проще в масштабировании.
    session: {
        strategy: "jwt",
    },

    // Здесь мы подключаем GitHub как способ авторизации.
    // Можно добавить другие провайдеры (Google, Credentials и т.д.)
    providers: [Github],

    adapter: PrismaAdapter(prisma),

    // Это самые важные части. Здесь мы можем изменять данные токена и сессии.
    callbacks: {
        // --- jwt callback ---
        // Вызывается каждый раз, когда создаётся или обновляется JWT токен.
        // Здесь мы можем добавить свои данные в токен.
        async jwt({ token, user }) {
            // `user` существует только при первом входе (когда пользователь только что авторизовался)
            if (user) {
                // Добавляем id пользователя в токен
                token.id = user.id;
                // Можно добавить и другие данные (например роль)
                token.name = user.name;
            }

            // Обязательно возвращаем токен
            return token;
        },

        // --- session callback ---
        // Вызывается каждый раз, когда создаётся или обновляется сессия.
        // Здесь мы передаём данные из токена в объект session,
        // чтобы они были доступны на клиенте и в серверных компонентах.
        async session({ session, token }) {
            if (session.user) {
                // Добавляем id в сессию (по умолчанию его там нет)
                session.user.id = token.id as string;
                session.user.name = token.name as string;
            }

            return session;
        },
    },
});
