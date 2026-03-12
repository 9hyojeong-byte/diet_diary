
import { GoogleGenAI } from "@google/genai";

/**
 * 쿠쿠님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number, targetKcal: number, targetProtein: number): Promise<string | undefined> {
  // Always obtain the API key exclusively from process.env.API_KEY.
  if (!process.env.API_KEY) {
    console.error("GeminiService: API Key is missing in process.env.");
    return "AI 분석을 위한 설정을 확인해 주세요.";
  }

  try {
    // Initializing the SDK with process.env.API_KEY directly as a named parameter.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `당신은 쿠쿠님의 다정한 전담 영양사입니다. 
쿠쿠님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: ${targetKcal}kcal, 단백질 ${targetProtein}g. 
남은 할당량 내에서 먹어야 하는 단백질의 양과 kcal를 먼저 숫자로 명시하고, 부족한 양이 없다면 부족함 없이 잘 챙겨 섭취했다는 내용의 칭찬 한마디를 해주세요.
부족한 양이 있다면 남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 1가지를 추천하고 응원 한 마디를 해주세요. 
답변은 다양한 이모지를 사용해서 한국어로 3문장 이내로 작성하세요.`;

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
