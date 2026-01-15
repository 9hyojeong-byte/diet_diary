
import React, { useState, useMemo, useEffect } from 'react';
import { MealRecord, Ingredient, MealType, MealStatus } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  prefilledType: MealType | null;
  editTarget?: MealRecord | null;
  ingredients: Ingredient[];
  onSave: (meal: MealRecord, ingredient?: Ingredient) => void;
  onDelete?: (uuid: string) => void;
}

const MealInputForm: React.FC<Props> = ({ isOpen, onClose, selectedDate, prefilledType, editTarget, ingredients, onSave, onDelete }) => {
  const getKSTTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[1].slice(0, 5);
  };

  const [date, setDate] = useState(editTarget?.date || selectedDate);
  const [time, setTime] = useState(editTarget?.time || getKSTTime());
  const [type, setType] = useState<MealType>(editTarget?.type || prefilledType || MealType.BREAKFAST);
  
  // 상태 선택 UI를 제거하고, 기본값은 ACTUAL로 설정 (수동 PLANNED 전환은 스와이프로 유도)
  const [status, setStatus] = useState<MealStatus>(editTarget?.status || MealStatus.ACTUAL);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(
    editTarget ? (ingredients.find(i => i.uuid === editTarget.ingredient_uuid) || null) : null
  );
  const [amount, setAmount] = useState(editTarget?.amount.toString() || '1');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBase, setNewBase] = useState('1');
  const [newKcal, setNewKcal] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newFat, setNewFat] = useState('');
  const [shouldSaveToIngredients, setShouldSaveToIngredients] = useState(false);

  useEffect(() => {
    if (isAddingNew) {
      const c = parseFloat(newCarbs) || 0;
      const p = parseFloat(newProtein) || 0;
      const f = parseFloat(newFat) || 0;
      const calculated = (c * 4) + (p * 4) + (f * 9);
      if (calculated > 0) {
        setNewKcal(calculated.toFixed(1));
      }
    }
  }, [newCarbs, newProtein, newFat, isAddingNew]);

  useEffect(() => {
    if (!prefilledType && !editTarget) {
      const h = parseInt(time.split(':')[0]);
      const m = parseInt(time.split(':')[1]);
      const totalMin = h * 60 + m;
      if (totalMin >= 360 && totalMin < 720) setType(MealType.BREAKFAST);
      else if (totalMin >= 720 && totalMin < 840) setType(MealType.LUNCH);
      else if (totalMin >= 840 && totalMin < 1080) setType(MealType.SNACK);
      else setType(MealType.DINNER);
    }
  }, [time, prefilledType, editTarget]);

  const bookmarkedIngredients = useMemo(() => {
    return ingredients.filter(i => i.is_bookmarked).slice(0, 8);
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return [];
    return ingredients
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b.is_bookmarked ? 1 : 0) - (a.is_bookmarked ? 1 : 0))
      .slice(0, 8);
  }, [searchTerm, ingredients]);

  const preview = useMemo(() => {
    if (isAddingNew) {
      const factor = parseFloat(amount) / (parseFloat(newBase) || 1);
      return {
        kcal: (parseFloat(newKcal) || 0) * factor,
        carbs: (parseFloat(newCarbs) || 0) * factor,
        protein: (parseFloat(newProtein) || 0) * factor,
        fat: (parseFloat(newFat) || 0) * factor,
        sugar: 0,
        fiber: 0,
      };
    }
    const ing = selectedIngredient;
    if (!ing || !amount) return null;
    const factor = parseFloat(amount) / ing.base_amount;
    return {
      kcal: ing.kcal * factor,
      carbs: (ing.carbs || 0) * factor,
      protein: (ing.protein || 0) * factor,
      fat: (ing.fat || 0) * factor,
      sugar: (ing.sugar || 0) * factor,
      fiber: (ing.fiber || 0) * factor,
    };
  }, [selectedIngredient, amount, isAddingNew, newBase, newKcal, newCarbs, newProtein, newFat]);

  const handleSave = (keepOpen: boolean) => {
    let finalIngredientUuid = selectedIngredient?.uuid || 'direct-entry';
    let finalIngredientName = selectedIngredient?.name || newName || '직접 입력 식단';
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
    
    const newMeal: MealRecord = {
      uuid: editTarget?.uuid || crypto.randomUUID(),
      type,
      status,
      date,
      time,
      ingredient_name: finalIngredientName,
      ingredient_uuid: finalIngredientUuid,
      amount: parseFloat(amount),
      ...preview
    };
    
    onSave(newMeal, newIngData);
    
    if (keepOpen) {
      setSearchTerm('');
      setSelectedIngredient(null);
      setAmount('1');
      setIsAddingNew(false);
      setNewName('');
      setNewKcal('');
      setNewCarbs('');
      setNewProtein('');
      setNewFat('');
      setShouldSaveToIngredients(false);
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    if (editTarget && onDelete) {
      onDelete(editTarget.uuid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-black">{editTarget ? '기록 수정' : '식단 입력'}</h2>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 실제/예정 스위치 제거됨: 입력 시 기본은 ACTUAL이며 상세 변경은 메인 리스트 스와이프로 유도 */}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">날짜</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 p-3 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-gray-50 p-3 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">식사 분류</label>
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-xs rounded-xl transition-all ${type === t ? 'bg-white shadow-md font-black text-indigo-600' : 'text-gray-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!isAddingNew && !selectedIngredient ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">식재료 검색</label>
                  <button onClick={() => setIsAddingNew(true)} className="text-[10px] font-black text-indigo-600 underline">직접 입력하기</button>
                </div>
                <div className="relative">
                  <input autoFocus type="text" placeholder="식재료 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-4 rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                {filteredIngredients.map(i => (
                  <button key={i.uuid} onClick={() => { setSelectedIngredient(i); setSearchTerm(''); }} className="w-full text-left p-4 bg-white border border-gray-100 hover:border-indigo-500 rounded-2xl flex justify-between items-center transition-all shadow-sm group">
                    <div className="flex items-center space-x-3">
                      {i.is_bookmarked && <span className="text-amber-400">★</span>}
                      <span className="font-bold text-gray-800">{i.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{i.kcal} kcal / {i.base_amount}g</span>
                  </button>
                ))}
              </div>
            </div>
          ) : isAddingNew ? (
            <div className="space-y-5 bg-indigo-50/30 p-5 rounded-[32px] border border-indigo-100 animate-in zoom-in duration-300">
               <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">직접 입력</h3>
                <button onClick={() => setIsAddingNew(false)} className="text-[10px] text-gray-400 underline font-bold">돌아가기</button>
              </div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="이름 (예: 엄마표 볶음밥)" className="w-full p-4 rounded-2xl border bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="탄(g)" value={newCarbs} onChange={e => setNewCarbs(e.target.value)} className="w-full p-3 rounded-xl border text-center font-bold" />
                  <input type="number" placeholder="단(g)" value={newProtein} onChange={e => setNewProtein(e.target.value)} className="w-full p-3 rounded-xl border text-center font-bold" />
                  <input type="number" placeholder="지(g)" value={newFat} onChange={e => setNewFat(e.target.value)} className="w-full p-3 rounded-xl border text-center font-bold" />
              </div>
              <div className="pt-4 border-t border-indigo-100">
                <label className="block text-[10px] font-black text-indigo-600 mb-2 uppercase">양 (g)</label>
                <input type="number" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-6 rounded-3xl border-2 border-indigo-500 text-4xl font-black text-center bg-white" />
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/50 p-6 rounded-[40px] flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-indigo-600 text-2xl">{selectedIngredient?.name}</h3>
                  <p className="text-xs text-gray-400">{selectedIngredient?.base_amount}g 당 {selectedIngredient?.kcal}kcal</p>
                </div>
                {!editTarget && <button onClick={() => setSelectedIngredient(null)} className="text-xs text-indigo-400 font-bold underline bg-white px-3 py-1 rounded-full">변경</button>}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase">양 (g)</label>
                <input autoFocus type="number" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-6 bg-white rounded-3xl border-none ring-2 ring-indigo-500 text-4xl font-black focus:ring-4 outline-none text-center" />
              </div>
              {preview && (
                <div className="grid grid-cols-4 gap-2 bg-indigo-600 p-4 rounded-3xl text-white text-center">
                  <div><p className="text-[8px] opacity-70 uppercase font-black">kcal</p><p className="font-black text-lg">{Math.round(preview.kcal)}</p></div>
                  <div><p className="text-[8px] opacity-70 uppercase font-black">탄</p><p className="font-bold">{Math.round(preview.carbs)}g</p></div>
                  <div><p className="text-[8px] opacity-70 uppercase font-black">단</p><p className="font-bold">{Math.round(preview.protein)}g</p></div>
                  <div><p className="text-[8px] opacity-70 uppercase font-black">지</p><p className="font-bold">{Math.round(preview.fat)}g</p></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex space-x-3 sticky bottom-0">
          {editTarget && (
            <button onClick={handleDelete} className="px-6 py-4 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 transition-all text-sm">삭제</button>
          )}
          {!editTarget && (
            <button disabled={!preview} onClick={() => handleSave(true)} className="flex-1 py-4 px-2 border-2 border-indigo-600 text-indigo-600 font-black rounded-2xl disabled:opacity-30 transition-all text-sm">+ 계속 추가</button>
          )}
          <button disabled={!preview} onClick={() => handleSave(false)} className="flex-1 py-4 px-2 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-30 transition-all text-sm">
            {editTarget ? '기록 업데이트' : '저장 후 닫기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealInputForm;
