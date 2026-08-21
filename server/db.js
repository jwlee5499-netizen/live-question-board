import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'data_store.json');

// 초기 데이터 구조
const defaultData = {
  adminConfig: {
    // 기본 관리자 비밀번호 (원하는 비밀번호로 변경 가능)
    password: process.env.ADMIN_PASSWORD || 'admin1234',
  },
  rooms: {}, // roomId -> { id, title, createdAt, isLocked, isArchived, questions: [] }
};

class JSONDatabase {
  constructor() {
    this.data = defaultData;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...defaultData, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('DB 로드 에러:', e);
      this.data = defaultData;
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('DB 저장 에러:', e);
    }
  }

  // 관리자 비밀번호 검증
  verifyAdminPassword(inputPassword) {
    return this.data.adminConfig.password === inputPassword;
  }

  // 관리자 비밀번호 변경
  updateAdminPassword(newPassword) {
    this.data.adminConfig.password = newPassword;
    this.save();
    return true;
  }

  // 방 생성 또는 가져오기
  createRoom(roomId, title) {
    const code = roomId.toUpperCase();
    if (!this.data.rooms[code]) {
      this.data.rooms[code] = {
        id: code,
        title: title || `${code} 강연 세션`,
        createdAt: Date.now(),
        isLocked: false,
        isArchived: false,
        questions: [],
      };
      this.save();
    }
    return this.data.rooms[code];
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.data.rooms[roomId.toUpperCase()] || null;
  }

  // 모든 방 목록 (히스토리용)
  getAllRooms() {
    return Object.values(this.data.rooms).sort((a, b) => b.createdAt - a.createdAt);
  }

  // 방 삭제 (히스토리에서 정리)
  deleteRoom(roomId) {
    const code = roomId.toUpperCase();
    if (this.data.rooms[code]) {
      delete this.data.rooms[code];
      this.save();
      return true;
    }
    return false;
  }

  // 질문 추가
  addQuestion(roomId, { author, content }) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const newQ = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomId: room.id,
      author: (author && author.trim()) ? author.trim() : '익명',
      content: content.trim(),
      votes: 0,
      voters: [],
      isAnswered: false,
      isHighlighted: false,
      isHidden: false,
      createdAt: Date.now(),
    };

    room.questions.unshift(newQ);
    this.save();
    return newQ;
  }

  // 투표 토글
  voteQuestion(roomId, questionId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const question = room.questions.find((q) => q.id === questionId);
    if (!question) return null;

    const voterIndex = question.voters.indexOf(userId);
    let hasVoted = false;

    if (voterIndex === -1) {
      question.voters.push(userId);
      question.votes += 1;
      hasVoted = true;
    } else {
      question.voters.splice(voterIndex, 1);
      question.votes = Math.max(0, question.votes - 1);
      hasVoted = false;
    }

    this.save();
    return { question, hasVoted };
  }

  // 답변 완료 토글
  toggleAnswered(roomId, questionId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const question = room.questions.find((q) => q.id === questionId);
    if (question) {
      question.isAnswered = !question.isAnswered;
      this.save();
      return question;
    }
    return null;
  }

  // 질문 하이라이트 토글
  toggleHighlight(roomId, questionId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.questions.forEach((q) => {
      if (q.id === questionId) {
        q.isHighlighted = !q.isHighlighted;
      } else {
        q.isHighlighted = false;
      }
    });

    this.save();
    return room.questions;
  }

  // 질문 삭제
  deleteQuestion(roomId, questionId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    room.questions = room.questions.filter((q) => q.id !== questionId);
    this.save();
    return true;
  }

  // 방 질문 전체 초기화
  clearQuestions(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    room.questions = [];
    this.save();
    return true;
  }

  // 방 잠금 토글
  toggleLock(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.isLocked = !room.isLocked;
    this.save();
    return room.isLocked;
  }
}

export const db = new JSONDatabase();
