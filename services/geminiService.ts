
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  /**
   * 가이드라인에 따라 process.env.API_KEY를 사용합니다.
   * Vite 빌드 도구가 이 코드를 "undefined" 문자열로 치환하는 것을 방지하기 위해 
   * 런타임 체크 로직을 강화합니다.
   */
  let apiKey = process.env.API_KEY;

  // 만약 빌드 타임에 "undefined" 문자열로 박혔거나 실제 undefined라면 window 객체에서 재확인
  if (!apiKey || apiKey === "undefined") {
    apiKey = (window as any).process?.env?.API_KEY;
  }

  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key is missing even after runtime check.");
    return "API 키를 인식하지 못했습니다. Vercel 설정에서 [VITE_API_KEY]를 다시 확인하고, 수정 후 'Redeploy' (기존 빌드 캐시 무시)를 진행해 주세요.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `당신은 효정님의 다정한 전담 영양사입니다. 
효정님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: 1500kcal, 단백질 100g. 
남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 2가지를 추천하고 응원 한 마디를 해주세요. 
답변은 한국어로 3문장 이내로 작성하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    
    if (!text) {
      return "AI가 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("API key not valid")) {
      return "설정된 API 키가 유효하지 않습니다. 키 값을 다시 확인해 주세요.";
    }
    
    return "AI 분석 중 오류가 발생했습니다. (네트워크 또는 서버 이슈)";
  }
}
