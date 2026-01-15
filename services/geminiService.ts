
import { GoogleGenAI } from "@google/genai";

/**
 * 런타임에 유효한 API 키를 철저히 검증하여 가져옵니다.
 * "undefined" 문자열이 박혀있는 경우를 걸러내고 전역 객체에서 재탐색합니다.
 */
function getVerifiedApiKey(): string | undefined {
  const g = globalThis as any;
  const isTrulyValid = (v: any) => 
    v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '';

  // 1. process.env['API_KEY'] 동적 접근 (가장 확실함)
  const dynamicEnvKey = g.process?.env?.['API_KEY'];
  if (isTrulyValid(dynamicEnvKey)) return dynamicEnvKey;

  // 2. window 객체 직접 확인
  const windowKey = g['API_KEY'] || (g.window && g.window['API_KEY']);
  if (isTrulyValid(windowKey)) return windowKey;

  // 3. (Fallback) 번들러에 의해 치환되었을 수도 있는 일반적인 접근
  try {
    const staticKey = process.env.API_KEY;
    if (isTrulyValid(staticKey)) return staticKey;
  } catch (e) {}

  return undefined;
}

/**
 * 쿠쿠님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  const apiKey = getVerifiedApiKey();
  
  if (!apiKey) {
    console.error("GeminiService: No API Key available.");
    return "API 키가 설정되지 않았습니다. Vercel 환경 변수에서 API_KEY가 제대로 등록되었는지 확인해 주세요.";
  }

  try {
    // 가이드라인 준수: new GoogleGenAI({ apiKey })
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `당신은 쿠쿠님의 다정한 전담 영양사입니다. 
쿠쿠님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: 1500kcal, 단백질 100g. 
남은 할당량 내에서 먹어야 하는 단백질의 양과 kcal를 먼저 숫자로 명시하고, 부족한 양이 없다면 부족함 없이 잘 챙겨 섭취했다는 내용의 칭찬 한마디를 해주세요.
부족한 양이 있다면 남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 1가지를 추천하고 응원 한 마디를 해주세요. 
답변은 다양한 이모지를 사용해서 한국어로 3문장 이내로 작성하세요.`;

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
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes('API_KEY_INVALID')) {
      return "유효하지 않은 API 키입니다. 키 설정을 다시 확인해 주세요.";
    }
    return "AI 분석 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.";
  }
}
