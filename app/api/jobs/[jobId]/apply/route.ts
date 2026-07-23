import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Application } from "../../../../generated/prisma/client";

type JobPageProps = {
    params: Promise<{ jobId: string }>; // Важно: params теперь Promise в новых версиях Next.js
};

export async function POST(request: Request, { params }: JobPageProps) {
    const session = await auth();

    if (!session?.user || !session?.user?.id) {
        return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
        const jobId = (await params).jobId; // Разворачиваем Promise

        const job = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
        });

        if (!job) {
            return new NextResponse("Job not found", { status: 404 });
        }

        const existingApplication = await prisma.application.findFirst({
            where: {
                jobId: jobId,
                userId: session.user.id,
            },
        });

        if (existingApplication) {
            return new NextResponse("You already have applied for this job", { status: 400 });
        }

        const application = await prisma.application.create({
            data: {
                jobId: jobId,
                userId: session.user.id,
                status: "PENDING",
            },
        });

        return NextResponse.json(application);
    } catch (err) {
        console.error("Error creating job: ", err);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
