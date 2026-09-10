// 오프라인 / 클라이언트 전용 실행 시 폴백용 기본 가족 사진 데이터
const SEED_PHOTOS = [
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

if (typeof window !== 'undefined') {
  window.SEED_PHOTOS = SEED_PHOTOS;
}
