
import { GoogleGenAI } from "@google/genai";

/**
 * 빌드 도구의 정적 분석(Static Analysis)을 완전히 회피하여 실제 API 키를 가져옵니다.
 * 이 함수는 process.env.API_KEY 라는 문구를 직접 사용하지 않습니다.
 */
function getDynamicApiKey(): string | undefined {
  const g = globalThis as any;
  const isTrulyValid = (v: any) => 
    v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '';

  // 1. 전역 객체에 직접 박힌 값 확인 (index.tsx의 브릿지가 설정한 값)
  if (isTrulyValid(g['API_KEY'])) return g['API_KEY'];
  
  // 2. process.env를 대괄호로 접근하여 빌드 타임 치환 방지
  const env = g.process?.env || {};
  if (isTrulyValid(env['API_KEY'])) return env['API_KEY'];
  if (isTrulyValid(env['VITE_API_KEY'])) return env['VITE_API_KEY'];

  // 3. window 객체 확인
  if (g.window && isTrulyValid(g.window['API_KEY'])) return g.window['API_KEY'];

  return undefined;
}

/**
 * 쿠쿠님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  const apiKey = getDynamicApiKey();
  
  if (!apiKey) {
    console.error("GeminiService: API Key is missing or string 'undefined'.");
    return "API 키를 찾을 수 없습니다. Vercel 설정에서 API_KEY가 등록되었는지, 혹은 VITE_API_KEY로 등록되었는지 확인해 주세요.";
  }

  try {
    // 런타임에 확보한 apiKey를 직접 주입
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

    return response.text || "AI가 답변을 생성하지 못했습니다.";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    return "AI 분석 중 오류가 발생했습니다. 키 유효성이나 네트워크를 확인해 주세요.";
  }
}
