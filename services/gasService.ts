
import { MealRecord, Ingredient } from '../types';

// IMPORTANT: Replace this with your actual deployed GAS Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwccJ7-LOmYW_OQw58TJqT3k-X0SfWPv13xCD_qaBfSF9ZvV4IL-xGU6YXA7ZBYlups/exec';

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
    console.log("Data fetched from GAS:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch from GAS. Check URL or CORS settings.", error);
    // Fallback to empty/mock data
    return {
      meals: [],
      ingredients: [
        { uuid: '1', name: '닭가슴살', base_amount: 100, kcal: 110, carbs: 0, protein: 23, fat: 1.2, sugar: 0, fiber: 0 },
        { uuid: '2', name: '현미밥', base_amount: 210, kcal: 320, carbs: 70, protein: 7, fat: 1, sugar: 0, fiber: 2 },
        { uuid: '3', name: '사과', base_amount: 150, kcal: 80, carbs: 20, protein: 0.5, fat: 0.3, sugar: 15, fiber: 4 }
      ]
    };
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
