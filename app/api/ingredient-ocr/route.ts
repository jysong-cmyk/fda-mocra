import { NextResponse } from "next/server";

const MAX_BYTES = 15 * 1024 * 1024;

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

export async function POST(request: Request) {
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
      { error: "성분표 이미지(image) 파일이 필요합니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "이미지는 15MB 이하만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime =
    file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "This is a cosmetics ingredient label (INCI). List every ingredient name exactly as printed, one per line. Output only the ingredient list text — no headings, no explanations, no numbering.",
            },
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
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text = raw.choices?.[0]?.message?.content?.trim() ?? "";
  if (text === "") {
    return NextResponse.json(
      { error: "OCR 결과가 비어 있습니다. 더 선명한 이미지로 다시 시도해 주세요." },
      { status: 422 },
    );
  }

  return NextResponse.json({ text });
}
