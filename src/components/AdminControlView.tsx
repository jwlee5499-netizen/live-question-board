import React, { useState } from 'react';
import { RoomInfo } from '../types';
import { 
  ThumbsUp, 
  Radio, 
  CheckCircle2, 
  Trash2, 
  Lock, 
  Unlock, 
  QrCode, 
  Tv, 
  ArrowLeft, 
  Sparkles,
  Search,
  Check,
  History
} from 'lucide-react';

interface AdminControlViewProps {
  room: RoomInfo;
  publicUrl?: string | null;
  onUpdatePublicUrl?: (url: string) => void;
  onToggleHighlight: (questionId: string) => void;
  onToggleAnswered: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onToggleLock: () => void;
  onClearQuestions: () => void;
  onOpenQR: () => void;
  onOpenHistory?: () => void;
  onChangeMode: (mode: 'audience' | 'screen') => void;
  onLeave: () => void;
}

export const AdminControlView: React.FC<AdminControlViewProps> = ({
  room,
  publicUrl,
  onUpdatePublicUrl,
  onToggleHighlight,
  onToggleAnswered,
  onDeleteQuestion,
  onToggleLock,
  onClearQuestions,
  onOpenQR,
  onOpenHistory,
  onChangeMode,
  onLeave,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'answered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = room.questions.filter((q) => {
    if (filterTab === 'pending' && q.isAnswered) return false;
    if (filterTab === 'answered' && !q.isAnswered) return false;
    if (searchQuery.trim()) {
      const qText = (q.content + q.author).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1;
    if (!a.isHighlighted && b.isHighlighted) return 1;
    return b.votes - a.votes;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onLeave}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-mono text-xs font-bold rounded-md">
                  #{room.id}
                </span>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg">
                  {room.title}
                </h1>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                  진행자 관리 패널
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="지난 강연 히스토리"
              >
                <History className="w-4 h-4 text-indigo-600" />
                <span>히스토리</span>
              </button>
            )}
            <button
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>QR 코드</span>
            </button>
            <button
              onClick={() => onChangeMode('screen')}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Tv className="w-4 h-4" />
              <span>스크린 모드</span>
            </button>
            <button
              onClick={() => onChangeMode('audience')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>청중 뷰</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Side: Session Controls */}
        <div className="w-full md:w-64 space-y-4 shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>세션 상태 제어</span>
            </h3>

            {/* Lock/Unlock Toggle */}
            <button
              onClick={onToggleLock}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                room.isLocked
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {room.isLocked ? (
                <>
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>질문 접수 잠김 (클릭해 해제)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-emerald-600" />
                  <span>질문 접수 중 (클릭해 마감)</span>
                </>
              )}
            </button>

            {/* Clear All */}
            <button
              onClick={() => {
                if (window.confirm('정말 모든 질문을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  onClearQuestions();
                }
              }}
              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>전체 질문 삭제</span>
            </button>
          </div>

          {/* Stat Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900 text-sm">실시간 현황</h3>
            <div className="flex justify-between">
              <span>현재 접속 인원:</span>
              <span className="font-bold text-slate-900">{room.userCount || 1}명</span>
            </div>
            <div className="flex justify-between">
              <span>등록된 질문:</span>
              <span className="font-bold text-indigo-600">{room.questions.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>답변 완료:</span>
              <span className="font-bold text-emerald-600">
                {room.questions.filter((q) => q.isAnswered).length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>답변 대기 중:</span>
              <span className="font-bold text-amber-600">
                {room.questions.filter((q) => !q.isAnswered).length}개
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Question Management List */}
        <div className="flex-1 flex flex-col space-y-4 min-w-0">
          {/* Filter and Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                전체 ({room.questions.length})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                대기 중 ({room.questions.filter((q) => !q.isAnswered).length})
              </button>
              <button
                onClick={() => setFilterTab('answered')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === 'answered' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                답변 완료 ({room.questions.filter((q) => q.isAnswered).length})
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="질문 검색..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-transparent rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          {/* Question Items */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">해당 조건의 질문이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl bg-white border transition-all ${
                    q.isHighlighted
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                      : q.isAnswered
                      ? 'border-slate-200 bg-slate-50 opacity-70'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {q.isHighlighted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                            <Radio className="w-3 h-3 animate-pulse" />
                            스크린 하이라이트 중
                          </span>
                        )}
                        {q.isAnswered && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                            <Check className="w-3 h-3" />
                            답변 완료
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-700">{q.author}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-slate-800 text-sm leading-relaxed ${q.isAnswered ? 'line-through text-slate-400' : 'font-medium'}`}>
                        {q.content}
                      </p>
                    </div>

                    {/* Votes Count */}
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-bold shrink-0">
                      <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{q.votes}</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onToggleHighlight(q.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        q.isHighlighted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{q.isHighlighted ? '하이라이트 해제' : '스크린에 포커스'}</span>
                    </button>

                    <button
                      onClick={() => onToggleAnswered(q.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        q.isAnswered
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{q.isAnswered ? '답변 취소' : '답변 완료'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('이 질문을 삭제하시겠습니까?')) {
                          onDeleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="질문 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
