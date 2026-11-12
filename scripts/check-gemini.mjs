import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const apiKey = env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim();

if (!apiKey) {
  console.error("GEMINI_API_KEY가 없습니다.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

let lastError = "모델을 호출하지 못했습니다.";
for (const model of models) {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: "한 단어로만 대답해. 준비",
    });
    console.log(`${model}: ${response.text ?? "(빈 응답)"}`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lastError = message.replace(apiKey, "[key]");
    console.error(`${model}: ${lastError}`);
  }
}

process.exit(1);
