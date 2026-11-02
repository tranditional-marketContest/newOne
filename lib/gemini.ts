import "server-only";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"] as const;

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  }
  return new GoogleGenAI({ apiKey });
}

function statusOf(error: unknown) {
  if (typeof error === "object" && error && "status" in error) {
    return error.status;
  }
  return undefined;
}

export async function generateText(contents: string) {
  const ai = client();
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents });
      return response.text ?? "";
    } catch (error) {
      lastError = error;
      const status = statusOf(error);
      if (status !== 503 && status !== 429) throw error;
    }
  }

  throw lastError;
}
