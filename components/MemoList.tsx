import React, { useState, useMemo } from 'react';
import { Memo } from '../types';
import MemoInputModal from './MemoInputModal';

interface MemoListProps {
  isAdmin: boolean;
  trialMessage: string;
  memos: Memo[];
  onSaveMemo: (content: string, editingMemo: Memo | null) => Promise<void>;
  onDeleteMemo: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
}

const MemoList: React.FC<MemoListProps> = ({ isAdmin, trialMessage, memos, onSaveMemo, onDeleteMemo, onTogglePin }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const LIMIT = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + LIMIT);
  };

  const handleSaveMemo = async (content: string) => {
    if (!isAdmin) {
      alert(trialMessage);
      return;
    }

    setIsSaving(true);
    // 모달을 즉시 닫아서 빠른 UX 제공
    setIsModalOpen(false);
    
    try {
      await onSaveMemo(content, editingMemo);
      setEditingMemo(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemo = async (id: string) => {
    if (!isAdmin) {
      alert(trialMessage);
      return;
    }
    if (window.confirm("정말 이 메모를 삭제하시겠습니까?")) {
      await onDeleteMemo(id);
    }
  };

  const handleTogglePin = async (id: string) => {
    await onTogglePin(id);
  };

  const openEditModal = (memo: Memo) => {
    setEditingMemo(memo);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingMemo(null);
    setIsModalOpen(true);
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const renderContentWithLinks = (content: string) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline break-all">
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const sortedMemos = useMemo(() => {
    return [...memos].sort((a, b) => {
      // Prioritize pinned memos
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [memos]);

  const paginatedMemos = useMemo(() => {
    return sortedMemos.slice(0, visibleCount);
  }, [sortedMemos, visibleCount]);

  const hasMore = visibleCount < sortedMemos.length;

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4">
        {sortedMemos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">작성된 메모가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">우측 하단 버튼을 눌러 첫 메모를 작성해보세요!</p>
          </div>
        ) : (
          paginatedMemos.map(memo => (
            <div 
              key={memo.id} 
              className={`bg-white p-5 rounded-2xl shadow-sm border transition-all relative group ${
                memo.isPinned ? 'border-indigo-200 ring-2 ring-indigo-500/5' : 'border-gray-100'
              }`}
            >
              {memo.isPinned && (
                <div className="absolute top-4 right-4 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span>📌</span>
                  <span>고정됨</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed pr-16">
                {renderContentWithLinks(memo.content)}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {formatDateTime(memo.updatedAt)} 수정됨
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleTogglePin(memo.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                      memo.isPinned 
                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                        : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    title={memo.isPinned ? "고정 해제" : "상단 고정"}
                  >
                    <span>{memo.isPinned ? '📌 고정해제' : '📎 고정'}</span>
                  </button>
                  <button 
                    onClick={() => openEditModal(memo)}
                    className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    수정
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && sortedMemos.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleLoadMore} 
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            <span>더보기</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 active:scale-90 hover:bg-indigo-700 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isModalOpen && (
        <MemoInputModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveMemo} 
          initialContent={editingMemo?.content || ''} 
        />
      )}
    </div>
  );
};

export default MemoList;
