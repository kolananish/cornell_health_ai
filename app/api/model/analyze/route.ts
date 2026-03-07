import { NextResponse } from "next/server";
import { formatTerminalAnalysis } from "@/lib/ml/log-format";
import { runModelInference } from "@/lib/ml/model-runtime";
import { modelAnalyzeRequestSchema } from "@/lib/schemas/model-input";

export const runtime = "nodejs";

const MAX_CONTENT_LENGTH = 180_000;

function makeRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `ana-${Date.now()}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const contentLengthRaw = request.headers.get("content-length");
    const contentLength = contentLengthRaw ? Number(contentLengthRaw) : 0;

    if (contentLength && Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const json = await request.json();
    const parsed = modelAnalyzeRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid analysis payload",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            code: issue.code,
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const requestId = makeRequestId();
    const result = runModelInference(parsed.data, requestId);

    console.info(formatTerminalAnalysis(parsed.data, result));

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Model analysis failed" }, { status: 500 });
  }
}
