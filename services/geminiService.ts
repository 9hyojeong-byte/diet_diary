
import { GoogleGenAI } from "@google/genai";

/**
 * 효정님의 현재 영양 섭취 상태를 기반으로 Gemini AI 추천을 가져옵니다.
 * @param currentKcal 오늘 섭취한 칼로리
 * @param currentProtein 오늘 섭취한 단백질
 */
export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 가이드라인에 따라 process.env.API_KEY를 직접 사용하여 인스턴스 생성
  // 이 값은 빌드 프로세스(Vercel/Vite 등)에 의해 실제 키 값으로 치환되어야 합니다.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 텍스트 태스크를 위한 최신 모델 설정
  const model = 'gemini-3-flash-preview';

  const prompt = `당신은 영양사입니다. 사용자가 오늘 ${currentKcal.toFixed(0)}kcal를 섭취했고, 단백질은 ${currentProtein.toFixed(1)}g을 먹었습니다. 
오늘의 목표는 1500kcal, 단백질 100g입니다. 
남은 칼로리 한도 내에서 부족한 단백질을 보충할 수 있는 구체적인 식재료나 메뉴를 2~3개 추천해주세요. 
사용자 이름은 '효정'님이며, 친절하고 다정하게 조언해주세요. 
답변은 3문장 이내로 짧고 명확하게 해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    // response.text는 속성이므로 바로 참조합니다.
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Vercel 배포 후 키가 인식되지 않을 경우를 위한 상세 안내
    return "분석 기능을 호출할 수 없습니다. Vercel 설정에서 API_KEY를 추가하신 후, 반드시 [Deployments] 탭에서 [Redeploy]를 클릭하여 다시 배포해 주셔야 합니다.";
  }
}
