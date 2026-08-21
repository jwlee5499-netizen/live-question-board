import React, { useState } from 'react';
import { MessageSquarePlus, LogIn, Sparkles } from 'lucide-react';

interface CreateJoinRoomProps {
  onJoin: (roomId: string, mode: 'audience' | 'screen' | 'admin', title?: string) => void;
}

export const CreateJoinRoom: React.FC<CreateJoinRoomProps> = ({ onJoin }) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [role, setRole] = useState<'audience' | 'screen' | 'admin'>('audience');
  const [error, setError] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('입장 코드를 입력해주세요.');
      return;
    }
    setError('');
    onJoin(joinCode.trim().toUpperCase(), role);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setError('강연/이벤트 제목을 입력해주세요.');
      return;
    }
    const code = customCode.trim() 
      ? customCode.trim().toUpperCase() 
      : Math.random().toString(36).substring(2, 8).toUpperCase();

    setError('');
    onJoin(code, 'admin', createTitle.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 flex flex-col justify-center items-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Live Q&A Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            강연장 및 세미나를 위한 실시간 질문 플랫폼
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setTab('join'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === 'join'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            질문 보드 참여
          </button>
          <button
            type="button"
            onClick={() => { setTab('create'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === 'create'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            새 강연 보드 생성
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium animate-shake">
            {error}
          </div>
        )}

        {/* Join Tab */}
        {tab === 'join' ? (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                이벤트 코드 입력
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="예: 7A3F9B"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-300 placeholder:font-normal focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  maxLength={12}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                접속 모드 선택
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('audience')}
                  className={`p-2.5 border rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    role === 'audience'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🙋‍♂️ 청중</span>
                  <span className="text-[10px] text-slate-400 font-normal">질문 & 공감</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('screen')}
                  className={`p-2.5 border rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    role === 'screen'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>📺 스크린</span>
                  <span className="text-[10px] text-slate-400 font-normal">빔프로젝터용</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 border rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    role === 'admin'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🛠 진행자</span>
                  <span className="text-[10px] text-slate-400 font-normal">질문 관리</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-5 h-5" />
              <span>입장하기</span>
            </button>
          </form>
        ) : (
          /* Create Tab */
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                강연 / 세미나 제목
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="예: 2026 AI 트렌드 & 개발 세미나"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                룸 코드 (선택사항)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="비워두면 6자리 코드가 자동 생성됩니다"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-mono focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                maxLength={10}
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span>새 질문 보드 만들기</span>
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-indigo-200/70 relative z-10 flex items-center gap-4">
        <span>✨ 실시간 WebSockets 지원</span>
        <span>•</span>
        <span>📱 모바일 반응형 & QR 스캔</span>
        <span>•</span>
        <span>👍 실시간 공감 투표</span>
      </div>
    </div>
  );
};
