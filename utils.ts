export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKST = (): string => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60 * 1000));
  return formatDateToYYYYMMDD(kst);
};

export const getKSTTime = (): string => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60 * 1000));
  return kst.toISOString().split('T')[1].slice(0, 5);
};

export const getKSTFullTime = (): string => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60 * 1000));
  return kst.toISOString().replace('T', ' ').slice(0, 19);
};

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  if (String(timeStr).includes('T')) {
    return String(timeStr).split('T')[1].slice(0, 5);
  }
  return String(timeStr).slice(0, 5);
};

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
