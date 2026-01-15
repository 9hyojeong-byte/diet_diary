
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 가이드라인에 따라 process.env.API_KEY를 사용합니다.
  // Vite 환경에서는 빌드 시점에 대체되거나, index.tsx의 브릿지를 통해 window.process.env에서 가져옵니다.
  let apiKey = process.env.API_KEY;

  // 만약 process.env.API_KEY가 정의되지 않았다면 window 객체에서 직접 확인 (런타임 브릿지)
  if (!apiKey || apiKey === "undefined") {
    apiKey = (window as any).process?.env?.API_KEY;
  }

  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key is missing.");
    return "API 키를 인식하지 못했습니다. Vercel에서 VITE_API_KEY를 설정한 후 [Redeploy] 시 'Clear Cache' 옵션이 있다면 체크하고 다시 진행해 주세요.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  const prompt = `당신은 효정님의 다정한 전담 영양사입니다. 
효정님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: 1500kcal, 단백질 100g. 
남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 2가지를 추천하고 응원 한 마디를 해주세요. 
답변은 한국어로 3문장 이내로 작성하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
