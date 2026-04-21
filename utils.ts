export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKST = (): string => {
  const now = new Date();
  const kstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return formatDateToYYYYMMDD(kstDate);
};

export const getKSTTime = (): string => {
  const now = new Date();
  const kstTime = now.toLocaleTimeString('en-GB', { 
    timeZone: 'Asia/Seoul', 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  return kstTime;
};

export const getKSTTimeWithOffset = (offsetMinutes: number): string => {
  const now = new Date();
  const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const offsetTime = new Date(kstNow.getTime() + (offsetMinutes * 60 * 1000));
  
  const hours = String(offsetTime.getHours()).padStart(2, '0');
  const minutes = String(offsetTime.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getKSTFullTime = (): string => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60 * 1000));
  return kst.toISOString().replace('T', ' ').slice(0, 19);
};

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const s = String(timeStr);
  
  // 이미 HH:mm 형식인 경우 그대로 반환
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  
  if (s.includes('T')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      // ISO 문자열인 경우 KST를 고려하지 않고 해당 문자열의 시간 부분만 추출 (데이터 정제 단계에서 이미 처리됨을 가정)
      return s.split('T')[1].slice(0, 5);
    }
  }

  const match = s.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  return s.slice(0, 5);
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
