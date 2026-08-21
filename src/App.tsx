import React, { useState, useEffect, useRef } from 'react';
import { socket, getUserId, getStoredVotes, saveStoredVote, setStoredNickname } from './utils/socket';
import { Question, RoomInfo, ViewMode } from './types';
import { CreateJoinRoom } from './components/CreateJoinRoom';
import { AudienceView } from './components/AudienceView';
import { PresenterScreenView } from './components/PresenterScreenView';
import { AdminControlView } from './components/AdminControlView';
import { RoomHistoryView } from './components/RoomHistoryView';
import { QRCodeModal } from './components/QRCodeModal';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('join');
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [serverIp, setServerIp] = useState<string>('localhost');
  const [targetRoomParam, setTargetRoomParam] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(() => {
    return localStorage.getItem('qa_custom_public_url') || null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return !!localStorage.getItem('qa_admin_token');
  });
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [isQrOpen, setIsQrOpen] = useState(false);
  const userId = getUserId();

  const currentRoomRef = useRef<RoomInfo | null>(null);
  currentRoomRef.current = room;

  // 1. 서버 정보 가져오기
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

  // 2. URL 쿼리 파라미터 확인 (?room=CODE&mode=audience)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const modeParam = params.get('mode') as ViewMode | null;

    if (roomParam) {
      setTargetRoomParam(roomParam.toUpperCase());
      // 만약 스크린 모드나 관리자 모드로 링크가 온 경우 바로 입장
      if (modeParam === 'screen' || (modeParam === 'admin' && isAdmin)) {
        handleJoin(roomParam.toUpperCase(), modeParam);
      }
    }
  }, [isAdmin]);

  // 3. Socket 이벤트 등록 및 실시간 동기화 (재연결 시 방 자동 재입장)
  useEffect(() => {
    const onConnect = () => {
      console.log('> Socket connected / reconnected');
      if (currentRoomRef.current) {
        socket.emit('join_room', { roomId: currentRoomRef.current.id });
      }
    };

    socket.on('connect', onConnect);

    socket.on('question_added', (newQ: Question) => {
      console.log('> [Realtime] New question received:', newQ);
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.id !== newQ.roomId) return prev;
        if (prev.questions.some((q) => q.id === newQ.id)) return prev;
        return {
          ...prev,
          questions: [newQ, ...prev.questions],
        };
      });
    });

    socket.on('question_updated', (updatedQ: Question) => {
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.id !== updatedQ.roomId) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)),
        };
      });
    });

    socket.on('question_deleted', ({ questionId }: { questionId: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.filter((q) => q.id !== questionId),
        };
      });
    });

    socket.on('room_questions_synced', (questions: Question[]) => {
      setRoom((prev) => (prev ? { ...prev, questions } : prev));
    });

    socket.on('user_count_updated', ({ roomId, userCount }: { roomId: string; userCount: number }) => {
      setRoom((prev) => {
        if (!prev || prev.id !== roomId) return prev;
        return { ...prev, userCount };
      });
    });

    socket.on('room_lock_changed', ({ isLocked }: { isLocked: boolean }) => {
      setRoom((prev) => (prev ? { ...prev, isLocked } : prev));
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('question_added');
      socket.off('question_updated');
      socket.off('question_deleted');
      socket.off('room_questions_synced');
      socket.off('user_count_updated');
      socket.off('room_lock_changed');
    };
  }, []);

  // 관리자 로그인
  const handleAdminLogin = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('qa_admin_token', data.token);
        setIsAdmin(true);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('qa_admin_token');
    setIsAdmin(false);
  };

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

  // 방 입장 (닉네임 지원)
  const handleJoin = (roomId: string, mode: ViewMode = 'audience', title?: string, nickname?: string) => {
    if (nickname) {
      setStoredNickname(nickname);
    }

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

        const newUrl = `${window.location.pathname}?room=${roomId}&mode=${mode}`;
        window.history.replaceState({}, '', newUrl);
      }
    });
  };

  // 질문 등록
  const handleSendQuestion = (author: string, content: string) => {
    if (!room) return;
    socket.emit(
      'new_question',
      {
        roomId: room.id,
        author,
        content,
      },
      (res: any) => {
        if (res && res.success && res.question) {
          // 등록 즉시 내 화면에 안전 반영 (중복 방지 처리됨)
          setRoom((prev) => {
            if (!prev) return prev;
            if (prev.questions.some((q) => q.id === res.question.id)) return prev;
            return {
              ...prev,
              questions: [res.question, ...prev.questions],
            };
          });
        }
      }
    );
  };

  // 공감 투표
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

  const handleToggleHighlight = (questionId: string) => {
    if (!room) return;
    socket.emit('toggle_highlight', { roomId: room.id, questionId });
  };

  const handleToggleAnswered = (questionId: string) => {
    if (!room) return;
    socket.emit('toggle_answered', { roomId: room.id, questionId });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!room) return;
    socket.emit('delete_question', { roomId: room.id, questionId });
  };

  const handleToggleLock = () => {
    if (!room) return;
    socket.emit('toggle_lock', { roomId: room.id });
  };

  const handleClearQuestions = () => {
    if (!room) return;
    socket.emit('clear_questions', { roomId: room.id });
  };

  const handleChangeMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (room) {
      const newUrl = `${window.location.pathname}?room=${room.id}&mode=${mode}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleLeave = () => {
    setRoom(null);
    setViewMode('join');
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div>
      {viewMode === 'join' || (!room && viewMode !== 'history') ? (
        <CreateJoinRoom
          isAdmin={isAdmin}
          targetRoomId={targetRoomParam}
          onAdminLogin={handleAdminLogin}
          onAdminLogout={handleAdminLogout}
          onJoin={handleJoin}
          onOpenHistory={() => setViewMode('history')}
        />
      ) : viewMode === 'history' ? (
        <RoomHistoryView
          onBack={() => setViewMode('join')}
          onOpenRoom={(roomId, mode) => handleJoin(roomId, mode)}
        />
      ) : room && viewMode === 'audience' ? (
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
      ) : room && viewMode === 'screen' ? (
        <PresenterScreenView
          room={room}
          serverIp={serverIp}
          publicUrl={publicUrl}
          onUpdatePublicUrl={handleUpdateCustomUrl}
          onOpenQR={() => setIsQrOpen(true)}
          onChangeMode={(mode) => handleChangeMode(mode)}
          onLeave={handleLeave}
        />
      ) : room ? (
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
          onOpenHistory={() => setViewMode('history')}
          onChangeMode={(mode) => handleChangeMode(mode)}
          onLeave={handleLeave}
        />
      ) : null}

      {/* QR Code Modal */}
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
