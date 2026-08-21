import React, { useState, useEffect } from 'react';
import { RoomInfo } from '../types';
import { 
  ThumbsUp, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  ArrowLeft, 
  Radio, 
  Lock, 
  Flame, 
  Clock, 
  MoreVertical,
  QrCode,
  Tv,
  Settings,
  User,
  Edit3
} from 'lucide-react';
import { getStoredNickname, setStoredNickname } from '../utils/socket';

interface AudienceViewProps {
  room: RoomInfo;
  userId: string;
  votedIds: Set<string>;
  onSendQuestion: (author: string, content: string) => void;
  onVote: (questionId: string) => void;
  onOpenQR: () => void;
  onChangeMode: (mode: 'screen' | 'admin') => void;
  onLeave: () => void;
}

export const AudienceView: React.FC<AudienceViewProps> = ({
  room,
  userId,
  votedIds,
  onSendQuestion,
  onVote,
  onOpenQR,
  onChangeMode,
  onLeave,
}) => {
  const [currentNickname, setCurrentNickname] = useState(() => getStoredNickname() || '익명');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [content, setContent] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'latest'>('popular');
  const [filterAnswered, setFilterAnswered] = useState<boolean>(true);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(currentNickname);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const saved = getStoredNickname();
    if (saved) {
      setCurrentNickname(saved);
      setTempNick(saved);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const finalAuthor = isAnonymous ? '익명' : (currentNickname.trim() || '익명');
    onSendQuestion(finalAuthor, content.trim());
    setContent('');
  };

  const handleSaveNick = (e: React.FormEvent) => {
    e.preventDefault();
    const final = tempNick.trim() || '익명';
    setCurrentNickname(final);
    setStoredNickname(final);
    setIsEditingNick(false);
  };

  // 정렬 및 필터
  const filteredQuestions = [...room.questions]
    .filter((q) => !q.isHidden && (filterAnswered ? true : !q.isAnswered))
    .sort((a, b) => {
      if (a.isHighlighted && !b.isHighlighted) return -1;
      if (!a.isHighlighted && b.isHighlighted) return 1;

      if (sortBy === 'popular') {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.createdAt - a.createdAt;
      }
      return b.createdAt - a.createdAt;
    });

  const answeredCount = room.questions.filter((q) => q.isAnswered).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between pb-36 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* 1. Mobile Optimized Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onLeave}
              className="p-2 -ml-1 text-slate-600 active:bg-slate-100 rounded-full transition-colors shrink-0"
              title="나가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                {room.title}
              </h1>
              
              {/* Sub Info Row: Users & My Nickname */}
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {room.userCount || 1}명 접속
                </span>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setIsEditingNick(true)}
                  className="flex items-center gap-1 text-indigo-600 font-semibold active:opacity-70 truncate max-w-[150px]"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{currentNickname}</span>
                  <Edit3 className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Menu Button (Clean Dropdown) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-slate-600 active:bg-slate-100 rounded-xl transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs font-semibold text-slate-700 animate-fade-in">
                  <button
                    onClick={() => { setShowMoreMenu(false); onOpenQR(); }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 text-left"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>참여 QR 코드</span>
                  </button>
                  <button
                    onClick={() => { setShowMoreMenu(false); onChangeMode('screen'); }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 text-left"
                  >
                    <Tv className="w-4 h-4 text-indigo-600" />
                    <span>스크린 모드 보기</span>
                  </button>
                  <button
                    onClick={() => { setShowMoreMenu(false); onChangeMode('admin'); }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 text-left border-t border-slate-100"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>관리자 패널</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. Mobile Segmented Sort Control */}
        <div className="max-w-xl mx-auto px-3.5 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold w-full max-w-[200px]">
            <button
              onClick={() => setSortBy('popular')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                sortBy === 'popular'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              인기순
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                sortBy === 'latest'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              최신순
            </button>
          </div>

          {answeredCount > 0 && (
            <button
              onClick={() => setFilterAnswered(!filterAnswered)}
              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all shrink-0 ${
                filterAnswered
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              답변완료 ({answeredCount}) {filterAnswered ? '표시' : '숨김'}
            </button>
          )}
        </div>
      </header>

      {/* 3. Main Question Cards Feed */}
      <main className="max-w-xl mx-auto w-full px-3.5 pt-3.5 flex-1">
        {room.isLocked && (
          <div className="mb-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs font-medium leading-relaxed">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>현재 강연자가 질문 접수를 마감했습니다. 기존 질문에 공감 투표는 가능합니다.</span>
          </div>
        )}

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-14 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm my-3">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-500">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base mb-1">
              아직 등록된 질문이 없습니다
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              강연자에게 궁금한 점을 가장 먼저 질문해 보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const isVoted = votedIds.has(q.id) || q.voters.includes(userId);
              const timeAgo = formatTimeAgo(q.createdAt);

              return (
                <div
                  key={q.id}
                  className={`relative p-4 sm:p-5 rounded-2xl bg-white border transition-all duration-200 shadow-sm ${
                    q.isHighlighted
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-gradient-to-br from-indigo-50/50 via-white to-white'
                      : q.isAnswered
                      ? 'border-slate-200 bg-slate-50/70 opacity-75'
                      : 'border-slate-200/90'
                  }`}
                >
                  {/* Highlight Banner if Now Answering */}
                  {q.isHighlighted && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[11px] font-extrabold rounded-full mb-2.5 shadow-sm animate-pulse">
                      <Radio className="w-3.5 h-3.5" />
                      현재 답변 중인 질문
                    </div>
                  )}

                  {/* Card Content & Upvote Button Layout */}
                  <div className="flex items-start justify-between gap-3.5">
                    {/* Left: Content and Meta */}
                    <div className="flex-1 min-w-0">
                      {/* Meta Info (Author, Time, Status) */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5">
                        <span className="text-slate-700 font-bold truncate max-w-[120px]">
                          {q.author}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">{timeAgo}</span>
                        {q.isAnswered && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              답변완료
                            </span>
                          </>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className={`text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words ${
                        q.isAnswered ? 'line-through text-slate-400' : 'text-slate-900 font-semibold'
                      }`}>
                        {q.content}
                      </p>
                    </div>

                    {/* Right: Big Touch Friendly Upvote Button */}
                    <button
                      onClick={() => onVote(q.id)}
                      className={`flex flex-col items-center justify-center min-w-[54px] min-h-[54px] rounded-2xl border transition-all active:scale-90 select-none shrink-0 ${
                        isVoted
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold'
                          : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 mb-0.5 ${isVoted ? 'fill-current' : ''}`} />
                      <span className="text-xs font-black font-mono">{q.votes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Mobile Fixed Bottom Input Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Author info & Anonymous toggle */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500 font-medium">
                작성자: <strong className="text-slate-800 font-bold">{isAnonymous ? '익명' : currentNickname}</strong>
              </span>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-indigo-600 active:opacity-70">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>익명으로 질문</span>
              </label>
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={content}
                disabled={room.isLocked}
                onChange={(e) => setContent(e.target.value)}
                placeholder={room.isLocked ? "질문 접수가 마감되었습니다." : "질문 내용을 입력하세요..."}
                className="flex-1 px-4 py-3 bg-slate-100 border border-transparent rounded-2xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-200"
                maxLength={300}
              />
              <button
                type="submit"
                disabled={room.isLocked || !content.trim()}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-md shadow-indigo-500/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </footer>

      {/* Nickname Edit Modal */}
      {isEditingNick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <form onSubmit={handleSaveNick} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">닉네임 변경</h3>
            <input
              type="text"
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value)}
              placeholder="새 닉네임 입력"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
              maxLength={15}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingNick(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20"
              >
                변경 완료
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return '오늘';
}
