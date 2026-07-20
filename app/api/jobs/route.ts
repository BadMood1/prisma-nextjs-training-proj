import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// если фронтенд сделает fetch("/api/jobs", { method: "POST" })
export async function POST(request: Request) {
    // Получаем текущую сессию пользователя на сервере.
    // auth() читает куки/JWT из запроса и возвращает:
    // - объект Session, если юзер залогинен
    // - null, если не залогинен
    const session = await auth();

    // Проверка авторизации — "охранник" перед основной логикой.
    // session?.user — если сессии нет (null), не упадём с ошибкой,
    // а просто получим undefined (опциональная цепочка ?.)
    //
    // session?.user?.id — дополнительно проверяем, что есть именно id юзера
    // (на случай если сессия есть, но почему-то без id — например,
    // если сломался jwt/session callback в auth.ts)
    if (!session?.user || !session?.user?.id) {
        // Если не авторизован — обрываем выполнение и редиректим
        // на страницу входа. new URL(...) собирает полный путь
        // (/auth/signin) на основе текущего домена запроса.
        return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
        const data = await request.json();

        const job = await prisma.job.create({
            data: {
                ...data,
                postedById: session.user.id,
            },
        });

        return NextResponse.json(job);
    } catch (err) {
        console.error("Error creating job: ", err);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: {
                postedAt: "desc",
            },
        });
        return NextResponse.json(jobs);
    } catch (err) {
        console.error("Error creating job: ", err);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
