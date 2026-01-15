
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 가이드라인에 따라 process.env.API_KEY를 직접 사용합니다.
  // index.tsx의 브릿지 로직 덕분에 브라우저에서도 이 값을 읽을 수 있습니다.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key is missing.");
    return "API 키를 인식하지 못했습니다. Vercel 설정에서 VITE_API_KEY가 등록되었는지 확인 후 Redeploy 해주세요.";
  }

  // 최신 SDK 방식: 인스턴스 생성 시 객체 형태로 전달
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `당신은 효정님의 다정한 전담 영양사입니다. 
효정님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: 1500kcal, 단백질 100g. 
남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 2가지를 추천하고 응원 한 마디를 해주세요. 
답변은 한국어로 3문장 이내로 작성하세요.`;

  try {
    // 최신 호출 방식: ai.models.generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // response.text는 메서드가 아니라 게터(Getter) 속성입니다.
    const text = response.text;
    
    if (!text) {
      return "AI가 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("API key not valid")) {
      return "설정된 API 키가 유효하지 않습니다.";
    }
    
    return "AI 분석 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.";
  }
}
