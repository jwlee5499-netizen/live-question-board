import React, { useState, useEffect, useCallback } from 'react';
import { socket, getUserId, getStoredVotes, saveStoredVote } from './utils/socket';
import { Question, RoomInfo, ViewMode } from './types';
import { CreateJoinRoom } from './components/CreateJoinRoom';
import { AudienceView } from './components/AudienceView';
import { PresenterScreenView } from './components/PresenterScreenView';
import { AdminControlView } from './components/AdminControlView';
import { QRCodeModal } from './components/QRCodeModal';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('join');
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [serverIp, setServerIp] = useState<string>('localhost');
  const [publicUrl, setPublicUrl] = useState<string | null>(() => {
    return localStorage.getItem('qa_custom_public_url') || null;
  });
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [isQrOpen, setIsQrOpen] = useState(false);
  const userId = getUserId();

  // 1. 서버 정보(IP 및 터널 URL) 가져오기
  useEffect(() => {
    fetch('/api/server-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) setServerIp(data.ip);
        if (data.publicUrl && !localStorage.getItem('qa_custom_public_url')) {
          setPublicUrl(data.publicUrl);
        }
      })
      .catch((err) => console.log('Could not fetch server ip:', err));

    setVotedIds(getStoredVotes());
  }, []);

  const handleUpdateCustomUrl = (url: string) => {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem('qa_custom_public_url', trimmed);
      setPublicUrl(trimmed);
    } else {
      localStorage.removeItem('qa_custom_public_url');
      setPublicUrl(null);
    }
  };

  // 2. URL 쿼리 파라미터로 자동 입장 처리 (?room=CODE&mode=audience)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const modeParam = params.get('mode') as ViewMode | null;

    if (roomParam) {
      handleJoin(roomParam.toUpperCase(), modeParam || 'audience');
    }
  }, []);

  // 3. Socket 이벤트 등록
  useEffect(() => {
    // 새 질문 추가
    socket.on('question_added', (newQ: Question) => {
      setRoom((prev) => {
        if (!prev) return prev;
        // 중복 방지
        if (prev.questions.some((q) => q.id === newQ.id)) return prev;
        return {
          ...prev,
          questions: [newQ, ...prev.questions],
        };
      });
    });

    // 질문 업데이트 (좋아요 수, 완료 상태 등)
    socket.on('question_updated', (updatedQ: Question) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)),
        };
      });
    });

    // 질문 삭제
    socket.on('question_deleted', ({ questionId }: { questionId: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.filter((q) => q.id !== questionId),
        };
      });
    });

    // 질문 목록 전체 동기화
    socket.on('room_questions_synced', (questions: Question[]) => {
      setRoom((prev) => (prev ? { ...prev, questions } : prev));
    });

    // 접속자 수 업데이트
    socket.on('user_count_updated', ({ userCount }: { userCount: number }) => {
      setRoom((prev) => (prev ? { ...prev, userCount } : prev));
    });

    // 질문 접수 마감/오픈 상태
    socket.on('room_lock_changed', ({ isLocked }: { isLocked: boolean }) => {
      setRoom((prev) => (prev ? { ...prev, isLocked } : prev));
    });

    return () => {
      socket.off('question_added');
      socket.off('question_updated');
      socket.off('question_deleted');
      socket.off('room_questions_synced');
      socket.off('user_count_updated');
      socket.off('room_lock_changed');
    };
  }, []);

  // 방 입장 핸들러
  const handleJoin = (roomId: string, mode: ViewMode = 'audience', title?: string) => {
    if (mode === 'admin' && title) {
      socket.emit('create_room', { roomId, title }, () => {
        joinRoomActual(roomId, mode);
      });
    } else {
      joinRoomActual(roomId, mode);
    }
  };

  const joinRoomActual = (roomId: string, mode: ViewMode) => {
    socket.emit('join_room', { roomId, role: mode }, (response: any) => {
      if (response && response.success) {
        setRoom(response.room);
        setViewMode(mode);

        // URL 히스토리 업데이트 (새로고침 시 방 유지)
        const newUrl = `${window.location.pathname}?room=${roomId}&mode=${mode}`;
        window.history.replaceState({}, '', newUrl);
      }
    });
  };

  // 질문 등록
  const handleSendQuestion = (author: string, content: string) => {
    if (!room) return;
    socket.emit('new_question', {
      roomId: room.id,
      author,
      content,
    });
  };

  // 공감(좋아요) 토글
  const handleVote = (questionId: string) => {
    if (!room) return;
    socket.emit(
      'vote_question',
      {
        roomId: room.id,
        questionId,
        userId,
      },
      (res: any) => {
        if (res && res.success) {
          saveStoredVote(questionId, res.hasVoted);
          setVotedIds(getStoredVotes());
        }
      }
    );
  };

  // 진행자: 질문 강조(포커스) 토글
  const handleToggleHighlight = (questionId: string) => {
    if (!room) return;
    socket.emit('toggle_highlight', { roomId: room.id, questionId });
  };

  // 진행자: 답변 완료 토글
  const handleToggleAnswered = (questionId: string) => {
    if (!room) return;
    socket.emit('toggle_answered', { roomId: room.id, questionId });
  };

  // 진행자: 질문 삭제
  const handleDeleteQuestion = (questionId: string) => {
    if (!room) return;
    socket.emit('delete_question', { roomId: room.id, questionId });
  };

  // 진행자: 질문 접수 잠금 토글
  const handleToggleLock = () => {
    if (!room) return;
    socket.emit('toggle_lock', { roomId: room.id });
  };

  // 진행자: 전체 질문 비우기
  const handleClearQuestions = () => {
    if (!room) return;
    socket.emit('clear_questions', { roomId: room.id });
  };

  // 모드 변경 (스크린, 관리자, 청중)
  const handleChangeMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (room) {
      const newUrl = `${window.location.pathname}?room=${room.id}&mode=${mode}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  // 방 나가기
  const handleLeave = () => {
    setRoom(null);
    setViewMode('join');
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div>
      {viewMode === 'join' || !room ? (
        <CreateJoinRoom onJoin={handleJoin} />
      ) : viewMode === 'audience' ? (
        <AudienceView
          room={room}
          userId={userId}
          votedIds={votedIds}
          onSendQuestion={handleSendQuestion}
          onVote={handleVote}
          onOpenQR={() => setIsQrOpen(true)}
          onChangeMode={(mode) => handleChangeMode(mode)}
          onLeave={handleLeave}
        />
      ) : viewMode === 'screen' ? (
        <PresenterScreenView
          room={room}
          serverIp={serverIp}
          publicUrl={publicUrl}
          onUpdatePublicUrl={handleUpdateCustomUrl}
          onOpenQR={() => setIsQrOpen(true)}
          onChangeMode={(mode) => handleChangeMode(mode)}
          onLeave={handleLeave}
        />
      ) : (
        <AdminControlView
          room={room}
          publicUrl={publicUrl}
          onUpdatePublicUrl={handleUpdateCustomUrl}
          onToggleHighlight={handleToggleHighlight}
          onToggleAnswered={handleToggleAnswered}
          onDeleteQuestion={handleDeleteQuestion}
          onToggleLock={handleToggleLock}
          onClearQuestions={handleClearQuestions}
          onOpenQR={() => setIsQrOpen(true)}
          onChangeMode={(mode) => handleChangeMode(mode)}
          onLeave={handleLeave}
        />
      )}

      {/* QR Code Global Modal */}
      {room && (
        <QRCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          roomId={room.id}
          roomTitle={room.title}
          serverIp={serverIp}
          publicUrl={publicUrl}
          onUpdatePublicUrl={handleUpdateCustomUrl}
        />
      )}
    </div>
  );
}

export default App;
