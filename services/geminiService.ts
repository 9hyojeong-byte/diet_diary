
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 가이드라인에 따라 process.env.API_KEY를 직접 사용합니다.
  // index.tsx에서 수행한 브리징 덕분에 브라우저에서도 이 값을 읽을 수 있습니다.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("Critical: API_KEY is missing in the browser environment.");
    return "API 키를 찾을 수 없습니다. Vercel에서 VITE_API_KEY와 API_KEY를 모두 설정한 후 반드시 'Redeploy'를 해주세요.";
  }

  // 매 호출 시 최신 키를 사용하도록 인스턴스 생성
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
    if (error.message?.includes("API key not valid")) {
      return "설정된 API 키가 유효하지 않습니다. Google AI Studio에서 키를 새로 발급받아 Vercel에 업데이트해 주세요.";
    }
    return "AI 분석 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
