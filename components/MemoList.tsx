import React, { useState, useEffect, useCallback } from 'react';
import { Memo } from '../types';
import { fetchMemos, saveMemoToGAS, updateMemoInGAS, deleteMemoFromGAS } from '../services/gasService';
import MemoInputModal from './MemoInputModal';

interface MemoListProps {
  isAdmin: boolean;
  trialMessage: string;
}

const MemoList: React.FC<MemoListProps> = ({ isAdmin, trialMessage }) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);

  const loadMemos = useCallback(async (currentOffset: number, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const newMemos = await fetchMemos(currentOffset, LIMIT);
      if (newMemos.length < LIMIT) {
        setHasMore(false);
      }
      
      if (isLoadMore) {
        setMemos(prev => [...prev, ...newMemos]);
      } else {
        setMemos(newMemos);
      }
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error("Failed to load memos", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadMemos(0);
  }, [loadMemos]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMemos(offset, true);
    }
  };

  const handleSaveMemo = async (content: string) => {
    if (!isAdmin) {
      alert(trialMessage);
      return;
    }

    const now = new Date().toISOString();
    
    // 모달을 즉시 닫아서 빠른 UX 제공
    setIsModalOpen(false);
    
    if (editingMemo) {
      const updatedMemo: Memo = { ...editingMemo, content, updatedAt: now };
      setMemos(prev => prev.map(m => m.id === updatedMemo.id ? updatedMemo : m));
      setEditingMemo(null);
      await updateMemoInGAS(updatedMemo);
    } else {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        content,
        createdAt: now,
        updatedAt: now
      };
      setMemos(prev => [newMemo, ...prev]);
      await saveMemoToGAS(newMemo);
    }
  };

  const handleDeleteMemo = async (id: string) => {
    if (!isAdmin) {
      alert(trialMessage);
      return;
    }
    if (window.confirm("정말 이 메모를 삭제하시겠습니까?")) {
      setMemos(prev => prev.filter(m => m.id !== id));
      await deleteMemoFromGAS(id);
    }
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
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [memos]);

  if (loading && memos.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4">
        {sortedMemos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">작성된 메모가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">우측 하단 버튼을 눌러 첫 메모를 작성해보세요!</p>
          </div>
        ) : (
          sortedMemos.map(memo => (
            <div key={memo.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {renderContentWithLinks(memo.content)}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {formatDateTime(memo.updatedAt)} 수정됨
                </span>
                <div className="flex space-x-2">
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
            disabled={loadingMore}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {loadingMore ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : null}
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
