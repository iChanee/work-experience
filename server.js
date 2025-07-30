require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const multer = require('multer');
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });


// ====== 회사 데이터: 키워드-파일 매칭 테이블 ======
const DATA_DIR = path.join(__dirname, 'CTI_DATA');
// 질문 키워드에 따라 불러올 txt파일 지정 (필요에 따라 추가/수정)
const TOPIC_FILES = [
  { keywords: ['회사개요', '개요'], file: '1_회사개요.txt' },
  { keywords: ['회사소개', '소개'], file: '2_회사소개.txt' },
  { keywords: ['연혁', '히스토리', '연도'], file: '3_연혁.txt' },
  { keywords: ['복지', '복리', '혜택'], file: '4_복지혜택.txt' },
  { keywords: ['연봉', '임금', '급여'], file: '5_연봉정보.txt' },
  { keywords: ['재무', '매출', '회계'], file: '6_재무현황.txt' },
  { keywords: ['인원', '조직', '인사'], file: '7_인원현황.txt' },
  { keywords: ['주요제품', '제품', '상품'], file: '8_주요제품.txt' },
  { keywords: ['주요거래처', '거래처', '고객사'], file: '9_주요거래처.txt' },
  { keywords: ['계측', '계측제품', '측정장비'], file: '계측제품.txt' },
  { keywords: ['공지', '공지사항'], file: '공지사항_전체글.txt' },
  { keywords: ['사업', '분야', '업종'], file: '사업분야.txt' },
  { keywords: ['오시는길', '주소', '위치'], file: '오시는길.txt' },
  { keywords: ['웹매거진', '매거진'], file: '웹매거진.txt' },
  { keywords: ['인사말', 'CEO'], file: '인사말.txt' },
  { keywords: ['인증', '품질'], file: '인증현황.txt' },
  { keywords: ['제조', '생산제품'], file: '제조제품.txt' },
  { keywords: ['조직도', '구성'], file: '조직도.txt' },
  { keywords: ['특허'], file: '특허현황.txt' }
];
// 질문→회사데이터 파일 찾는 함수
function getCompanyDataByTopic(userMsg) {
    const msg = (userMsg||'').toLowerCase();
    let filesToUse = [];
    for (const topic of TOPIC_FILES) {
        if (topic.keywords.some(kw => msg.includes(kw))) {
            filesToUse.push(topic.file);
        }
    }
    // 파일이 여러개면 모두 합쳐서 리턴
    if (filesToUse.length > 0) {
        let mergedText = '';
        for (const file of filesToUse) {
            const filePath = path.join(DATA_DIR, file);
            if (fs.existsSync(filePath)) {
                mergedText += `\n\n[${file.replace('.txt','')}] =====================\n`;
                mergedText += fs.readFileSync(filePath, 'utf-8') + '\n';
            }
        }
        return mergedText;
    }
    // 키워드 없으면 회사개요+회사소개 기본값
    let mergedText = '';
    ['1_회사개요.txt','2_회사소개.txt'].forEach(f=>{
        const filePath = path.join(DATA_DIR, f);
        if (fs.existsSync(filePath)) {
            mergedText += `\n\n[${f.replace('.txt','')}] =====================\n`;
            mergedText += fs.readFileSync(filePath, 'utf-8') + '\n';
        }
    });
    return mergedText;
}

// ========================================

const app = express();

// CORS: 반드시 origin/credentials 옵션 추가
app.use(cors({
  origin: "http://localhost:3000", // 실제 프론트 주소에 맞게 변경
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use('/uploads', express.static(uploadPath));

// 세션
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false // HTTPS 환경에서는 true로!
  }
}));

// MySQL 연결
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME // .env에 반드시 community_db로!
});

// DB 연결 체크
db.connect(err => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
  } else {
    console.log('MySQL 연결 성공');
  }
});

// 로그인 상태 및 관리자 여부 등 사용자 정보 반환 API (통합)
app.get('/api/me', (req, res) => {
  if (req.session.loggedIn && req.session.ID) {
    res.json({
      loggedIn: true,
      ID: req.session.ID,
      role: req.session.role // 세션에 저장된 경우에만 반환, null/undefined 가능
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// 회원가입
app.post('/register', (req, res) => {
  const { ID, password } = req.body;
  const userID = uuidv4();  // 랜덤 고유값
  db.query(
    'INSERT INTO users (userID, ID, password) VALUES (?, ?, ?)',
    [userID, ID, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB 저장 오류: ' + err.message });
      res.json({ message: '회원가입 성공' });
    }
  );
});

// 로그인
app.post('/login', (req, res) => {
  const { ID, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE ID = ? AND password = ?',
    [ID, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB 오류' });
      if (results.length === 0) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
      const user = results[0];
      req.session.loggedIn = true;
      req.session.ID = user.ID;
      req.session.role = user.role; // ← role 저장
      res.json({ message: '로그인 성공!' });
    }
  );
});

// 로그아웃
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    res.json({ message: '로그아웃 성공' });
  });
});

app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// 글 목록
app.get('/api/posts', (req, res) => {
  const type = req.query.type || 'board'; // 기본값 board
  db.query(
    "SELECT * FROM posts WHERE type = ? ORDER BY created_at DESC",
    [type],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      res.json(rows);
    }
  );
});

// 글 등록 
app.post('/api/posts', (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  const { title, content, type, img_url } = req.body;
  const author = req.session.ID;

  // 웹매거진 type만 관리자 권한 체크
  if (type === 'webmagazine' && req.session.role !== 'admin') {
    return res.status(403).json({ error: '웹매거진 글쓰기는 관리자만 가능합니다.' });
  }
  if (!title || !content || !type) {
    return res.status(400).json({ error: '제목, 내용, type 필수' });
  }
  db.query(
    "INSERT INTO posts (title, content, author, type, img_url) VALUES (?, ?, ?, ?, ?)",
    [title, content, author, type, img_url || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      res.json({ message: '글 등록 성공', post_id: result.insertId });
    }
  );
});


// 글 삭제 (본인만 가능)
app.delete('/api/posts/:id', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: '로그인 필요' });
  const postId = req.params.id;
  const type = req.query.type;
  const user_id = req.session.ID;
  const user_role = req.session.role;

  db.query(
    "SELECT author FROM posts WHERE post_id = ? AND type = ?",
    [postId, type],
    (err, rows) => {
      if (err || rows.length === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
      const { author } = rows[0];
      if (author !== user_id && user_role !== 'admin') {
        return res.status(403).json({ error: '본인 또는 관리자만 삭제할 수 있습니다.' });
      }
      db.query(
        "DELETE FROM posts WHERE post_id = ? AND type = ?",
        [postId, type],
        (err2) => {
          if (err2) return res.status(500).json({ error: '글 삭제 실패' });
          res.json({ message: '글 삭제 성공' });
        }
      );
    }
  );
});


// 게시글 상세정보 라우터 추가
app.get('/api/posts/:id', (req, res) => {
  const postId = req.params.id;
  const type = req.query.type;
  db.query(
    "SELECT * FROM posts WHERE post_id = ? AND type = ?",
    [postId, type],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      if (rows.length === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
      res.json(rows[0]);
    }
  );
});


// 댓글 등록
app.post('/api/comments', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: '로그인 필요' });
  const { post_id, post_type, content } = req.body;
  const author = req.session.ID;
  if (!post_id || !post_type || !content) {
    return res.status(400).json({ error: 'post_id, post_type, content 필수' });
  }
  db.query(
    "INSERT INTO comments (post_id, post_type, author, content) VALUES (?, ?, ?, ?)",
    [post_id, post_type, author, content],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      // 댓글 카운트 +1
      db.query(
        "UPDATE posts SET comments = comments + 1 WHERE post_id = ? AND type = ?",
        [post_id, post_type],
        (err2) => {
          if (err2) return res.status(500).json({ error: '댓글 등록은 성공, 카운트 업데이트 실패: ' + err2.message });
          res.json({ message: '댓글 등록 성공', comment_id: result.insertId });
        }
      );
    }
  );
});


// 댓글 목록 (특정 게시글)
app.get('/api/comments', (req, res) => {
    const { post_id, post_type } = req.query;
    if (!post_id || !post_type) return res.status(400).json({ error: 'post_id, post_type 필요' });
    db.query(
        "SELECT comment_id, author, content, created_at FROM comments WHERE post_id = ? AND post_type = ? ORDER BY created_at ASC",
        [post_id, post_type],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
            const comments = rows.map(row => ({
                comment_id: row.comment_id,
                author: row.author,
                content: row.content,
                date: row.created_at
            }));
            res.json(comments);
        }
    );
});


// 댓글 삭제 API
app.delete('/api/comments/:comment_id', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: '로그인 필요' });
  const comment_id = req.params.comment_id;
  const user_id = req.session.ID;
  const user_role = req.session.role;
  db.query(
    "SELECT author, post_id, post_type FROM comments WHERE comment_id = ?",
    [comment_id],
    (err, rows) => {
      if (err || rows.length === 0) return res.status(404).json({ error: '댓글 없음' });
      const { author, post_id, post_type } = rows[0];
      if (author !== user_id && user_role !== 'admin') {
        return res.status(403).json({ error: '본인 또는 관리자만 삭제할 수 있습니다.' });
      }
      db.query(
        "DELETE FROM comments WHERE comment_id = ?",
        [comment_id],
        (err2) => {
          if (err2) return res.status(500).json({ error: '댓글 삭제 실패' });
          // 댓글수 -1 (최소 0)
          db.query(
            "UPDATE posts SET comments = GREATEST(comments - 1, 0) WHERE post_id = ? AND type = ?",
            [post_id, post_type],
            (err3) => {
              if (err3) return res.status(500).json({ error: '카운트 동기화 실패' });
              res.json({ message: '댓글 삭제 성공' });
            }
          );
        }
      );
    }
  );
});


// 1. 웹매거진 글 목록 조회 (전체 공개)
// app.get('/api/webmagazine', (req, res) => {
//   db.query('SELECT post_id, title, author, created_at FROM webmagazine ORDER BY post_id DESC', (err, rows) => {
//     if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
//     res.json(rows);
//   });
// });

// 2. 웹매거진 글 상세 조회 (전체 공개)
// app.get('/api/webmagazine/:post_id', (req, res) => {
//   const post_id = req.params.post_id;
//   db.query('SELECT * FROM webmagazine WHERE post_id = ?', [post_id], (err, rows) => {
//     if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
//     if (rows.length === 0) return res.status(404).json({ error: '글 없음' });
//     res.json(rows[0]);
//   });
// });

// 3. 웹매거진 글 등록 (관리자만)
// app.post('/api/webmagazine', (req, res) => {
//   if (!req.session.loggedIn || req.session.role !== 'admin') {
//     return res.status(403).json({ error: '관리자만 작성 가능' });
//   }
//   const { title, content } = req.body;
//   if (!title || !content) {
//     return res.status(400).json({ error: '제목과 내용 필수' });
//   }
//   const author = req.session.ID; // 로그인한 관리자 ID
//   db.query(
//     'INSERT INTO webmagazine (title, content, author) VALUES (?, ?, ?)',
//     [title, content, author],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
//       res.json({ message: '글 등록 성공', post_id: result.insertId });
//     }
//   );
// });

// 4. 웹매거진 글 삭제 (관리자만)
// app.delete('/api/webmagazine/:post_id', (req, res) => {
//   if (!req.session.loggedIn || req.session.role !== 'admin') {
//     return res.status(403).json({ error: '관리자만 삭제 가능' });
//   }
//   const post_id = req.params.post_id;
//   db.query('DELETE FROM webmagazine WHERE post_id = ?', [post_id], (err, result) => {
//     if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
//     res.json({ message: '삭제 완료' });
//   });
// });

// === GPT 챗봇 핵심 라우터 ===
app.post('/api/chat', async (req, res) => {
  try {
    const userMsg = req.body.message;
    const companyInfo = getCompanyDataByTopic(userMsg);

    const SYSTEM_PROMPT = `
아래는 우리 회사 공식 자료입니다. 반드시 참고해서 답변만 해주세요.

${companyInfo}
`;

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg }
        ]
      })
    });
    const data = await gptRes.json();

    if (data.error) {
      res.json({ reply: 'OpenAI API 오류: ' + (data.error.message || '알 수 없는 에러') });
      return;
    }
    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.json({ reply: "GPT API 응답이 올바르지 않습니다." });
    }
  } catch (err) {
    res.json({ reply: "서버 오류 발생" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
