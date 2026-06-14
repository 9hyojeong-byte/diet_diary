
import { MealRecord, Ingredient, MealStatus, HealthDiary, Memo, ActivityLog, AIRecommendation, NutrientTargets, NutrientTargetRecord } from '../types';
import { generateUUID } from '../utils';

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzSsE8SWszwwOGYIQxoajZYlL_LkhSU4bQEWFDvacT07LVQ2T17xNLPVXbFtvwhFa9p/exec';

export async function fetchInitialData(): Promise<{ 
  meals: MealRecord[], 
  ingredients: Ingredient[], 
  diaries: HealthDiary[], 
  activities: ActivityLog[],
  recommendations: AIRecommendation[],
  nutrientTargets: NutrientTargetRecord[]
}> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getData`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`GAS HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const dataObj = (data && typeof data === 'object') ? data : {};

    const toKSTDate = (dateStr: string) => {
      if (!dateStr) return '';
      
      // ISO 형태(UTC)일 경우 KST(+9)로 변환하여 날짜 추출
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
          return kst.toISOString().split('T')[0];
        }
      }

      // 'YYYY. M. D.' 또는 'YYYY-MM-DD' 등 다양한 형식에서 날짜 추출 시도
      const dateMatch = String(dateStr).match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      const d = new Date(dateStr);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return String(dateStr).split(' ')[0];
    };

    const toKSTTime = (timeStr: string) => {
      if (!timeStr) return '00:00';
      const s = String(timeStr);
      
      // ISO (UTC) 형식 처리: T03:58:00.000Z -> KST 변환 후 시간 추출
      if (s.includes('T')) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
          return kst.toISOString().split('T')[1].slice(0, 5);
        }
      }

      // "12:26:00" 또는 "12:26" 등 형식에서 HH:mm 추출
      const match = s.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }

      // 오전/오후 형식 (예: "오후 12:26") 처리
      if (s.includes('오전') || s.includes('오후') || s.includes('AM') || s.includes('PM')) {
        const d = new Date(`2000-01-01 ${s.replace('오전', 'AM').replace('오후', 'PM')}`);
        if (!isNaN(d.getTime())) {
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }

      return s.slice(0, 5);
    };

    const sanitizedIngredients = (dataObj.ingredients || [])
      .filter((ing: any) => ing !== null && ing !== undefined)
      .map((ing: any) => ({
        ...ing,
        is_bookmarked: String(ing.is_bookmarked).toLowerCase() === 'true',
        base_amount: Number(ing.base_amount) || 100,
        kcal: Number(ing.kcal) || 0,
        carbs: Number(ing.carbs) || 0,
        protein: Number(ing.protein) || 0,
        fat: Number(ing.fat) || 0,
        sugar: Number(ing.sugar) || 0,
        fiber: Number(ing.fiber) || 0
      }));

    const sanitizedMeals = (dataObj.meals || [])
      .filter((meal: any) => meal !== null && meal !== undefined)
      .map((meal: any) => ({
        ...meal,
        date: toKSTDate(meal.date),
        time: toKSTTime(meal.time),
        status: (meal.status as MealStatus) || MealStatus.ACTUAL,
        amount: Number(meal.amount) || 0,
        kcal: Number(meal.kcal) || 0,
        carbs: Number(meal.carbs) || 0,
        protein: Number(meal.protein) || 0,
        fat: Number(meal.fat) || 0,
        sugar: Number(meal.sugar) || 0,
        fiber: Number(meal.fiber) || 0
      }));

    const sanitizedDiaries = (dataObj.diaries || [])
      .filter((d: any) => d !== null && d !== undefined)
      .map((d: any) => ({
        ...d,
        date: toKSTDate(d.date)
      }));

    const sanitizedActivities = (dataObj.activities || [])
      .filter((a: any) => a !== null && a !== undefined)
      .map((a: any) => ({
        ...a,
        uuid: a.uuid || generateUUID(),
        date: toKSTDate(a.date),
        steps: Number(a.steps) || 0,
        active_calories: Number(a.active_calories) || 0,
        total_calories: Number(a.total_calories) || 0,
        tef: a.tef !== undefined && a.tef !== "" ? Number(a.tef) : undefined,
        tdee: a.tdee !== undefined && a.tdee !== "" ? Number(a.tdee) : undefined
      }));

    const sanitizedRecommendations = (dataObj.recommendations || [])
      .filter((r: any) => r !== null && r !== undefined)
      .map((r: any) => ({
        ...r,
        date: toKSTDate(r.date)
      }));

    const sanitizedNutrientTargets = (dataObj.nutrient_targets || [])
      .filter((nt: any) => nt !== null && nt !== undefined && nt.date)
      .map((nt: any) => ({
        date: nt.date,
        kcal: Number(nt.kcal) || 0,
        carbs: Number(nt.carbs) || 0,
        protein: Number(nt.protein) || 0,
        fat: Number(nt.fat) || 0
      }));

    return { 
      meals: sanitizedMeals, 
      ingredients: sanitizedIngredients, 
      diaries: sanitizedDiaries, 
      activities: sanitizedActivities,
      recommendations: sanitizedRecommendations,
      nutrientTargets: sanitizedNutrientTargets
    };
  } catch (error) {
    console.error("Failed to fetch from GAS", error);
    return { meals: [], ingredients: [], diaries: [], activities: [], recommendations: [], nutrientTargets: [] };
  }
}

export async function saveAIRecommendationToGAS(recommendation: AIRecommendation): Promise<boolean> {
  return callGAS('saveRecommendation', recommendation);
}

export async function saveNutrientTargetsToGAS(targets: NutrientTargetRecord): Promise<boolean> {
  return callGAS('saveNutrientTargets', targets);
}

export async function fetchMemos(offset: number = 0, limit: number = 10): Promise<Memo[]> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getMemos&offset=${offset}&limit=${limit}`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`GAS HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return (data.memos || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdat || m.createdAt || new Date().toISOString(),
      updatedAt: m.updatedat || m.updatedAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch memos from GAS", error);
    return [];
  }
}

export async function saveMemoToGAS(memo: Memo): Promise<boolean> {
  const payload = {
    ...memo,
    createdat: memo.createdAt,
    updatedat: memo.updatedAt
  };
  return callGAS('saveMemo', payload);
}

export async function updateMemoInGAS(memo: Memo): Promise<boolean> {
  const payload = {
    ...memo,
    createdat: memo.createdAt,
    updatedat: memo.updatedAt
  };
  return callGAS('updateMemo', payload);
}

export async function deleteMemoFromGAS(id: string): Promise<boolean> {
  return callGAS('deleteMemo', { id });
}

export async function saveMealToGAS(meal: MealRecord): Promise<boolean> {
  const orderedMeal = {
    uuid: meal.uuid,
    type: meal.type,
    status: meal.status,
    date: meal.date,
    time: meal.time,
    ingredient_name: meal.ingredient_name,
    ingredient_uuid: meal.ingredient_uuid,
    amount: meal.amount,
    kcal: meal.kcal,
    carbs: meal.carbs,
    protein: meal.protein,
    fat: meal.fat,
    sugar: meal.sugar,
    fiber: meal.fiber
  };
  return callGAS('saveMeal', orderedMeal);
}

export async function updateMealInGAS(meal: MealRecord): Promise<boolean> {
  const orderedMeal = {
    uuid: meal.uuid,
    type: meal.type,
    status: meal.status,
    date: meal.date,
    time: meal.time,
    ingredient_name: meal.ingredient_name,
    ingredient_uuid: meal.ingredient_uuid,
    amount: meal.amount,
    kcal: meal.kcal,
    carbs: meal.carbs,
    protein: meal.protein,
    fat: meal.fat,
    sugar: meal.sugar,
    fiber: meal.fiber
  };
  return callGAS('updateMeal', orderedMeal);
}

export async function deleteMealFromGAS(uuid: string): Promise<boolean> {
  return callGAS('deleteMeal', { uuid });
}

export async function saveIngredientToGAS(ingredient: Ingredient): Promise<boolean> {
  return callGAS('saveIngredient', ingredient);
}

export async function updateIngredientInGAS(ingredient: Ingredient): Promise<boolean> {
  return callGAS('updateIngredient', ingredient);
}

export async function deleteIngredientFromGAS(uuid: string): Promise<boolean> {
  return callGAS('deleteIngredient', { uuid });
}

export async function updateIngredientBookmark(uuid: string, isBookmarked: boolean): Promise<boolean> {
  return callGAS('updateBookmark', { uuid, is_bookmarked: isBookmarked });
}

export async function saveDiaryToGAS(diary: HealthDiary): Promise<boolean> {
  return callGAS('saveDiary', diary);
}

export async function updateDiaryInGAS(diary: HealthDiary): Promise<boolean> {
  return callGAS('updateDiary', diary);
}

export async function saveActivityToGAS(activity: ActivityLog): Promise<boolean> {
  return callGAS('saveActivity', activity);
}

export async function updateActivityInGAS(activity: ActivityLog): Promise<boolean> {
  return callGAS('updateActivity', activity);
}

export async function deleteActivityFromGAS(uuid: string): Promise<boolean> {
  return callGAS('deleteActivity', { uuid });
}

export async function fetchDriveImages(folderId: string): Promise<string[]> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getDriveImages&folderId=${folderId}`, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`GAS HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error("Failed to fetch drive images from GAS", error);
    return [];
  }
}

async function callGAS(action: string, data: any): Promise<boolean> {
  try {
    // 식단 저장/수정 시 필드 순서가 중요하므로 JSON.stringify의 replacer 배열을 사용하여 순서를 강제합니다.
    let body: string;
    if (action === 'saveMeal' || action === 'updateMeal') {
      const mealKeys = [
        'uuid', 'type', 'status', 'date', 'time', 
        'ingredient_name', 'ingredient_uuid', 
        'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber'
      ];
      body = JSON.stringify({ action, data }, ['action', 'data', ...mealKeys]);
    } else {
      body = JSON.stringify({ action, data });
    }

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: body,
    });
    return response.ok;
  } catch (e) {
    console.error(`GAS Action failed: ${action}`, e);
    return false;
  }
}
