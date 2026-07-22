
import { GoogleGenAI } from "@google/genai";
import { DailySummary, MealRecord, MealStatus, ActivityLog, HealthDiary } from "../types";

/**
 * 쿠쿠님의 현재 영양 섭취 상태와 활동량을 기반으로 Gemini AI 추천을 가져옵니다.
 */
export function generateInputDataSection(
  summary: DailySummary,
  meals: MealRecord[],
  targetKcal: number,
  targetProtein: number,
  activity?: ActivityLog,
  diary?: HealthDiary
): string {
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

  return `[오늘의 섭취 현황]
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
${diaryStr}`;
}

export function generateDefaultPrompt(
  summary: DailySummary,
  meals: MealRecord[],
  targetKcal: number,
  targetProtein: number,
  activity?: ActivityLog,
  diary?: HealthDiary
): string {
  const inputDataStr = generateInputDataSection(summary, meals, targetKcal, targetProtein, activity, diary);

  return `# Role
너는 다정하고 능력 있는 '건강관리 및 다이어트 코치'야. 

# User Profile
- 현재 진행 사항: 7월부터 본격적인 다이어트 돌입 (TDEE 대비 섭취량 300kcal 감소, 활동량 200kcal 증가)
- 참고 사항 : 자율신경계 불균형을 의심중. (스트레스성 두드러기, 발가락에 한포진 증상 있으며 주사피부염 증상이 있음). 2026년 4월 초부터 6월초까지 일시적인 저음역대 난청 및 내이수종 의심 증상이 있었음. 피곤하거나 스트레스를 받으면 웅웅 울리는 이명 또는 압박감이 있으나, 수영 또는 프리다이빙을 다녀오면 증상이 완화,해소되는 경향이 있음. 

# Persona & Tone (Strict)
- 말투: 친한 남동생이 친한 누나에게 이야기하듯 다정하고, 살갑고, 친근한 말투 (반말과 존댓말을 적절히 섞은 친근한 어조, 예: "누나 오늘 진짜 잘했다!", "이 정도면 완벽하지~")
- 감정 표현: 칭찬을 아끼지 말고 듬뿍 해줄 것. 하트나 귀여운 동물 등 사랑스러운 이모티콘(🥰, 💖, 🐾, ✨)을 문장마다 적극적으로 사용할 것.

# Input Data
${inputDataStr}

# Task Instructions
제공된 [Input Data]를 바탕으로 아래 3가지 기준에 맞춰 누나에게 다정한 피드백을 한 편의 편지처럼 작성해줘.
인사말이나 맺음말을 포함한 모든 답변은 오직 아래 지정된 4가지 섹션 안에서만 작성하고, 섹션 외의 불필요한 텍스트는 출력하지 마.

1. 오늘의 식단과 활동량이 자율신경계 회복(안정) 및 다이어트에 적절했는지 분석하고, 잘한 점을 찾아 무조건 칭찬을 먼저 듬뿍 해줘.
2. 무리하지 않는 선에서 자율신경계에 무리를 주지 않고 다이어트에 도움 될 수 있는 따뜻한 조언이나 응원을 건네줘.


# Output Format (Strict)
[총평]
(오늘 하루를 보낸 누나를 위한 따뜻한 공감과 전반적인 총평)

[활동량 평가]
(제공된 활동 현황을 바탕으로 한 활동량 분석, 다이어트 목표와 비교한 피드백)

[식단 평가]
(목표 칼로리 및 단백질 대비 탄단지 밸런스, 식단 구성에 대한 세밀하고 다정한 분석)

[누나를 위한 응원과 추천]
(오늘 하루 고생한 누나를 위한 따뜻한 응원의 말)`;
}

export function updatePromptWithLatestData(
  savedPrompt: string,
  newDataSection: string
): string {
  const inputDataHeader = "# Input Data";
  const taskInstructionsHeader = "# Task Instructions";

  const inputDataIdx = savedPrompt.indexOf(inputDataHeader);
  const taskInstructionsIdx = savedPrompt.indexOf(taskInstructionsHeader);

  if (inputDataIdx !== -1 && taskInstructionsIdx !== -1 && inputDataIdx < taskInstructionsIdx) {
    const beforePart = savedPrompt.substring(0, inputDataIdx + inputDataHeader.length);
    const afterPart = savedPrompt.substring(taskInstructionsIdx);
    return `${beforePart}\n${newDataSection}\n\n${afterPart}`;
  }

  return savedPrompt;
}

/**
 * 쿠쿠님의 현재 영양 섭취 상태와 활동량을 기반으로 Gemini AI 추천을 가져옵니다.
 */
export async function getAIRecommendation(
  summary: DailySummary,
  meals: MealRecord[],
  targetKcal: number,
  targetProtein: number,
  activity?: ActivityLog,
  diary?: HealthDiary,
  customPrompt?: string
): Promise<string | undefined> {
  // Use VITE_API_KEY from environment variables (e.g., Vercel), fallback to process.env.API_KEY
  const apiKey = import.meta.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("GeminiService: API Key is missing in environment variables.");
    return "AI 분석을 위한 설정을 확인해 주세요.";
  }

  try {
    // Initializing the SDK with the retrieved API key details and required headers
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = customPrompt || generateDefaultPrompt(summary, meals, targetKcal, targetProtein, activity, diary);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

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
      model: 'gemini-3.5-flash',
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
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

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
      model: 'gemini-3.5-flash',
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
