import React, { useState, useEffect } from 'react';
import { RoomHistoryItem, Question } from '../types';
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle2, 
  Trash2, 
  Download, 
  ExternalLink, 
  Tv, 
  Search,
  Sparkles,
  Calendar
} from 'lucide-react';

interface RoomHistoryViewProps {
  onBack: () => void;
  onOpenRoom: (roomId: string, mode: 'admin' | 'screen') => void;
}

export const RoomHistoryView: React.FC<RoomHistoryViewProps> = ({ onBack, onOpenRoom }) => {
  const [historyList, setHistoryList] = useState<RoomHistoryItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomData, setSelectedRoomData] = useState<{ id: string; title: string; questions: Question[]; createdAt: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/admin/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.rooms) {
          setHistoryList(data.rooms);
          if (data.rooms.length > 0 && !selectedRoomId) {
            loadRoomDetail(data.rooms[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadRoomDetail = (roomId: string) => {
    setSelectedRoomId(roomId);
    fetch(`/api/admin/history/${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.room) {
          setSelectedRoomData(data.room);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteRoom = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`'${roomId}' 세션을 히스토리에서 완전히 삭제하시겠습니까?`)) {
      fetch(`/api/admin/history/${roomId}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then(() => {
          setHistoryList((prev) => prev.filter((r) => r.id !== roomId));
          if (selectedRoomId === roomId) {
            setSelectedRoomId(null);
            setSelectedRoomData(null);
          }
        });
    }
  };

  const handleExportCSV = () => {
    if (!selectedRoomData || !selectedRoomData.questions.length) {
      alert('내보낼 질문 데이터가 없습니다.');
      return;
    }

    const headers = ['번호', '작성자', '질문 내용', '공감수', '답변완료여부', '등록시간'];
    const rows = selectedRoomData.questions.map((q, idx) => [
      idx + 1,
      `"${q.author.replace(/"/g, '""')}"`,
      `"${q.content.replace(/"/g, '""')}"`,
      q.votes,
      q.isAnswered ? '완료' : '미완료',
      new Date(q.createdAt).toLocaleString(),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedRoomData.title}_질문목록.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = historyList.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return r.title.toLowerCase().includes(query) || r.id.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>📚 지난 강연 Q&A 히스토리 보관함</span>
              </h1>
              <p className="text-xs text-slate-500">
                과거에 진행했던 강연 세션과 등록된 질문들을 다시 조회하고 내보낼 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Side: Room History List */}
        <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="강연 제목 또는 코드 검색..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 shadow-sm"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 flex justify-between">
              <span>강연 세션 목록 ({filteredHistory.length})</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-230px)] flex-1">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  저장된 강연 히스토리가 없습니다.
                </div>
              ) : (
                filteredHistory.map((room) => {
                  const isSelected = selectedRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => loadRoomDetail(room.id)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {room.title}
                        </h4>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded">
                          #{room.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-indigo-500" />
                          질문 {room.questionCount}개
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-amber-500" />
                          공감 {room.totalVotes}개
                        </span>
                        <button
                          onClick={(e) => handleDeleteRoom(room.id, e)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Room Question Detail */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-w-0">
          {selectedRoomData ? (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Room Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded-lg">
                      #{selectedRoomData.id}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 truncate">
                      {selectedRoomData.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    강연 일시: {new Date(selectedRoomData.createdAt).toLocaleString()} • 총 질문 {selectedRoomData.questions.length}개
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV 내보내기</span>
                  </button>
                  <button
                    onClick={() => onOpenRoom(selectedRoomData.id, 'screen')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Tv className="w-4 h-4" />
                    <span>스크린 뷰</span>
                  </button>
                  <button
                    onClick={() => onOpenRoom(selectedRoomData.id, 'admin')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>세션 재개</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] space-y-3 pr-2">
                {selectedRoomData.questions.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">이 세션에 등록된 질문이 없습니다.</p>
                  </div>
                ) : (
                  [...selectedRoomData.questions]
                    .sort((a, b) => b.votes - a.votes)
                    .map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold shrink-0 font-mono mt-0.5">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 leading-relaxed break-words">
                              {q.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                              <span className="font-semibold text-slate-600">{q.author}</span>
                              <span>•</span>
                              <span>{new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {q.isAnswered && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    답변 완료
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold shrink-0 shadow-sm">
                          <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{q.votes}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
              <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm">좌측 목록에서 강연 세션을 선택해 주세요.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
