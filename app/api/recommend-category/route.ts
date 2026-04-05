import { NextResponse } from "next/server";
import {
  getFdaCategoryPaths,
  type FdaCategoryPath,
} from "@/app/fdaCategories";

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1] != null) return fence[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function isPathInList(
  c1: string,
  c2: string,
  c3: string,
  paths: FdaCategoryPath[],
): boolean {
  return paths.some(
    (p) => p.category1 === c1 && p.category2 === c2 && p.category3 === c3,
  );
}

function buildSystemPrompt(validPathsJson: string): string {
  return `너는 미국 FDA MoCRA 화장품 카테고리 전문가다. 사용자의 검색어를 보고 즉시 카테고리를 고르지 마라.

반드시 1) 해당 품목에 대한 미국 FDA MoCRA 규정, 2) 미국 시장에 등록된 유사/경쟁 화장품들의 실제 카테고리 등록 사례(Precedents)를 먼저 분석해라.

그 분석 결과를 바탕으로, 아래 제공된 [유효한 카테고리 조합 목록]에 정확히 100% 일치하는 세트 딱 1개만 찾아내라.

응답은 반드시 JSON 형태여야 하며 구조는 { "reasoning": "규정 및 사례 분석 내용", "category1": "...", "category2": "...", "category3": "..." } 로 작성해. category1, category2, category3 문자열은 목록에 나온 값과 토씨 하나도 다르지 않게 복사해야 한다.

[유효한 카테고리 조합 목록]
${validPathsJson}`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey == null || apiKey === "") {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query =
    typeof body === "object" &&
    body !== null &&
    "query" in body &&
    typeof (body as { query: unknown }).query === "string"
      ? (body as { query: string }).query.trim()
      : "";

  if (query === "") {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  const validPaths = getFdaCategoryPaths();
  const validPathsJson = JSON.stringify(validPaths);
  const systemContent = buildSystemPrompt(validPathsJson);

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: `다음 검색어에 가장 알맞은 카테고리 조합 1개만 골라 JSON으로 답해:\n\n${query}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
    }),
  });

  const raw = (await openaiRes.json()) as OpenAIChatResponse;

  if (!openaiRes.ok) {
    const msg = raw.error?.message ?? "OpenAI request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const content = raw.choices?.[0]?.message?.content;
  if (content == null || content === "") {
    return NextResponse.json(
      { error: "Empty response from OpenAI." },
      { status: 502 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(content));
  } catch {
    return NextResponse.json(
      { error: "Failed to parse category JSON from model output." },
      { status: 502 },
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    return NextResponse.json(
      { error: "Invalid category JSON shape from model." },
      { status: 502 },
    );
  }

  const rec = parsed as Record<string, unknown>;

  if (
    typeof rec.reasoning !== "string" ||
    typeof rec.category1 !== "string" ||
    typeof rec.category2 !== "string" ||
    typeof rec.category3 !== "string"
  ) {
    return NextResponse.json(
      { error: "Model JSON must include reasoning and category1–3 strings." },
      { status: 502 },
    );
  }

  const category1 = rec.category1;
  const category2 = rec.category2;
  const category3 = rec.category3;

  if (!isPathInList(category1, category2, category3, validPaths)) {
    return NextResponse.json(
      {
        error:
          "모델이 반환한 카테고리 조합이 유효한 경로 목록에 없습니다. 다시 검색해 주세요.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ category1, category2, category3 });
}
