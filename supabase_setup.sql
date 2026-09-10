-- =========================================================================
-- 🏡 우리 가족 앨범 (Our Family Memories) - Supabase 데이터베이스 구축 SQL
-- 사용법: Supabase 대시보드(https://supabase.com/dashboard) 로그인 
--       -> 프로젝트(fhxixobykjkcconczpnq) 선택
--       -> 좌측 메뉴 [SQL Editor] 클릭 
--       -> 아래 내용 전체를 복사하여 붙여넣고 우측 하단 [Run] 버튼 클릭!
-- =========================================================================

-- 1. 사진(photos) 테이블 생성
CREATE TABLE IF NOT EXISTS public.photos (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    caption TEXT,
    author TEXT DEFAULT '가족',
    author_role TEXT DEFAULT '👨‍👩‍👧‍👦',
    taken_at TEXT NOT NULL,
    location TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 댓글(comments) 테이블 생성 (사진 삭제 시 해당 댓글도 자동 삭제)
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    photo_id TEXT REFERENCES public.photos(id) ON DELETE CASCADE,
    author TEXT DEFAULT '가족',
    author_role TEXT DEFAULT '💬',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 보안 정책(RLS) 활성화 및 가족 누구나 사진/댓글 읽기·쓰기 허용
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 충돌 방지를 위해 삭제 후 재생성
DROP POLICY IF EXISTS "Allow public read photos" ON public.photos;
DROP POLICY IF EXISTS "Allow public insert photos" ON public.photos;
DROP POLICY IF EXISTS "Allow public update photos" ON public.photos;
DROP POLICY IF EXISTS "Allow public delete photos" ON public.photos;

CREATE POLICY "Allow public read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Allow public insert photos" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update photos" ON public.photos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete photos" ON public.photos FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public insert comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public delete comments" ON public.comments;

CREATE POLICY "Allow public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete comments" ON public.comments FOR DELETE USING (true);

-- 4. 사진 파일 저장용 스토리지 버킷(photos) 생성 및 공개 설정
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public select on photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert on photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on photos bucket" ON storage.objects;

CREATE POLICY "Allow public select on photos bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Allow public insert on photos bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Allow public delete on photos bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'photos');

-- 5. 초기 샘플 가족 사진 데이터 등록
INSERT INTO public.photos (id, url, title, caption, author, author_role, taken_at, location, likes)
VALUES 
('sample-1', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80', '주말 공원 나들이', '선선한 가을 날씨에 온 가족이 함께 공원에 나와 돗자리 펴고 힐링했던 날! 하늘이 너무 맑았어요 🌿', '아빠', '👨', '2026-09-08', '올림픽공원 잔디마당', 5),
('sample-2', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80', '우리 집 셰프들의 피자 만들기 파티', '아이들과 함께 만든 수제 토핑 피자! 도우 반죽하느라 온 얼굴에 밀가루가 묻었지만 맛은 최고였습니다 🍕', '엄마', '👩', '2026-09-05', '우리 집 주방', 4),
('sample-3', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80', '할머니 생신 축하 파티 🎂', '할머니 칠순을 맞아 온 가족이 다 모였습니다. 늘 건강하시고 오래오래 행복하셨으면 좋겠어요 사랑합니다!', '딸', '👧', '2026-08-24', '가족 모임 식당', 7),
('sample-4', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', '여름 바다 가족 여행', '뜨거운 태양과 시원한 동해 바다 파도! 모래성도 쌓고 조개도 줍고 신나게 놀다 왔어요 🌊', '아빠', '👨', '2026-08-15', '강릉 안목해변', 6),
('sample-5', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80', '초코의 나른한 낮잠 시간 🐶', '거실 창가 햇살 아래서 배 보이고 쿨쿨 자는 막둥이 초코. 보기만 해도 마음이 몽글몽글해져요.', '아들', '👦', '2026-07-20', '거실 햇살자리', 8),
('sample-6', 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=1200&q=80', '여름 숲속 힐링 캠핑 ⛺', '새소리 물소리 들으며 마신 모닝 드립커피 한 잔. 가족들과 둘러앉아 밤하늘 별 보며 나눈 이야기들이 참 좋았습니다.', '엄마', '👩', '2026-07-02', '가평 잣나무숲 캠핑장', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.comments (id, photo_id, author, author_role, text)
VALUES
('c-1-1', 'sample-1', '엄마', '👩', '이날 챙겨간 샌드위치 진짜 맛있었지! 다음 주에 또 가자 ❤️'),
('c-1-2', 'sample-1', '딸', '👧', '바람개비 돌리면서 달리기한 거 짱 재밌었음 ㅋㅋㅋ'),
('c-2-1', 'sample-2', '아들', '👦', '제가 올린 치즈가 제일 두꺼워서 꿀맛이었어요!'),
('c-2-2', 'sample-2', '아빠', '👨', '다음에 아빠표 스파게티도 같이 만들자 ㅎㅎ'),
('c-3-1', 'sample-3', '할머니', '👵', '우리 손녀가 써준 손편지 읽고 눈물날 뻔했단다 고마워 ^^')
ON CONFLICT (id) DO NOTHING;
