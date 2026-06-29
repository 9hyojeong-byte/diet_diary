
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus, HealthDiary, NutrientTargets, BMRRecord, Memo } from './types';
import Calendar from './components/Calendar';
import DailySummaryView from './components/DailySummary';
import MealSection from './components/MealSection';
import MealInputForm from './components/MealInputForm';
import AIAdviceModal from './components/AIAdviceModal';
import Sidebar from './components/Sidebar';
import IngredientManagement from './components/IngredientManagement';
import Statistics from './components/Statistics';
import MemoList from './components/MemoList';
import ExitModal from './components/ExitModal';
import AdminLoginModal from './components/AdminLoginModal';
import DiaryModal from './components/DiaryModal';
import ActivityLogView from './components/ActivityLogView';
import ActivityUploadForm from './components/ActivityUploadForm';
import SettingsModal from './components/SettingsModal';
import { getTargetKcal, getTargetProtein, getTodayKST, formatDateToYYYYMMDD, getKSTTime, getKSTFullTime, formatTime, generateUUID } from './utils';
import { 
  fetchInitialData, 
  saveMealToGAS, 
  updateMealInGAS, 
  deleteMealFromGAS,
  saveIngredientToGAS, 
  updateIngredientInGAS,
  deleteIngredientFromGAS,
  updateIngredientBookmark,
  saveDiaryToGAS,
  updateDiaryInGAS,
  saveActivityToGAS,
  updateActivityInGAS,
  deleteActivityFromGAS,
  saveAIRecommendationToGAS,
  saveNutrientTargetsToGAS,
  saveBMRToGAS,
  saveMemoToGAS,
  updateMemoInGAS,
  deleteMemoFromGAS
} from './services/gasService';
import PinnedMemoModal from './components/PinnedMemoModal';

import { ActivityLog, AIRecommendation, NutrientTargetRecord } from './types';

const TRIAL_MESSAGE = "체험 모드 안내\n이 버전은 공개용 포트폴리오 버전입니다. 데이터의 보안과 무결성을 위해 기록 수정 기능이 제한되어 있습니다.";


const FOOD_EMOJIS = ['🥗', '🍎', '🥑', '🍗', '🍳', '🥛', '🍣', '🍱', '🥣', '🥦', '🍌', '🥪', '🥙', '🥗'];

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Calendar Skeleton */}
      <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-24 bg-gray-200 rounded"></div>
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="flex justify-between">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="h-3 w-6 bg-gray-200 rounded"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Summary Skeleton */}
      <div className="bg-white rounded-[24px] p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 w-36 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-8 border-gray-100 flex items-center justify-center">
              <div className="h-6 w-12 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-12 bg-gray-200 rounded"></div>
                  <div className="h-3 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meals Skeleton */}
      <div className="space-y-4">
        {['아침 식단', '점심 식단', '간식 식단', '저녁 식단'].map((meal, idx) => (
          <div key={idx} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-14 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const safePushState = (state: any, titleStr: string = '') => {
  try {
    window.history.pushState(state, titleStr);
  } catch (e) {
    console.warn("pushState is not supported in this environment", e);
  }
};

const parseCreatedAt = (str: string): number => {
  if (!str) return 0;
  const t = Date.parse(str);
  if (!isNaN(t)) return t;

  try {
    const parts = str.split(' ');
    if (parts.length >= 4) {
      const year = parseInt(parts[0].replace('.', '')) || 2026;
      const month = (parseInt(parts[1].replace('.', '')) || 1) - 1;
      const day = parseInt(parts[2].replace('.', '')) || 1;
      
      const ampm = parts[3];
      const timeParts = parts[4] ? parts[4].split(':') : ['0', '0', '0'];
      let hour = parseInt(timeParts[0]) || 0;
      const minute = parseInt(timeParts[1]) || 0;
      const second = parseInt(timeParts[2]) || 0;

      if (ampm === '오후' && hour < 12) {
        hour += 12;
      } else if (ampm === '오전' && hour === 12) {
        hour = 0;
      }
      return new Date(year, month, day, hour, minute, second).getTime();
    }
  } catch (e) {
    console.error("Failed parsing created_at", str, e);
  }
  
  return 0;
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => safeLocalStorage.getItem('isAdmin') === 'true');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'ingredients' | 'stats' | 'memos' | 'activity'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKST());
  
  const [meals, setMeals] = useState<MealRecord[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_meals');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_ingredients');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [diaries, setDiaries] = useState<HealthDiary[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_diaries');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_activities');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_recommendations');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [bmrHistory, setBmrHistory] = useState<BMRRecord[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_bmr_history');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [memos, setMemos] = useState<Memo[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('cached_memos');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isPinnedMemoOpen, setIsPinnedMemoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(() => {
    try {
      const cachedMeals = safeLocalStorage.getItem('cached_meals');
      const cachedIngredients = safeLocalStorage.getItem('cached_ingredients');
      const parsedMeals = cachedMeals ? JSON.parse(cachedMeals) : [];
      const parsedIngredients = cachedIngredients ? JSON.parse(cachedIngredients) : [];
      const hasCache = (Array.isArray(parsedMeals) && parsedMeals.length > 0) || 
                       (Array.isArray(parsedIngredients) && parsedIngredients.length > 0);
      return !hasCache;
    } catch {
      return true;
    }
  });
  const [syncMode, setSyncMode] = useState<'none' | 'manual' | 'quiet'>('none');
  const isBackgroundSyncing = syncMode !== 'none';
  const [syncEmoji, setSyncEmoji] = useState<string>('🥗');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingEmoji, setLoadingEmoji] = useState('🥗');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isActivityUploadOpen, setIsActivityUploadOpen] = useState(false);
  const [activityUploadDate, setActivityUploadDate] = useState<string>('');
  const [editMealTarget, setEditMealTarget] = useState<MealRecord | null>(null);
  const [prefilledType, setPrefilledType] = useState<MealType | null>(null);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const [nutrientTargetsMap, setNutrientTargetsMap] = useState<Record<string, NutrientTargets>>(() => {
    try {
      const saved = safeLocalStorage.getItem('nutrientTargetsMap');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
      const legacy = safeLocalStorage.getItem('nutrientTargets');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        return { [selectedDate]: parsedLegacy };
      }
      return {};
    } catch {
      return {};
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    safeLocalStorage.setItem('cached_meals', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    safeLocalStorage.setItem('cached_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    safeLocalStorage.setItem('cached_diaries', JSON.stringify(diaries));
  }, [diaries]);

  useEffect(() => {
    safeLocalStorage.setItem('cached_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    safeLocalStorage.setItem('cached_recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    safeLocalStorage.setItem('nutrientTargetsMap', JSON.stringify(nutrientTargetsMap));
  }, [nutrientTargetsMap]);

  useEffect(() => {
    safeLocalStorage.setItem('cached_bmr_history', JSON.stringify(bmrHistory));
  }, [bmrHistory]);

  useEffect(() => {
    safeLocalStorage.setItem('cached_memos', JSON.stringify(memos));
  }, [memos]);

  const getTargetForDate = useCallback((date: string): NutrientTargets => {
    if (nutrientTargetsMap[date]) return nutrientTargetsMap[date];
    
    // Find the closest previous date with targets
    const sortedDates = Object.keys(nutrientTargetsMap).sort((a, b) => b.localeCompare(a));
    const previousDate = sortedDates.find(d => d < date);
    
    if (previousDate) return nutrientTargetsMap[previousDate];

    // Default fallback
    return {
      kcal: 1600,
      carbs: 200,
      protein: 120,
      fat: 35
    };
  }, [nutrientTargetsMap]);

  const getBmrForDate = useCallback((date: string): number => {
    if (bmrHistory.length === 0) return 1410; // Default fallback BMR
    
    // Sort descending by effectiveDate, then by createdAt
    const sorted = [...bmrHistory].sort((a, b) => {
      const dateCompare = b.effectiveDate.localeCompare(a.effectiveDate);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    // Find the record that is effective on or before the target date
    const record = sorted.find(r => r.effectiveDate <= date);
    if (record) return record.bmr;
    
    // If none are <= date, return the oldest one
    return sorted[sorted.length - 1].bmr;
  }, [bmrHistory]);

  const currentPinnedMemo = useMemo(() => {
    const pinned = memos.filter(m => m.isPinned);
    if (pinned.length === 0) return null;
    return [...pinned].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }, [memos]);

  const onSaveMemo = useCallback(async (content: string, editingMemo: Memo | null) => {
    const now = new Date().toISOString();
    if (editingMemo) {
      const updatedMemo: Memo = { ...editingMemo, content, updatedAt: now };
      setMemos(prev => prev.map(m => m.id === updatedMemo.id ? updatedMemo : m));
      try {
        await updateMemoInGAS(updatedMemo);
      } catch (error) {
        console.error("Failed to update memo in GAS", error);
      }
    } else {
      const newMemo: Memo = {
        id: generateUUID(),
        content,
        createdAt: now,
        updatedAt: now,
        isPinned: false
      };
      setMemos(prev => [newMemo, ...prev]);
      try {
        await saveMemoToGAS(newMemo);
      } catch (error) {
        console.error("Failed to save memo in GAS", error);
      }
    }
  }, []);

  const onDeleteMemo = useCallback(async (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
    try {
      await deleteMemoFromGAS(id);
    } catch (error) {
      console.error("Failed to delete memo in GAS", error);
    }
  }, []);

  const onTogglePin = useCallback(async (id: string) => {
    let updated: Memo | null = null;
    setMemos(prev => prev.map(m => {
      if (m.id === id) {
        updated = { ...m, isPinned: !m.isPinned, updatedAt: new Date().toISOString() };
        return updated;
      }
      return m;
    }));
    
    if (updated) {
      try {
        await updateMemoInGAS(updated);
      } catch (error) {
        console.error("Failed to update memo pin in GAS", error);
      }
    }
  }, []);

  const onSaveBMR = async (bmrVal: number, effectiveDateVal: string): Promise<boolean> => {
    const newRecord: BMRRecord = {
      id: generateUUID(),
      bmr: bmrVal,
      effectiveDate: effectiveDateVal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic UI update
    setBmrHistory(prev => [...prev, newRecord]);

    try {
      const success = await saveBMRToGAS(newRecord);
      if (success) {
        showToast("기초대사량이 성공적으로 저장되었습니다. 💾");
        // Pull latest to sync
        await syncDataWithGAS(false, 'quiet');
        return true;
      } else {
        // Rollback optimistic update
        setBmrHistory(prev => prev.filter(r => r.id !== newRecord.id));
        showToast("기초대사량 저장에 실패했습니다.");
        return false;
      }
    } catch (error) {
      console.error("Failed to save BMR", error);
      // Rollback optimistic update
      setBmrHistory(prev => prev.filter(r => r.id !== newRecord.id));
      showToast("기초대사량 저장 중 오류가 발생했습니다.");
      return false;
    }
  };

  const nutrientTargets = useMemo(() => getTargetForDate(selectedDate), [selectedDate, getTargetForDate]);

  const syncDataWithGAS = useCallback(async (showToastMessage = false, mode: 'manual' | 'quiet' | 'none' = 'none') => {
    setSyncMode(mode);
    try {
      const data = await fetchInitialData();
      let hasChanges = false;

      const currentMealsStr = safeLocalStorage.getItem('cached_meals') || '[]';
      const fetchedMealsStr = JSON.stringify(data.meals || []);
      if (fetchedMealsStr !== currentMealsStr) {
        setMeals(data.meals || []);
        hasChanges = true;
      }

      const currentIngredientsStr = safeLocalStorage.getItem('cached_ingredients') || '[]';
      const fetchedIngredientsStr = JSON.stringify(data.ingredients || []);
      if (fetchedIngredientsStr !== currentIngredientsStr) {
        setIngredients(data.ingredients || []);
        hasChanges = true;
      }

      const currentDiariesStr = safeLocalStorage.getItem('cached_diaries') || '[]';
      const fetchedDiariesStr = JSON.stringify(data.diaries || []);
      if (fetchedDiariesStr !== currentDiariesStr) {
        setDiaries(data.diaries || []);
        hasChanges = true;
      }

      const currentActivitiesStr = safeLocalStorage.getItem('cached_activities') || '[]';
      const fetchedActivitiesStr = JSON.stringify(data.activities || []);
      if (fetchedActivitiesStr !== currentActivitiesStr) {
        setActivities(data.activities || []);
        hasChanges = true;
      }

      const currentRecommendationsStr = safeLocalStorage.getItem('cached_recommendations') || '[]';
      const fetchedRecommendationsStr = JSON.stringify(data.recommendations || []);
      if (fetchedRecommendationsStr !== currentRecommendationsStr) {
        setRecommendations(data.recommendations || []);
        hasChanges = true;
      }

      const currentBmrHistoryStr = safeLocalStorage.getItem('cached_bmr_history') || '[]';
      const fetchedBmrHistoryStr = JSON.stringify(data.bmrHistory || []);
      if (fetchedBmrHistoryStr !== currentBmrHistoryStr) {
        setBmrHistory(data.bmrHistory || []);
        hasChanges = true;
      }

      const currentMemosStr = safeLocalStorage.getItem('cached_memos') || '[]';
      const fetchedMemosStr = JSON.stringify(data.memos || []);
      if (fetchedMemosStr !== currentMemosStr) {
        setMemos(data.memos || []);
        hasChanges = true;
      }

      const newNtMap: Record<string, NutrientTargets> = {};
      (data.nutrientTargets || []).forEach(nt => {
        if (nt && nt.date) {
          newNtMap[nt.date] = { 
            kcal: Number(nt.kcal) || 1600, 
            carbs: Number(nt.carbs) || 200, 
            protein: Number(nt.protein) || 120, 
            fat: Number(nt.fat) || 35 
          };
        }
      });

      const currentNutrientTargetsStr = safeLocalStorage.getItem('nutrientTargetsMap') || '{}';
      const fetchedNutrientTargetsStr = JSON.stringify(newNtMap);
      if (fetchedNutrientTargetsStr !== currentNutrientTargetsStr) {
        setNutrientTargetsMap(prev => ({ ...prev, ...newNtMap }));
        hasChanges = true;
      }

      if (showToastMessage) {
        // Removed as requested: showToast("최신 정보가 업데이트되었습니다 ✨");
      } else {
        const hadCache = currentMealsStr !== '[]' || currentIngredientsStr !== '[]';
        if (hasChanges && hadCache) {
          // Removed as requested: showToast("최신 정보가 업데이트되었습니다 ✨");
        }
      }
    } catch (error) {
      console.error("Failed to load data from GAS", error);
      showToast("데이터를 동기화하는 중 오류가 발생했습니다.");
    } finally {
      setIsInitialLoad(false);
      setSyncMode('none');
    }
  }, []);

  const onUpdateNutrientTargets = async (newTargets: NutrientTargets) => {
    const newMap = { ...nutrientTargetsMap, [selectedDate]: newTargets };
    setNutrientTargetsMap(newMap);
    safeLocalStorage.setItem('nutrientTargetsMap', JSON.stringify(newMap));
    
    try {
      await saveNutrientTargetsToGAS({ ...newTargets, date: selectedDate });
      showToast(`${selectedDate} 목표 영양분이 수정되었습니다. ✨`);
      // Update from DB to sync changes
      await syncDataWithGAS(false);
    } catch (error) {
      console.error("Failed to save nutrient targets to GAS", error);
      showToast("로컬에 저장되었습니다. 서버 저장 실패 😅");
    }
  };

  // Touch handlers for Pull to Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart !== null) {
      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStart;
      if (delta > 0) {
        setTouchDelta(Math.min(delta / 2, 80));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (touchStart !== null) {
      if (touchDelta >= 50 && !isBackgroundSyncing) {
        showToast("🔄 데이터 동기화 시작...");
        await syncDataWithGAS(true, 'manual');
      }
      setTouchStart(null);
      setTouchDelta(0);
    }
  };

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    safePushState({ noBackExitsApp: true }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (isSidebarOpen) { setIsSidebarOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      if (isSettingsOpen) { setIsSettingsOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      if (isInputOpen) { setIsInputOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      if (isDiaryOpen) { setIsDiaryOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      if (isActivityUploadOpen) { setIsActivityUploadOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      if (adviceModalOpen) { setAdviceModalOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      if (isAdminLoginOpen) { setIsAdminLoginOpen(false); safePushState({ noBackExitsApp: true }, ''); return; }
      setIsExitModalOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSidebarOpen, isSettingsOpen, isInputOpen, isDiaryOpen, isActivityUploadOpen, adviceModalOpen, isAdminLoginOpen]);

  useEffect(() => {
    // 앱 처음 진입 시에는 구글 스프레드시트 서버 조회(동기화)를 즉시 타지 않고 로컬 캐시로 신속히 로드합니다.
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (isBackgroundSyncing) {
      const foodEmojis = ['🥗', '🍎', '🥑', '🥩', '🍙', '🍣', '🍤', '🍕', '🍰', '🍪', '🥨', '🥛', '🍇', '🍌', '🍳', '🍜', '🍔', '🌯', '🥖', '🥝', '🍉', '🍍', '🍒', '🍯', '🍒', '🍑', '🍋', '🥞', '🧇', '🧀', '🍗', '🍟', '🌮', '🍩', '🍦'];
      const randomEmoji = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
      setSyncEmoji(randomEmoji);
    }
  }, [isBackgroundSyncing]);

  useEffect(() => {
    if (!isAdmin && currentView === 'memos') {
      setCurrentView('main');
    }
  }, [isAdmin, currentView]);

  const filteredMeals = useMemo(() => meals.filter(m => String(m.date).startsWith(selectedDate) && m.status !== MealStatus.CANCELED), [meals, selectedDate]);
  const currentDiary = useMemo(() => diaries.find(d => d.date === selectedDate), [diaries, selectedDate]);
  const currentActivity = useMemo(() => activities.find(a => a.date === selectedDate), [activities, selectedDate]);
  const currentRecommendation = useMemo(() => {
    const dayRecommendations = recommendations.filter(r => r.date === selectedDate);
    if (dayRecommendations.length === 0) return undefined;
    
    return [...dayRecommendations].sort((a, b) => {
      const timeA = parseCreatedAt(a.created_at);
      const timeB = parseCreatedAt(b.created_at);
      return timeB - timeA;
    })[0];
  }, [recommendations, selectedDate]);

  const summary = useMemo(() => {
    const initial = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    const actual = filteredMeals.filter(m => m.status === MealStatus.ACTUAL).reduce((acc, cur) => ({
      kcal: acc.kcal + (Number(cur.kcal) || 0),
      carbs: acc.carbs + (Number(cur.carbs) || 0),
      protein: acc.protein + (Number(cur.protein) || 0),
      fat: acc.fat + (Number(cur.fat) || 0),
    }), { ...initial });
    const total = filteredMeals.reduce((acc, cur) => ({
      kcal: acc.kcal + (Number(cur.kcal) || 0),
      carbs: acc.carbs + (Number(cur.carbs) || 0),
      protein: acc.protein + (Number(cur.protein) || 0),
      fat: acc.fat + (Number(cur.fat) || 0),
    }), { ...initial });
    return { actual, planned: total };
  }, [filteredMeals]);

  const onSaveMeal = useCallback(async (newMeal: MealRecord, newIngredient?: Ingredient) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevMeals = [...meals];
    const prevIngredients = [...ingredients];
    const isUpdate = meals.some(m => String(m.uuid) === String(newMeal.uuid));
    setMeals(prev => isUpdate ? prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...newMeal, pending: true } : m) : [...prev, { ...newMeal, pending: true }]);
    if (newIngredient) setIngredients(prev => [...prev, newIngredient]);
    try {
      if (newIngredient) await saveIngredientToGAS(newIngredient);
      const success = isUpdate ? await updateMealInGAS(newMeal) : await saveMealToGAS(newMeal);
      if (!success) throw new Error("Server storage failed");
      setMeals(prev => prev.map(m => String(m.uuid) === String(newMeal.uuid) ? { ...m, pending: false } : m));
      await syncDataWithGAS(false);
    } catch (error) {
      setMeals(prevMeals);
      setIngredients(prevIngredients);
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    }
  }, [meals, ingredients, isAdmin, syncDataWithGAS]);
 
  const handleSetMealStatus = useCallback(async (uuid: string, status: MealStatus) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target || target.status === status) return;
    const prevMeals = [...meals];
    
    // ACTUAL로 전환 시 현재 시각/날짜, PLANNED로 전환 시 23:59
    const isToActual = status === MealStatus.ACTUAL;
    const isToPlanned = status === MealStatus.PLANNED;
    
    const newTime = isToActual ? getKSTTime() : (isToPlanned ? '23:59' : target.time);
    const newDate = target.date; // 날짜는 기존 상태 그대로 유지
 
    const updatedMeal: MealRecord = { ...target, status, time: newTime, date: newDate, pending: true };
    setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? updatedMeal : m));
    try {
      const success = await updateMealInGAS(updatedMeal);
      if (!success) throw new Error("Update failed");
      setMeals(prev => prev.map(m => String(m.uuid) === String(uuid) ? { ...updatedMeal, pending: false } : m));
      await syncDataWithGAS(false);
    } catch (err) {
      setMeals(prevMeals);
      showToast("상태 변경에 실패했습니다. 다시 시도해 주세요.");
    }
  }, [meals, isAdmin, syncDataWithGAS]);
 
  const onDeleteMeal = useCallback(async (uuid: string): Promise<boolean> => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return false; }
    const target = meals.find(m => String(m.uuid) === String(uuid));
    if (!target) return false;
    const prevMeals = [...meals];
    setMeals(p => p.filter(m => String(m.uuid) !== String(uuid)));
    try {
      const success = await deleteMealFromGAS(uuid);
      if (success) {
        await syncDataWithGAS(false);
        return true;
      } else throw new Error("Delete failed");
    } catch (err) {
      setMeals(prevMeals);
      showToast("삭제에 실패했습니다. 다시 시도해 주세요.");
      return false;
    }
  }, [meals, isAdmin, syncDataWithGAS]);

  const getIngredientDisplayName = useCallback((meal: MealRecord) => {
    const targetUuid = String(meal.ingredient_uuid || '').trim();
    if (targetUuid && targetUuid !== 'direct-entry') {
      const found = ingredients.find(i => String(i.uuid).trim() === targetUuid);
      if (found) return found.name;
    }
    if (meal.ingredient_name) return meal.ingredient_name;
    return '식재료 정보 없음';
  }, [ingredients]);

/** 식단 복사 기능 **/

  const handleCopyTextToClipboard = useCallback((includePlanned: boolean = false) => {
    const mealsToCopy = filteredMeals.filter(m => 
      m.status === MealStatus.ACTUAL || (includePlanned && m.status === MealStatus.PLANNED)
    );
    
    if (mealsToCopy.length === 0 && !currentDiary && !currentActivity) {
      alert("복사할 데이터(식단, 일기, 활동량)가 없습니다.");
      return;
    }

    const typeOrder = [MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER];
    let text = `오늘의 식단, 건강일기, 활동량기록이야.\n현재 170cm, 73kg인 내가 65kg이 되기위한 꾸준한 다이어트(한달에 -2kg목표) 를 위한 하루로써 어떤지 평가해줘. 그리고 조언해줘.\n\n`;
    text += `[${selectedDate} ${includePlanned ? '예정 ' : ''}기록]\n\n`;

    if (mealsToCopy.length > 0) {
      text += `[식단]\n`;
      typeOrder.forEach(type => {
        const typeMeals = mealsToCopy.filter(m => m.type === type);
        if (typeMeals.length > 0) {
          text += `- ${type}\n`;
          typeMeals.forEach(m => {
            const name = getIngredientDisplayName(m);
            const isPlanned = m.status === MealStatus.PLANNED;
            const statusText = (includePlanned && isPlanned) ? '(예정) ' : '';
            const timeText = isPlanned ? '' : `${formatTime(m.time)} | `;
            text += `  ${timeText}${statusText}${name} (${m.amount}g) - ${Math.round(m.kcal)}kcal (탄:${Math.round(m.carbs)}g, 단:${Math.round(m.protein)}g, 지:${Math.round(m.fat)}g)\n`;
          });
        }
      });

      const summaryToUse = includePlanned ? summary.planned : summary.actual;
      text += `\n${includePlanned ? '총 섭취 예상' : '총 섭취'}: ${Math.round(summaryToUse.kcal)}kcal `;
      text += `영양합계: 탄 ${Math.round(summaryToUse.carbs)}g, 단 ${Math.round(summaryToUse.protein)}g, 지 ${Math.round(summaryToUse.fat)}g\n\n`;
    }

    if (currentDiary) {
      text += `[건강 일기]\n${currentDiary.content}\n\n`;
    }

    if (currentActivity) {
      const summaryToUse = includePlanned ? summary.planned : summary.actual;
      const tef = Math.round(summaryToUse.kcal * 0.1);
      const activityTotal = Math.round(currentActivity.total_calories);
      const finalTDEE = activityTotal + tef;

      text += `[활동량]\n`;
      text += `- 걸음 수 : ${currentActivity.steps.toLocaleString()}보\n`;
      text += `- 활동 칼로리 : ${currentActivity.active_calories}kcal\n`;
      text += `- TEF : ${tef}kcal\n`;
      text += `- 총 소모 칼로리 : ${activityTotal}kcal\n`;
      text += `- 최종 총 소모 칼로리 (TDEE) : ${finalTDEE}kcal\n\n`;
    }
    
    text = text.trim();
    
    navigator.clipboard.writeText(text).then(() => {
      showToast("기록이 클립보드에 복사되었습니다! 📋");
    }).catch(err => {
      console.error("Clipboard copy failed", err);
      showToast("복사에 실패했습니다.");
    });
  }, [filteredMeals, selectedDate, summary, getIngredientDisplayName, currentDiary, currentActivity]);

  const onSaveDiary = useCallback(async (content: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevDiaries = [...diaries];
    const now = getKSTFullTime();
    
    // Check if we already have a diary for the selected date to decide between Edit or Create
    const isEdit = !!currentDiary;
    
    const newDiary: HealthDiary = {
      uuid: isEdit ? currentDiary.uuid : crypto.randomUUID(),
      date: selectedDate,
      content,
      updated_at: now,
      pending: true
    };
    
    // Optimistic UI state update. Safeguard against date duplication.
    setDiaries(prev => {
      const exists = prev.some(d => d.date === selectedDate || d.uuid === newDiary.uuid);
      if (exists) {
        return prev.map(d => (d.date === selectedDate || d.uuid === newDiary.uuid) ? newDiary : d);
      } else {
        return [...prev, newDiary];
      }
    });
    
    try {
      // Execute UPDATE if edit, otherwise INSERT (save)
      const success = isEdit 
        ? await updateDiaryInGAS(newDiary) 
        : await saveDiaryToGAS(newDiary);
        
      if (success) {
        setDiaries(prev => prev.map(d => d.uuid === newDiary.uuid ? { ...newDiary, pending: false } : d));
        showToast(isEdit ? "건강 일기가 수정되었습니다! ✨" : "건강 일기가 저장되었습니다! ✨");
        await syncDataWithGAS(false);
      } else {
        throw new Error("Diary persistent operation returned false");
      }
    } catch (error) { 
      setDiaries(prevDiaries);
      showToast("일기 저장에 실패했습니다.");
    }
  }, [selectedDate, currentDiary, diaries, isAdmin, syncDataWithGAS]);
 
  const onSaveActivity = useCallback(async (activity: ActivityLog) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevActivities = [...activities];
    const isUpdate = activities.some(a => a.uuid === activity.uuid);
    
    setActivities(prev => {
      const exists = prev.some(a => a.uuid === activity.uuid);
      return exists ? prev.map(a => a.uuid === activity.uuid ? { ...activity, pending: true } : a) : [...prev, { ...activity, pending: true }];
    });
    setIsActivityUploadOpen(false);
    try {
      const success = isUpdate ? await updateActivityInGAS(activity) : await saveActivityToGAS(activity);
      if (success) {
        setActivities(prev => prev.map(a => a.uuid === activity.uuid ? { ...activity, pending: false } : a));
        showToast(isUpdate ? "활동 기록이 수정되었습니다! 💪" : "활동 기록이 저장되었습니다! 💪");
        await syncDataWithGAS(false);
      } else throw new Error("Activity storage failed");
    } catch (error) {
      setActivities(prevActivities);
      showToast("활동 기록 저장에 실패했습니다.");
    }
  }, [activities, isAdmin, syncDataWithGAS]);
 
  const onDeleteActivity = useCallback(async (uuid: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const prevActivities = [...activities];
    setActivities(prev => prev.filter(a => a.uuid !== uuid));
    setIsActivityUploadOpen(false);
    try {
      const success = await deleteActivityFromGAS(uuid);
      if (!success) throw new Error("Activity deletion failed");
      showToast("활동 기록이 삭제되었습니다.");
      await syncDataWithGAS(false);
    } catch (error) {
      setActivities(prevActivities);
      showToast("활동 기록 삭제에 실패했습니다.");
    }
  }, [activities, isAdmin, syncDataWithGAS]);
 
  const handleToggleBookmark = useCallback(async (uuid: string) => {
    if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
    const target = ingredients.find(i => String(i.uuid) === String(uuid));
    if (!target) return;
    const prevIngredients = [...ingredients];
    const next = !target.is_bookmarked;
    setIngredients(prev => prev.map(i => String(i.uuid) === String(uuid) ? { ...i, is_bookmarked: next } : i));
    try { 
      const success = await updateIngredientBookmark(uuid, next); 
      if (!success) throw new Error("Bookmark failed");
      await syncDataWithGAS(false);
    } catch (err) { 
      setIngredients(prevIngredients); 
      showToast("즐겨찾기 상태 변경에 실패했습니다.");
    }
  }, [ingredients, isAdmin, syncDataWithGAS]);

  const handleLogin = (s: boolean) => { if (s) { setIsAdmin(true); safeLocalStorage.setItem('isAdmin', 'true'); } };
  const handleLogout = () => { 
    if (confirm('관리자 모드를 해제하시겠습니까?')) { 
      setIsAdmin(false); 
      safeLocalStorage.removeItem('isAdmin'); 
      if (currentView === 'memos') setCurrentView('main');
    } 
  };

  const onSaveAIRecommendation = useCallback(async (advice: string) => {
    // 조언이 비어있거나 실패 메시지인 경우 저장하지 않음
    if (!advice || advice.includes("실패") || advice.includes("데이터를 불러오는데")) return;

    // 이미 동일한 날짜에 동일한 내용의 추천이 있다면 저장하지 않음 (로컬 상태 기준)
    const isAlreadySaved = recommendations.some(r => r.date === selectedDate && r.advice === advice);
    if (isAlreadySaved) {
      console.log("Recommendation already exists for this date and content.");
      return;
    }

    const newRecommendation: AIRecommendation = {
      date: selectedDate,
      advice,
      created_at: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };
    
    setRecommendations(prev => {
      return [...prev, newRecommendation];
    });

    try {
      const success = await saveAIRecommendationToGAS(newRecommendation);
      if (success) {
        console.log("AI Recommendation saved to DB");
      }
    } catch (error) {
      console.error("Failed to save AI Recommendation", error);
    }
  }, [recommendations, selectedDate]);

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`max-w-md mx-auto min-h-screen pb-24 relative bg-gray-50 shadow-2xl transition-all ${!isAdmin ? 'ring-4 ring-orange-200 ring-inset' : ''}`}
    >
      {/* Pull to Refresh Indicator */}
      {touchDelta > 0 && (
        <div 
          className="w-full flex justify-center items-center overflow-hidden transition-all duration-75 text-indigo-600 bg-white border-b border-slate-100 sticky top-0 z-[110]"
          style={{ height: `${touchDelta}px` }}
        >
          <div className="flex items-center space-x-2 text-xs font-black">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform duration-200 ${touchDelta >= 50 ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>{touchDelta >= 50 ? '놓아서 새로고침' : '당겨서 새로고침'}</span>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      {/* Full-screen Sync Dim Overlay with Spinner */}
      {syncMode === 'manual' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-[250] animate-in fade-in duration-200">
          <div className="bg-slate-950/95 text-white px-6 py-5 rounded-3xl flex flex-col items-center space-y-4 max-w-[280px] text-center shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center w-[72px] h-[72px]">
              {/* Spinner tail */}
              <div className="absolute w-[72px] h-[72px] border-4 border-indigo-500/20 rounded-full"></div>
              {/* Rotating spinner head */}
              <div className="w-[72px] h-[72px] border-4 border-indigo-500 border-t-transparent border-r-transparent rounded-full animate-spin"></div>
              <span className="absolute text-4xl animate-bounce leading-none" style={{ animationDuration: '0.8s' }}>{syncEmoji}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black tracking-tight text-white/95">데이터를 동기화하고 있습니다</p>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">구글 스프레드시트(DB)와 실시간 동기화 중...</p>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && <div className="bg-orange-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest sticky top-0 z-[60]">체험 모드로 접속 중입니다</div>}
      
      <header className={`bg-indigo-600 text-white p-4 sticky ${!isAdmin ? 'top-6' : 'top-0'} z-50 shadow-lg flex items-center justify-between`}>
        <div className="flex items-center">
          {currentView === 'main' ? (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          ) : (
            <button onClick={() => { setCurrentView('main'); setIsActivityUploadOpen(false); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></button>
          )}
          <h1 className="ml-2 text-xl font-bold flex items-center">
            <span>
              {currentView === 'main' ? '쿠쿠님의 식단 기록' : 
               currentView === 'ingredients' ? '식재료 관리' : 
               currentView === 'memos' ? '메모 목록' : 
               currentView === 'activity' ? '활동량 기록' : '나의 통계'}
            </span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {currentView === 'main' && (
            <button 
              onClick={() => setIsPinnedMemoOpen(true)}
              className="bg-white/15 hover:bg-white/25 p-2 rounded-full transition-all active:scale-95 shadow-sm border border-white/5 flex items-center justify-center relative"
              title="상단 고정 메모 보기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1.323l3.947 1.974A2 2 0 0116 8.082v.826a2 2 0 01-1.2 1.835L11 12.574V17a1 1 0 11-2 0v-4.426l-3.8-1.83A2 2 0 014 8.908v-.826a2 2 0 011.053-1.785L9 4.323V3a1 1 0 011-1z" />
              </svg>
              {currentPinnedMemo && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full border border-indigo-600"></span>
              )}
            </button>
          )}
          <button 
            onClick={() => syncDataWithGAS(true, 'manual')} 
            disabled={isBackgroundSyncing}
            className={`bg-white/15 hover:bg-white/25 px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-sm border border-white/5 disabled:opacity-80`}
            title="구글 스프레드시트와 데이터 동기화"
          >
            <span className="text-[11px] font-black text-white tracking-widest">동기화</span>
          </button>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onNavigate={setCurrentView} isAdmin={isAdmin} onLogout={handleLogout} onOpenAdminLogin={() => setIsAdminLoginOpen(true)} selectedDate={selectedDate} onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="p-4">
        {isInitialLoad ? (
          <DashboardSkeleton />
        ) : currentView === 'main' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} meals={meals} diaries={diaries} activities={activities} />
            <DailySummaryView 
              summary={summary} 
              selectedDate={selectedDate} 
              targets={nutrientTargets} 
              onUpdateTargets={onUpdateNutrientTargets}
              isAdmin={isAdmin}
            />

            <div className="space-y-4">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(type => (
                <MealSection key={type} type={type} meals={filteredMeals.filter(m => m.type === type)} ingredients={ingredients} isAdmin={isAdmin} onAdd={() => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setEditMealTarget(null); setPrefilledType(type); setIsInputOpen(true); }} onEdit={(m) => { if (!isAdmin) { alert(TRIAL_MESSAGE); return; } setEditMealTarget(m); setIsInputOpen(true); }} onDelete={onDeleteMeal} onSetStatus={handleSetMealStatus} />
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <button 
                onClick={() => {
                  if (!isAdmin && !currentDiary) {
                    alert(TRIAL_MESSAGE);
                    return;
                  }
                  setIsDiaryOpen(true);
                }} 
                className={`w-full py-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 font-black shadow-sm active:scale-[0.98] ${currentDiary ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-dashed border-gray-200 text-gray-400'}`}
              >
                <span className="text-xl">{currentDiary ? '📝' : '+'}</span>
                <span>{currentDiary ? '건강 일기 보기' : '오늘의 건강 일기 작성'}</span>
              </button>
              <div className="flex space-x-3">
                <button onClick={() => handleCopyTextToClipboard(false)} className="flex-1 py-4 bg-white border-2 border-indigo-500 text-indigo-600 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1">
                  <span className="text-lg">📋</span>
                  <span className="text-sm">식단 복사</span>
                </button>
                <button onClick={() => handleCopyTextToClipboard(true)} className="flex-1 py-4 bg-indigo-50 border-2 border-indigo-400 text-indigo-700 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1">
                  <span className="text-lg">📝</span>
                  <span className="text-sm">예상 포함 복사</span>
                </button>
              </div>
              <button onClick={() => setAdviceModalOpen(true)} className="w-full py-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2"><span className="text-xl">✨</span><span>AI 영양 추천 받기</span></button>
            </div>
          </div>
        ) : currentView === 'ingredients' ? (
          <IngredientManagement 
            ingredients={ingredients} 
            isAdmin={isAdmin} 
            onToggleBookmark={handleToggleBookmark} 
            onAddIngredient={async (ing) => { 
              if (!isAdmin) { alert(TRIAL_MESSAGE); return; } 
              setIngredients(p => [...p, ing]); 
              const success = await saveIngredientToGAS(ing); 
              if (success) await syncDataWithGAS(false);
            }} 
            onUpdateIngredient={async (ing) => { 
              if (!isAdmin) { alert(TRIAL_MESSAGE); return; } 
              setIngredients(p => p.map(i => i.uuid === ing.uuid ? ing : i)); 
              const success = await updateIngredientInGAS(ing); 
              if (success) await syncDataWithGAS(false);
            }} 
            onDeleteIngredient={async (id) => { 
              if (!isAdmin) { alert(TRIAL_MESSAGE); return; } 
              setIngredients(p => p.filter(i => i.uuid !== id)); 
              const success = await deleteIngredientFromGAS(id); 
              if (success) await syncDataWithGAS(false);
            }} 
            trialMessage={TRIAL_MESSAGE} 
          />
        ) : currentView === 'memos' ? (
          <MemoList 
            isAdmin={isAdmin} 
            trialMessage={TRIAL_MESSAGE} 
            memos={memos}
            onSaveMemo={onSaveMemo}
            onDeleteMemo={onDeleteMemo}
            onTogglePin={onTogglePin}
          />
        ) : currentView === 'activity' ? (
          <ActivityLogView 
            activities={activities} 
            meals={meals}
            onNavigateToUpload={(date) => {
              setActivityUploadDate(date);
              setIsActivityUploadOpen(true);
            }} 
          />
        ) : (
          <Statistics meals={meals} onDateSelect={(d) => { setSelectedDate(d); setCurrentView('main'); }} />
        )}
      </main>

      {currentView === 'main' && !isActivityUploadOpen && !isInitialLoad && (
        <button 
          onClick={() => {
            if (!isAdmin) { alert(TRIAL_MESSAGE); return; }
            setActivityUploadDate(selectedDate);
            setIsActivityUploadOpen(true);
          }}
          className="fixed bottom-6 right-6 bg-white border-2 border-indigo-600 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40 group"
        >
          <span className="text-2xl group-hover:animate-bounce">💪</span>
          {currentActivity && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-full -translate-y-1/4 translate-x-1/4 animate-pulse"></span>
          )}
        </button>
      )}

      {isInputOpen && <MealInputForm isOpen={isInputOpen} onClose={() => { setIsInputOpen(false); setEditMealTarget(null); }} selectedDate={selectedDate} prefilledType={prefilledType} editTarget={editMealTarget} ingredients={ingredients} meals={meals} isAdmin={isAdmin} onSave={onSaveMeal} onDelete={onDeleteMeal} trialMessage={TRIAL_MESSAGE} />}
      {isActivityUploadOpen && (
        <ActivityUploadForm 
          isOpen={isActivityUploadOpen}
          initialDate={activityUploadDate} 
          existingActivity={activities.find(a => a.date === activityUploadDate)}
          onSave={onSaveActivity} 
          onDelete={onDeleteActivity}
          onCancel={() => setIsActivityUploadOpen(false)} 
          meals={meals}
          bmr={getBmrForDate(activityUploadDate)}
        />
      )}
      {isDiaryOpen && <DiaryModal isOpen={isDiaryOpen} onClose={() => setIsDiaryOpen(false)} selectedDate={selectedDate} diary={currentDiary} onSave={onSaveDiary} isAdmin={isAdmin} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} bmrHistory={bmrHistory} onSaveBMR={onSaveBMR} />}
      {adviceModalOpen && (
        <AIAdviceModal 
          isOpen={adviceModalOpen} 
          onClose={() => setAdviceModalOpen(false)} 
          summary={summary} 
          meals={filteredMeals} 
          targetKcal={nutrientTargets.kcal} 
          targetProtein={nutrientTargets.protein} 
          activity={currentActivity} 
          diary={currentDiary} 
          savedRecommendation={currentRecommendation}
          onSaveRecommendation={onSaveAIRecommendation}
        />
      )}
      {isAdminLoginOpen && <AdminLoginModal isOpen={isAdminLoginOpen} onClose={() => setIsAdminLoginOpen(false)} onLogin={handleLogin} />}
      {isExitModalOpen && <ExitModal isOpen={isExitModalOpen} onClose={() => { setIsExitModalOpen(false); safePushState({ noBackExitsApp: true }, ''); }} />}
      {isPinnedMemoOpen && (
        <PinnedMemoModal 
          isOpen={isPinnedMemoOpen} 
          onClose={() => setIsPinnedMemoOpen(false)} 
          memo={currentPinnedMemo} 
        />
      )}
    </div>
  );
};

export default App;
