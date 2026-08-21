import React, { useState, useEffect } from 'react';
import { RoomInfo } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ThumbsUp, 
  Radio, 
  Maximize, 
  Minimize, 
  Users, 
  ArrowLeft, 
  Sparkles, 
  Settings, 
  Lock
} from 'lucide-react';

interface PresenterScreenViewProps {
  room: RoomInfo;
  serverIp?: string;
  publicUrl?: string | null;
  onUpdatePublicUrl?: (url: string) => void;
  onOpenQR: () => void;
  onChangeMode: (mode: 'audience' | 'admin') => void;
  onLeave: () => void;
}

export const PresenterScreenView: React.FC<PresenterScreenViewProps> = ({
  room,
  serverIp,
  publicUrl,
  onUpdatePublicUrl,
  onOpenQR,
  onChangeMode,
  onLeave,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  let baseDomain = '';
  if (publicUrl) {
    baseDomain = publicUrl.replace(/\/$/, '');
  } else {
    const port = window.location.port ? `:${window.location.port}` : '';
    const host = serverIp && window.location.hostname === 'localhost' 
      ? serverIp 
      : window.location.hostname;
    baseDomain = `${window.location.protocol}//${host}${port}`;
  }

  const joinUrl = `${baseDomain}?room=${room.id}&mode=audience`;

  // 질문 정렬: 하이라이트 -> 추천수 -> 최신순
  const sortedQuestions = [...room.questions]
    .filter((q) => !q.isHidden && !q.isAnswered)
    .sort((a, b) => {
      if (a.isHighlighted && !b.isHighlighted) return -1;
      if (!a.isHighlighted && b.isHighlighted) return 1;
      if (b.votes !== a.votes) return b.votes - a.votes;
      return b.createdAt - a.createdAt;
    });

  const highlightedQuestion = room.questions.find((q) => q.isHighlighted && !q.isAnswered);
  const otherQuestions = highlightedQuestion 
    ? sortedQuestions.filter((q) => q.id !== highlightedQuestion.id)
    : sortedQuestions;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Bar for Projector */}
      <header className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="홈으로"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-sm font-bold rounded-lg">
                #{room.id}
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-100">
                {room.title}
              </h1>
              {room.isLocked && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg">
                  <Lock className="w-3.5 h-3.5" /> 질문마감
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              접속 주소: <span className="font-mono text-indigo-400 font-bold">{baseDomain.replace(/^https?:\/\//, '')}</span> 입력 후 코드 <span className="font-mono text-white font-bold">#{room.id}</span>
            </p>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-300 font-medium">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{room.userCount || 1}명 참여 중</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl transition-all"
            title="전체화면 토글"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onChangeMode('admin')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Settings className="w-4 h-4" />
            <span>진행자 모드</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex p-8 gap-8 max-w-[1600px] w-full mx-auto">
        {/* Left Side: Question List (70%) */}
        <div className="flex-1 flex flex-col min-w-0 space-y-5">
          {/* Highlighted Question (Focus Q&A) */}
          {highlightedQuestion && (
            <div className="p-7 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-900/40 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 px-5 py-2 bg-indigo-600 text-white text-xs font-black tracking-wider uppercase rounded-bl-2xl flex items-center gap-1.5 shadow-md">
                <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
                NOW ANSWERING
              </div>

              <div className="flex items-start justify-between gap-6 mt-2">
                <div className="flex-1">
                  <p className="text-2xl lg:text-3xl font-extrabold text-white leading-snug tracking-tight">
                    {highlightedQuestion.content}
                  </p>
                  <div className="flex items-center gap-3 mt-4 text-sm text-indigo-300 font-medium">
                    <span className="font-semibold text-slate-200">{highlightedQuestion.author}</span>
                    <span>•</span>
                    <span className="text-indigo-400">실시간 집중 답변 중</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] bg-indigo-600/30 border border-indigo-500/50 rounded-2xl text-indigo-300 shrink-0">
                  <ThumbsUp className="w-6 h-6 mb-1 text-indigo-400 fill-current" />
                  <span className="text-base font-black font-mono text-white">{highlightedQuestion.votes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Normal Top Questions Feed */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>인기 질문 피드 ({otherQuestions.length})</span>
              <span className="text-xs text-slate-500 font-normal">공감 투표 순으로 자동 정렬됩니다</span>
            </h2>

            {otherQuestions.length === 0 && !highlightedQuestion ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800/80 text-center">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 mb-4">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-200 mb-2">질문을 기다리는 중입니다</h3>
                <p className="text-slate-400 text-sm max-w-md">
                  스마트폰으로 우측 QR 코드를 스캔하거나 브라우저에서 코드를 입력하여 질문을 등록해보세요!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 max-h-[calc(100vh-280px)]">
                {otherQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 transition-all flex items-start justify-between gap-5 shadow-lg group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold shrink-0 font-mono mt-0.5">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg lg:text-xl font-bold text-slate-100 leading-relaxed break-words">
                          {q.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">{q.author}</span>
                          <span>•</span>
                          <span>{new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center min-w-[56px] h-[56px] bg-slate-800/80 border border-slate-700/60 rounded-2xl text-slate-300 shrink-0">
                      <ThumbsUp className="w-4 h-4 mb-0.5 text-indigo-400" />
                      <span className="text-sm font-bold font-mono text-white">{q.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: QR Code & Connection Info Card (30%) */}
        <div className="w-80 lg:w-96 flex flex-col gap-6 shrink-0">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
            <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full mb-3">
              스마트폰 질문 참여
            </span>
            <h3 className="text-lg font-bold text-white mb-4">카메라로 스캔하세요</h3>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-4">
              <QRCodeSVG
                value={joinUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="w-full bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center">
              <p className="text-xs text-slate-400 mb-1">질문 보드 코드</p>
              <p className="text-2xl font-black font-mono text-indigo-400 tracking-widest">
                #{room.id}
              </p>
            </div>
          </div>

          {/* Realtime Stats Card */}
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-5 text-xs text-slate-400 space-y-2.5">
            <div className="flex justify-between items-center">
              <span>총 등록된 질문</span>
              <span className="font-mono font-bold text-white text-sm">{room.questions.length}개</span>
            </div>
            <div className="flex justify-between items-center">
              <span>답변 완료된 질문</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {room.questions.filter(q => q.isAnswered).length}개
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>총 공감(투표) 수</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                {room.questions.reduce((acc, cur) => acc + cur.votes, 0)}개
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
