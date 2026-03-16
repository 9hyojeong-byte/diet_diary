
import { GoogleGenAI } from "@google/genai";
import { DailySummary, MealRecord, MealStatus } from "../types";

/**
 * 쿠쿠님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(
  summary: DailySummary,
  meals: MealRecord[],
  targetKcal: number,
  targetProtein: number
): Promise<string | undefined> {
  // Use VITE_API_KEY from environment variables (e.g., Vercel), fallback to process.env.API_KEY
  const apiKey = import.meta.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("GeminiService: API Key is missing in environment variables.");
    return "AI 분석을 위한 설정을 확인해 주세요.";
  }

  try {
    // Initializing the SDK with the retrieved API key
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Filter only actual meals
    const actualMeals = meals.filter(m => m.status === MealStatus.ACTUAL);
    
    // Create a string representation of meals
    const mealListStr = actualMeals.length > 0 
      ? actualMeals.map(m => `- ${m.type} (${m.time}): ${m.ingredient_name || '알 수 없는 식재료'} ${m.amount}g (${Math.round(m.kcal)}kcal)`).join('\n')
      : '아직 섭취한 식단이 없습니다.';

    const prompt = `너는 건강관리 및 다이어트 코치야. 
현재 다이어트 중인 나(키 171cm, 체중 74kg, 목표체중 65kg)에게 오늘 먹은 식단이 적절했는지 평가해줘.
말투는 친한 동생이 친한 누나에게 조언하듯 다정하고 친근하게 해주고, 칭찬을 듬뿍 곁들여줘. 사랑스러운 이모티콘을 많이 사용해줘.

[오늘의 섭취 현황]
- 일일 목표: ${targetKcal}kcal, 단백질 ${targetProtein}g
- 총 섭취량: ${Math.round(summary.actual.kcal)}kcal
- 탄수화물: ${Math.round(summary.actual.carbs)}g
- 단백질: ${Math.round(summary.actual.protein)}g
- 지방: ${Math.round(summary.actual.fat)}g

[오늘 먹은 식단]
${mealListStr}

위 내용을 바탕으로 오늘 식단이 어땠는지, 남은 할당량 내에서 추가로 먹으면 좋을 메뉴 추천이나 응원의 말을 3~4문장 이내로 작성해줘.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access the extracted text output directly via the .text property.
    return response.text || "AI가 답변을 생성하지 못했습니다.";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
