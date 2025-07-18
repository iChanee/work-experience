require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();

// CORS: 반드시 origin/credentials 옵션 추가
app.use(cors({
  origin: "http://localhost:3000", // 실제 프론트 주소에 맞게 변경
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

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

// // 루트에서 무조건 로그인 페이지로
// app.get('/', (req, res) => {
//   res.redirect('/login.html');
// });

// 로그인 상태 확인 API (프론트에서 /api/me fetch)
app.get('/api/me', (req, res) => {
  if (req.session.loggedIn && req.session.ID) {
    res.json({ loggedIn: true, ID: req.session.ID });
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
      req.session.loggedIn = true;
      req.session.ID = ID;
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

// 글 목록
app.get('/api/posts', (req, res) => {
  db.query("SELECT * FROM board ORDER BY post_id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
    res.json(rows);
  });
});

// 글 등록 (로그인 필요, write-post.html에서 사용)
app.post('/api/posts', (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  const { title, content } = req.body;
  const author = req.session.ID;
  db.query(
    "INSERT INTO board (title, content, author) VALUES (?, ?, ?)",
    [title, content, author],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      // 글 등록 성공 시 새 글의 post_id 반환
      res.json({ message: '글 등록 성공', post_id: result.insertId });
    }
  );
});

// 글 삭제 (본인만 가능)
app.delete('/api/posts/:post_id', (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: '로그인 필요' });
    }
    const post_id = req.params.post_id;
    const user_id = req.session.ID;
    // 1. 권한 확인: 본인 글인지
    db.query(
        "SELECT author FROM board WHERE post_id = ?",
        [post_id],
        (err, rows) => {
            if (err || rows.length === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
            const { author } = rows[0];
            if (author !== user_id) return res.status(403).json({ error: '본인 글만 삭제할 수 있습니다.' });
            // 2. 글 삭제 (댓글은 ON DELETE CASCADE 등으로 같이 삭제 권장)
            db.query(
                "DELETE FROM board WHERE post_id = ?",
                [post_id],
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
  db.query(
    "SELECT * FROM board WHERE post_id = ?",
    [postId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      if (rows.length === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
      res.json(rows[0]);
    }
  );
});


// 댓글 등록 (로그인 필요)
app.post('/api/comments', (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: '로그인 필요' });
    }
    const { post_id, content } = req.body;
    const author = req.session.ID;
    if (!post_id || !content) {
        return res.status(400).json({ error: '필수값 누락' });
    }
    db.query(
        "INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)",
        [post_id, author, content],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
            // 댓글 카운트 +1
            db.query(
                "UPDATE board SET comments = comments + 1 WHERE post_id = ?",
                [post_id],
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
    const post_id = req.query.post_id;
    if (!post_id) return res.status(400).json({ error: 'post_id 필요' });
    db.query(
        "SELECT comment_id, author, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC",
        [post_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
            // 반드시 comment_id 포함
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
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: '로그인 필요' });
    }
    const comment_id = req.params.comment_id;
    const user_id = req.session.ID;
    db.query(
        "SELECT post_id, author FROM comments WHERE comment_id = ?",
        [comment_id],
        (err, rows) => {
            if (err || rows.length === 0) return res.status(404).json({ error: '댓글 없음' });
            const { post_id, author } = rows[0];
            if (author !== user_id) return res.status(403).json({ error: '본인 댓글만 삭제할 수 있습니다.' });
            db.query(
                "DELETE FROM comments WHERE comment_id = ?",
                [comment_id],
                (err2) => {
                    if (err2) return res.status(500).json({ error: 'DB 오류' });
                    db.query(
                        "UPDATE board SET comments = GREATEST(comments - 1, 0) WHERE post_id = ?",
                        [post_id],
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


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

