import { GoogleGenAI } from "@google/genai";

export async function getAIRecommendation(currentKcal: number, currentProtein: number): Promise<string | undefined> {
  // 1. 다양한 환경 변수 이름을 모두 체크하도록 수정 (Vite 우선)
  const apiKey = 
    import.meta.env.VITE_API_KEY || 
    process.env.VITE_API_KEY || 
    process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key가 없습니다. Vercel에서 VITE_API_KEY로 등록했는지 확인하세요.");
    return "API 키를 인식하지 못했습니다. Vercel 설정 후 재배포가 필요합니다.";
  }

  // 2. 위에서 찾은 apiKey를 사용해 초기화
  const genAI = new GoogleGenAI(apiKey);
  
  // 현재 가장 안정적인 모델명으로 설정
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


  const prompt = `당신은 효정님의 다정한 전담 영양사입니다. 
효정님의 현재 상태: 오늘 ${currentKcal.toFixed(0)}kcal 섭취, 단백질 ${currentProtein.toFixed(1)}g 섭취. 
일일 목표: 1500kcal, 단백질 100g. 
남은 할당량 내에서 부족한 단백질을 채울 수 있는 맛있는 메뉴 2가지를 추천하고 응원 한 마디를 해주세요. 
답변은 한국어로 3문장 이내로 작성하세요.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}