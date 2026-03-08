import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const metadataSchema = z.object({
  age_num: z.number().min(16).max(95),
  is_female: z.union([z.literal(0), z.literal(1)]),
  edu_num: z.number().min(1).max(5),
  sr_depression: z.union([z.literal(0), z.literal(1)]),
  sr_gad: z.union([z.literal(0), z.literal(1)]),
  sr_ptsd: z.union([z.literal(0), z.literal(1)]),
  sr_insomnia: z.union([z.literal(0), z.literal(1)]),
  sr_bipolar: z.union([z.literal(0), z.literal(1)]),
  sr_panic: z.union([z.literal(0), z.literal(1)]),
  sr_soc_anx_dis: z.union([z.literal(0), z.literal(1)]),
  sr_ocd: z.union([z.literal(0), z.literal(1)]),
  any_psych_sr: z.union([z.literal(0), z.literal(1)]),
  threshold_mode: z.enum(["balanced", "high_sensitivity"]).default("balanced"),
  transcript: z.string().max(1000).optional().default("")
});

function parseMetadata(raw: FormDataEntryValue | null) {
  if (!raw || typeof raw !== "string") {
    return { ok: false as const, error: "Missing metadata JSON payload" };
  }

  try {
    const parsedJson = JSON.parse(raw);
    const parsed = metadataSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: "Invalid metadata payload",
        details: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      };
    }

    return { ok: true as const, value: parsed.data };
  } catch {
    return { ok: false as const, error: "Metadata is not valid JSON" };
  }
}

export async function POST(request: Request) {
  const serviceBaseUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";

  try {
    const incoming = await request.formData();

    const rainbowAudio = incoming.get("rainbow_audio");
    const freeSpeechAudio = incoming.get("free_speech_audio");

    if (!(rainbowAudio instanceof File) || !(freeSpeechAudio instanceof File)) {
      return NextResponse.json(
        { error: "Both rainbow_audio and free_speech_audio files are required as multipart uploads." },
        { status: 400 }
      );
    }

    const metadataParsed = parseMetadata(incoming.get("metadata"));
    if (!metadataParsed.ok) {
      return NextResponse.json({ error: metadataParsed.error, details: metadataParsed.details ?? [] }, { status: 400 });
    }

    const outbound = new FormData();
    outbound.append("rainbow_audio", rainbowAudio, rainbowAudio.name || "rainbow.wav");
    outbound.append("free_speech_audio", freeSpeechAudio, freeSpeechAudio.name || "free_speech.wav");
    outbound.append("metadata", JSON.stringify(metadataParsed.value));

    const timeoutMs = Number(process.env.ML_SERVICE_TIMEOUT_MS || 60000);
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    const mlResponse = await fetch(`${serviceBaseUrl.replace(/\/$/, "")}/v1/analyze/phq`, {
      method: "POST",
      body: outbound,
      signal: abortController.signal
    }).finally(() => clearTimeout(timeout));

    const body = await mlResponse.json().catch(() => ({}));

    if (!mlResponse.ok) {
      const errorMessage =
        typeof body?.detail === "string"
          ? body.detail
          : typeof body?.error === "string"
            ? body.error
            : "Model service returned an error";
      return NextResponse.json(
        {
          error: errorMessage,
          details: Array.isArray(body?.details)
            ? body.details
            : body?.detail && typeof body.detail !== "string"
              ? [body.detail]
              : []
        },
        { status: mlResponse.status }
      );
    }

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: isAbort ? "Model service timed out" : "Model analysis proxy failed" },
      { status: isAbort ? 504 : 500 }
    );
  }
}
