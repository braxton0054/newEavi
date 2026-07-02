import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const structure = await prisma.feeStructure.findUnique({
      where: { id },
    });

    if (!structure) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (structure.pdfData) {
      return new NextResponse(new Uint8Array(structure.pdfData), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${structure.name}.pdf"`,
        },
      });
    }

    if (structure.url) {
      return NextResponse.redirect(structure.url);
    }

    return NextResponse.json({ error: "No PDF data available" }, { status: 404 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
