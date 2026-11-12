/** 무료 한도를 오래 쓰기 위해 가벼운 모델부터 시도한다. */
export const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
] as const;

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

export function readGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  const content = (candidates[0] as { content?: { parts?: unknown[] } }).content;
  const parts = content?.parts ?? [];
  return parts
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const row = part as { text?: unknown; thought?: unknown };
      if (row.thought === true || typeof row.text !== "string") return "";
      return row.text;
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function generateGeminiContent(
  prompt: string,
  generationConfig?: Record<string, unknown>,
): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(generationConfig ? { generationConfig } : {}),
  });

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) continue;
      const payload: unknown = await response.json();
      const raw = readGeminiText(payload).trim();
      if (raw) return raw;
    } catch {
      continue;
    }
  }

  return null;
}

/** 홈 이벤트 배너 등 일반 텍스트 생성 (merge 브랜치용) */
export async function generateText(contents: string): Promise<string> {
  const text = await generateGeminiContent(contents);
  if (text == null) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않거나 Gemini 응답이 비었습니다.");
  }
  return text;
}

export async function generateGeminiJson(prompt: string): Promise<string | null> {
  const raw = await generateGeminiContent(prompt, { responseMimeType: "application/json" });
  return raw?.replace(/^```json\s*|```$/g, "").trim() ?? null;
}
