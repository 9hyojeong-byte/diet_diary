
import { MealRecord, Ingredient } from '../types';

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw1E7eTlCn5SGsJvEj633m4HZQHjd3kgfJZ6JKvyLgf1Sf2Ny8PrkFBlGIfOY94FjAy/exec';

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
    
    const sanitizedIngredients = (data.ingredients || []).map((ing: any) => ({
      ...ing,
      is_bookmarked: ing.is_bookmarked === 'true' || ing.is_bookmarked === true,
      base_amount: Number(ing.base_amount),
      kcal: Number(ing.kcal),
      carbs: Number(ing.carbs),
      protein: Number(ing.protein),
      fat: Number(ing.fat)
    }));

    const sanitizedMeals = (data.meals || []).map((meal: any) => ({
      ...meal,
      amount: Number(meal.amount),
      kcal: Number(meal.kcal),
      carbs: Number(meal.carbs),
      protein: Number(meal.protein),
      fat: Number(meal.fat)
    }));

    return { meals: sanitizedMeals, ingredients: sanitizedIngredients };
  } catch (error) {
    console.error("Failed to fetch from GAS", error);
    return { meals: [], ingredients: [] };
  }
}

export async function saveMealToGAS(meal: MealRecord): Promise<boolean> {
  return callGAS('saveMeal', meal);
}

export async function updateMealInGAS(meal: MealRecord): Promise<boolean> {
  return callGAS('updateMeal', meal);
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

async function callGAS(action: string, data: any): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action, data }),
    });
    return response.ok;
  } catch (e) {
    console.error(`GAS Action failed: ${action}`, e);
    return false;
  }
}
