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

아래 [MOCRA 핵심 분류 원칙]과 [다양한 제형별 모범 답안 예시]를 반드시 참고해, 세럼·앰플·스크럽·패치 등 다양한 용어가 들어와도 일관되게 판단해라.

[MOCRA 핵심 분류 원칙]

기능 우선의 법칙 (Function First): 제품명이나 설명에 클렌징(세안/세정), 보습(수분공급), 자외선 차단, 제모, 염색 등의 명확한 '기능'이 있다면, 사용 부위(얼굴/몸)를 따지기 전에 무조건 해당 기능 카테고리(예: Cleansing, Moisturizing, Suntan preparations 등)를 1순위로 선택하라. (이 경우 소분류는 보통 'Not applicable'이 된다.)

부위 및 사용 방식은 후순위: 명확한 기능(클렌징, 보습 등)에 속하지 않는 일반적인 영양/관리 제품(예: 단순 스킨, 토너, 앰플 등)일 경우에만 'Face and neck' 또는 'Body and hand' 같은 부위 카테고리로 가며, 이때 씻어내는지(Rinse-off) 바르고 두는지(Leave-on)를 판단하라.

다양한 K-뷰티 용어 해석 가이드:
- 세럼, 앰플, 에센스 ➔ 주로 수분/보습이 목적이면 'Moisturizing', 기능성이 복합적이면 'Face and neck > Leave-on'으로 분류.
- 스크럽, 필링, 클렌징 오일/워터 ➔ 무조건 'Cleansing' 또는 몸 전용일 경우 'Personal cleanliness > Bath soaps and body washes'.
- 패치(마스크팩 아님, 국소부위용) ➔ 'Face and neck > Leave-on' 또는 'Other skin care preparations'.
- 바디 오일/로션 ➔ 'Body and hand > Leave-on' 또는 'Moisturizing'.

[다양한 제형별 모범 답안 예시 (Few-shot)]
예시 1) 사용자 입력: "히알루론산 수분 앰플"
응답: {"reasoning": "제품의 핵심 목적이 수분 공급이므로 기능 우선 법칙에 따라 정확히 일치하는 Moisturizing 카테고리를 선택합니다.", "category1": "(14) Skin care preparations, (creams, lotions, powder, and sprays).", "category2": "(f) Moisturizing.", "category3": "Not applicable"}

예시 2) 사용자 입력: "블랙헤드 클렌징 오일"
응답: {"reasoning": "세안용 클렌징 제품이므로 기능 우선 법칙에 따라 명시적인 Cleansing 카테고리를 선택합니다.", "category1": "(14) Skin care preparations, (creams, lotions, powder, and sprays).", "category2": "(a) Cleansing (cold creams, cleansing lotions, liquids, and pads).", "category3": "Not applicable"}

예시 3) 사용자 입력: "바디 스크럽"
응답: {"reasoning": "몸의 각질을 제거하고 세정하는 목적이므로 Personal cleanliness의 바디워시 카테고리를 선택합니다.", "category1": "(12) Personal cleanliness.", "category2": "(a) Bath soaps and body washes.", "category3": "Not applicable"}

예시 4) 사용자 입력: "비타민C 화이트닝 세럼"
응답: {"reasoning": "특정 보습이나 클렌징이 아닌 일반적인 얼굴용 영양/기초 제품이므로 Face and neck 카테고리를 선택하며, 씻어내지 않으므로 Leave-on을 선택합니다.", "category1": "(14) Skin care preparations, (creams, lotions, powder, and sprays).", "category2": "(c) Face and neck (excluding shaving preparations).", "category3": "1. Leave-on."}

예시 5) 사용자 입력: "트러블 진정 패치"
응답: {"reasoning": "국소 부위에 붙이는 스킨케어 제품이므로 Other skin care preparations로 분류하며, 떼어낼 때까지 피부에 두므로 Leave-on을 선택합니다.", "category1": "(14) Skin care preparations, (creams, lotions, powder, and sprays).", "category2": "(j) Other skin care preparations.", "category3": "1. Leave-on."}

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
