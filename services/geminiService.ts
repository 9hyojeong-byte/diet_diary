
import { GoogleGenAI } from "@google/genai";

export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key가 설정되지 않았습니다.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `현재 사용자는 오늘 ${currentKcal.toFixed(0)}kcal, 단백질 ${currentProtein.toFixed(1)}g을 먹었어. 목표는 1500kcal와 단백질 100g이야. 남은 칼로리 범위 내에서 부족한 단백질을 채울 수 있는 구체적인 식재료나 메뉴를 2~3개 추천해줘. 간단하고 친절하게 효정님에게 말하듯 조언해줘.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 500,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error", error);
    return "영양 상태를 분석하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
