import {
  INGREDIENT_UPLOAD_MIME_WHITELIST,
  MAX_INGREDIENT_FILE_BYTES,
  MAX_INGREDIENT_FILE_SIZE_MB,
} from "@/lib/apply/types-and-constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** Vercel Pro 등: 기본 10s 한도 완화 (플랜별 상한은 Vercel 정책 따름) */
export const maxDuration = 60;

const INGREDIENT_SYSTEM_KO = [
  "당신은 화장품 성분 분석 전문가입니다. 제공된 이미지에서 오직 '화장품 성분명(국문 또는 영문)'만 추출하십시오.",
  "사용 시 주의사항, 회사 정보, 마케팅 문구, 바코드 번호 등 성분이 아닌 모든 텍스트는 절대 포함하지 마십시오.",
  "추출된 성분명들은 쉼표(,)로 구분된 깔끔한 텍스트 형태로만 반환하십시오. 다른 설명이나 인사말은 절대 추가하지 마십시오.",
].join("\n");

const USER_VISION_KO =
  "위 이미지에서 지시에 따라 화장품 성분명만 추출하여, 쉼표(,)로만 구분한 한 덩어리의 텍스트로만 답하십시오.";

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

function resolveEffectiveMime(file: File, buf: Buffer): string {
  const declared = (file.type ?? "").trim().toLowerCase();
  if (INGREDIENT_UPLOAD_MIME_WHITELIST.has(declared)) {
    return declared === "image/jpg" ? "image/jpeg" : declared;
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  return declared;
}

function isAllowedIngredientMime(mime: string): boolean {
  return INGREDIENT_UPLOAD_MIME_WHITELIST.has(mime);
}

function normalizeModelIngredientOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```[a-z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
  s = s.replace(/\s*[\r\n]+\s*/g, ", ");
  s = s.replace(/，/g, ",");
  s = s.replace(/\s*,\s*/g, ", ");
  s = s.replace(/,{2,}/g, ", ");
  return s.replace(/\s{2,}/g, " ").trim();
}

async function openaiExtractFromImage(
  apiKey: string,
  dataUrl: string,
): Promise<string> {
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: INGREDIENT_SYSTEM_KO },
        {
          role: "user",
          content: [
            { type: "text", text: USER_VISION_KO },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  const raw = (await openaiRes.json()) as OpenAIChatResponse;
  if (!openaiRes.ok) {
    const msg =
      raw.error?.message ??
      (typeof raw === "object" ? JSON.stringify(raw) : "OpenAI request failed");
    throw new Error(msg);
  }
  return raw.choices?.[0]?.message?.content?.trim() ?? "";
}

function backendFatalDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message !== "" ? error.message : error.toString();
  }
  if (typeof error === "string") return error;
  try {
    return String(error);
  } catch {
    return "알 수 없는 오류";
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey == null || apiKey === "") {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "성분표 파일(image 필드)이 필요합니다." },
        { status: 400 },
      );
    }
    if (file.size > MAX_INGREDIENT_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `파일은 ${MAX_INGREDIENT_FILE_SIZE_MB}MB 이하만 업로드할 수 있습니다.`,
        },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const effectiveMime = resolveEffectiveMime(file, buf);

    if (!isAllowedIngredientMime(effectiveMime)) {
      return NextResponse.json(
        {
          error: "PNG, JPEG, JPG 형식만 업로드할 수 있습니다.",
        },
        { status: 400 },
      );
    }

    let modelRaw = "";

    try {
      const mimeForDataUrl =
        effectiveMime === "image/jpg" ? "image/jpeg" : effectiveMime;
      const dataUrl = `data:${mimeForDataUrl};base64,${buf.toString("base64")}`;
      modelRaw = await openaiExtractFromImage(apiKey, dataUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OpenAI request failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const text = normalizeModelIngredientOutput(modelRaw);
    if (text === "") {
      return NextResponse.json(
        {
          error:
            "성분 추출 결과가 비었습니다. 더 선명한 파일로 다시 시도해 주세요.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error("OCR API 백엔드 치명적 오류:", error);
    return NextResponse.json(
      { error: `백엔드 상세 오류: ${backendFatalDetail(error)}` },
      { status: 500 },
    );
  }
}
