
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 * @param currentKcal 오늘 섭취한 칼로리
 * @param currentProtein 오늘 섭취한 단백질
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 가이드라인에 따라 process.env.API_KEY 사용
  const apiKey = process.env.API_KEY;

  // Vercel 환경에서 변수가 주입되지 않았거나 문자열 "undefined"로 들어오는 경우 체크
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Gemini API Key is missing in process.env");
    return "영양 분석 기능을 사용할 수 없습니다. Vercel 설정에서 'API_KEY'를 추가하고 반드시 [Redeploy]를 진행했는지 확인해 주세요. (해결되지 않는 경우 VITE_API_KEY로도 등록해 보세요.)";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  const prompt = `당신은 효정님의 전담 영양사입니다. 
효정님의 오늘 섭취량: 칼로리 ${currentKcal.toFixed(0)}kcal, 단백질 ${currentProtein.toFixed(1)}g. 
오늘의 목표: 1500kcal, 단백질 100g. 
남은 칼로리 한도 내에서 단백질을 보충할 수 있는 식재료나 메뉴 2가지를 다정하게 추천해주세요. 
답변은 3문장 이내로 짧고 명확하게 한국어로 작성해 주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    // response.text 속성을 사용하여 텍스트 추출
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    return "AI 분석 중 오류가 발생했습니다. API 키가 유효한지 확인해 주세요.";
  }
}
