import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import localtunnel from 'localtunnel';
import { startTunnel } from 'untun';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let publicTunnelUrl = process.env.PUBLIC_URL || null;

// 정적 파일 서빙 (배포 및 빌드 실행 대응)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 메모리 저장소 (방 및 질문)
const rooms = new Map();

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

app.get('/api/server-info', (req, res) => {
  res.json({
    ip: getLocalIpAddress(),
    port: 5173,
    serverPort: 3001,
    publicUrl: publicTunnelUrl,
  });
});

// 룸 유효성 확인 API
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId.toUpperCase());
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
  let currentRoomId = null;

  // 방 생성
  socket.on('create_room', ({ roomId, title }, callback) => {
    const code = (roomId || Math.random().toString(36).substring(2, 8)).toUpperCase();
    if (!rooms.has(code)) {
      rooms.set(code, {
        id: code,
        title: title || '실시간 강연 Q&A',
        createdAt: Date.now(),
        isLocked: false,
        questions: [],
      });
    }
    const room = rooms.get(code);
    if (callback) callback({ success: true, room });
  });

  // 방 입장
  socket.on('join_room', ({ roomId, role = 'audience' }, callback) => {
    const code = roomId?.toUpperCase();
    let room = rooms.get(code);

    // 없는 방이면 기본 생성 (간편 테스트를 위해)
    if (!room) {
      room = {
        id: code,
        title: `${code} 강연 세션`,
        createdAt: Date.now(),
        isLocked: false,
        questions: [],
      };
      rooms.set(code, room);
    }

    currentRoomId = code;
    socket.join(code);

    // 현재 접속자 수 계산 및 알림
    const roomSockets = io.sockets.adapter.rooms.get(code);
    const userCount = roomSockets ? roomSockets.size : 1;

    io.to(code).emit('user_count_updated', { userCount });

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
    const room = rooms.get(code);

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

    const newQ = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomId: code,
      author: (author && author.trim()) ? author.trim() : '익명',
      content: content.trim(),
      votes: 0,
      voters: [], // 중복 방지용 (socketId 또는 client uuid)
      isAnswered: false,
      isHighlighted: false,
      isHidden: false,
      createdAt: Date.now(),
    };

    room.questions.unshift(newQ);

    // 해당 방의 모든 클라이언트에 브로드캐스트
    io.to(code).emit('question_added', newQ);

    if (callback) callback({ success: true, question: newQ });
  });

  // 질문 추천(Upvote) 토글
  socket.on('vote_question', ({ roomId, questionId, userId }, callback) => {
    const code = roomId?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    const question = room.questions.find((q) => q.id === questionId);
    if (!question) return;

    const voterId = userId || socket.id;
    const voterIndex = question.voters.indexOf(voterId);

    let hasVoted = false;
    if (voterIndex === -1) {
      // 투표 추가
      question.voters.push(voterId);
      question.votes += 1;
      hasVoted = true;
    } else {
      // 투표 취소
      question.voters.splice(voterIndex, 1);
      question.votes = Math.max(0, question.votes - 1);
      hasVoted = false;
    }

    io.to(code).emit('question_updated', question);

    if (callback) callback({ success: true, votes: question.votes, hasVoted });
  });

  // 질문 상태 변경 (답변 완료 토글)
  socket.on('toggle_answered', ({ roomId, questionId }) => {
    const code = roomId?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    const question = room.questions.find((q) => q.id === questionId);
    if (question) {
      question.isAnswered = !question.isAnswered;
      io.to(code).emit('question_updated', question);
    }
  });

  // 질문 강조(Highlight) 토글 - 발표자가 현재 답변 중인 질문 포커스
  socket.on('toggle_highlight', ({ roomId, questionId }) => {
    const code = roomId?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.questions.forEach((q) => {
      if (q.id === questionId) {
        q.isHighlighted = !q.isHighlighted;
      } else {
        q.isHighlighted = false; // 하나만 강조
      }
    });

    io.to(code).emit('room_questions_synced', room.questions);
  });

  // 질문 삭제
  socket.on('delete_question', ({ roomId, questionId }) => {
    const code = roomId?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.questions = room.questions.filter((q) => q.id !== questionId);
    io.to(code).emit('question_deleted', { questionId });
  });

  // 전체 질문 초기화
  socket.on('clear_questions', ({ roomId }) => {
    const code = roomId?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.questions = [];
    io.to(code).emit('room_questions_synced', []);
  });

  // 질문 접수 잠금/해제 토글
  socket.on('toggle_lock', ({ roomId }) => {
    const code = roomId?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.isLocked = !room.isLocked;
    io.to(code).emit('room_lock_changed', { isLocked: room.isLocked });
  });

  socket.on('disconnect', () => {
    if (currentRoomId) {
      const roomSockets = io.sockets.adapter.rooms.get(currentRoomId);
      const userCount = roomSockets ? roomSockets.size : 0;
      io.to(currentRoomId).emit('user_count_updated', { userCount });
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [오류] 포트 ${PORT}번이 이미 다른 프로그램에서 사용 중입니다.`);
    console.error(`👉 해결 방법: 기존에 켜져 있는 터미널이나 서버를 끄거나, 작업 관리자에서 node 프로세스를 종료해 주세요.\n`);
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

  // --tunnel 플래그가 있거나 환경변수로 터널 요청 시
  const enableTunnel = process.argv.includes('--tunnel') || process.env.ENABLE_TUNNEL === 'true';
  if (enableTunnel) {
    try {
      const subdomain = 'qa-' + Math.random().toString(36).substring(2, 8);
      console.log(`> [Q&A Server] LTE 모바일 공개 터널 생성 중...`);
      const ltTunnel = await localtunnel({ port: PORT, subdomain });
      publicTunnelUrl = ltTunnel.url;
      console.log(`> [Q&A Server] ✨ 외부 공개 주소 (스마트폰 접속용):`);
      console.log(`> [Q&A Server] 🚀 ${publicTunnelUrl}`);
      console.log(`==================================================\n`);

      ltTunnel.on('close', () => {
        console.log('> [Q&A Server] Tunnel closed');
      });
    } catch (err) {
      console.error('> [Q&A Server] 터널 생성 실패:', err.message);
    }
  } else {
    console.log(`==================================================\n`);
  }
});
