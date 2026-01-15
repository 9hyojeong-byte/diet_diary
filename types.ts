
export enum MealType {
  BREAKFAST = '아침',
  LUNCH = '점심',
  SNACK = '간식',
  DINNER = '저녁'
}

export enum MealStatus {
  PLANNED = 'PLANNED',
  ACTUAL = 'ACTUAL'
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
  is_bookmarked?: boolean; // 즐겨찾기 여부
}

export interface MealRecord {
  uuid: string;
  type: MealType;
  status: MealStatus; // 예정(PLANNED) 또는 실제(ACTUAL)
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  ingredient_uuid: string;
  ingredient_name?: string; // 저장된 이름 (일회성 식단 대응)
  amount: number;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  fiber: number;
  pending?: boolean; // For optimistic UI
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
