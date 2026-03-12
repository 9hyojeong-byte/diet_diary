export const getTargetKcal = (dateString: string): number => {
  // dateString format: 'YYYY-MM-DD'
  if (dateString <= '2026-03-11') {
    return 1500;
  }
  return 1600; // 3월 12일부터는 1600kcal
};

export const getTargetProtein = (dateString: string): number => {
  return 100; // 단백질 목표는 일단 100g으로 고정
};
