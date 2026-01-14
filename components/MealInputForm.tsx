
import React, { useState, useMemo, useEffect } from 'react';
import { MealRecord, Ingredient, MealType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  prefilledType: MealType | null;
  ingredients: Ingredient[];
  onSave: (meal: MealRecord, ingredient?: Ingredient) => void;
}

const MealInputForm: React.FC<Props> = ({ isOpen, onClose, selectedDate, prefilledType, ingredients, onSave }) => {
  // 한국 시간 기준으로 현재 시:분 구하기
  const getKSTTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[1].slice(0, 5);
  };

  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState(getKSTTime());
  const [type, setType] = useState<MealType>(prefilledType || MealType.BREAKFAST);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState<string>('100');
  
  // New Ingredient Mode
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBase, setNewBase] = useState('100');
  const [newKcal, setNewKcal] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newFat, setNewFat] = useState('');

  // Auto-set type based on time if not manually selected
  useEffect(() => {
    if (!prefilledType) {
      const h = parseInt(time.split(':')[0]);
      const m = parseInt(time.split(':')[1]);
      const totalMin = h * 60 + m;

      if (totalMin >= 360 && totalMin < 710) setType(MealType.BREAKFAST);
      else if (totalMin >= 710 && totalMin < 840) setType(MealType.LUNCH);
      else if (totalMin >= 840 && totalMin < 1080) setType(MealType.SNACK);
      else if (totalMin >= 1080 || totalMin < 360) setType(MealType.DINNER);
    }
  }, [time, prefilledType]);

  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return [];
    return ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
  }, [searchTerm, ingredients]);

  const preview = useMemo(() => {
    const ing = selectedIngredient;
    if (!ing || !amount) return null;
    const factor = parseFloat(amount) / ing.base_amount;
    return {
      kcal: ing.kcal * factor,
      carbs: ing.carbs * factor,
      protein: ing.protein * factor,
      fat: ing.fat * factor,
      sugar: ing.sugar * factor,
      fiber: ing.fiber * factor,
    };
  }, [selectedIngredient, amount]);

  const handleSave = (keepOpen: boolean) => {
    let finalIngredient = selectedIngredient;
    let newIngData: Ingredient | undefined;

    if (isAddingNew) {
      newIngData = {
        uuid: crypto.randomUUID(),
        name: newName,
        base_amount: parseFloat(newBase),
        kcal: parseFloat(newKcal),
        carbs: parseFloat(newCarbs),
        protein: parseFloat(newProtein),
        fat: parseFloat(newFat),
        sugar: 0,
        fiber: 0
      };
      finalIngredient = newIngData;
    }

    if (!finalIngredient || !preview) return;

    const newMeal: MealRecord = {
      uuid: crypto.randomUUID(),
      type,
      date,
      time,
      ingredient_uuid: finalIngredient.uuid,
      amount: parseFloat(amount),
      ...preview
    };

    onSave(newMeal, newIngData);

    if (keepOpen) {
      setSearchTerm('');
      setSelectedIngredient(null);
      setAmount('100');
      setIsAddingNew(false);
      setNewName('');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold">식단 입력</h2>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">날짜</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-gray-50 p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">분류</label>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              {[MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${type === t ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-gray-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!isAddingNew && !selectedIngredient ? (
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">식재료 검색</label>
              <input 
                autoFocus
                type="text" 
                placeholder="식재료 이름을 입력하세요..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              <div className="mt-2 space-y-1">
                {filteredIngredients.map(i => (
                  <button 
                    key={i.uuid} 
                    onClick={() => { setSelectedIngredient(i); setSearchTerm(''); }}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl flex justify-between items-center"
                  >
                    <span className="font-medium text-sm">{i.name}</span>
                    <span className="text-[10px] text-gray-400">{i.kcal} kcal / {i.base_amount}g</span>
                  </button>
                ))}
                {searchTerm && filteredIngredients.length === 0 && (
                  <button 
                    onClick={() => { setIsAddingNew(true); setNewName(searchTerm); }}
                    className="w-full p-4 border border-dashed border-indigo-300 rounded-xl text-indigo-500 text-sm font-bold bg-indigo-50"
                  >
                    + "{searchTerm}" 신규 식재료 등록하기
                  </button>
                )}
              </div>
            </div>
          ) : isAddingNew ? (
            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div className="flex justify-between">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">신규 식재료 정보</h3>
                <button onClick={() => setIsAddingNew(false)} className="text-[10px] text-gray-400 underline">검색으로 돌아가기</button>
              </div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="이름" className="w-full p-2 rounded-lg border" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newBase} onChange={e => setNewBase(e.target.value)} placeholder="기준양(g)" className="p-2 rounded-lg border text-sm" />
                <input value={newKcal} onChange={e => setNewKcal(e.target.value)} placeholder="칼로리" className="p-2 rounded-lg border text-sm" />
                <input value={newCarbs} onChange={e => setNewCarbs(e.target.value)} placeholder="탄수화물(g)" className="p-2 rounded-lg border text-sm" />
                <input value={newProtein} onChange={e => setNewProtein(e.target.value)} placeholder="단백질(g)" className="p-2 rounded-lg border text-sm" />
                <input value={newFat} onChange={e => setNewFat(e.target.value)} placeholder="지방(g)" className="p-2 rounded-lg border text-sm col-span-2" />
              </div>
              {newName && newKcal && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1">이번에 먹은 양(g)</label>
                  <input type="number" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 rounded-xl border-2 border-indigo-500 font-bold" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-50 p-4 rounded-2xl flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-indigo-600 text-lg">{selectedIngredient?.name}</h3>
                  <p className="text-xs text-gray-400">기준: {selectedIngredient?.base_amount}g 당 {selectedIngredient?.kcal}kcal</p>
                </div>
                <button onClick={() => setSelectedIngredient(null)} className="text-xs text-gray-400 underline">다른 식재료 선택</button>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">섭취량 (g)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full p-4 rounded-xl border-2 border-indigo-500 text-2xl font-black focus:ring-0 outline-none" 
                />
              </div>

              {preview && (
                <div className="grid grid-cols-4 gap-2 bg-white/60 p-3 rounded-xl">
                  <div className="text-center"><p className="text-[10px] text-gray-400 uppercase">kcal</p><p className="font-bold text-indigo-600">{Math.round(preview.kcal)}</p></div>
                  <div className="text-center"><p className="text-[10px] text-gray-400 uppercase">탄</p><p className="font-bold text-gray-700">{Math.round(preview.carbs)}g</p></div>
                  <div className="text-center"><p className="text-[10px] text-gray-400 uppercase">단</p><p className="font-bold text-gray-700">{Math.round(preview.protein)}g</p></div>
                  <div className="text-center"><p className="text-[10px] text-gray-400 uppercase">지</p><p className="font-bold text-gray-700">{Math.round(preview.fat)}g</p></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          <button 
            disabled={!preview}
            onClick={() => handleSave(true)}
            className="flex-1 py-3 px-2 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl active:bg-indigo-100 disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300"
          >
            다음 음식 입력
          </button>
          <button 
            disabled={!preview}
            onClick={() => handleSave(false)}
            className="flex-1 py-3 px-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-30"
          >
            저장 후 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealInputForm;
