
import { MealRecord, Ingredient } from '../types';

// IMPORTANT: Replace this with your actual deployed GAS Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx8ZnVyYbV5W6UWxNBhrd33s1VUs0HSAtvu89-0WiHlu_fGPwqaGnWBk39yBDsmSr9r/exec';

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
    return data;
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

export async function updateMealInGAS(meal: MealRecord): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'updateMeal', data: meal }),
    });
    return response.ok;
  } catch (e) {
    console.error("Update meal failed", e);
    return false;
  }
}

export async function deleteMealFromGAS(uuid: string): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'deleteMeal', data: { uuid } }),
    });
    return response.ok;
  } catch (e) {
    console.error("Delete meal failed", e);
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
