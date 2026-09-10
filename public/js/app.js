// =========================================================
// 우리 가족 앨범 (Our Family Memories) - 프론트엔드 핵심 로직
// =========================================================

(function () {
  'use strict';

  // 애플리케이션 상태
  const state = {
    allPhotos: [],
    filteredPhotos: [],
    monthsSummary: [],
    activeFilter: {
      year: null,
      month: null,
      date: null,
      author: null
    },
    activeViewMode: 'feed', // 'feed' | 'grid' | 'calendar'
    currentUser: {
      name: localStorage.getItem('family_user_name') || '아빠',
      role: localStorage.getItem('family_user_role') || '👨'
    },
    calendarState: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1, // 1 ~ 12
      selectedDate: null
    },
    activeLightboxPhoto: null,
    isServerOnline: true,
    localFallbackKey: 'family_album_photos_fallback'
  };

  // 요일 매핑
  const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  // DOM 요소 캐시
  const elements = {
    // 헤더 & 컨트롤
    monthFilterTrack: document.getElementById('month-filter-track'),
    viewTabs: document.querySelectorAll('.view-tab'),
    mNavItems: document.querySelectorAll('.m-nav-item'),
    memberChips: document.querySelectorAll('.member-chip'),
    filterBanner: document.getElementById('filter-banner'),
    filterBannerLabel: document.getElementById('filter-banner-label'),
    filterBannerCount: document.getElementById('filter-banner-count'),
    btnClearFilter: document.getElementById('btn-clear-filter'),
    emptyState: document.getElementById('empty-state'),
    btnHome: document.getElementById('btn-home'),

    // 뷰 컨테이너
    viewFeed: document.getElementById('view-feed'),
    viewGrid: document.getElementById('view-grid'),
    viewCalendar: document.getElementById('view-calendar'),
    feedContainer: document.getElementById('feed-container'),
    gridContainer: document.getElementById('grid-container'),

    // 캘린더 요소
    calCurrentMonth: document.getElementById('cal-current-month'),
    calendarDays: document.getElementById('calendar-days'),
    btnCalPrev: document.getElementById('btn-cal-prev'),
    btnCalNext: document.getElementById('btn-cal-next'),
    calSelectedPanel: document.getElementById('cal-selected-panel'),
    calSelectedDateText: document.getElementById('cal-selected-date-text'),
    calSelectedPhotos: document.getElementById('cal-selected-photos'),
    btnCloseCalPanel: document.getElementById('btn-close-cal-panel'),

    // 업로드 모달
    uploadModal: document.getElementById('upload-modal'),
    btnOpenUpload: document.getElementById('btn-open-upload'),
    mNavUpload: document.getElementById('m-nav-upload'),
    btnEmptyUpload: document.getElementById('btn-empty-upload'),
    btnCloseUpload: document.getElementById('btn-close-upload'),
    btnCancelUpload: document.getElementById('btn-cancel-upload'),
    uploadForm: document.getElementById('upload-form'),
    inputFile: document.getElementById('input-file'),
    dropzone: document.getElementById('dropzone'),
    dropzoneEmpty: document.getElementById('dropzone-empty'),
    dropzonePreview: document.getElementById('dropzone-preview'),
    previewImg: document.getElementById('preview-img'),
    btnRemovePreview: document.getElementById('btn-remove-preview'),
    uploaderChips: document.querySelectorAll('.family-chip'),
    customUploaderBox: document.getElementById('custom-uploader-box'),
    inputCustomUploader: document.getElementById('input-custom-uploader'),
    inputAuthor: document.getElementById('input-author'),
    inputAuthorRole: document.getElementById('input-author-role'),
    inputTakenAt: document.getElementById('input-taken-at'),
    inputTitle: document.getElementById('input-title'),
    inputLocation: document.getElementById('input-location'),
    inputCaption: document.getElementById('input-caption'),
    btnSubmitUpload: document.getElementById('btn-submit-upload'),

    // QR 접속 모달
    qrModal: document.getElementById('qr-modal'),
    btnOpenQr: document.getElementById('btn-open-qr'),
    mNavQr: document.getElementById('m-nav-qr'),
    btnCloseQr: document.getElementById('btn-close-qr'),
    btnOkQr: document.getElementById('btn-ok-qr'),
    qrImage: document.getElementById('qr-image'),
    networkUrlText: document.getElementById('network-url-text'),
    btnCopyUrl: document.getElementById('btn-copy-url'),

    // 라이트박스 모달
    lightboxModal: document.getElementById('lightbox-modal'),
    btnCloseLightbox: document.getElementById('btn-close-lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxAuthorRole: document.getElementById('lightbox-author-role'),
    lightboxAuthorName: document.getElementById('lightbox-author-name'),
    lightboxDate: document.getElementById('lightbox-date'),
    lightboxLocation: document.getElementById('lightbox-location'),
    lightboxTitle: document.getElementById('lightbox-title'),
    lightboxCaption: document.getElementById('lightbox-caption'),
    lightboxLikeCount: document.getElementById('lightbox-like-count'),
    lightboxBtnLike: document.getElementById('lightbox-btn-like'),
    lightboxCommentsCount: document.getElementById('lightbox-comments-count'),
    lightboxCommentsList: document.getElementById('lightbox-comments-list'),
    lightboxCommentForm: document.getElementById('lightbox-comment-form'),
    lightboxInputComment: document.getElementById('lightbox-input-comment'),
    lightboxCommentAuthors: document.querySelectorAll('#lightbox-comment-authors .c-chip'),

    // 토스트
    toastContainer: document.getElementById('toast-container')
  };

  // 선택된 업로드 이미지 Blob
  let selectedUploadBlob = null;

  // ================= 1. 초기화 =================
  async function init() {
    // 오늘 날짜를 업로드 기본값으로 설정 (KST 기준 YYYY-MM-DD)
    const todayStr = getTodayString();
    elements.inputTakenAt.value = todayStr;

    // 저장된 사용자 칩 활성화
    syncUserChips();

    // 이벤트 리스너 바인딩
    bindEvents();

    // 사진 데이터 로드
    await loadPhotos();

    // 백엔드 네트워크 정보(QR 코드) 사전 확인
    loadNetworkInfo();
  }

  function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ================= 2. 데이터 통신 (API & 폴백) =================
  async function loadPhotos() {
    try {
      const params = new URLSearchParams();
      if (state.activeFilter.date) {
        params.append('date', state.activeFilter.date);
      } else if (state.activeFilter.year && state.activeFilter.month) {
        params.append('year', state.activeFilter.year);
        params.append('month', state.activeFilter.month);
      }
      if (state.activeFilter.author) {
        params.append('author', state.activeFilter.author);
      }

      const res = await fetch(`/api/photos?${params.toString()}`);
      if (!res.ok) throw new Error('API 응답 실패');
      
      const data = await res.json();
      state.isServerOnline = true;
      state.filteredPhotos = data.photos || [];
      state.monthsSummary = data.monthsSummary || [];

      // 전체 목록 조회(파라미터 없을 때)의 사진 보관
      if (!state.activeFilter.year && !state.activeFilter.date && !state.activeFilter.author) {
        state.allPhotos = data.photos || [];
      }

    } catch (err) {
      console.warn('서버 통신 불가, 로컬 데이터 모드로 동작합니다:', err.message);
      state.isServerOnline = false;
      loadLocalFallbackData();
    }

    renderUI();
  }

  // 오프라인 / 정적 파일 오픈 시 로컬 폴백
  function loadLocalFallbackData() {
    let stored = localStorage.getItem(state.localFallbackKey);
    let photos = stored ? JSON.parse(stored) : (window.SEED_PHOTOS || []);
    state.allPhotos = photos;

    // 필터링 적용
    let filtered = [...photos];
    if (state.activeFilter.date) {
      filtered = filtered.filter(p => p.takenAt === state.activeFilter.date);
    } else if (state.activeFilter.year && state.activeFilter.month) {
      const ym = `${state.activeFilter.year}-${String(state.activeFilter.month).padStart(2, '0')}`;
      filtered = filtered.filter(p => p.takenAt && p.takenAt.startsWith(ym));
    }
    if (state.activeFilter.author) {
      filtered = filtered.filter(p => p.author === state.activeFilter.author);
    }

    // 날짜 역순 정렬
    filtered.sort((a, b) => (b.takenAt || '').localeCompare(a.takenAt || ''));
    state.filteredPhotos = filtered;

    // 월별 통계 집계
    const counts = {};
    photos.forEach(p => {
      if (p.takenAt && p.takenAt.length >= 7) {
        const ym = p.takenAt.substring(0, 7);
        counts[ym] = (counts[ym] || 0) + 1;
      }
    });

    state.monthsSummary = Object.keys(counts)
      .sort((a, b) => b.localeCompare(a))
      .map(ym => {
        const [y, m] = ym.split('-');
        return {
          key: ym,
          year: parseInt(y, 10),
          month: parseInt(m, 10),
          label: `${y}년 ${parseInt(m, 10)}월`,
          count: counts[ym]
        };
      });
  }

  function saveLocalFallbackData(photos) {
    state.allPhotos = photos;
    localStorage.setItem(state.localFallbackKey, JSON.stringify(photos));
  }

  // ================= 3. UI 렌더링 =================
  function renderUI() {
    renderMonthFilterTrack();
    renderFilterBanner();

    const hasPhotos = state.filteredPhotos.length > 0;
    elements.emptyState.style.display = hasPhotos ? 'none' : 'block';

    if (state.activeViewMode === 'feed') {
      renderFeedView();
    } else if (state.activeViewMode === 'grid') {
      renderGridView();
    } else if (state.activeViewMode === 'calendar') {
      renderCalendarView();
    }
  }

  // 1) 상단 월별 필터 가로 스크롤 바
  function renderMonthFilterTrack() {
    const track = elements.monthFilterTrack;
    track.innerHTML = '';

    const isAllActive = !state.activeFilter.year && !state.activeFilter.date;
    const totalCount = state.allPhotos.length;

    // '전체보기' 알약 버튼
    const allPill = document.createElement('button');
    allPill.className = `month-pill ${isAllActive ? 'active' : ''}`;
    allPill.innerHTML = `<span>전체 보기</span><span class="pill-count">${totalCount}</span>`;
    allPill.addEventListener('click', () => {
      setMonthFilter(null, null);
    });
    track.appendChild(allPill);

    // 월별 알약 버튼들 (예: 2026년 9월, 8월, 7월...)
    state.monthsSummary.forEach(item => {
      const isItemActive = state.activeFilter.year === item.year && state.activeFilter.month === item.month;
      const pill = document.createElement('button');
      pill.className = `month-pill ${isItemActive ? 'active' : ''}`;
      pill.innerHTML = `<span>${item.label}</span><span class="pill-count">${item.count}</span>`;
      pill.addEventListener('click', () => {
        setMonthFilter(item.year, item.month);
      });
      track.appendChild(pill);
    });
  }

  // 2) 현재 필터 상태 배너 표시
  function renderFilterBanner() {
    if (state.activeFilter.date) {
      elements.filterBanner.style.display = 'flex';
      elements.filterBannerLabel.textContent = `${formatDateWithDay(state.activeFilter.date)} 사진`;
      elements.filterBannerCount.textContent = `${state.filteredPhotos.length}장`;
    } else if (state.activeFilter.year && state.activeFilter.month) {
      elements.filterBanner.style.display = 'flex';
      elements.filterBannerLabel.textContent = `${state.activeFilter.year}년 ${state.activeFilter.month}월 사진`;
      elements.filterBannerCount.textContent = `${state.filteredPhotos.length}장`;
    } else if (state.activeFilter.author) {
      elements.filterBanner.style.display = 'flex';
      elements.filterBannerLabel.textContent = `${state.activeFilter.author}님이 올린 사진`;
      elements.filterBannerCount.textContent = `${state.filteredPhotos.length}장`;
    } else {
      elements.filterBanner.style.display = 'none';
    }
  }

  // 3) 타임라인 피드 뷰 렌더링 (날짜별 그룹핑)
  function renderFeedView() {
    const container = elements.feedContainer;
    container.innerHTML = '';

    if (state.filteredPhotos.length === 0) return;

    // 날짜별로 사진 묶기 (Map)
    const groupedByDate = new Map();
    state.filteredPhotos.forEach(photo => {
      const dateKey = photo.takenAt || '날짜 미지정';
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey).push(photo);
    });

    // 각 날짜 그룹 생성
    groupedByDate.forEach((photos, dateKey) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'date-group';

      // 스티키 날짜 헤더
      const formattedDate = formatDateWithDay(dateKey);
      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-sticky-header';
      dateHeader.innerHTML = `
        <i class="fa-regular fa-calendar-check date-icon"></i>
        <span class="date-title">${formattedDate}</span>
        <span class="date-count-badge">${photos.length}장의 추억</span>
      `;
      groupEl.appendChild(dateHeader);

      // 사진 카드 목록
      photos.forEach(photo => {
        const card = createPhotoCardElement(photo);
        groupEl.appendChild(card);
      });

      container.appendChild(groupEl);
    });
  }

  // 개별 사진 카드 엘리먼트 생성
  function createPhotoCardElement(photo) {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.id = `card-${photo.id}`;

    const comments = photo.comments || [];
    const likes = photo.likes || 0;
    const authorRole = photo.authorRole || '👨‍👩‍👧‍👦';
    const authorName = photo.author || '가족';

    card.innerHTML = `
      <!-- 카드 상단 작성자 정보 -->
      <div class="card-header">
        <div class="card-author-info">
          <div class="author-avatar">${authorRole}</div>
          <div class="author-meta">
            <div class="author-name-row">
              <span class="author-name">${escapeHtml(authorName)}</span>
              <span class="author-role-tag">${authorRole}</span>
            </div>
            <div class="card-time-location">
              <span>${photo.takenAt || ''}</span>
              ${photo.location ? `<span class="location-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(photo.location)}</span>` : ''}
            </div>
          </div>
        </div>
        <button class="btn-card-more" title="사진 삭제" data-photo-id="${photo.id}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>

      <!-- 사진 이미지 -->
      <div class="card-image-wrap" data-photo-id="${photo.id}">
        <img src="${photo.url}" alt="${escapeHtml(photo.title || '가족 사진')}" loading="lazy" />
      </div>

      <!-- 인터랙션 바 (좋아요, 댓글 아이콘) -->
      <div class="card-action-bar">
        <div class="action-left">
          <button class="btn-action-icon like-btn" data-photo-id="${photo.id}" title="좋아요!">
            <i class="fa-solid fa-heart"></i>
            <span class="action-count like-count">${likes}</span>
          </button>
          <button class="btn-action-icon comment-icon-btn" data-photo-id="${photo.id}" title="댓글">
            <i class="fa-regular fa-comment-dots"></i>
            <span class="action-count comment-count">${comments.length}</span>
          </button>
        </div>
      </div>

      <!-- 제목 및 본문 에피소드 -->
      <div class="card-body">
        ${photo.title ? `<h3 class="card-title">${escapeHtml(photo.title)}</h3>` : ''}
        ${photo.caption ? `<p class="card-caption">${escapeHtml(photo.caption)}</p>` : ''}
      </div>

      <!-- 댓글 섹션 -->
      <div class="card-comments-wrap">
        <div class="comments-header">
          <span><i class="fa-regular fa-comments"></i> 가족들의 코멘트 (${comments.length})</span>
        </div>

        <div class="comments-list" id="comments-list-${photo.id}">
          ${renderCommentItemsHtml(comments, photo.id)}
        </div>

        <!-- 인라인 댓글 작성 폼 -->
        <form class="card-comment-form" data-photo-id="${photo.id}">
          <div class="comment-author-select-bar">
            <span style="font-size: 0.72rem; color: var(--text-sub); margin-right: 4px;">작성자:</span>
            <button type="button" class="author-chip-small active" data-role="👩" data-name="엄마">👩 엄마</button>
            <button type="button" class="author-chip-small" data-role="👨" data-name="아빠">👨 아빠</button>
            <button type="button" class="author-chip-small" data-role="👧" data-name="딸">👧 딸</button>
            <button type="button" class="author-chip-small" data-role="👦" data-name="아들">👦 아들</button>
            <button type="button" class="author-chip-small" data-role="👵" data-name="할머니">👵 할머니</button>
          </div>
          <div class="comment-input-box">
            <input type="text" class="input-inline-comment" placeholder="가족 사진에 따뜻한 코멘트를 달아주세요..." required />
            <button type="submit" class="btn-submit-comment">등록</button>
          </div>
        </form>
      </div>
    `;

    // 이벤트 리스너 연결
    // 1. 이미지 클릭 시 라이트박스 팝업
    card.querySelector('.card-image-wrap').addEventListener('click', () => {
      openLightbox(photo);
    });

    // 2. 좋아요 버튼
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => {
      handleLikePhoto(photo.id, likeBtn);
    });

    // 3. 댓글 아이콘 클릭 시 입력창으로 포커스
    card.querySelector('.comment-icon-btn').addEventListener('click', () => {
      const input = card.querySelector('.input-inline-comment');
      if (input) input.focus();
    });

    // 4. 삭제 버튼
    card.querySelector('.btn-card-more').addEventListener('click', () => {
      handleDeletePhoto(photo.id);
    });

    // 5. 작성자 칩 선택
    const chips = card.querySelectorAll('.author-chip-small');
    let selectedAuthor = { name: state.currentUser.name, role: state.currentUser.role };
    chips.forEach(chip => {
      if (chip.dataset.name === selectedAuthor.name) {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedAuthor = { name: chip.dataset.name, role: chip.dataset.role };
      });
    });

    // 6. 댓글 등록 폼 제출
    const form = card.querySelector('.card-comment-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('.input-inline-comment');
      const text = input.value.trim();
      if (!text) return;

      await handleAddComment(photo.id, selectedAuthor.name, selectedAuthor.role, text);
      input.value = '';
    });

    // 7. 댓글 내 개별 삭제 버튼 이벤트 바인딩
    bindCommentDeleteButtons(card, photo.id);

    return card;
  }

  // 댓글 목록 HTML 생성
  function renderCommentItemsHtml(comments, photoId) {
    if (!comments || comments.length === 0) {
      return `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 4px 0;">아직 댓글이 없습니다. 첫 번째 코멘트를 남겨보세요!</div>`;
    }

    return comments.map(c => `
      <div class="comment-item" id="comment-${c.id}">
        <div class="comment-avatar">${c.authorRole || '💬'}</div>
        <div class="comment-bubble">
          <div class="comment-author-line">
            <span class="comment-author-name">${escapeHtml(c.author || '가족')}</span>
            <div style="display: flex; align-items: center;">
              <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
              <button class="btn-del-comment" data-photo-id="${photoId}" data-comment-id="${c.id}" title="댓글 삭제">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
        </div>
      </div>
    `).join('');
  }

  function bindCommentDeleteButtons(parentEl, photoId) {
    parentEl.querySelectorAll('.btn-del-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const commentId = btn.dataset.commentId;
        handleDeleteComment(photoId, commentId);
      });
    });
  }

  // 4) 그리드 갤러리 뷰 렌더링
  function renderGridView() {
    const container = elements.gridContainer;
    container.innerHTML = '';

    if (state.filteredPhotos.length === 0) return;

    // 날짜별 그룹 생성
    const groupedByDate = new Map();
    state.filteredPhotos.forEach(p => {
      const dateKey = p.takenAt || '기타';
      if (!groupedByDate.has(dateKey)) groupedByDate.set(dateKey, []);
      groupedByDate.get(dateKey).push(p);
    });

    groupedByDate.forEach((photos, dateKey) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'grid-date-group';

      const title = document.createElement('div');
      title.className = 'grid-date-title';
      title.innerHTML = `<span><i class="fa-regular fa-calendar"></i> ${formatDateWithDay(dateKey)}</span> <span style="font-size: 0.8rem; color: var(--text-sub);">(${photos.length}장)</span>`;
      groupEl.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'photo-grid';

      photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.innerHTML = `
          <img src="${photo.url}" alt="${escapeHtml(photo.title || '')}" loading="lazy" />
          <div class="grid-item-overlay">
            <span class="grid-item-author">${photo.authorRole || ''} ${escapeHtml(photo.author || '')}</span>
            <div class="grid-item-stats">
              <span><i class="fa-solid fa-heart"></i> ${photo.likes || 0}</span>
              <span><i class="fa-solid fa-comment"></i> ${(photo.comments || []).length}</span>
            </div>
          </div>
        `;
        item.addEventListener('click', () => openLightbox(photo));
        grid.appendChild(item);
      });

      groupEl.appendChild(grid);
      container.appendChild(groupEl);
    });
  }

  // 5) 캘린더 달력 날짜별 뷰 렌더링
  function renderCalendarView() {
    const { year, month } = state.calendarState;
    elements.calCurrentMonth.textContent = `${year}년 ${month}월`;

    const calGrid = elements.calendarDays;
    calGrid.innerHTML = '';

    // 해당 월의 1일 요일 및 총 일수 계산
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0(일) ~ 6(토)
    const daysInMonth = new Date(year, month, 0).getDate();

    // 해당 월에 찍힌 사진들을 날짜별로 매핑 (YYYY-MM-DD -> array)
    const photosByDate = new Map();
    state.allPhotos.forEach(p => {
      if (p.takenAt) {
        if (!photosByDate.has(p.takenAt)) photosByDate.set(p.takenAt, []);
        photosByDate.get(p.takenAt).push(p);
      }
    });

    const todayStr = getTodayString();

    // 이전 달 빈 칸
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'cal-day empty';
      calGrid.appendChild(emptyDay);
    }

    // 해당 월 일자 칸
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPhotos = photosByDate.get(dateStr) || [];
      const hasPhotos = dayPhotos.length > 0;
      const isToday = dateStr === todayStr;
      const isSelected = state.calendarState.selectedDate === dateStr;

      const dayCell = document.createElement('div');
      dayCell.className = `cal-day ${hasPhotos ? 'has-photos' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;
      
      let photoBubbleHtml = '';
      if (hasPhotos) {
        const firstPhoto = dayPhotos[0];
        photoBubbleHtml = `
          <div class="cal-photo-bubble">
            <img src="${firstPhoto.url}" alt="날짜 사진" />
            <span class="cal-photo-badge">${dayPhotos.length}</span>
          </div>
        `;
      }

      dayCell.innerHTML = `
        <span class="cal-day-num">${day}</span>
        ${photoBubbleHtml}
      `;

      if (hasPhotos) {
        dayCell.addEventListener('click', () => {
          showCalendarSelectedDay(dateStr, dayPhotos);
        });
      } else {
        dayCell.addEventListener('click', () => {
          // 사진이 없는 날짜 클릭 시 해당 날짜로 업로드 모달 오픈 제안
          elements.inputTakenAt.value = dateStr;
          showToast(`${formatDateWithDay(dateStr)}에 찍은 사진을 올려보세요! 📸`);
        });
      }

      calGrid.appendChild(dayCell);
    }
  }

  // 달력에서 날짜 클릭 시 하단에 해당 날짜 사진 패널 표시
  function showCalendarSelectedDay(dateStr, photos) {
    state.calendarState.selectedDate = dateStr;
    renderCalendarView(); // 선택 표시 갱신

    elements.calSelectedPanel.style.display = 'block';
    elements.calSelectedDateText.textContent = `${formatDateWithDay(dateStr)} 추억 (${photos.length}장)`;

    const photosWrap = elements.calSelectedPhotos;
    photosWrap.innerHTML = '';

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'selected-photo-card';
      card.innerHTML = `
        <img src="${photo.url}" alt="${escapeHtml(photo.title || '')}" />
        <div class="selected-photo-meta">
          <div style="font-weight: 700;">${escapeHtml(photo.title || '가족 사진')}</div>
          <div style="font-size: 0.75rem; color: var(--text-sub); margin-top: 2px;">
            ${photo.authorRole || ''} ${escapeHtml(photo.author || '')} · 댓글 ${(photo.comments || []).length}
          </div>
        </div>
      `;
      card.addEventListener('click', () => openLightbox(photo));
      photosWrap.appendChild(card);
    });

    elements.calSelectedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ================= 4. 액션 핸들러 (좋아요, 댓글, 업로드, 삭제) =================

  // 1) 사진 좋아요
  async function handleLikePhoto(photoId, btnElement) {
    btnElement.classList.add('liked');
    setTimeout(() => btnElement.classList.remove('liked'), 400);

    // 즉각 UI 낙관적 반영
    const photo = state.allPhotos.find(p => p.id === photoId);
    if (photo) {
      photo.likes = (photo.likes || 0) + 1;
      const countEl = btnElement.querySelector('.like-count');
      if (countEl) countEl.textContent = photo.likes;
    }

    if (state.isServerOnline) {
      try {
        await fetch(`/api/photos/${photoId}/like`, { method: 'POST' });
      } catch (err) {
        console.warn('좋아요 API 실패, 로컬 유지:', err.message);
      }
    } else {
      saveLocalFallbackData(state.allPhotos);
    }
  }

  // 2) 댓글 등록
  async function handleAddComment(photoId, authorName, authorRole, text) {
    const photo = state.allPhotos.find(p => p.id === photoId);
    if (!photo) return;

    if (!photo.comments) photo.comments = [];

    const newComment = {
      id: 'c-' + Date.now(),
      author: authorName,
      authorRole: authorRole,
      text: text,
      createdAt: new Date().toISOString()
    };

    if (state.isServerOnline) {
      try {
        const res = await fetch(`/api/photos/${photoId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author: authorName, authorRole: authorRole, text: text })
        });
        if (res.ok) {
          const savedComment = await res.json();
          photo.comments.push(savedComment);
        } else {
          photo.comments.push(newComment);
        }
      } catch (err) {
        photo.comments.push(newComment);
      }
    } else {
      photo.comments.push(newComment);
      saveLocalFallbackData(state.allPhotos);
    }

    // UI 즉시 갱신
    updateCardComments(photoId);

    // 만약 라이트박스가 열려있다면 라이트박스 댓글 목록도 갱신
    if (state.activeLightboxPhoto && state.activeLightboxPhoto.id === photoId) {
      refreshLightboxComments();
    }

    showToast('소중한 댓글이 등록되었습니다! 💬');
  }

  function updateCardComments(photoId) {
    const photo = state.allPhotos.find(p => p.id === photoId);
    if (!photo) return;

    const listEl = document.getElementById(`comments-list-${photoId}`);
    if (listEl) {
      listEl.innerHTML = renderCommentItemsHtml(photo.comments, photoId);
      const card = document.getElementById(`card-${photoId}`);
      if (card) {
        bindCommentDeleteButtons(card, photoId);
        const countEl = card.querySelector('.comment-count');
        if (countEl) countEl.textContent = photo.comments.length;
      }
    }
  }

  // 3) 댓글 삭제
  async function handleDeleteComment(photoId, commentId) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    const photo = state.allPhotos.find(p => p.id === photoId);
    if (!photo) return;

    photo.comments = (photo.comments || []).filter(c => c.id !== commentId);

    if (state.isServerOnline) {
      try {
        await fetch(`/api/photos/${photoId}/comments/${commentId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('댓글 삭제 실패:', err.message);
      }
    } else {
      saveLocalFallbackData(state.allPhotos);
    }

    updateCardComments(photoId);
    if (state.activeLightboxPhoto && state.activeLightboxPhoto.id === photoId) {
      refreshLightboxComments();
    }
    showToast('댓글이 삭제되었습니다.');
  }

  // 4) 사진 삭제
  async function handleDeletePhoto(photoId) {
    if (!confirm('정말로 이 가족 사진을 앨범에서 삭제하시겠습니까?')) return;

    if (state.isServerOnline) {
      try {
        await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('사진 삭제 실패:', err.message);
      }
    }

    state.allPhotos = state.allPhotos.filter(p => p.id !== photoId);
    state.filteredPhotos = state.filteredPhotos.filter(p => p.id !== photoId);
    saveLocalFallbackData(state.allPhotos);

    closeLightbox();
    renderUI();
    showToast('사진이 삭제되었습니다.');
  }

  // 5) 사진 업로드 실행 (스마트폰 이미지 리사이징 압축 적용)
  async function handleUploadSubmit(e) {
    e.preventDefault();

    if (!selectedUploadBlob && !elements.inputFile.files[0]) {
      alert('올릴 사진을 먼저 선택해 주세요!');
      return;
    }

    const submitBtn = elements.btnSubmitUpload;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 사진 등록 중...`;

    try {
      const fileToUpload = selectedUploadBlob || elements.inputFile.files[0];
      const author = elements.inputAuthor.value.trim() || '가족';
      const authorRole = elements.inputAuthorRole.value || '👨‍👩‍👧‍👦';
      const takenAt = elements.inputTakenAt.value || getTodayString();
      const title = elements.inputTitle.value.trim();
      const location = elements.inputLocation.value.trim();
      const caption = elements.inputCaption.value.trim();

      if (state.isServerOnline) {
        const formData = new FormData();
        formData.append('photo', fileToUpload, 'photo.jpg');
        formData.append('author', author);
        formData.append('authorRole', authorRole);
        formData.append('takenAt', takenAt);
        formData.append('title', title);
        formData.append('location', location);
        formData.append('caption', caption);

        const res = await fetch('/api/photos', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('업로드 서버 응답 오류');
        const newPhoto = await res.json();
        state.allPhotos.unshift(newPhoto);
      } else {
        // 로컬 오프라인 모드: FileReader DataURL로 로컬 저장
        const dataUrl = await readFileAsDataURL(fileToUpload);
        const newPhoto = {
          id: 'p-' + Date.now(),
          url: dataUrl,
          title: title || `${takenAt}의 추억`,
          caption: caption,
          author: author,
          authorRole: authorRole,
          takenAt: takenAt,
          location: location,
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: []
        };
        state.allPhotos.unshift(newPhoto);
        saveLocalFallbackData(state.allPhotos);
      }

      // 모달 닫기 & 폼 리셋
      closeUploadModal();
      resetUploadForm();

      // 업로드한 사진의 년/월 필터로 자동 포커스
      const [year, month] = takenAt.split('-');
      setMonthFilter(parseInt(year, 10), parseInt(month, 10));

      showToast('소중한 추억 사진이 앨범에 등록되었습니다! 🎉');

    } catch (err) {
      console.error('업로드 실패:', err);
      alert('사진 업로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> <span>추억 저장하기</span>`;
    }
  }

  // ================= 5. 이미지 압축 및 미리보기 (모바일 최적화) =================
  async function processSelectedFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG 등)만 등록 가능합니다.');
      return;
    }

    try {
      // Canvas를 통한 빠른 클라이언트 사이드 리사이징 (최대 1600px, 용량 대폭 절감)
      selectedUploadBlob = await compressImage(file, 1600, 0.86);

      // 미리보기 표시
      const previewUrl = URL.createObjectURL(selectedUploadBlob);
      elements.previewImg.src = previewUrl;
      elements.dropzoneEmpty.style.display = 'none';
      elements.dropzonePreview.style.display = 'block';

    } catch (err) {
      console.error('이미지 압축 실패:', err);
      selectedUploadBlob = file;
      elements.previewImg.src = URL.createObjectURL(file);
      elements.dropzoneEmpty.style.display = 'none';
      elements.dropzonePreview.style.display = 'block';
    }
  }

  function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas toBlob 변환 실패'));
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function readFileAsDataURL(fileOrBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  }

  // ================= 6. 전체화면 뷰어 (Lightbox) =================
  function openLightbox(photo) {
    state.activeLightboxPhoto = photo;

    elements.lightboxImg.src = photo.url;
    elements.lightboxAuthorRole.textContent = photo.authorRole || '👨‍👩‍👧‍👦';
    elements.lightboxAuthorName.textContent = photo.author || '가족';
    elements.lightboxDate.textContent = formatDateWithDay(photo.takenAt || '');
    
    if (photo.location) {
      elements.lightboxLocation.style.display = 'inline-block';
      elements.lightboxLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(photo.location)}`;
    } else {
      elements.lightboxLocation.style.display = 'none';
    }

    elements.lightboxTitle.textContent = photo.title || '소중한 가족의 추억';
    elements.lightboxCaption.textContent = photo.caption || '';
    elements.lightboxLikeCount.textContent = photo.likes || 0;

    refreshLightboxComments();

    elements.lightboxModal.classList.add('open');
    elements.lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function refreshLightboxComments() {
    if (!state.activeLightboxPhoto) return;
    const comments = state.activeLightboxPhoto.comments || [];
    elements.lightboxCommentsCount.textContent = comments.length;
    elements.lightboxCommentsList.innerHTML = renderCommentItemsHtml(comments, state.activeLightboxPhoto.id);
    bindCommentDeleteButtons(elements.lightboxCommentsList, state.activeLightboxPhoto.id);
  }

  function closeLightbox() {
    state.activeLightboxPhoto = null;
    elements.lightboxModal.classList.remove('open');
    elements.lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ================= 7. 스마트폰 접속 QR 안내 =================
  async function loadNetworkInfo() {
    if (!state.isServerOnline) return;
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        const info = await res.json();
        if (info.qrCodeDataUrl) {
          elements.qrImage.src = info.qrCodeDataUrl;
        }
        if (info.mobileUrl) {
          elements.networkUrlText.value = info.mobileUrl;
        }
      }
    } catch (err) {
      console.warn('네트워크 정보 조회 건너뜀:', err.message);
    }
  }

  function openQrModal() {
    loadNetworkInfo();
    elements.qrModal.classList.add('open');
    elements.qrModal.setAttribute('aria-hidden', 'false');
  }

  function closeQrModal() {
    elements.qrModal.classList.remove('open');
    elements.qrModal.setAttribute('aria-hidden', 'true');
  }

  // ================= 8. 모달 제어 및 헬퍼 =================
  function openUploadModal() {
    elements.uploadModal.classList.add('open');
    elements.uploadModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeUploadModal() {
    elements.uploadModal.classList.remove('open');
    elements.uploadModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function resetUploadForm() {
    elements.uploadForm.reset();
    selectedUploadBlob = null;
    elements.previewImg.src = '';
    elements.dropzonePreview.style.display = 'none';
    elements.dropzoneEmpty.style.display = 'block';
    elements.inputTakenAt.value = getTodayString();
    syncUserChips();
  }

  function syncUserChips() {
    const savedName = state.currentUser.name;
    let matched = false;

    elements.uploaderChips.forEach(chip => {
      chip.classList.remove('active');
      if (chip.dataset.name === savedName) {
        chip.classList.add('active');
        elements.inputAuthor.value = chip.dataset.name;
        elements.inputAuthorRole.value = chip.dataset.role;
        matched = true;
      }
    });

    if (!matched && savedName) {
      const customChip = document.querySelector('.family-chip[data-name="custom"]');
      if (customChip) customChip.classList.add('active');
      elements.customUploaderBox.style.display = 'block';
      elements.inputCustomUploader.value = savedName;
      elements.inputAuthor.value = savedName;
      elements.inputAuthorRole.value = '✏️';
    }
  }

  function setMonthFilter(year, month) {
    state.activeFilter.year = year;
    state.activeFilter.month = month;
    state.activeFilter.date = null; // 월 선택 시 특정 날짜 필터는 해제

    if (year && month) {
      state.calendarState.year = year;
      state.calendarState.month = month;
    }

    loadPhotos();
  }

  function switchViewMode(mode) {
    state.activeViewMode = mode;

    // 상단 탭 활성화 상태
    elements.viewTabs.forEach(tab => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // 모바일 하단 네비게이션 활성화 상태
    elements.mNavItems.forEach(item => {
      if (item.dataset.mode) {
        item.classList.toggle('active', item.dataset.mode === mode);
      }
    });

    // 뷰 섹션 표시/숨김
    elements.viewFeed.classList.toggle('active', mode === 'feed');
    elements.viewGrid.classList.toggle('active', mode === 'grid');
    elements.viewCalendar.classList.toggle('active', mode === 'calendar');

    renderUI();
  }

  // ================= 9. 이벤트 바인딩 =================
  function bindEvents() {
    // 1) 브랜드 로고 클릭 -> 첫 화면 초기화
    elements.btnHome.addEventListener('click', () => {
      state.activeFilter = { year: null, month: null, date: null, author: null };
      elements.memberChips.forEach(c => c.classList.toggle('active', !c.dataset.author));
      loadPhotos();
    });

    // 2) 보기 모드 탭 전환
    elements.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => switchViewMode(tab.dataset.mode));
    });

    elements.mNavItems.forEach(item => {
      if (item.dataset.mode) {
        item.addEventListener('click', () => switchViewMode(item.dataset.mode));
      }
    });

    // 3) 가족 구성원 필터
    elements.memberChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.memberChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter.author = chip.dataset.author || null;
        loadPhotos();
      });
    });

    // 4) 필터 지우기 버튼
    elements.btnClearFilter.addEventListener('click', () => {
      state.activeFilter = { year: null, month: null, date: null, author: null };
      elements.memberChips.forEach(c => c.classList.toggle('active', !c.dataset.author));
      loadPhotos();
    });

    // 5) 업로드 모달 열기/닫기
    elements.btnOpenUpload.addEventListener('click', openUploadModal);
    elements.mNavUpload.addEventListener('click', openUploadModal);
    elements.btnEmptyUpload.addEventListener('click', openUploadModal);
    elements.btnCloseUpload.addEventListener('click', closeUploadModal);
    elements.btnCancelUpload.addEventListener('click', closeUploadModal);

    // 6) QR 모달 열기/닫기
    elements.btnOpenQr.addEventListener('click', openQrModal);
    elements.mNavQr.addEventListener('click', openQrModal);
    elements.btnCloseQr.addEventListener('click', closeQrModal);
    elements.btnOkQr.addEventListener('click', closeQrModal);

    // 7) QR 주소 복사
    elements.btnCopyUrl.addEventListener('click', () => {
      const url = elements.networkUrlText.value;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      } else {
        elements.networkUrlText.select();
        document.execCommand('copy');
      }
      showToast('스마트폰 접속 주소가 복사되었습니다! 📋');
    });

    // 8) 드롭존 & 파일 선택
    elements.dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btn-remove-preview')) return;
      elements.inputFile.click();
    });

    elements.inputFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processSelectedFile(e.target.files[0]);
      }
    });

    elements.btnRemovePreview.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedUploadBlob = null;
      elements.inputFile.value = '';
      elements.previewImg.src = '';
      elements.dropzonePreview.style.display = 'none';
      elements.dropzoneEmpty.style.display = 'block';
    });

    // 드래그 & 드롭
    elements.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.dropzone.style.borderColor = 'var(--primary-hover)';
    });
    elements.dropzone.addEventListener('dragleave', () => {
      elements.dropzone.style.borderColor = 'var(--primary)';
    });
    elements.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.dropzone.style.borderColor = 'var(--primary)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processSelectedFile(e.dataTransfer.files[0]);
      }
    });

    // 9) 업로더 선택 칩 이벤트
    elements.uploaderChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.uploaderChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const role = chip.dataset.role;
        const name = chip.dataset.name;

        if (name === 'custom') {
          elements.customUploaderBox.style.display = 'block';
          elements.inputAuthor.value = elements.inputCustomUploader.value || '가족';
          elements.inputAuthorRole.value = '✏️';
          elements.inputCustomUploader.focus();
        } else {
          elements.customUploaderBox.style.display = 'none';
          elements.inputAuthor.value = name;
          elements.inputAuthorRole.value = role;
          // 선택한 사용자 기억
          state.currentUser = { name, role };
          localStorage.setItem('family_user_name', name);
          localStorage.setItem('family_user_role', role);
        }
      });
    });

    elements.inputCustomUploader.addEventListener('input', (e) => {
      const val = e.target.value.trim() || '가족';
      elements.inputAuthor.value = val;
      state.currentUser = { name: val, role: '✏️' };
      localStorage.setItem('family_user_name', val);
      localStorage.setItem('family_user_role', '✏️');
    });

    // 10) 업로드 폼 제출
    elements.uploadForm.addEventListener('submit', handleUploadSubmit);

    // 11) 라이트박스 닫기 & 좋아요 & 댓글 제출
    elements.btnCloseLightbox.addEventListener('click', closeLightbox);
    elements.lightboxModal.addEventListener('click', (e) => {
      if (e.target === elements.lightboxModal) closeLightbox();
    });

    elements.lightboxBtnLike.addEventListener('click', () => {
      if (state.activeLightboxPhoto) {
        handleLikePhoto(state.activeLightboxPhoto.id, elements.lightboxBtnLike);
        elements.lightboxLikeCount.textContent = state.activeLightboxPhoto.likes;
      }
    });

    // 라이트박스 댓글 작성자 칩
    let lbCommentAuthor = { name: state.currentUser.name, role: state.currentUser.role };
    elements.lightboxCommentAuthors.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.lightboxCommentAuthors.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        lbCommentAuthor = { name: chip.dataset.name, role: chip.dataset.role };
      });
    });

    // 라이트박스 댓글 폼 제출
    elements.lightboxCommentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.activeLightboxPhoto) return;
      const text = elements.lightboxInputComment.value.trim();
      if (!text) return;

      await handleAddComment(state.activeLightboxPhoto.id, lbCommentAuthor.name, lbCommentAuthor.role, text);
      elements.lightboxInputComment.value = '';
    });

    // 이모지 빠른 리액션 버튼 클릭 시 입력창에 추가
    document.querySelectorAll('.btn-reaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        elements.lightboxInputComment.value += emoji;
        elements.lightboxInputComment.focus();
      });
    });

    // 12) 캘린더 네비게이션 (이전/다음 달)
    elements.btnCalPrev.addEventListener('click', () => {
      state.calendarState.month--;
      if (state.calendarState.month < 1) {
        state.calendarState.month = 12;
        state.calendarState.year--;
      }
      state.calendarState.selectedDate = null;
      elements.calSelectedPanel.style.display = 'none';
      renderCalendarView();
    });

    elements.btnCalNext.addEventListener('click', () => {
      state.calendarState.month++;
      if (state.calendarState.month > 12) {
        state.calendarState.month = 1;
        state.calendarState.year++;
      }
      state.calendarState.selectedDate = null;
      elements.calSelectedPanel.style.display = 'none';
      renderCalendarView();
    });

    elements.btnCloseCalPanel.addEventListener('click', () => {
      elements.calSelectedPanel.style.display = 'none';
      state.calendarState.selectedDate = null;
      renderCalendarView();
    });

    // ESC 키 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeUploadModal();
        closeQrModal();
        closeLightbox();
      }
    });
  }

  // ================= 10. 유틸리티 함수 =================
  function formatDateWithDay(dateStr) {
    if (!dateStr || dateStr.length < 10) return dateStr || '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const dayName = DAY_NAMES[dateObj.getDay()] || '';
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일 (${dayName})`;
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const now = new Date();
    const past = new Date(isoString);
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return '방금 전';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    return isoString.split('T')[0];
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // DOM 로드 완료 시 초기화 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
