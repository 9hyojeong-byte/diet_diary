
export enum MealType {
  BREAKFAST = '아침',
  LUNCH = '점심',
  SNACK = '간식',
  DINNER = '저녁'
}

export enum MealStatus {
  PLANNED = 'PLANNED',
  ACTUAL = 'ACTUAL',
  CANCELED = 'CANCELED'
}

export interface Ingredient {
  uuid: string;
  name: string;
  base_amount: number;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  fiber: number;
  is_bookmarked?: boolean;
}

export interface MealRecord {
  uuid: string;
  type: MealType;
  status: MealStatus;
  date: string;
  time: string;
  ingredient_uuid: string;
  ingredient_name?: string;
  amount: number;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  fiber: number;
  pending?: boolean;
}

export interface DailySummary {
  actual: {
    kcal: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  planned: {
    kcal: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface HealthDiary {
  uuid: string;
  date: string; // YYYY-MM-DD
  content: string;
  updated_at: string;
  pending?: boolean;
}

export interface Memo {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  uuid: string;
  date: string; // YYYY-MM-DD
  steps: number;
  active_calories: number;
  total_calories: number;
  tef?: number;
  tdee?: number;
  tdee_with_tef?: number;
  calorie_deficit?: number;
  bmr?: number; // Persisted BMR value at the time of log creation
  image_url?: string;
  created_at?: string;
  pending?: boolean;
}

export interface AIRecommendation {
  date: string;
  advice: string;
  created_at: string;
}

export interface NutrientTargets {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface NutrientTargetRecord extends NutrientTargets {
  date: string;
}

export interface BMRRecord {
  id: string;
  bmr: number;
  effectiveDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

