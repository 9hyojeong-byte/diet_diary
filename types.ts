
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
  image_url?: string;
  created_at?: string;
  pending?: boolean;
}
