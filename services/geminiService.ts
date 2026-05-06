
import { GoogleGenAI } from "@google/genai";
import { DailySummary, MealRecord, MealStatus, ActivityLog, HealthDiary } from "../types";

/**
 * 쿠쿠님의 현재 영양 섭취 상태와 활동량을 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(
  summary: DailySummary,
  meals: MealRecord[],
  targetKcal: number,
  targetProtein: number,
  activity?: ActivityLog,
  diary?: HealthDiary
): Promise<string | undefined> {
  // Use VITE_API_KEY from environment variables (e.g., Vercel), fallback to process.env.API_KEY
  const apiKey = import.meta.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("GeminiService: API Key is missing in environment variables.");
    return "AI 분석을 위한 설정을 확인해 주세요.";
  }

  try {
    // Initializing the SDK with the retrieved API key
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Filter only actual meals
    const actualMeals = meals.filter(m => m.status === MealStatus.ACTUAL);
    
    // Create a string representation of meals
    const mealListStr = actualMeals.length > 0 
      ? actualMeals.map(m => `- ${m.type} (${m.time}): ${m.ingredient_name || '알 수 없는 식재료'} ${m.amount}g (${Math.round(m.kcal)}kcal)`).join('\n')
      : '아직 섭취한 식단이 없습니다.';

    // Calculate TEF and TDEE
    const tef = Math.round(summary.actual.kcal * 0.1);
    const totalActivityExpended = activity ? Math.round(activity.total_calories) : 0;
    const finalTDEE = totalActivityExpended + tef;

    const activityStr = activity 
      ? `- 걸음 수: ${activity.steps.toLocaleString()}보\n- 활동 칼로리: ${activity.active_calories}kcal\n- TEF (식이발열효과): ${tef}kcal\n- 총 소모 칼로리: ${totalActivityExpended}kcal\n- 최종 총 소모 칼로리 (TDEE): ${finalTDEE}kcal`
      : '오늘의 활동 기록이 아직 없습니다.';

    const diaryStr = diary && diary.content.trim()
      ? `- 건강 일기 내용: ${diary.content}`
      : '오늘 작성된 건강 일기가 없습니다.';

    const prompt = `너는 건강관리 및 다이어트 코치야. 
현재 다이어트 중인 나(현재 10kg을 빼야함.)에게 오늘 먹은 식단과 활동량이 적절했는지 평가해줘.
나는 건강하게 지속적인 다이어트를 진행하고자 해. 한 달에 2kg정도씩 감량하는게 목표야. 
말투는 친한 동생이 친한 누나에게 조언하듯 다정하고 친근하게 해주고, 칭찬을 듬뿍 곁들여줘. 사랑스러운 이모티콘을 많이 사용해줘.
목표한 다이어트를 위한 운동량이 부족해보인다면 그에 대해서도 언급 및 조언을 해줘. 
금지 할 것 : 체중감량목표치 언급

[오늘의 섭취 현황]
- 일일 목표: ${targetKcal}kcal, 단백질 ${targetProtein}g
- 총 섭취량: ${Math.round(summary.actual.kcal)}kcal
- 탄수화물: ${Math.round(summary.actual.carbs)}g
- 단백질: ${Math.round(summary.actual.protein)}g
- 지방: ${Math.round(summary.actual.fat)}g

[오늘 먹은 식단]
${mealListStr}

[오늘의 활동 및 소모 현황]
${activityStr}

[오늘의 건강 일기]
${diaryStr}

위 내용을 바탕으로 오늘 식단과 운동이 어땠는지(특히 최종 총 소모 칼로리 TDEE를 고려해서!), 남은 할당량 내에서 추가로 먹으면 좋을 메뉴 추천이나 응원의 말을 3~4문장 이내로 작성해줘.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access the extracted text output directly via the .text property.
    return response.text || "AI가 답변을 생성하지 못했습니다.";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

export async function analyzeActivityImage(base64Image: string): Promise<{ steps: number, active_calories: number, total_calories: number } | null> {
  const apiKey = import.meta.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("GeminiService: API Key is missing.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `이 이미지는 운동 기록(걸음수, 칼로리 소모량 등)이 포함된 스크린샷이야.
이미지에서 다음 정보를 찾아줘:
1. 걸음수 (steps)
2. 활동 칼로리 (active calories)
3. 총 칼로리 소모량 (total calories)

결과는 반드시 다음과 같은 JSON 형식으로만 응답해줘. 다른 설명은 하지 마.
{
  "steps": 숫자,
  "active_calories": 숫자,
  "total_calories": 숫자
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      steps: Number(result.steps) || 0,
      active_calories: Number(result.active_calories) || 0,
      total_calories: Number(result.total_calories) || 0
    };
  } catch (error) {
    console.error("Gemini Activity Analysis Error:", error);
    return null;
  }
}

export async function analyzeMealDescription(description: string): Promise<{ name: string, carbs: number, protein: number, fat: number } | null> {
  const apiKey = import.meta.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("GeminiService: API Key is missing.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `사용자가 입력한 식단 설명을 바탕으로 영양 성분(탄수화물, 단백질, 지방)을 추산하고, 식단 이름을 10자 내외로 요약해줘.
설명: "${description}"

결과는 반드시 다음과 같은 JSON 형식으로만 응답해줘. 다른 설명은 하지 마.
{
  "name": "요약된 식단 이름",
  "carbs": 숫자(g),
  "protein": 숫자(g),
  "fat": 숫자(g)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      name: result.name || description.slice(0, 10),
      carbs: Number(result.carbs) || 0,
      protein: Number(result.protein) || 0,
      fat: Number(result.fat) || 0
    };
  } catch (error) {
    console.error("Gemini Meal Analysis Error:", error);
    return null;
  }
}
