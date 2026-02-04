
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  prefilledType: MealType | null;
  editTarget?: MealRecord | null;
  ingredients: Ingredient[];
  meals: MealRecord[];
  isAdmin: boolean;
  onSave: (meal: MealRecord, ingredient?: Ingredient) => void;
  onDelete?: (uuid: string) => Promise<boolean>;
  trialMessage?: string;
}

const MealInputForm: React.FC<Props> = ({ isOpen, onClose, selectedDate, prefilledType, editTarget, ingredients, meals, isAdmin, onSave, onDelete, trialMessage }) => {
  const getKSTTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[1].slice(0, 5);
  };

  const isDirectEntryEdit = editTarget?.ingredient_uuid === 'direct-entry';

  const [date, setDate] = useState(editTarget?.date || selectedDate);
  const [time, setTime] = useState(editTarget?.time || getKSTTime());
  const [type, setType] = useState<MealType>(editTarget?.type || prefilledType || MealType.BREAKFAST);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(
    (editTarget && !isDirectEntryEdit) ? (ingredients.find(i => String(i.uuid) === String(editTarget.ingredient_uuid)) || null) : null
  );
  const [amount, setAmount] = useState(editTarget?.amount.toString() || '1');
  
  const [isAddingNew, setIsAddingNew] = useState(isDirectEntryEdit);
  const [newName, setNewName] = useState(editTarget?.ingredient_name || '');
  const [newBase, setNewBase] = useState(editTarget?.amount.toString() || '1');
  const [newKcal, setNewKcal] = useState(editTarget?.kcal.toString() || '');
  const [newCarbs, setNewCarbs] = useState(editTarget?.carbs.toString() || '');
  const [newProtein, setNewProtein] = useState(editTarget?.protein.toString() || '');
  const [newFat, setNewFat] = useState(editTarget?.fat.toString() || '');
  const [shouldSaveToIngredients, setShouldSaveToIngredients] = useState(false);

  const yesterdayMeals = useMemo(() => {
    if (editTarget) return []; 
    const current = new Date(date);
    current.setDate(current.getDate() - 1);
    const yesterdayStr = current.toISOString().split('T')[0];
    return meals.filter(m => m.date === yesterdayStr && m.type === type && m.status === MealStatus.ACTUAL);
  }, [meals, date, type, editTarget]);

  const handleSelectYesterdayMeal = useCallback((meal: MealRecord) => {
    const isDirect = meal.ingredient_uuid === 'direct-entry';
    const mealAmount = meal.amount.toString();
    if (isDirect) {
      setIsAddingNew(true);
      setNewName(meal.ingredient_name || '');
      setAmount(mealAmount);
      setNewBase(mealAmount); 
      setNewKcal(meal.kcal.toString());
      setNewCarbs(meal.carbs.toString());
      setNewProtein(meal.protein.toString());
      setNewFat(meal.fat.toString());
    } else {
      const ing = ingredients.find(i => String(i.uuid) === String(meal.ingredient_uuid));
      if (ing) {
        setIsAddingNew(false);
        setSelectedIngredient(ing);
        setAmount(mealAmount);
      } else {
        setIsAddingNew(true);
        setNewName(meal.ingredient_name || '복구된 메뉴');
        setAmount(mealAmount);
        setNewBase(mealAmount);
        setNewKcal(meal.kcal.toString());
        setNewCarbs(meal.carbs.toString());
        setNewProtein(meal.protein.toString());
        setNewFat(meal.fat.toString());
      }
    }
  }, [ingredients]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 20);
  }, [ingredients, searchTerm]);

  const bookmarks = useMemo(() => {
    return ingredients.filter(i => i.is_bookmarked).slice(0, 10);
  }, [ingredients]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAddingNew) {
      const c = parseFloat(newCarbs) || 0;
      const p = parseFloat(newProtein) || 0;
      const f = parseFloat(newFat) || 0;
      const calculated = (c * 4) + (p * 4) + (f * 9);
      if (calculated >= 0) setNewKcal(calculated.toFixed(1));
    }
  }, [newCarbs, newProtein, newFat, isAddingNew]);

  const preview = useMemo(() => {
    if (isAddingNew) {
      const currentAmount = parseFloat(amount) || 0;
      const currentBase = parseFloat(newBase) || 1;
      const factor = currentBase === 0 ? 0 : currentAmount / currentBase;
      return {
        kcal: (parseFloat(newKcal) || 0) * factor,
        carbs: (parseFloat(newCarbs) || 0) * factor,
        protein: (parseFloat(newProtein) || 0) * factor,
        fat: (parseFloat(newFat) || 0) * factor,
      };
    }
    const ing = selectedIngredient;
    if (!ing || !amount) return null;
    const factor = ing.base_amount === 0 ? 0 : parseFloat(amount) / ing.base_amount;
    return {
      kcal: ing.kcal * factor,
      carbs: (ing.carbs || 0) * factor,
      protein: (ing.protein || 0) * factor,
      fat: (ing.fat || 0) * factor,
    };
  }, [selectedIngredient, amount, isAddingNew, newBase, newKcal, newCarbs, newProtein, newFat]);

  const handleSave = (finalStatus: MealStatus) => {
    if (!isAdmin) {
      alert(trialMessage);
      return;
    }
    let finalIngredientUuid = selectedIngredient?.uuid || 'direct-entry';
    let finalIngredientName = isAddingNew ? (newName || '직접 입력 식단') : (selectedIngredient?.name || '식재료 정보 없음');
    let newIngData: Ingredient | undefined;
    
    if (isAddingNew && shouldSaveToIngredients) {
      newIngData = {
        uuid: crypto.randomUUID(),
        name: finalIngredientName,
        base_amount: parseFloat(newBase) || 1,
        kcal: parseFloat(newKcal) || 0,
        carbs: parseFloat(newCarbs || '0'),
        protein: parseFloat(newProtein || '0'),
        fat: parseFloat(newFat || '0'),
        sugar: 0,
        fiber: 0,
        is_bookmarked: false
      };
      finalIngredientUuid = newIngData.uuid;
    }
    
    if (!preview) return;
    
    onSave({
      uuid: editTarget?.uuid || crypto.randomUUID(),
      type,
      status: finalStatus,
      date,
      time,
      ingredient_name: finalIngredientName,
      ingredient_uuid: finalIngredientUuid,
      amount: parseFloat(amount),
      kcal: preview.kcal,
      carbs: preview.carbs,
      protein: preview.protein,
      fat: preview.fat,
      sugar: 0,
      fiber: 0
    }, newIngData);
    onClose();
  };

  const confirmDelete = async () => {
    if (!isAdmin) {
      alert(trialMessage);
      return;
    }
    if (editTarget && onDelete) {
      setIsDeleting(true);
      setShowDeleteConfirm(false); 
      try {
        const success = await onDelete(editTarget.uuid);
        if (success) onClose();
        else setIsDeleting(false);
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-10 relative" onClick={e => e.stopPropagation()}>
        
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[130] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">정말 삭제할까요?</h3>
            <p className="text-gray-500 font-medium mb-8">기록된 영양 데이터가 통계에서 제외됩니다.</p>
            <div className="flex flex-col w-full space-y-3">
              <button onClick={confirmDelete} className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">네, 삭제할게요</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95 transition-all">아니오, 유지할게요</button>
            </div>
          </div>
        )}

        {isDeleting && (
          <div className="absolute inset-0 z-[140] bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center animate-in fade-in">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-bold text-red-500">삭제하는 중...</p>
          </div>
        )}

        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-black">{editTarget ? '기록 수정' : '식단 입력'}</h2>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 pb-3 space-y-4 overflow-y-auto min-h-[300px]">
          <div className="space-y-4 p-4 bg-gray-50 rounded-3xl">
            <div className="flex bg-gray-200/50 p-1 rounded-2xl">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map((mType) => (
                <button
                  key={mType}
                  onClick={() => setType(mType)}
                  className={`flex-1 py-2.5 text-xs rounded-xl transition-all font-black ${
                    type === mType ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  {mType}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="absolute left-3 top-1 text-[8px] font-black text-gray-400 uppercase">날짜</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full pt-4 pb-2 px-3 rounded-xl border-none ring-1 ring-gray-200 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div className="relative">
                <label className="absolute left-3 top-1 text-[8px] font-black text-gray-400 uppercase">시간</label>
                <input 
                  type="time" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  className="w-full pt-4 pb-2 px-3 rounded-xl border-none ring-1 ring-gray-200 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {!isAddingNew && !selectedIngredient ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="relative">
                <input 
                  autoFocus 
                  type="text" 
                  placeholder="식재료 검색..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full p-4 rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium" 
                />
                <button onClick={() => setIsAddingNew(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 underline">직접 입력</button>
              </div>

              {searchTerm.trim() === '' ? (
                <div className="space-y-5">
                  {yesterdayMeals.length > 0 && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1 flex items-center">
                        <span className="mr-1">🕒</span> 어제 먹은 {type} 메뉴 ({yesterdayMeals.length})
                      </h3>
                      <div className="space-y-2">
                        {yesterdayMeals.map((meal) => (
                          <button 
                            key={meal.uuid}
                            onClick={() => handleSelectYesterdayMeal(meal)}
                            className="w-full p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-50 flex justify-between items-center active:scale-[0.98] transition-all group border-b-2 border-indigo-700"
                          >
                            <div className="text-left flex-1 truncate mr-2">
                              <p className="text-[10px] font-black opacity-70 mb-0.5">그대로 가져오기</p>
                              <p className="text-sm font-bold truncate">{meal.ingredient_name || '식재료'} / {meal.amount}g</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2H7a2 2 0 00-2 2v6H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">자주 찾는 식재료</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {bookmarks.length > 0 ? bookmarks.map(i => (
                        <button key={i.uuid} onClick={() => setSelectedIngredient(i)} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left hover:bg-indigo-100 transition-colors flex items-center space-x-2">
                          <span className="text-amber-500 text-xs">⭐</span>
                          <p className="text-xs font-bold text-indigo-900 truncate">{i.name}</p>
                        </button>
                      )) : (
                        <p className="col-span-2 text-center py-4 text-xs text-gray-300 italic">즐겨찾기한 식재료가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1">검색 결과</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {searchResults.length > 0 ? searchResults.map(i => (
                      <button key={i.uuid} onClick={() => setSelectedIngredient(i)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm hover:border-indigo-300 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{i.name}</p>
                          <p className="text-[10px] text-gray-400">{i.base_amount}g 기준 {i.kcal}kcal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-indigo-600">P {i.protein}g</p>
                        </div>
                      </button>
                    )) : (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl">
                        <p className="text-xs text-gray-400 mb-3">검색 결과가 없습니다.</p>
                        <button onClick={() => { setIsAddingNew(true); setNewName(searchTerm); }} className="text-xs font-black text-indigo-600 underline">'{searchTerm}' 직접 등록하기</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : isAddingNew ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">식단 이름</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="이름 (예: 엄마표 볶음밥)" className="w-full p-4 rounded-2xl border bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase text-center block">탄(g)</label>
                  <input type="number" placeholder="0" value={newCarbs} onChange={e => setNewCarbs(e.target.value)} className="w-full p-3 rounded-xl border text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase text-center block">단(g)</label>
                  <input type="number" placeholder="0" value={newProtein} onChange={e => setNewProtein(e.target.value)} className="w-full p-3 rounded-xl border text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase text-center block">지(g)</label>
                  <input type="number" placeholder="0" value={newFat} onChange={e => setNewFat(e.target.value)} className="w-full p-3 rounded-xl border text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="pt-2 border-t border-indigo-100">
                <div className="flex justify-between items-end mb-1 px-1">
                  <label className="text-[10px] font-black text-indigo-600 uppercase">현재 섭취량 (g)</label>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400">
                      C {Math.round(preview?.carbs || 0)}g · P {Math.round(preview?.protein || 0)}g · F {Math.round(preview?.fat || 0)}g
                    </span>
                    <span className="text-sm font-black text-indigo-600">{Math.round(preview?.kcal || 0)} kcal</span>
                  </div>
                </div>
                <input type="number" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-indigo-500 text-3xl font-black text-center bg-white outline-none" />
              </div>
              {!editTarget && (
                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="saveToIng" checked={shouldSaveToIngredients} onChange={e => setShouldSaveToIngredients(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="saveToIng" className="text-xs font-bold text-gray-500">이 식단 정보를 식재료 목록에도 저장할게요</label>
                </div>
              )}
              {isAddingNew && !isDirectEntryEdit && (
                <button onClick={() => { setIsAddingNew(false); setSelectedIngredient(null); setSearchTerm(''); }} className="w-full py-2 text-xs font-bold text-gray-400 hover:text-indigo-500 underline transition-colors">식재료 검색으로 돌아가기</button>
              )}
            </div>
          ) : (
            <div className="bg-indigo-50/50 p-5 pb-4 rounded-[40px] space-y-4 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-indigo-600 text-2xl truncate mr-4">{selectedIngredient?.name}</h3>
                {!editTarget && <button onClick={() => setSelectedIngredient(null)} className="text-xs text-indigo-400 font-bold underline shrink-0">변경</button>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">양 (g)</label>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] font-bold text-indigo-400">
                      C {Math.round(preview?.carbs || 0)}g · P {Math.round(preview?.protein || 0)}g · F {Math.round(preview?.fat || 0)}g
                    </span>
                    <span className="text-sm font-black text-indigo-600">{Math.round(preview?.kcal || 0)} kcal</span>
                  </div>
                </div>
                <input autoFocus type="number" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 bg-white rounded-3xl ring-2 ring-indigo-500 text-3xl font-black text-center outline-none" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-3 border-t bg-gray-50 flex flex-col space-y-3">
          <div className="flex space-x-2">
            {editTarget && (
              <button 
                onClick={() => isAdmin ? setShowDeleteConfirm(true) : alert(trialMessage)} 
                disabled={isDeleting} 
                className="px-4 py-4 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 transition-all text-xs hover:bg-red-100 active:scale-95 disabled:opacity-30"
              >
                삭제
              </button>
            )}
            <button 
              disabled={!preview || isDeleting} 
              onClick={() => handleSave(MealStatus.PLANNED)} 
              className="flex-1 py-4 bg-white text-gray-500 border border-gray-200 font-black rounded-2xl active:scale-95 disabled:opacity-30 transition-all text-sm"
            >
              예정으로 저장
            </button>
            <button 
              disabled={!preview || isDeleting} 
              onClick={() => handleSave(MealStatus.ACTUAL)} 
              className="flex-[1.5] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl active:scale-95 disabled:opacity-30 transition-all text-sm"
            >
              {editTarget ? '수정 완료' : '식단 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealInputForm;
