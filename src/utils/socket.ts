import { io, Socket } from 'socket.io-client';

const getServerUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:3001`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

// 실시간 연결 신뢰성 극대화 (웹소켓 + 폴링 자동 복구)
export const socket: Socket = io(getServerUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 10000,
  transports: ['polling', 'websocket'], // 모바일 통신사 호환성을 위해 polling 우선 후 ws 업그레이드
});

// 고유 사용자 ID
export const getUserId = (): string => {
  let uid = localStorage.getItem('qa_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('qa_user_id', uid);
  }
  return uid;
};

// 닉네임 저장 및 가져오기
export const getStoredNickname = (): string => {
  return localStorage.getItem('qa_user_nickname') || '';
};

export const setStoredNickname = (name: string) => {
  localStorage.setItem('qa_user_nickname', name);
};

// 투표 캐시
export const getStoredVotes = (): Set<string> => {
  try {
    const raw = localStorage.getItem('qa_voted_questions');
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch (e) {
    console.error(e);
  }
  return new Set();
};

export const saveStoredVote = (questionId: string, voted: boolean) => {
  const current = getStoredVotes();
  if (voted) {
    current.add(questionId);
  } else {
    current.delete(questionId);
  }
  localStorage.setItem('qa_voted_questions', JSON.stringify(Array.from(current)));
};
