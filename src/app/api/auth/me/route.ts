import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return NextResponse.json({ user });
}
