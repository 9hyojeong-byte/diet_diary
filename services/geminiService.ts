
import { GoogleGenAI } from "@google/genai";

/**
 * 런타임에 유효한 API 키를 가져옵니다. 
 * 번들러가 process.env.API_KEY를 "undefined" 문자열로 치환한 경우를 대비합니다.
 */
function getSafeApiKey(): string | undefined {
  // 번들러의 정적 분석을 피하기 위해 대괄호 표기법 사용 고려 가능
  const env = (process as any).env || {};
  const key = env['API_KEY'];
  
  if (key && key !== "undefined" && key !== "null") {
    return key;
  }
  
  // 전역 객체에서 재확인
  const g = globalThis as any;
  const fallbackKey = g.API_KEY || (g.process?.env?.API_KEY);
  
  if (fallbackKey && fallbackKey !== "undefined" && fallbackKey !== "null") {
    return fallbackKey;
  }
  
  return undefined;
}

/**
 * 쿠쿠님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  const apiKey = getSafeApiKey();
  
  if (!apiKey) {
    return "API 키가 설정되지 않았습니다. 환경 변수를 확인해 주세요.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `당신은 쿠쿠님의 다정한 전담 영양사입니다. 
쿠쿠님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: 1500kcal, 단백질 100g. 
남은 할당량 내에서 먹어야 하는 단백질의 양과 kcal를 먼저 숫자로 명시하고, 부족한 양이 없다면 부족함 없이 잘 챙겨 섭취했다는 내용의 칭찬 한마디를 해주세요.
부족한 양이 있다면 남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 1가지를 추천하고 응원 한 마디를 해주세요. 
답변은 다양한 이모지를 사용해서 한국어로 3문장 이내로 작성하세요.`;

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
    return "AI 분석 중 오류가 발생했습니다. API 키나 네트워크 상태를 확인해 주세요.";
  }
}
