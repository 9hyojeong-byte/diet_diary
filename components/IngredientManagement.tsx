
import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';

interface Props {
  ingredients: Ingredient[];
  onToggleBookmark: (uuid: string) => void;
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (ing: Ingredient) => void;
  onDeleteIngredient: (uuid: string) => void;
}

const IngredientManagement: React.FC<Props> = ({ ingredients, onToggleBookmark, onAddIngredient, onUpdateIngredient, onDeleteIngredient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const sortedIngredients = useMemo(() => {
    return [...ingredients]
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // 북마크 여부 우선순위 (Boolean 강제 변환 후 비교)
        const aBooked = !!a.is_bookmarked;
        const bBooked = !!b.is_bookmarked;
        
        if (aBooked && !bBooked) return -1;
        if (!aBooked && bBooked) return 1;
        
        // 북마크 여부가 같으면 이름순 정렬
        return a.name.localeCompare(b.name);
      });
  }, [ingredients, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800">식재료 관리</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center space-x-2 active:scale-95 transition-transform"
        >
          <span>+ 등록</span>
        </button>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="식재료 이름 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white p-4 pr-12 rounded-2xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-3 pb-24">
        {sortedIngredients.length === 0 ? (
          <div className="py-20 text-center text-gray-400 italic">
            검색 결과가 없습니다.
          </div>
        ) : (
          sortedIngredients.map(ing => (
            <button 
              key={ing.uuid} 
              onClick={() => setEditTarget(ing)}
              className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center group relative overflow-hidden active:scale-[0.98] transition-all ${ing.is_bookmarked ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-50'}`}
            >
              {ing.is_bookmarked && (
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              )}
              <div className="flex items-center space-x-4">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(ing.uuid);
                  }}
                  className={`p-2 rounded-full transition-all ${ing.is_bookmarked ? 'bg-amber-50 text-amber-500 scale-110 shadow-sm' : 'text-gray-300 hover:text-amber-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center">
                    {ing.name}
                    {ing.is_bookmarked && <span className="ml-2 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase">Fav</span>}
                  </h4>
                  <p className="text-xs text-gray-400">기준: {ing.base_amount}g / {ing.kcal}kcal</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex space-x-2 text-[10px] font-bold text-gray-400 uppercase">
                  <span className="text-indigo-600">P {ing.protein}g</span>
                  <span>C {ing.carbs}g</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {(isAdding || editTarget) && (
        <IngredientFormModal 
          target={editTarget} 
          onClose={() => { setIsAdding(false); setEditTarget(null); }} 
          onDelete={onDeleteIngredient}
          onSave={(data) => {
            if (editTarget) onUpdateIngredient(data);
            else onAddIngredient(data);
            setIsAdding(false);
            setEditTarget(null);
          }} 
        />
      )}
    </div>
  );
};

const IngredientFormModal: React.FC<{ target: Ingredient | null, onClose: () => void, onSave: (ing: Ingredient) => void, onDelete: (uuid: string) => void }> = ({ target, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: target?.name || '', 
    base: target?.base_amount?.toString() || '100', 
    kcal: target?.kcal?.toString() || '', 
    carbs: target?.carbs?.toString() || '', 
    protein: target?.protein?.toString() || '', 
    fat: target?.fat?.toString() || ''
  });

  const handleSave = () => {
    if (!formData.name || !formData.kcal) return;
    onSave({
      uuid: target?.uuid || crypto.randomUUID(),
      name: formData.name,
      base_amount: parseFloat(formData.base),
      kcal: parseFloat(formData.kcal),
      carbs: parseFloat(formData.carbs || '0'),
      protein: parseFloat(formData.protein || '0'),
      fat: parseFloat(formData.fat || '0'),
      sugar: target?.sugar || 0,
      fiber: target?.fiber || 0,
      is_bookmarked: target?.is_bookmarked || false
    });
  };

  const handleDelete = () => {
    if (target && confirm('이 식재료를 삭제할까요?')) {
      onDelete(target.uuid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 bg-indigo-600 text-white">
          <h3 className="text-xl font-bold">{target ? '식재료 수정' : '신규 식재료 등록'}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">식재료 이름</label>
            <input 
              placeholder="식재료 이름" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">기준(g)</label>
              <input value={formData.base} onChange={e => setFormData({...formData, base: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">칼로리(kcal)</label>
              <input value={formData.kcal} onChange={e => setFormData({...formData, kcal: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">탄수화물(g)</label>
              <input placeholder="탄수화물" value={formData.carbs} onChange={e => setFormData({...formData, carbs: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">단백질(g)</label>
              <input placeholder="단백질" value={formData.protein} onChange={e => setFormData({...formData, protein: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            {target && (
              <button onClick={handleDelete} className="px-4 py-3 bg-red-50 text-red-500 font-bold border border-red-100 rounded-xl active:scale-95 transition-transform">삭제</button>
            )}
            <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold border rounded-xl">취소</button>
            <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientManagement;
