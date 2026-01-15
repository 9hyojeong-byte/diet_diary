
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 * @param currentKcal 오늘 섭취한 칼로리
 * @param currentProtein 오늘 섭취한 단백질
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 가이드라인에 따라 process.env.API_KEY를 직접 사용하여 인스턴스 생성
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 기본 텍스트 태스크를 위한 최신 모델 사용
  const model = 'gemini-3-flash-preview';

  const prompt = `현재 사용자는 오늘 ${currentKcal.toFixed(0)}kcal, 단백질 ${currentProtein.toFixed(1)}g을 먹었어. 목표는 1500kcal와 단백질 100g이야. 남은 칼로리 범위 내에서 부족한 단백질을 채울 수 있는 구체적인 식재료나 메뉴를 2~3개 추천해줘. 간단하고 친절하게 효정님에게 말하듯 조언해줘.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });

    // response.text 속성을 직접 참조 (메소드 호출 아님)
    return response.text;
  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생:", error);
    return "영양 상태를 분석하는 중 오류가 발생했습니다. Vercel 설정에서 API_KEY가 정확히 등록되었는지, 그리고 배포(Redeploy)가 완료되었는지 확인해 주세요.";
  }
}
