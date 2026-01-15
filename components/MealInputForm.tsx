
import React, { useState, useMemo, useEffect } from 'react';
import { MealRecord, Ingredient, MealType } from '../types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(
    editTarget ? (ingredients.find(i => i.uuid === editTarget.ingredient_uuid) || null) : null
  );
  const [amount, setAmount] = useState(editTarget?.amount.toString() || '100');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBase, setNewBase] = useState('100');
  const [newKcal, setNewKcal] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newFat, setNewFat] = useState('');

  useEffect(() => {
    if (!prefilledType && !editTarget) {
      const h = parseInt(time.split(':')[0]);
      const totalMin = h * 60 + parseInt(time.split(':')[1]);
      if (totalMin >= 360 && totalMin < 710) setType(MealType.BREAKFAST);
      else if (totalMin >= 710 && totalMin < 840) setType(MealType.LUNCH);
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
        carbs: parseFloat(newCarbs || '0'),
        protein: parseFloat(newProtein || '0'),
        fat: parseFloat(newFat || '0'),
        sugar: 0,
        fiber: 0,
        is_bookmarked: false
      };
      finalIngredient = newIngData;
    }
    if (!finalIngredient || !preview) return;
    const newMeal: MealRecord = {
      uuid: editTarget?.uuid || crypto.randomUUID(),
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

  const handleDelete = () => {
    if (editTarget && onDelete) {
      onDelete(editTarget.uuid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-black">{editTarget ? '기록 수정' : '식단 입력'}</h2>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
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
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">분류</label>
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
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">식재료 검색</label>
                <div className="relative">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="닭가슴살, 현미밥 등..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-4 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm font-medium" 
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {!searchTerm && bookmarkedIngredients.length > 0 && (
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">자주 먹는 식재료 ★</p>
                   <div className="flex flex-wrap gap-2">
                     {bookmarkedIngredients.map(i => (
                       <button 
                         key={i.uuid} 
                         onClick={() => setSelectedIngredient(i)}
                         className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 hover:bg-indigo-100"
                       >
                         {i.name}
                       </button>
                     ))}
                   </div>
                </div>
              )}

              <div className="space-y-2">
                {filteredIngredients.map(i => (
                  <button 
                    key={i.uuid} 
                    onClick={() => { setSelectedIngredient(i); setSearchTerm(''); }}
                    className="w-full text-left p-4 bg-white border border-gray-100 hover:border-indigo-500 rounded-2xl flex justify-between items-center transition-all shadow-sm group"
                  >
                    <div className="flex items-center space-x-3">
                      {i.is_bookmarked && <span className="text-amber-400">★</span>}
                      <span className="font-bold text-gray-800 group-hover:text-indigo-600">{i.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{i.kcal} kcal / {i.base_amount}g</span>
                  </button>
                ))}
                {searchTerm && filteredIngredients.length === 0 && (
                  <button 
                    onClick={() => { setIsAddingNew(true); setNewName(searchTerm); }}
                    className="w-full p-6 border-2 border-dashed border-indigo-200 rounded-[32px] text-indigo-500 text-sm font-black bg-indigo-50/50 flex flex-col items-center space-y-2"
                  >
                    <span className="text-2xl">🥗</span>
                    <span>"{searchTerm}" 새로 등록하기</span>
                  </button>
                )}
              </div>
            </div>
          ) : isAddingNew ? (
            <div className="space-y-4 bg-indigo-50/30 p-5 rounded-[32px] border border-indigo-100 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">새 식재료 정보</h3>
                <button onClick={() => setIsAddingNew(false)} className="text-[10px] text-gray-400 underline font-bold">검색으로 돌아가기</button>
              </div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="이름 (예: 그릭요거트)" className="w-full p-3 rounded-xl border ring-offset-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-[10px] text-gray-400 font-bold ml-1">기준 (g)</label>
                   <input value={newBase} onChange={e => setNewBase(e.target.value)} className="w-full p-3 rounded-xl border" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] text-gray-400 font-bold ml-1">칼로리 (kcal)</label>
                   <input value={newKcal} onChange={e => setNewKcal(e.target.value)} className="w-full p-3 rounded-xl border" />
                </div>
              </div>
              {newName && newKcal && (
                <div className="pt-4 border-t border-indigo-100">
                  <label className="block text-[10px] font-black text-indigo-600 mb-2 uppercase">지금 먹은 양 (g)</label>
                  <input type="number" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-indigo-500 text-3xl font-black focus:ring-0 outline-none text-center" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-50/50 p-6 rounded-[40px] flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-indigo-600 text-2xl flex items-center">
                    {selectedIngredient?.name}
                    {selectedIngredient?.is_bookmarked && <span className="ml-2 text-lg text-amber-400">★</span>}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{selectedIngredient?.base_amount}g 당 {selectedIngredient?.kcal}kcal</p>
                </div>
                {!editTarget && <button onClick={() => setSelectedIngredient(null)} className="text-xs text-indigo-400 font-bold underline bg-white px-3 py-1 rounded-full shadow-sm">변경</button>}
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 ml-1 uppercase">지금 얼마나 드셨나요?</label>
                <div className="relative">
                  <input 
                    autoFocus
                    type="number" 
                    step="0.1" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="w-full p-6 bg-white rounded-3xl border-none ring-2 ring-indigo-500 text-4xl font-black focus:ring-4 transition-all outline-none text-center" 
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl italic">g</span>
                </div>
              </div>

              {preview && (
                <div className="grid grid-cols-4 gap-2 bg-indigo-600 p-4 rounded-3xl text-white shadow-lg shadow-indigo-100">
                  <div className="text-center"><p className="text-[8px] opacity-70 uppercase font-black">kcal</p><p className="font-black text-lg">{Math.round(preview.kcal)}</p></div>
                  <div className="text-center"><p className="text-[8px] opacity-70 uppercase font-black">탄</p><p className="font-bold">{Math.round(preview.carbs)}g</p></div>
                  <div className="text-center"><p className="text-[8px] opacity-70 uppercase font-black">단</p><p className="font-bold">{Math.round(preview.protein)}g</p></div>
                  <div className="text-center"><p className="text-[8px] opacity-70 uppercase font-black">지</p><p className="font-bold">{Math.round(preview.fat)}g</p></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex space-x-3 sticky bottom-0">
          {editTarget && (
            <button 
              onClick={handleDelete}
              className="px-6 py-4 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 active:bg-red-100 transition-all text-sm"
            >
              삭제
            </button>
          )}
          {!editTarget && (
            <button 
              disabled={!preview}
              onClick={() => handleSave(true)}
              className="flex-1 py-4 px-2 border-2 border-indigo-600 text-indigo-600 font-black rounded-2xl active:bg-indigo-100 disabled:opacity-30 disabled:border-gray-200 disabled:text-gray-300 transition-all text-sm"
            >
              + 추가 기록
            </button>
          )}
          <button 
            disabled={!preview}
            onClick={() => handleSave(false)}
            className="flex-1 py-4 px-2 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-30 transition-all text-sm"
          >
            {editTarget ? '기록 업데이트' : '저장 후 닫기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealInputForm;
