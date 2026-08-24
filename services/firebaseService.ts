import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MealRecord, Ingredient, HealthDiary, Memo, ActivityLog, AIRecommendation, NutrientTargetRecord, BMRRecord } from '../types';

async function saveDoc(collectionName: string, id: string, data: object): Promise<boolean> {
  try {
    await setDoc(doc(db, collectionName, id), data);
    return true;
  } catch (e) {
    console.error(`Firestore save failed: ${collectionName}/${id}`, e);
    return false;
  }
}

async function removeDoc(collectionName: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (e) {
    console.error(`Firestore delete failed: ${collectionName}/${id}`, e);
    return false;
  }
}

export async function fetchInitialData(): Promise<{
  meals: MealRecord[],
  ingredients: Ingredient[],
  diaries: HealthDiary[],
  activities: ActivityLog[],
  recommendations: AIRecommendation[],
  nutrientTargets: NutrientTargetRecord[],
  bmrHistory: BMRRecord[],
  memos: Memo[]
}> {
  const [
    mealsSnap,
    ingredientsSnap,
    diariesSnap,
    activitiesSnap,
    recommendationsSnap,
    nutrientTargetsSnap,
    bmrHistorySnap,
    memosSnap
  ] = await Promise.all([
    getDocs(collection(db, 'meals')),
    getDocs(collection(db, 'ingredients')),
    getDocs(collection(db, 'diaries')),
    getDocs(collection(db, 'activity_logs')),
    getDocs(collection(db, 'ai_recommendations')),
    getDocs(collection(db, 'nutrient_targets')),
    getDocs(collection(db, 'bmr_history')),
    getDocs(collection(db, 'memos'))
  ]);

  return {
    meals: mealsSnap.docs.map(d => d.data() as MealRecord),
    ingredients: ingredientsSnap.docs.map(d => d.data() as Ingredient),
    diaries: diariesSnap.docs.map(d => d.data() as HealthDiary),
    activities: activitiesSnap.docs.map(d => d.data() as ActivityLog),
    recommendations: recommendationsSnap.docs.map(d => d.data() as AIRecommendation),
    nutrientTargets: nutrientTargetsSnap.docs.map(d => d.data() as NutrientTargetRecord),
    bmrHistory: bmrHistorySnap.docs.map(d => d.data() as BMRRecord),
    memos: memosSnap.docs.map(d => d.data() as Memo)
  };
}

// --- Meals ---

export async function saveMeal(meal: MealRecord): Promise<boolean> {
  const { pending, ...data } = meal;
  return saveDoc('meals', meal.uuid, data);
}

export async function updateMeal(meal: MealRecord): Promise<boolean> {
  const { pending, ...data } = meal;
  return saveDoc('meals', meal.uuid, data);
}

export async function deleteMeal(uuid: string): Promise<boolean> {
  return removeDoc('meals', uuid);
}

// --- Ingredients ---

export async function saveIngredient(ingredient: Ingredient): Promise<boolean> {
  return saveDoc('ingredients', ingredient.uuid, ingredient);
}

export async function updateIngredient(ingredient: Ingredient): Promise<boolean> {
  return saveDoc('ingredients', ingredient.uuid, ingredient);
}

export async function deleteIngredient(uuid: string): Promise<boolean> {
  return removeDoc('ingredients', uuid);
}

export async function updateIngredientBookmark(uuid: string, isBookmarked: boolean): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'ingredients', uuid), { is_bookmarked: isBookmarked });
    return true;
  } catch (e) {
    console.error(`Firestore bookmark update failed: ingredients/${uuid}`, e);
    return false;
  }
}

// --- Diaries (one per date; date is the document id) ---

export async function saveDiary(diary: HealthDiary): Promise<boolean> {
  const { pending, ...data } = diary;
  return saveDoc('diaries', diary.date, data);
}

export async function updateDiary(diary: HealthDiary): Promise<boolean> {
  const { pending, ...data } = diary;
  return saveDoc('diaries', diary.date, data);
}

// --- Activity Logs ---

export async function saveActivity(activity: ActivityLog): Promise<boolean> {
  const { pending, ...data } = activity;
  return saveDoc('activity_logs', activity.uuid, data);
}

export async function updateActivity(activity: ActivityLog): Promise<boolean> {
  const { pending, ...data } = activity;
  return saveDoc('activity_logs', activity.uuid, data);
}

export async function deleteActivity(uuid: string): Promise<boolean> {
  return removeDoc('activity_logs', uuid);
}

// --- AI Recommendations (one per date; date is the document id) ---

export async function saveAIRecommendation(recommendation: AIRecommendation): Promise<boolean> {
  return saveDoc('ai_recommendations', recommendation.date, recommendation);
}

// --- Nutrient Targets (one per date; date is the document id) ---

export async function saveNutrientTargets(targets: NutrientTargetRecord): Promise<boolean> {
  return saveDoc('nutrient_targets', targets.date, targets);
}

// --- BMR History ---

export async function saveBMR(bmrRecord: BMRRecord): Promise<boolean> {
  return saveDoc('bmr_history', bmrRecord.id, bmrRecord);
}

// --- Memos ---

export async function saveMemo(memo: Memo): Promise<boolean> {
  return saveDoc('memos', memo.id, memo);
}

export async function updateMemo(memo: Memo): Promise<boolean> {
  return saveDoc('memos', memo.id, memo);
}

export async function deleteMemo(id: string): Promise<boolean> {
  return removeDoc('memos', id);
}
