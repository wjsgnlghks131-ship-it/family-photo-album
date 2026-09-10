const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// 환경 및 경로 설정 (Vercel 서버리스 배포 호환)
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'album.json');
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

// 디렉토리 자동 생성
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 정적 파일 서빙
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));

// Multer 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
    }
  }
});

// 초기 샘플 데이터 (월별/날짜별 구성을 바로 보여줄 수 있는 감성 가족 사진)
const DEFAULT_PHOTOS = [
  {
    id: 'sample-1',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    title: '주말 공원 나들이',
    caption: '선선한 가을 날씨에 온 가족이 함께 공원에 나와 돗자리 펴고 힐링했던 날! 하늘이 너무 맑았어요 🌿',
    author: '아빠',
    authorRole: '👨',
    takenAt: '2026-09-08',
    location: '올림픽공원 잔디마당',
    createdAt: '2026-09-08T14:20:00.000Z',
    likes: 5,
    comments: [
      {
        id: 'c-1-1',
        author: '엄마',
        authorRole: '👩',
        text: '이날 챙겨간 샌드위치 진짜 맛있었지! 다음 주에 또 가자 ❤️',
        createdAt: '2026-09-08T15:10:00.000Z'
      },
      {
        id: 'c-1-2',
        author: '딸',
        authorRole: '👧',
        text: '바람개비 돌리면서 달리기한 거 짱 재밌었음 ㅋㅋㅋ',
        createdAt: '2026-09-08T16:30:00.000Z'
      }
    ]
  },
  {
    id: 'sample-2',
    url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    title: '우리 집 셰프들의 피자 만들기 파티',
    caption: '아이들과 함께 만든 수제 토핑 피자! 도우 반죽하느라 온 얼굴에 밀가루가 묻었지만 맛은 최고였습니다 🍕',
    author: '엄마',
    authorRole: '👩',
    takenAt: '2026-09-05',
    location: '우리 집 주방',
    createdAt: '2026-09-05T18:45:00.000Z',
    likes: 4,
    comments: [
      {
        id: 'c-2-1',
        author: '아들',
        authorRole: '👦',
        text: '제가 올린 치즈가 제일 두꺼워서 꿀맛이었어요!',
        createdAt: '2026-09-05T19:00:00.000Z'
      },
      {
        id: 'c-2-2',
        author: '아빠',
        authorRole: '👨',
        text: '다음에 아빠표 스파게티도 같이 만들자 ㅎㅎ',
        createdAt: '2026-09-05T20:15:00.000Z'
      }
    ]
  },
  {
    id: 'sample-3',
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    title: '할머니 생신 축하 파티 🎂',
    caption: '할머니 칠순을 맞아 온 가족이 다 모였습니다. 늘 건강하시고 오래오래 행복하셨으면 좋겠어요 사랑합니다!',
    author: '딸',
    authorRole: '👧',
    takenAt: '2026-08-24',
    location: '가족 모임 식당',
    createdAt: '2026-08-24T19:30:00.000Z',
    likes: 7,
    comments: [
      {
        id: 'c-3-1',
        author: '할머니',
        authorRole: '👵',
        text: '우리 손녀가 써준 손편지 읽고 눈물날 뻔했단다 고마워 ^^',
        createdAt: '2026-08-24T21:00:00.000Z'
      },
      {
        id: 'c-3-2',
        author: '엄마',
        authorRole: '👩',
        text: '케이크도 너무 예뻤고 다들 웃음꽃이 활짝 핀 날 💐',
        createdAt: '2026-08-24T21:40:00.000Z'
      }
    ]
  },
  {
    id: 'sample-4',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    title: '여름 바다 가족 여행',
    caption: '뜨거운 태양과 시원한 동해 바다 파도! 모래성도 쌓고 조개도 줍고 신나게 놀다 왔어요 🌊',
    author: '아빠',
    authorRole: '👨',
    takenAt: '2026-08-15',
    location: '강릉 안목해변',
    createdAt: '2026-08-15T15:00:00.000Z',
    likes: 6,
    comments: [
      {
        id: 'c-4-1',
        author: '아들',
        authorRole: '👦',
        text: '튜브 타고 파도 넘기한 게 이번 여름 최고의 기억 🏊‍♂️',
        createdAt: '2026-08-15T17:20:00.000Z'
      }
    ]
  },
  {
    id: 'sample-5',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
    title: '초코의 나른한 낮잠 시간 🐶',
    caption: '거실 창가 햇살 아래서 배 보이고 쿨쿨 자는 막둥이 초코. 보기만 해도 마음이 몽글몽글해져요.',
    author: '아들',
    authorRole: '👦',
    takenAt: '2026-07-20',
    location: '거실 햇살자리',
    createdAt: '2026-07-20T14:10:00.000Z',
    likes: 8,
    comments: [
      {
        id: 'c-5-1',
        author: '엄마',
        authorRole: '👩',
        text: '진짜 사람처럼 자네 ㅋㅋㅋ 우리 집 귀염둥이',
        createdAt: '2026-07-20T14:50:00.000Z'
      }
    ]
  },
  {
    id: 'sample-6',
    url: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=1200&q=80',
    title: '여름 숲속 힐링 캠핑 ⛺',
    caption: '새소리 물소리 들으며 마신 모닝 드립커피 한 잔. 가족들과 둘러앉아 밤하늘 별 보며 나눈 이야기들이 참 좋았습니다.',
    author: '엄마',
    authorRole: '👩',
    takenAt: '2026-07-02',
    location: '가평 잣나무숲 캠핑장',
    createdAt: '2026-07-02T09:30:00.000Z',
    likes: 5,
    comments: [
      {
        id: 'c-6-1',
        author: '아빠',
        authorRole: '👨',
        text: '장작불에 구워 먹은 마시멜로 또 생각난다 🔥',
        createdAt: '2026-07-02T11:00:00.000Z'
      }
    ]
  }
];

// 데이터 읽기/쓰기 헬퍼 함수
function readData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeData({ photos: DEFAULT_PHOTOS });
      return { photos: DEFAULT_PHOTOS };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.photos || !Array.isArray(data.photos)) {
      data.photos = DEFAULT_PHOTOS;
      writeData(data);
    }
    return data;
  } catch (err) {
    console.error('DB 읽기 오류, 기본값으로 복구합니다:', err.message);
    return { photos: DEFAULT_PHOTOS };
  }
}

function writeData(data) {
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('DB 쓰기 오류:', err.message);
  }
}

// 네트워크 IPv4 주소 목록 추출
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // 가상 어댑터나 루프백 제외 우선순위
        addresses.push({
          name,
          address: iface.address
        });
      }
    }
  }
  return addresses;
}

// ================= API 엔드포인트 =================

// 1. 네트워크 정보 및 스마트폰 접속용 QR 코드 생성
app.get('/api/network-info', async (req, res) => {
  try {
    const ips = getLocalIpAddresses();
    const primaryIp = ips.length > 0 ? ips[0].address : 'localhost';
    const mobileUrl = `http://${primaryIp}:${PORT}`;
    
    // QR 코드 Data URL 생성
    const qrCodeDataUrl = await QRCode.toDataURL(mobileUrl, {
      margin: 2,
      width: 280,
      color: {
        dark: '#2D3142',
        light: '#FFFFFF'
      }
    });

    res.json({
      port: PORT,
      primaryIp,
      mobileUrl,
      allIps: ips,
      qrCodeDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'QR 생성 실패: ' + err.message });
  }
});

// 2. 사진 목록 조회 (월별/날짜별 필터 및 월별 통계 집계 포함)
app.get('/api/photos', (req, res) => {
  const db = readData();
  let photos = [...db.photos];

  // 날짜 역순(최신순) 정렬: takenAt 기준 내림차순
  photos.sort((a, b) => {
    const dateA = a.takenAt || '1970-01-01';
    const dateB = b.takenAt || '1970-01-01';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  // 전체 사진 기반 월별 통계 집계 (ex: "2026-09": 3)
  const monthCounts = {};
  photos.forEach(p => {
    if (p.takenAt && p.takenAt.length >= 7) {
      const ym = p.takenAt.substring(0, 7); // "YYYY-MM"
      monthCounts[ym] = (monthCounts[ym] || 0) + 1;
    }
  });

  // 정렬된 월별 탭 데이터 생성
  const monthsSummary = Object.keys(monthCounts)
    .sort((a, b) => b.localeCompare(a))
    .map(ym => {
      const [year, month] = ym.split('-');
      return {
        key: ym,
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        label: `${year}년 ${parseInt(month, 10)}월`,
        count: monthCounts[ym]
      };
    });

  // 필터 적용
  const { year, month, date, author, search } = req.query;

  if (date) {
    photos = photos.filter(p => p.takenAt === date);
  } else if (year && month) {
    const paddedMonth = String(month).padStart(2, '0');
    const ym = `${year}-${paddedMonth}`;
    photos = photos.filter(p => p.takenAt && p.takenAt.startsWith(ym));
  } else if (year) {
    photos = photos.filter(p => p.takenAt && p.takenAt.startsWith(String(year)));
  }

  if (author) {
    photos = photos.filter(p => p.author === author);
  }

  if (search) {
    const q = search.toLowerCase();
    photos = photos.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.author && p.author.toLowerCase().includes(q))
    );
  }

  res.json({
    totalCount: db.photos.length,
    filteredCount: photos.length,
    monthsSummary,
    photos
  });
});

// 3. 사진 업로드 (파일 업로드 or Base64 / URL 등록 지원)
app.post('/api/photos', upload.single('photo'), (req, res) => {
  try {
    const db = readData();
    const { title, caption, author, authorRole, takenAt, location, imageUrl } = req.body;

    let photoUrl = '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      photoUrl = imageUrl;
    } else {
      return res.status(400).json({ error: '사진 파일 또는 이미지 URL이 필요합니다.' });
    }

    // 촬영일이 없으면 오늘 날짜 (KST 기준 YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    const finalTakenAt = takenAt || todayStr;

    const newPhoto = {
      id: 'p-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      url: photoUrl,
      title: (title || '').trim() || `${finalTakenAt}의 추억`,
      caption: (caption || '').trim(),
      author: (author || '가족').trim(),
      authorRole: authorRole || '👨‍👩‍👧‍👦',
      takenAt: finalTakenAt,
      location: (location || '').trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };

    db.photos.unshift(newPhoto);
    writeData(db);

    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: '사진 업로드 실패: ' + err.message });
  }
});

// 4. 사진에 코멘트(댓글) 작성
app.post('/api/photos/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, authorRole, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: '댓글 내용을 입력해 주세요.' });
  }

  const db = readData();
  const photo = db.photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
  }

  if (!photo.comments) photo.comments = [];

  const newComment = {
    id: 'c-' + Date.now() + '-' + Math.round(Math.random() * 1000),
    author: (author || '가족').trim(),
    authorRole: authorRole || '💬',
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  photo.comments.push(newComment);
  writeData(db);

  res.status(201).json(newComment);
});

// 5. 사진 좋아요(하트) 토글
app.post('/api/photos/:id/like', (req, res) => {
  const { id } = req.params;
  const db = readData();
  const photo = db.photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
  }

  photo.likes = (photo.likes || 0) + 1;
  writeData(db);

  res.json({ likes: photo.likes });
});

// 6. 댓글 삭제
app.delete('/api/photos/:id/comments/:commentId', (req, res) => {
  const { id, commentId } = req.params;
  const db = readData();
  const photo = db.photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
  }

  const initialCount = photo.comments.length;
  photo.comments = (photo.comments || []).filter(c => c.id !== commentId);

  if (photo.comments.length === initialCount) {
    return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
  }

  writeData(db);
  res.json({ success: true, remainingCount: photo.comments.length });
});

// 7. 사진 삭제
app.delete('/api/photos/:id', (req, res) => {
  const { id } = req.params;
  const db = readData();
  const photoIndex = db.photos.findIndex(p => p.id === id);

  if (photoIndex === -1) {
    return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
  }

  const [removed] = db.photos.splice(photoIndex, 1);

  // 로컬 업로드 파일인 경우 실제 파일도 삭제
  if (removed.url && removed.url.startsWith('/uploads/')) {
    const filename = path.basename(removed.url);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('파일 삭제 실패:', err.message);
      }
    }
  }

  writeData(db);
  res.json({ success: true });
});

// 8. 데이터 초기화 (기본 샘플 복구용)
app.post('/api/reset-sample', (req, res) => {
  writeData({ photos: DEFAULT_PHOTOS });
  res.json({ success: true, message: '샘플 데이터로 초기화되었습니다.' });
});

// SPA 라우팅 폴백
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// 서버 기동 (직접 실행 시에만 listen, Vercel 및 모듈 임포트 시에는 app export)
if (!isVercel && require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIpAddresses();
    console.log('\n======================================================');
    console.log('🏡 [우리 가족 앨범] 웹 서버가 성공적으로 시작되었습니다!');
    console.log(`💻 PC 접속 주소      : http://localhost:${PORT}`);
    if (ips.length > 0) {
      ips.forEach(ip => {
        console.log(`📱 스마트폰 접속 주소: http://${ip.address}:${PORT}  (${ip.name})`);
      });
    }
    console.log('📌 같은 Wi-Fi에 연결된 스마트폰으로 위 주소에 접속해 사진을 올릴 수 있습니다.');
    console.log('======================================================\n');
  });
}

module.exports = app;
