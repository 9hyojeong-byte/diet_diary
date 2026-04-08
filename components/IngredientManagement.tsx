
import React, { useState, useMemo, useRef } from 'react';
import { Ingredient } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  ingredients: Ingredient[];
  isAdmin: boolean;
  onToggleBookmark: (uuid: string) => void;
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (ing: Ingredient) => void;
  onDeleteIngredient: (uuid: string) => void;
  trialMessage?: string;
}

const IngredientManagement: React.FC<Props> = ({ ingredients, isAdmin, onToggleBookmark, onAddIngredient, onUpdateIngredient, onDeleteIngredient, trialMessage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const sortedIngredients = useMemo(() => {
    return [...ingredients]
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const aBooked = !!a.is_bookmarked;
        const bBooked = !!b.is_bookmarked;
        if (aBooked && !bBooked) return -1;
        if (!aBooked && bBooked) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [ingredients, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800">식재료 관리</h2>
        <button 
          onClick={() => isAdmin ? setIsAdding(true) : alert(trialMessage)}
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
              onClick={() => isAdmin ? setEditTarget(ing) : alert(trialMessage)}
              className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center group relative overflow-hidden active:scale-[0.98] transition-all ${ing.is_bookmarked ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-50'}`}
            >
              {ing.is_bookmarked && (
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              )}
              <div className="flex items-center space-x-4">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAdmin) onToggleBookmark(ing.uuid);
                    else alert(trialMessage);
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
                  </h4>
                  <p className="text-xs text-gray-400">기준: {ing.base_amount}g / {ing.kcal}kcal</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex space-x-2 text-[10px] font-bold text-gray-400">
                  <span className="text-orange-600">C {ing.carbs}g</span>
                  <span className="text-emerald-600">P {ing.protein}g</span>
                  <span className="text-blue-600">F {ing.fat}g</span>
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      setPreviewImage(reader.result as string);
      setIsAnalyzing(true);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              },
              {
                text: "이 영양성분표 이미지에서 식품의 이름, 1회 제공량(g), 칼로리(kcal), 탄수화물(g), 단백질(g), 지방(g)을 추출해줘. JSON 형식으로 응답해줘.",
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                base_amount: { type: Type.NUMBER },
                kcal: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              },
              required: ["name", "base_amount", "kcal", "carbs", "protein", "fat"],
            },
          },
        });

        const result = JSON.parse(response.text);
        setFormData({
          name: result.name || formData.name,
          base: result.base_amount?.toString() || formData.base,
          kcal: result.kcal?.toString() || formData.kcal,
          carbs: result.carbs?.toString() || formData.carbs,
          protein: result.protein?.toString() || formData.protein,
          fat: result.fat?.toString() || formData.fat,
        });
      } catch (error) {
        console.error("AI Analysis failed", error);
        alert("이미지 분석에 실패했습니다. 수동으로 입력해주세요.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 bg-indigo-600 text-white shrink-0">
          <h3 className="text-xl font-bold">{target ? '식재료 수정' : '신규 식재료 등록'}</h3>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {!target && (
            <div className="space-y-3">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageAnalysis}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center space-x-2 border-2 border-dashed border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>이미지 분석 중...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>이미지 인식 (영양성분표)</span>
                  </>
                )}
              </button>
              {previewImage && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
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
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">탄수화물(g)</label>
              <input placeholder="탄" value={formData.carbs} onChange={e => setFormData({...formData, carbs: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">단백질(g)</label>
              <input placeholder="단" value={formData.protein} onChange={e => setFormData({...formData, protein: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold ml-1 uppercase">지방(g)</label>
              <input placeholder="지" value={formData.fat} onChange={e => setFormData({...formData, fat: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border text-sm" />
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
