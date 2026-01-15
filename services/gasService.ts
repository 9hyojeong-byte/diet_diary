
import { MealRecord, Ingredient } from '../types';

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzoxqDxL-uKDSUw85Pmljoeu6uz3w7phylvT9nVypxJGDDpgF3M7yBfOrIZrFrR73V3/exec';

export async function fetchInitialData(): Promise<{ meals: MealRecord[], ingredients: Ingredient[] }> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getData`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`GAS HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 데이터 형변환: is_bookmarked를 Boolean으로 변환
    const sanitizedIngredients = (data.ingredients || []).map((ing: any) => ({
      ...ing,
      is_bookmarked: ing.is_bookmarked === 'true' || ing.is_bookmarked === true
    }));

    return { ...data, ingredients: sanitizedIngredients };
  } catch (error) {
    console.error("Failed to fetch from GAS", error);
    return { meals: [], ingredients: [] };
  }
}

export async function saveMealToGAS(meal: MealRecord): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'saveMeal', data: meal }),
    });
    return response.ok;
  } catch (e) {
    console.error("Save meal failed", e);
    return false;
  }
}

export async function saveIngredientToGAS(ingredient: Ingredient): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'saveIngredient', data: ingredient }),
    });
    return response.ok;
  } catch (e) {
    console.error("Save ingredient failed", e);
    return false;
  }
}

export async function updateIngredientBookmark(uuid: string, isBookmarked: boolean): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ 
        action: 'updateBookmark', 
        data: { uuid, is_bookmarked: isBookmarked } 
      }),
    });
    return response.ok;
  } catch (e) {
    console.error("Update bookmark failed", e);
    return false;
  }
}
