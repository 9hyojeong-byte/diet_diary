
import React, { useState, useMemo, useEffect } from 'react';
import { MealRecord, Ingredient, MealType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  prefilledType: MealType | null;
  editingMeal: MealRecord | null;
  ingredients: Ingredient[];
  onSave: (meal: MealRecord) => void;
  onSaveIngredient: (ingredient: Ingredient) => void;
  onDelete: (uuid: string) => void;
}

const MealInputForm: React.FC<Props> = ({ isOpen, onClose, selectedDate, prefilledType, editingMeal, ingredients, onSave, onSaveIngredient, onDelete }) => {
  const getKSTTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kst.toISOString().split('T')[1].slice(0, 5);
  };

  const [date, setDate] = useState(editingMeal?.date || selectedDate);
  const [time, setTime] = useState(editingMeal?.time || getKSTTime());
  const [type, setType] = useState<MealType>(editingMeal?.type || prefilledType || MealType.BREAKFAST);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState<string>(editingMeal?.amount?.toString() || '100');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBase, setNewBase] = useState('100');
  const [newKcal, setNewKcal] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newFat, setNewFat] = useState('');

  // 편집 모드일 때 초기 식재료 설정
  useEffect(() => {
    if (editingMeal && ingredients.length > 0) {
      const found = ingredients.find(i => String(i.uuid).trim() === String(editingMeal.ingredient_uuid).trim());
      if (found) setSelectedIngredient(found);
    }
  }, [editingMeal, ingredients]);

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

  const handleSaveIngredient = () => {
    if (!newName || !newBase || !newKcal) {
      alert("이름, 기준양, 칼로리는 필수 입력 항목입니다.");
      return;
    }

    const newIngData: Ingredient = {
      uuid: crypto.randomUUID(),
      name: newName,
      base_amount: parseFloat(newBase) || 100,
      kcal: parseFloat(newKcal) || 0,
      carbs: parseFloat(newCarbs) || 0,
      protein: parseFloat(newProtein) || 0,
      fat: parseFloat(newFat) || 0,
      sugar: 0,
      fiber: 0
    };

    onSaveIngredient(newIngData);
    setSelectedIngredient(newIngData);
    setIsAddingNew(false);
    setSearchTerm('');
  };

  const handleSaveMeal = (keepOpen: boolean) => {
    if (!selectedIngredient || !preview) return;

    const mealData: MealRecord = {
      uuid: editingMeal?.uuid || crypto.randomUUID(),
      type,
      date,
      time,
      ingredient_uuid: selectedIngredient.uuid,
      amount: parseFloat(amount),
      ...preview
    };

    onSave(mealData);

    if (keepOpen && !editingMeal) {
      setSearchTerm('');
      setSelectedIngredient(null);
      setAmount('100');
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    if (editingMeal) {
      onDelete(editingMeal.uuid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold">
            {isAddingNew ? '신규 식재료 등록' : editingMeal ? '식단 수정' : '식단 입력'}
          </h2>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* 식단 입력 시에만 날짜/시간/분류 표시 */}
          {!isAddingNew && (
            <>
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
            </>
          )}

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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">새 식재료 정보 입력</h3>
                <button onClick={() => setIsAddingNew(false)} className="text-[10px] text-gray-400 underline">취소하고 돌아가기</button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">식재료명</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="예: 닭가슴살 스테이크" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">기준양 (g)</label>
                    <input type="number" value={newBase} onChange={e => setNewBase(e.target.value)} placeholder="100" className="w-full p-2.5 rounded-xl border text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">칼로리 (kcal)</label>
                    <input type="number" value={newKcal} onChange={e => setNewKcal(e.target.value)} placeholder="0" className="w-full p-2.5 rounded-xl border text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">탄수화물 (g)</label>
                    <input type="number" value={newCarbs} onChange={e => setNewCarbs(e.target.value)} placeholder="0" className="w-full p-2.5 rounded-xl border text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">단백질 (g)</label>
                    <input type="number" value={newProtein} onChange={e => setNewProtein(e.target.value)} placeholder="0" className="w-full p-2.5 rounded-xl border text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">지방 (g)</label>
                    <input type="number" value={newFat} onChange={e => setNewFat(e.target.value)} placeholder="0" className="w-full p-2.5 rounded-xl border text-sm" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveIngredient}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform mt-4"
              >
                식재료 저장하기
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50 p-4 rounded-2xl flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-indigo-600 text-lg">{selectedIngredient?.name}</h3>
                  <p className="text-xs text-gray-400">기준: {selectedIngredient?.base_amount}g 당 {selectedIngredient?.kcal}kcal</p>
                </div>
                {!editingMeal && (
                  <button onClick={() => setSelectedIngredient(null)} className="text-xs text-gray-400 underline">다른 식재료 선택</button>
                )}
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
          {!isAddingNew && (
            editingMeal ? (
              <>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 px-2 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 active:bg-red-100"
                >
                  삭제
                </button>
                <button 
                  disabled={!preview}
                  onClick={() => handleSaveMeal(false)}
                  className="flex-[2] py-3 px-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-30"
                >
                  수정 완료
                </button>
              </>
            ) : (
              <>
                <button 
                  disabled={!preview}
                  onClick={() => handleSaveMeal(true)}
                  className="flex-1 py-3 px-2 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl active:bg-indigo-100 disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300"
                >
                  다음 음식 입력
                </button>
                <button 
                  disabled={!preview}
                  onClick={() => handleSaveMeal(false)}
                  className="flex-1 py-3 px-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-30"
                >
                  저장 후 닫기
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MealInputForm;
