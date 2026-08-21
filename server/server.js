import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import localtunnel from 'localtunnel';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let publicTunnelUrl = process.env.PUBLIC_URL || null;

// 정적 파일 서빙
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// 로컬 IP 감지
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// 서버 정보
app.get('/api/server-info', (req, res) => {
  res.json({
    ip: getLocalIpAddress(),
    port: 5173,
    serverPort: process.env.PORT || 3001,
    publicUrl: publicTunnelUrl,
  });
});

// 가장 최근에 열린 강연방 가져오기 (링크만 치고 들어온 청중용)
app.get('/api/active-room', (req, res) => {
  const rooms = db.getAllRooms();
  if (rooms.length > 0) {
    const latest = rooms[0];
    return res.json({ room: { id: latest.id, title: latest.title, isLocked: latest.isLocked } });
  }
  // 기본 방 하나 자동 생성
  const defaultRoom = db.createRoom('MAIN', '실시간 강연 질문방');
  res.json({ room: { id: defaultRoom.id, title: defaultRoom.title, isLocked: defaultRoom.isLocked } });
});

// 관리자 로그인 API
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
  }

  if (db.verifyAdminPassword(password)) {
    const token = 'adm_' + Buffer.from(password + '_secret_' + Date.now()).toString('base64');
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ error: '관리자 비밀번호가 일치하지 않습니다.' });
  }
});

// 관리자 비밀번호 변경 API
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!db.verifyAdminPassword(currentPassword)) {
    return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: '새 비밀번호는 4자리 이상이어야 합니다.' });
  }

  db.updateAdminPassword(newPassword);
  res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
});

// 관리자 전용: 세션 히스토리 목록 조회 API
app.get('/api/admin/history', (req, res) => {
  const rooms = db.getAllRooms().map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt,
    questionCount: r.questions.length,
    totalVotes: r.questions.reduce((sum, q) => sum + q.votes, 0),
    answeredCount: r.questions.filter((q) => q.isAnswered).length,
    isLocked: r.isLocked,
  }));
  res.json({ rooms });
});

// 관리자 전용: 특정 세션 상세 히스토리 조회 API
app.get('/api/admin/history/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = db.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
  }
  res.json({ room });
});

// 관리자 전용: 세션 삭제 API
app.delete('/api/admin/history/:roomId', (req, res) => {
  const { roomId } = req.params;
  const success = db.deleteRoom(roomId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '방을 찾을 수 없습니다.' });
  }
});

// 방 정보 확인 API
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = db.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    title: room.title,
    isLocked: room.isLocked,
    questionCount: room.questions.length,
  });
});

io.on('connection', (socket) => {
  let joinedRooms = new Set();

  // 방 생성
  socket.on('create_room', ({ roomId, title, adminPassword }, callback) => {
    if (adminPassword && !db.verifyAdminPassword(adminPassword)) {
      if (callback) callback({ error: '관리자 권한이 없습니다.' });
      return;
    }

    const code = (roomId || Math.random().toString(36).substring(2, 8)).toUpperCase();
    const room = db.createRoom(code, title);

    if (callback) callback({ success: true, room });
  });

  // 방 입장
  socket.on('join_room', ({ roomId, role = 'audience' }, callback) => {
    const code = roomId?.toUpperCase();
    let room = db.getRoom(code);

    if (!room) {
      room = db.createRoom(code, `${code} 강연 세션`);
    }

    socket.join(code);
    joinedRooms.add(code);

    const roomSockets = io.sockets.adapter.rooms.get(code);
    const userCount = roomSockets ? roomSockets.size : 1;

    io.to(code).emit('user_count_updated', { roomId: code, userCount });

    if (callback) {
      callback({
        success: true,
        room: {
          id: room.id,
          title: room.title,
          isLocked: room.isLocked,
          questions: room.questions,
          userCount,
        },
      });
    }
  });

  // 질문 등록
  socket.on('new_question', ({ roomId, author, content }, callback) => {
    const code = roomId?.toUpperCase();
    const room = db.getRoom(code);

    if (!room) {
      if (callback) callback({ error: '방을 찾을 수 없습니다.' });
      return;
    }

    if (room.isLocked) {
      if (callback) callback({ error: '현재 질문 접수가 마감되었습니다.' });
      return;
    }

    if (!content || !content.trim()) {
      if (callback) callback({ error: '질문 내용을 입력해주세요.' });
      return;
    }

    const newQ = db.addQuestion(code, { author, content });

    if (newQ) {
      console.log(`[Q&A Server] 새 질문 등록 (${code}): ${newQ.author} - ${newQ.content}`);
      // 해당 룸 전체에 실시간 브로드캐스트
      io.to(code).emit('question_added', newQ);
      if (callback) callback({ success: true, question: newQ });
    }
  });

  // 질문 추천(Upvote) 토글
  socket.on('vote_question', ({ roomId, questionId, userId }, callback) => {
    const code = roomId?.toUpperCase();
    const voterId = userId || socket.id;

    const result = db.voteQuestion(code, questionId, voterId);
    if (result) {
      io.to(code).emit('question_updated', result.question);
      if (callback) callback({ success: true, votes: result.question.votes, hasVoted: result.hasVoted });
    }
  });

  // 관리자: 답변 완료 토글
  socket.on('toggle_answered', ({ roomId, questionId }) => {
    const code = roomId?.toUpperCase();
    const question = db.toggleAnswered(code, questionId);
    if (question) {
      io.to(code).emit('question_updated', question);
    }
  });

  // 관리자: 질문 강조(Highlight) 토글
  socket.on('toggle_highlight', ({ roomId, questionId }) => {
    const code = roomId?.toUpperCase();
    const questions = db.toggleHighlight(code, questionId);
    if (questions) {
      io.to(code).emit('room_questions_synced', questions);
    }
  });

  // 관리자: 질문 삭제
  socket.on('delete_question', ({ roomId, questionId }) => {
    const code = roomId?.toUpperCase();
    const success = db.deleteQuestion(code, questionId);
    if (success) {
      io.to(code).emit('question_deleted', { questionId });
    }
  });

  // 관리자: 전체 질문 초기화
  socket.on('clear_questions', ({ roomId }) => {
    const code = roomId?.toUpperCase();
    db.clearQuestions(code);
    io.to(code).emit('room_questions_synced', []);
  });

  // 관리자: 질문 접수 잠금/해제
  socket.on('toggle_lock', ({ roomId }) => {
    const code = roomId?.toUpperCase();
    const isLocked = db.toggleLock(code);
    if (isLocked !== null) {
      io.to(code).emit('room_lock_changed', { isLocked });
    }
  });

  socket.on('disconnect', () => {
    joinedRooms.forEach((code) => {
      const roomSockets = io.sockets.adapter.rooms.get(code);
      const userCount = roomSockets ? roomSockets.size : 0;
      io.to(code).emit('user_count_updated', { roomId: code, userCount });
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [오류] 포트 ${PORT}번이 이미 다른 프로그램에서 사용 중입니다.`);
    process.exit(1);
  } else {
    console.error('서버 오류:', err);
  }
});

httpServer.listen(PORT, '0.0.0.0', async () => {
  const localIp = getLocalIpAddress();
  console.log(`\n==================================================`);
  console.log(`> [Q&A Server] 로컬 접속:   http://localhost:${PORT}`);
  console.log(`> [Q&A Server] Wi-Fi 접속:   http://${localIp}:${PORT}`);
  console.log(`> [Q&A Server] 기본 관리자 비밀번호: admin1234`);

  const enableTunnel = process.argv.includes('--tunnel') || process.env.ENABLE_TUNNEL === 'true';
  if (enableTunnel) {
    try {
      const subdomain = 'qa-' + Math.random().toString(36).substring(2, 8);
      const ltTunnel = await localtunnel({ port: PORT, subdomain });
      publicTunnelUrl = ltTunnel.url;
      console.log(`> [Q&A Server] ✨ 외부 공개 주소 (스마트폰 접속용): ${publicTunnelUrl}`);
    } catch (err) {
      console.error('> [Q&A Server] 터널 생성 실패:', err.message);
    }
  }
  console.log(`==================================================\n`);
});
