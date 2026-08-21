import { io, Socket } from 'socket.io-client';

// 브라우저 호스트와 포트 자동 감지
const getServerUrl = () => {
  if (typeof window !== 'undefined') {
    // Vite 개발 모드(포트 5173)일 때만 3001번 서버로 명시적 연결
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:3001`;
    }
    // 터널링(trycloudflare.com, loca.lt) 또는 배포/동일 포트 서빙 시 현재 origin 사용
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

export const socket: Socket = io(getServerUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

// 고유 사용자 ID 생성 및 캐싱 (중복 투표 방지용)
export const getUserId = (): string => {
  let uid = localStorage.getItem('qa_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('qa_user_id', uid);
  }
  return uid;
};

// 사용자가 좋아요를 누른 질문 ID 목록 캐시
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
