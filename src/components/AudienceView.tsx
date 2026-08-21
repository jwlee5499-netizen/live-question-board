import React, { useState, useEffect } from 'react';
import { RoomInfo } from '../types';
import { 
  ThumbsUp, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  QrCode, 
  ArrowLeft, 
  Radio, 
  MessageSquare,
  Lock,
  Flame,
  Clock,
  Tv,
  Settings,
  User
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

  // 정렬 및 필터링
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
    <div className="min-h-screen bg-slate-50 flex flex-col pb-36">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onLeave}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="나가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                {room.title}
              </h1>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {room.userCount || 1}명 참여 중
                </span>
                <span>•</span>
                <button
                  onClick={() => setIsEditingNick(true)}
                  className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{currentNickname}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenQR}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="참여 QR 코드"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={() => onChangeMode('screen')}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="스크린/프로젝터 모드"
            >
              <Tv className="w-5 h-5" />
            </button>
            <button
              onClick={() => onChangeMode('admin')}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="진행자 관리 모드"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between border-t border-slate-100 bg-slate-50/70 text-xs">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
                sortBy === 'popular'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              인기순
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
                sortBy === 'latest'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              최신순
            </button>
          </div>

          {answeredCount > 0 && (
            <button
              onClick={() => setFilterAnswered(!filterAnswered)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-[11px] ${
                filterAnswered
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              답변 완료 ({answeredCount}) {filterAnswered ? '표시 중' : '숨김'}
            </button>
          )}
        </div>
      </header>

      {/* Nickname Edit Modal */}
      {isEditingNick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveNick} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">닉네임 변경</h3>
            <input
              type="text"
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value)}
              placeholder="새 닉네임 입력"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-600 focus:bg-white"
              maxLength={15}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNick(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
              >
                변경하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Question Feed */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1">
        {room.isLocked && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>현재 강연자가 질문 접수를 일시 마감했습니다. 기존 질문에 공감 투표는 가능합니다.</span>
          </div>
        )}

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm my-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-500">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">아직 등록된 질문이 없습니다</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              하단 입력창에서 강연자에게 첫 번째 질문을 남겨보세요!
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
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-gradient-to-r from-indigo-50/40 via-white to-white'
                      : q.isAnswered
                      ? 'border-slate-200 bg-slate-50/60 opacity-80'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {q.isHighlighted && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-full mb-2.5 shadow-sm">
                      <Radio className="w-3 h-3 animate-pulse" />
                      현재 답변 중인 질문
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${
                        q.isAnswered ? 'line-through text-slate-400' : 'font-medium'
                      }`}>
                        {q.content}
                      </p>

                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 font-medium">
                        <span className="text-slate-600 font-semibold">{q.author}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                        {q.isAnswered && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              답변 완료
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Upvote Button */}
                    <button
                      onClick={() => onVote(q.id)}
                      className={`flex flex-col items-center justify-center min-w-[52px] h-[52px] rounded-2xl border transition-all active:scale-95 ${
                        isVoted
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                          : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 mb-0.5 ${isVoted ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold font-mono">{q.votes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Question Input Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-xl">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="text-slate-500">
                작성자: <strong className="text-slate-800 font-bold">{isAnonymous ? '익명' : currentNickname}</strong>
              </span>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none text-indigo-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>익명으로 보내기</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={content}
                disabled={room.isLocked}
                onChange={(e) => setContent(e.target.value)}
                placeholder={room.isLocked ? "질문 접수가 마감되었습니다." : "강연자에게 질문을 남겨보세요..."}
                className="flex-1 px-4 py-3 bg-slate-100 border border-transparent rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-200 disabled:text-slate-400"
                maxLength={300}
              />
              <button
                type="submit"
                disabled={room.isLocked || !content.trim()}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-md shadow-indigo-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </footer>
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
