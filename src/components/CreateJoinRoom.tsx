import React, { useState } from 'react';
import { 
  MessageSquarePlus, 
  LogIn, 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  History, 
  KeyRound, 
  LogOut,
  ChevronRight
} from 'lucide-react';

interface CreateJoinRoomProps {
  isAdmin: boolean;
  onAdminLogin: (password: string) => Promise<boolean>;
  onAdminLogout: () => void;
  onJoin: (roomId: string, mode: 'audience' | 'screen' | 'admin', title?: string) => void;
  onOpenHistory: () => void;
}

export const CreateJoinRoom: React.FC<CreateJoinRoomProps> = ({
  isAdmin,
  onAdminLogin,
  onAdminLogout,
  onJoin,
  onOpenHistory,
}) => {
  const [tab, setTab] = useState<'audience' | 'admin'>('audience');
  const [joinCode, setJoinCode] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 청중: 질문방 코드 입력 후 바로 입장
  const handleAudienceJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('질문방 코드를 입력해주세요.');
      return;
    }
    setError('');
    onJoin(joinCode.trim().toUpperCase(), 'audience');
  };

  // 관리자: 로그인
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput.trim()) {
      setError('관리자 비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setLoginLoading(true);
    const success = await onAdminLogin(adminPasswordInput.trim());
    setLoginLoading(false);
    if (!success) {
      setError('관리자 비밀번호가 올바르지 않습니다.');
    } else {
      setAdminPasswordInput('');
    }
  };

  // 관리자: 새 방 생성
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Live Q&A Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            강연장 및 세미나를 위한 실시간 질문 플랫폼
          </p>
        </div>

        {/* Tab Selection (청중 vs 관리자) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setTab('audience'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'audience'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🙋‍♂️ 청중 질문 참여</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>강연자 / 관리자</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium animate-shake">
            {error}
          </div>
        )}

        {/* 1. 청중 전용 화면 (가입/로그인 전혀 없이 코드만 입력) */}
        {tab === 'audience' ? (
          <form onSubmit={handleAudienceJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                강연 질문방 코드 입력
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="예: 7A3F9B"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-300 placeholder:font-normal focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-center"
                maxLength={12}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>질문방 바로 입장하기</span>
            </button>

            <p className="text-[11px] text-center text-slate-400 mt-2">
              💡 스크린에 뜬 QR 코드를 찍으시면 코드 입력 없이 바로 입장됩니다.
            </p>
          </form>
        ) : (
          /* 2. 관리자 전용 화면 */
          <div>
            {!isAdmin ? (
              /* 관리자 로그인 폼 */
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-800">
                  🔒 관리자 권한이 있는 분만 새 질문방을 생성하고 관리할 수 있습니다.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    관리자 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="비밀번호 입력 (기본: admin1234)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>관리자 로그인</span>
                </button>
              </form>
            ) : (
              /* 관리자 인증 완료 후 제어 패널 */
              <div className="space-y-5">
                {/* Admin Status & Logout Bar */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>관리자 인증 완료</span>
                  </div>
                  <button
                    onClick={onAdminLogout}
                    className="text-slate-500 hover:text-rose-600 flex items-center gap-1 text-[11px] font-medium"
                  >
                    <LogOut className="w-3 h-3" />
                    로그아웃
                  </button>
                </div>

                {/* History Button */}
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>지난 강연 Q&A 히스토리 보관함</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Create Room Form */}
                <form onSubmit={handleCreateSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    새 질문 보드 만들기
                  </h3>

                  <div>
                    <input
                      type="text"
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="강연 제목 (예: 2026 AI 세미나)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder="룸 코드 (선택: 비워두면 자동 생성)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                      maxLength={10}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all text-xs"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>새 강연 시작하기</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-indigo-200/60 relative z-10 flex items-center gap-3">
        <span>🔒 관리자 로그인 보안</span>
        <span>•</span>
        <span>📚 강연 히스토리 저장</span>
        <span>•</span>
        <span>📱 무가입 QR 직행</span>
      </div>
    </div>
  );
};
