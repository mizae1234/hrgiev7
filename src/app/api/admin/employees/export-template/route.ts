import { NextResponse } from "next/server";
import { generateEmployeeTemplate } from "@/lib/excel";

export async function GET() {
  try {
    const buffer = generateEmployeeTemplate();
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Employee_Import_Template.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Export template error:", error);
    return NextResponse.json({ error: "Failed to generate Excel template" }, { status: 500 });
  }
}
