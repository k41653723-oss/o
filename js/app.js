/**
 * 발달장애인 디지털 출석관리 시스템 - 메인 애플리케이션 (App Engine)
 */

// ----------------------------------------------------
// 전역 아바타 이미지 오류 방어 및 체이닝 헬퍼
// ----------------------------------------------------
window.handleAvatarError = function(imgEl, initialLetter) {
  try {
    const raw = imgEl.getAttribute('data-candidates');
    if (!raw) {
      if (imgEl.parentElement) imgEl.parentElement.innerHTML = `<span>${initialLetter}</span>`;
      return;
    }
    const candidates = JSON.parse(decodeURIComponent(raw));
    let currentIdx = parseInt(imgEl.getAttribute('data-idx') || '0', 10);
    currentIdx++;
    if (currentIdx < candidates.length) {
      imgEl.setAttribute('data-idx', currentIdx);
      imgEl.src = candidates[currentIdx];
    } else {
      // 모든 후보 실패 시 이미지 제거하고 이니셜 텍스트로 안전하게 대체 (무한루프 방지)
      imgEl.onerror = null;
      if (imgEl.parentElement) {
        imgEl.parentElement.innerHTML = `<span>${initialLetter}</span>`;
      }
    }
  } catch (e) {
    imgEl.onerror = null;
    if (imgEl.parentElement) {
      imgEl.parentElement.innerHTML = `<span>${initialLetter}</span>`;
    }
  }
};

window.getParticipantAvatarHtml = function(part, commName = '', isLarge = true) {
  const initialLetter = (part.name || '').substring(0, 1) || 'U';
  const bgColor = part.avatar_color || '#FF5A5F';
  const photoX = Number.isFinite(Number(part.photo_position_x)) ? Number(part.photo_position_x) : 50;
  const photoY = Number.isFinite(Number(part.photo_position_y)) ? Number(part.photo_position_y) : 50;
  const photoZoom = Number.isFinite(Number(part.photo_zoom)) ? Number(part.photo_zoom) : 1;
  const rawName = (part.name || '').trim();
  const encName = encodeURIComponent(rawName);
  const rawComm = (commName || '').trim();
  const encComm = encodeURIComponent(rawComm);

  const candidates = [];
  if (part.photo_url) {
    candidates.push(part.photo_url);
  }
  
  // 공백 경로와 인코딩 경로를 모두 후보로 등록하여 어떤 환경에서도 100% 로드되도록 체이닝
  candidates.push(
    `커뮤니티 이용인 사진/${rawName}.png`,
    `커뮤니티 이용인 사진/${rawName}.jpg`,
    `커뮤니티%20이용인%20사진/${encName}.png`,
    `커뮤니티%20이용인%20사진/${encName}.jpg`,
    `건강커뮤니티 참여자 사진/${rawName}.png`,
    `건강커뮤니티 참여자 사진/${rawName}.jpg`,
    `건강커뮤니티%20참여자%20사진/${encName}.png`,
    `건강커뮤니티%20참여자%20사진/${encName}.jpg`,
    `${rawComm} 참여자 사진/${rawName}.png`,
    `${encComm}%20참여자%20사진/${encName}.png`
  );

  const dataAttr = encodeURIComponent(JSON.stringify(candidates));

  if (isLarge) {
    return `
      <div class="participant-avatar-wrap" style="background-color: ${bgColor};">
        <img src="${candidates[0]}" alt="${part.name}" class="participant-avatar-img" style="object-position:${photoX}% ${photoY}%;transform:scale(${photoZoom});"
             data-candidates="${dataAttr}" data-idx="0"
             onerror="handleAvatarError(this, '${initialLetter}')" />
      </div>
    `;
  } else {
    return `
      <div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-sm border border-gray-200" style="background-color: ${bgColor};">
        <img src="${candidates[0]}" alt="${part.name}" class="w-full h-full object-cover" style="object-position:${photoX}% ${photoY}%;transform:scale(${photoZoom});"
             data-candidates="${dataAttr}" data-idx="0"
             onerror="handleAvatarError(this, '${initialLetter}')" />
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // 애플리케이션 상태 (State)
  // ----------------------------------------------------
  const state = {
    mode: 'participant', // 'participant' | 'admin'
    activeParticipantCommunityId: null,
    activeAdminTab: 'dashboard',
    selectedAdminCommunityId: 'ALL', // 'ALL' 또는 특정 community_id
    selectedAttendanceDate: appStore.formatDateKey(),
    selectedStatsMonth: appStore.formatDateKey().substring(0, 7) // 'YYYY-MM'
  };

  // 초기 커뮤니티 ID 설정
  const initialComms = appStore.getCommunities(true);
  if (initialComms.length > 0) {
    state.activeParticipantCommunityId = initialComms[0].id;
  }

  // ----------------------------------------------------
  // 시계 및 실시간 날짜 업데이트
  // ----------------------------------------------------
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false });
    const clockEl = document.getElementById('current-clock-time');
    if (clockEl) clockEl.textContent = timeStr;
  }
  setInterval(updateClock, 1000);
  updateClock();

  function getKoreanDateString(dateObj = new Date()) {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const day = days[dateObj.getDay()];
    return `${y}년 ${m}월 ${d}일 ${day}`;
  }

  // ----------------------------------------------------
  // Toast 알림 함수
  // ----------------------------------------------------
  function showToast(message, icon = 'check-circle') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 text-[#FF385C]"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // 음성 안내 (TTS)
  function speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  // ----------------------------------------------------
  // 뷰 전환 (참여자 모드 <-> 관리자 모드)
  // ----------------------------------------------------
  const btnToggleView = document.getElementById('btn-toggle-view');
  const participantView = document.getElementById('participant-view');
  const adminView = document.getElementById('admin-view');
  const viewToggleLabel = document.getElementById('view-toggle-label');
  const viewToggleIcon = document.getElementById('view-toggle-icon');

  btnToggleView.addEventListener('click', async () => {
    if (state.mode === 'participant' && !window.__adminAuthenticated) {
      const allowed = await window.__requestAdminLogin();
      if (!allowed) return;
      await window.__loadAdminData();
    }
    if (state.mode === 'participant') {
      state.mode = 'admin';
      participantView.classList.add('hidden');
      adminView.classList.remove('hidden');
      viewToggleLabel.textContent = '참여자 출석 모드';
      viewToggleIcon.setAttribute('data-lucide', 'arrow-left');
      renderAdminView();
    } else {
      state.mode = 'participant';
      adminView.classList.add('hidden');
      participantView.classList.remove('hidden');
      viewToggleLabel.textContent = '관리자 모드';
      viewToggleIcon.setAttribute('data-lucide', 'shield-check');
      renderParticipantView();
    }
    lucide.createIcons();
  });

  // ----------------------------------------------------
  // 1. 참여자 출석 화면 렌더링
  // ----------------------------------------------------
  function renderParticipantView() {
    const communities = appStore.getCommunities(true);
    const tabsContainer = document.getElementById('participant-community-tabs');
    tabsContainer.innerHTML = '';

    if (communities.length === 0) {
      tabsContainer.innerHTML = '<p class="text-sm text-gray-500 py-2">등록된 커뮤니티가 없습니다.</p>';
      return;
    }

    // 현재 활성화된 커뮤니티가 유효하지 않으면 첫번째 커뮤니티로 설정
    if (!communities.some(c => c.id === state.activeParticipantCommunityId)) {
      state.activeParticipantCommunityId = communities[0].id;
    }

    // 커뮤니티 탭 렌더링
    communities.forEach(comm => {
      const partCount = appStore.getParticipants(comm.id, true).length;
      const btn = document.createElement('button');
      btn.className = `community-tab-btn ${comm.id === state.activeParticipantCommunityId ? 'active' : ''}`;
      btn.innerHTML = `
        <i data-lucide="users" class="w-5 h-5"></i>
        <span>${comm.name}</span>
        <span class="text-xs px-2 py-0.5 rounded-full ${comm.id === state.activeParticipantCommunityId ? 'bg-white text-black' : 'bg-gray-100 text-gray-700'}">${partCount}명</span>
      `;
      btn.addEventListener('click', () => {
        state.activeParticipantCommunityId = comm.id;
        renderParticipantView();
      });
      tabsContainer.appendChild(btn);
    });

    // 배너 정보 업데이트 (커뮤니티별 맞춤 멘트 적용)
    const currentComm = appStore.getCommunityById(state.activeParticipantCommunityId);
    const commUiTexts = appStore.getCommunityUiTexts(state.activeParticipantCommunityId);
    
    document.getElementById('banner-community-name').textContent = currentComm ? currentComm.name : '커뮤니티';
    document.getElementById('banner-date-text').textContent = getKoreanDateString();
    
    // 커뮤니티별 메인 타이틀 및 서브 멘트 렌더링
    const bannerMainTitleEl = document.getElementById('banner-main-title');
    const bannerSubTitleEl = document.getElementById('banner-sub-title');
    if (bannerMainTitleEl) bannerMainTitleEl.textContent = commUiTexts.bannerMainTitle;
    if (bannerSubTitleEl) bannerSubTitleEl.textContent = commUiTexts.bannerSubTitle;

    // 오늘의 프로그램 뱃지 렌더링
    const todayPrograms = appStore.getTodayProgramsForCommunity(state.activeParticipantCommunityId);
    const progListEl = document.getElementById('banner-today-programs-list');
    const progCountEl = document.getElementById('banner-prog-count');
    progListEl.innerHTML = '';
    progCountEl.textContent = `${todayPrograms.length}개`;

    if (todayPrograms.length === 0) {
      progListEl.innerHTML = '<span class="text-xs text-gray-400">오늘 등록된 프로그램 일정이 없습니다.</span>';
    } else {
      todayPrograms.forEach(item => {
        const span = document.createElement('span');
        span.className = 'text-xs bg-[#FFF0F2] text-[#FF385C] border border-[#FFD0D7] px-2.5 py-1 rounded-md font-semibold flex items-center gap-1';
        span.innerHTML = `<i data-lucide="activity" class="w-3 h-3"></i> ${item.program.name} <span class="text-[11px] text-gray-500">(${item.area ? item.area.name.replace(/^.*?_/, '') : ''})</span>`;
        progListEl.appendChild(span);
      });
    }

    // 참여자 그리드 렌더링
    const participants = appStore.getParticipants(state.activeParticipantCommunityId, true);
    const gridEl = document.getElementById('participant-card-grid');
    const countBadge = document.getElementById('participant-count-badge');
    const attendedCountEl = document.getElementById('participant-attended-count');
    
    gridEl.innerHTML = '';
    countBadge.textContent = `${participants.length}명`;

    const todayStr = appStore.formatDateKey();
    const todayAtts = appStore.getAttendances({ date: todayStr, communityId: state.activeParticipantCommunityId });

    let attendedCount = 0;

    if (participants.length === 0) {
      gridEl.innerHTML = `
        <div class="col-span-full bg-white rounded-2xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
          <i data-lucide="user-x" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
          <p class="text-lg font-bold text-gray-700">등록된 참여자가 없습니다.</p>
          <p class="text-sm">관리자 모드 > 참여자 관리에서 참여자를 등록해 주세요.</p>
        </div>
      `;
    } else {
      participants.forEach(part => {
        const isAttended = todayAtts.some(a => a.participant_id === part.id && (a.attendance_status === '출석' || a.attendance_status === '지각' || a.attendance_status === '조퇴'));
        if (isAttended) attendedCount++;

        const card = document.createElement('div');
        card.className = `participant-card ${isAttended ? 'attended' : ''}`;
        
        const avatarHtml = getParticipantAvatarHtml(part, currentComm ? currentComm.name : '', true);

        card.innerHTML = `
          <div class="attended-badge">
            <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i> 출석완료
          </div>
          ${avatarHtml}
          <button class="participant-name-btn">${part.name}</button>
        `;

        card.addEventListener('click', () => {
          handleParticipantClick(part);
        });

        gridEl.appendChild(card);
      });
    }

    attendedCountEl.textContent = attendedCount;
    lucide.createIcons();
  }

  let attendanceSuccessTimer = null;
  const pendingCheckins = new Set();
  let checkinModalToken = null;

  // 클릭 즉시 축하 화면을 표시하되, 서버 확인 전에는 저장 대기 상태임을 함께 안내합니다.
  function showCheckinPending(part, token) {
    if (attendanceSuccessTimer) {
      clearTimeout(attendanceSuccessTimer);
      attendanceSuccessTimer = null;
    }
    checkinModalToken = token;
    document.getElementById('modal-success-participant-name').textContent = `${part.name} 님`;
    const title = document.getElementById('modal-success-status-text');
    const commUiTexts = appStore.getCommunityUiTexts(state.activeParticipantCommunityId);
    title.textContent = commUiTexts.successModalTitle || '출석 완료!';
    title.className = 'text-2xl font-bold text-[#038026]';
    document.getElementById('modal-success-details').textContent = '출석 처리 중입니다. 서버 저장 확인 중… (실제 저장 전)';
    document.getElementById('modal-success-program-list').innerHTML = '';
    const mark = document.querySelector('#modal-attendance-success .attendance-success-animation');
    if (mark) mark.style.opacity = '';
    const closeButton = document.getElementById('btn-close-success-modal');
    if (closeButton) closeButton.textContent = '닫기 (저장 확인 중)';
    if (typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    openModal('modal-attendance-success');
  }

  // ----------------------------------------------------
  // 참여자 카드 클릭 (출석 처리)
  // ----------------------------------------------------
  async function handleParticipantClick(part) {
    const communityId = state.activeParticipantCommunityId;
    const key = `${communityId}:${part.id}`;
    if (pendingCheckins.has(key)) {
      showToast('이미 출석을 저장하고 있습니다.', 'info');
      return;
    }
    const token = Symbol('checkin');
    pendingCheckins.add(key);
    showCheckinPending(part, token);

    let result;
    try {
      if (!window.__adminAuthenticated) {
        const reply = await window.__publicCheckin(part.id, communityId);
        result = reply.type === 'already'
          ? { success: true, type: 'already', message: reply.message }
          : { success: true, type: 'success', totalPrograms: reply.count, programs: [], message: '출석 완료' };
      } else {
        result = appStore.recordParticipantDailyAttendance(part.id, communityId);
      }
    } catch (e) {
      // 저장 실패 시 성공 안내를 보여 주지 않습니다.
      if (checkinModalToken === token) {
        const title = document.getElementById('modal-success-status-text');
        const mark = document.querySelector('#modal-attendance-success .attendance-success-animation');
        if (mark) mark.style.opacity = '0.25';
        const closeButton = document.getElementById('btn-close-success-modal');
        if (closeButton) closeButton.textContent = '닫기';
        title.textContent = '출석 저장 실패';
        title.className = 'text-2xl font-bold text-red-600';
        document.getElementById('modal-success-details').textContent = '출석 여부를 확인하지 못했습니다. 관리자에게 확인해 주세요.';
      }
      showToast('출석 저장 실패: ' + e.message, 'alert-circle');
      return;
    } finally {
      pendingCheckins.delete(key);
    }

    if (!result.success) {
      if (checkinModalToken === token) closeModal('modal-attendance-success');
      showToast(result.message, 'alert-circle');
      speak(result.message);
      return;
    }

    if (result.type === 'success') {
      if (checkinModalToken === token) {
        if (attendanceSuccessTimer) clearTimeout(attendanceSuccessTimer);
        const mark = document.querySelector('#modal-attendance-success .attendance-success-animation');
        if (mark) mark.style.opacity = '';
        const closeButton = document.getElementById('btn-close-success-modal');
        if (closeButton) closeButton.textContent = '확인 (2초 후 자동 닫힘)';
        const commUiTexts = appStore.getCommunityUiTexts(communityId);
        document.getElementById('modal-success-participant-name').textContent = `${part.name} 님`;
        const title = document.getElementById('modal-success-status-text');
        title.textContent = commUiTexts.successModalTitle || '출석 완료!';
        title.className = 'text-2xl font-bold text-[#038026]';
        document.getElementById('modal-success-details').textContent = commUiTexts.successModalDesc || `오늘의 ${result.totalPrograms}개 프로그램 출석이 기록되었습니다.`;
        document.getElementById('modal-success-program-list').innerHTML = result.programs.map(p => `<li class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-[#038026]"></i> ${p}</li>`).join('');
        speak(`${part.name}님 출석 완료되었습니다.`);
        attendanceSuccessTimer = setTimeout(() => {
          if (checkinModalToken === token) {
            closeModal('modal-attendance-success');
            checkinModalToken = null;
          }
          attendanceSuccessTimer = null;
        }, 2000);
      }
    } else {
      if (checkinModalToken === token) {
        closeModal('modal-attendance-success');
        checkinModalToken = null;
      }
      showToast(result.message, 'info');
      speak(`${part.name}님은 오늘 이미 출석하셨습니다.`);
    }

    // Public check-in: reflect server-confirmed result immediately on participant cards.
    if (!window.__adminAuthenticated && result.type === 'success') {
      const today = appStore.formatDateKey();
      const already = (appStore.data.attendances || []).some(a =>
        a.attendance_date === today && a.community_id === communityId &&
        a.participant_id === part.id && a.attendance_status !== '취소'
      );
      if (!already) {
        appStore.data.attendances = appStore.data.attendances || [];
        appStore.data.attendances.push({
          id: 'confirmed-' + String(Date.now()), attendance_date: today,
          community_id: communityId, participant_id: part.id, attendance_status: '출석'
        });
      }
      renderParticipantView();
    }
    // 서버 저장 완료 후에만 최신 데이터를 다시 읽습니다. 화면 안내는 재조회 때문에 지연되지 않습니다.
    if (!window.__adminAuthenticated) {
      try {
        await window.__reloadPublicData();
      } catch (e) {
        showToast('출석은 저장됐지만 화면 갱신에 실패했습니다. 새로고침해 주세요.', 'alert-circle');
      }
    }
    renderParticipantView();
    lucide.createIcons();
  }

  // 모달 닫기 이벤트
  document.getElementById('btn-close-success-modal').addEventListener('click', () => {
    if (attendanceSuccessTimer) {
      clearTimeout(attendanceSuccessTimer);
      attendanceSuccessTimer = null;
    }
    checkinModalToken = null;
    closeModal('modal-attendance-success');
  });

  // ----------------------------------------------------
  // 2. 관리자 모드 네비게이션 및 라우팅
  // ----------------------------------------------------
  const adminNavButtons = document.querySelectorAll('#admin-nav button');
  adminNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      adminNavButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeAdminTab = btn.getAttribute('data-tab');
      renderAdminView();
    });
  });

  function renderAdminView() {
    const container = document.getElementById('admin-content-container');
    container.innerHTML = '';

    switch (state.activeAdminTab) {
      case 'dashboard':
        renderAdminDashboard(container);
        break;
      case 'communities':
        renderAdminCommunities(container);
        break;
      case 'ui-texts':
        renderAdminUiTexts(container);
        break;
      case 'participants':
        renderAdminParticipants(container);
        break;
      case 'areas':
        renderAdminAreas(container);
        break;
      case 'programs':
        renderAdminPrograms(container);
        break;
      case 'staffs':
        renderAdminStaffs(container);
        break;
      case 'schedules':
        renderAdminSchedules(container);
        break;
      case 'attendances':
        renderAdminAttendances(container);
        break;
      case 'attendance-rates':
        renderAdminAttendanceRates(container);
        break;
      case 'staff-assignments':
        renderAdminStaffAssignments(container);
        break;
      case 'export-data':
        renderAdminExportData(container);
        break;
      case 'system-settings':
        renderAdminSystemSettings(container);
        break;
      default:
        renderAdminDashboard(container);
    }
    lucide.createIcons();
  }

  // ----------------------------------------------------
  // [관리자 공통] 커뮤니티 필터 바 헬퍼
  // ----------------------------------------------------
  function createCommunityFilterBar(onSelect, showAllOption = true) {
    const communities = appStore.getCommunities(false);
    const wrap = document.createElement('div');
    wrap.className = 'flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 mb-4';

    if (showAllOption) {
      const allBtn = document.createElement('button');
      allBtn.className = `btn text-xs py-1.5 px-3.5 font-bold ${state.selectedAdminCommunityId === 'ALL' ? 'btn-primary' : 'btn-secondary'}`;
      allBtn.textContent = '전체 커뮤니티';
      allBtn.addEventListener('click', () => {
        state.selectedAdminCommunityId = 'ALL';
        onSelect('ALL');
      });
      wrap.appendChild(allBtn);
    }

    communities.forEach(c => {
      const btn = document.createElement('button');
      const isSelected = state.selectedAdminCommunityId === c.id;
      btn.className = `btn text-xs py-1.5 px-3.5 font-bold ${isSelected ? 'btn-primary' : 'btn-secondary'} ${!c.active ? 'opacity-50' : ''}`;
      btn.innerHTML = `${c.name} ${!c.active ? '(비활성)' : ''}`;
      btn.addEventListener('click', () => {
        state.selectedAdminCommunityId = c.id;
        onSelect(c.id);
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  // ----------------------------------------------------
  // 2-1. 관리자 - 대시보드
  // ----------------------------------------------------
  function renderAdminDashboard(container) {
    const communities = appStore.getCommunities(true);
    const todayStr = appStore.formatDateKey();
    const todayAtts = appStore.getAttendances({ date: todayStr });

    let totalParticipants = 0;
    let totalAttended = 0;

    const commCardsHtml = communities.map(c => {
      const parts = appStore.getParticipants(c.id, true);
      const todayProgs = appStore.getTodayProgramsForCommunity(c.id);
      const cAtts = todayAtts.filter(a => a.community_id === c.id);
      
      const attendedPartIds = new Set(cAtts.filter(a => a.attendance_status === '출석' || a.attendance_status === '지각' || a.attendance_status === '조퇴').map(a => a.participant_id));
      const attendedCount = attendedPartIds.size;
      const unAttendedCount = Math.max(0, parts.length - attendedCount);

      totalParticipants += parts.length;
      totalAttended += attendedCount;

      return `
        <div class="admin-card space-y-3 hover:border-gray-400 transition">
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-base text-[#222222]">${c.name}</span>
            <span class="text-xs bg-[#FFF0F2] text-[#FF385C] font-bold px-2 py-0.5 rounded-full">오늘 프로그램 ${todayProgs.length}개</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2.5 rounded-xl text-xs">
            <div>
              <div class="text-gray-400 font-medium">전체 인원</div>
              <div class="text-base font-bold text-gray-800">${parts.length}명</div>
            </div>
            <div>
              <div class="text-gray-400 font-medium">출석 완료</div>
              <div class="text-base font-bold text-[#038026]">${attendedCount}명</div>
            </div>
            <div>
              <div class="text-gray-400 font-medium">미출석</div>
              <div class="text-base font-bold text-[#FF385C]">${unAttendedCount}명</div>
            </div>
          </div>
          <div class="text-[11px] text-gray-500 line-clamp-1">
            <strong>오늘 영역:</strong> ${todayProgs.map(p => p.area ? p.area.name : '').filter(Boolean).join(', ') || '없음'}
          </div>
        </div>
      `;
    }).join('');

    const overallRate = totalParticipants > 0 ? ((totalAttended / totalParticipants) * 100).toFixed(1) : 0;

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-black text-[#222222] tracking-tight">출석 종합 대시보드</h2>
            <p class="text-xs text-gray-500">${getKoreanDateString()} (${todayStr}) 실시간 현황</p>
          </div>
          <button id="btn-quick-refresh" class="btn btn-secondary text-xs py-1.5 px-3">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> 새로고침
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <div class="text-xs text-gray-500 font-semibold">총 커뮤니티</div>
            <div class="text-2xl font-black text-gray-800 mt-1">${communities.length}개</div>
          </div>
          <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <div class="text-xs text-gray-500 font-semibold">총 등록 참여자</div>
            <div class="text-2xl font-black text-gray-800 mt-1">${totalParticipants}명</div>
          </div>
          <div class="bg-[#E6F6E9] p-3.5 rounded-xl border border-[#C2EAC9]">
            <div class="text-xs text-[#038026] font-semibold">오늘 출석 완료</div>
            <div class="text-2xl font-black text-[#038026] mt-1">${totalAttended}명</div>
          </div>
          <div class="bg-[#FFF0F2] p-3.5 rounded-xl border border-[#FFD0D7]">
            <div class="text-xs text-[#FF385C] font-semibold">오늘 출석률</div>
            <div class="text-2xl font-black text-[#FF385C] mt-1">${overallRate}%</div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="text-sm font-bold text-gray-700">커뮤니티별 오늘 현황</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${commCardsHtml}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-quick-refresh')?.addEventListener('click', () => {
      renderAdminDashboard(container);
      showToast('대시보드 데이터를 갱신했습니다.');
    });
  }

  // ----------------------------------------------------
  // 2-2. 관리자 - 커뮤니티 관리
  // ----------------------------------------------------
  function renderAdminCommunities(container) {
    const communities = appStore.getCommunities(false);

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">커뮤니티 관리</h2>
            <p class="text-xs text-gray-500">커뮤니티 명칭을 수정하면 사용자(참여자) 화면의 탭과 배너에 즉시 반영됩니다.</p>
          </div>
          <button id="btn-add-community" class="btn btn-primary text-xs py-2 px-4">
            <i data-lucide="plus" class="w-4 h-4"></i> 커뮤니티 추가
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th class="w-16">순서</th>
                <th>커뮤니티 이름</th>
                <th>설명</th>
                <th class="w-24">참여자 수</th>
                <th class="w-24">상태</th>
                <th class="w-32 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              ${communities.map(c => {
                const count = appStore.getParticipants(c.id, false).length;
                return `
                  <tr>
                    <td class="font-bold text-gray-500">${c.sort_order || 1}</td>
                    <td class="font-bold text-base text-gray-900">${c.name}</td>
                    <td class="text-sm text-gray-600">${c.description || '-'}</td>
                    <td class="text-sm font-semibold">${count}명</td>
                    <td>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}">
                        ${c.active ? '사용 중' : '비활성'}
                      </span>
                    </td>
                    <td class="text-right space-x-1">
                      <button data-edit-id="${c.id}" class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-comm">수정</button>
                      <button data-toggle-id="${c.id}" class="btn btn-ghost text-xs py-1 px-2 btn-toggle-comm">${c.active ? '비활성화' : '활성화'}</button>
                      <button data-delete-id="${c.id}" class="btn btn-ghost text-xs py-1 px-2 text-red-600 btn-delete-comm">삭제</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-add-community')?.addEventListener('click', () => {
      openCommunityFormModal();
    });

    container.querySelectorAll('.btn-edit-comm').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        const comm = appStore.getCommunityById(id);
        if (comm) openCommunityFormModal(comm);
      });
    });

    container.querySelectorAll('.btn-toggle-comm').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-id');
        const comm = appStore.getCommunityById(id);
        if (comm) {
          comm.active = !comm.active;
          appStore.saveCommunity(comm);
          renderAdminCommunities(container);
          showToast(`'${comm.name}' 상태가 변경되었습니다.`);
        }
      });
    });

    container.querySelectorAll('.btn-delete-comm').forEach(btn => {
      btn.addEventListener('click', () => {
        const comm = appStore.getCommunityById(btn.dataset.deleteId);
        if (!comm || !confirm(`'${comm.name}' 커뮤니티를 비활성화할까요? 연결된 참여자와 출석 기록은 보존됩니다.`)) return;
        appStore.deleteCommunity(comm.id);
        renderAdminCommunities(container);
        showToast(`'${comm.name}' 커뮤니티가 비활성화되었습니다.`);
      });
    });
  }

  function openCommunityFormModal(comm = null) {
    const isEdit = !!comm;
    const commUi = comm ? appStore.getCommunityUiTexts(comm.id) : {
      bannerMainTitle: '자신의 사진이나 이름을 누르면 출석이 완료됩니다!',
      bannerSubTitle: '오늘의 활동에 즐겁게 참여해 보세요.',
      successModalTitle: '출석 완료!',
      successModalDesc: '오늘의 모든 프로그램에 정상 출석되었습니다.'
    };

    const bodyHtml = `
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">커뮤니티 이름 *</label>
        <input type="text" id="form-comm-name" class="form-control" value="${comm ? comm.name : ''}" placeholder="예: 건강커뮤니티" required />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">설명</label>
        <input type="text" id="form-comm-desc" class="form-control" value="${comm ? comm.description || '' : ''}" placeholder="커뮤니티 주요 활동 설명" />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">정렬 순서</label>
        <input type="number" id="form-comm-order" class="form-control" value="${comm ? comm.sort_order || 1 : 1}" />
      </div>

      <div class="pt-2 border-t border-gray-100 space-y-2">
        <div class="text-xs font-bold text-[#FF385C]">사용자 화면 전용 안내 멘트 설정</div>
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-gray-600">배너 메인 타이틀</label>
          <input type="text" id="form-comm-banner-title" class="form-control text-xs" value="${commUi.bannerMainTitle}" placeholder="자신의 사진이나 이름을 누르면 출석이 완료됩니다!" />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-gray-600">배너 보조 설명 멘트</label>
          <input type="text" id="form-comm-banner-sub" class="form-control text-xs" value="${commUi.bannerSubTitle}" placeholder="오늘도 활기차고 건강한 하루를 시작해보세요." />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-gray-600">출석 완료 축하 문구</label>
          <input type="text" id="form-comm-success-msg" class="form-control text-xs" value="${commUi.successModalTitle}" placeholder="출석 완료!" />
        </div>
      </div>

      <div class="flex items-center gap-2 pt-2">
        <input type="checkbox" id="form-comm-active" ${!comm || comm.active ? 'checked' : ''} class="w-4 h-4 text-[#FF385C]" />
        <label for="form-comm-active" class="text-sm font-semibold text-gray-700">사용 활성화</label>
      </div>
    `;

    openGenericModal({
      title: isEdit ? '커뮤니티 정보 수정' : '새 커뮤니티 추가',
      bodyHtml: bodyHtml,
      onSubmit: () => {
        const name = document.getElementById('form-comm-name').value.trim();
        const desc = document.getElementById('form-comm-desc').value.trim();
        const order = parseInt(document.getElementById('form-comm-order').value) || 1;
        const bannerTitle = document.getElementById('form-comm-banner-title').value.trim();
        const bannerSub = document.getElementById('form-comm-banner-sub').value.trim();
        const successMsg = document.getElementById('form-comm-success-msg').value.trim();
        const active = document.getElementById('form-comm-active').checked;

        if (!name) {
          alert('커뮤니티 이름을 입력해 주세요.');
          return false;
        }

        appStore.saveCommunity({
          id: comm ? comm.id : null,
          name: name,
          description: desc,
          sort_order: order,
          banner_title: bannerTitle,
          banner_sub: bannerSub,
          success_msg: successMsg,
          active: active
        });

        showToast(`커뮤니티 '${name}' 정보 및 멘트가 저장되었습니다.`);
        renderAdminCommunities(document.getElementById('admin-content-container'));
        return true;
      }
    });
  }

  // ----------------------------------------------------
  // 2-2-B. 관리자 - 화면 멘트 설정 (★ 커뮤니티별 전용 멘트 편집기)
  // ----------------------------------------------------
  function renderAdminUiTexts(container) {
    const communities = appStore.getCommunities(true);
    if (communities.length === 0) {
      container.innerHTML = `<div class="admin-card text-center py-8 text-gray-500">등록된 커뮤니티가 없습니다.</div>`;
      return;
    }

    // 커뮤니티 ID 결정 (ALL일 경우 첫번째 커뮤니티로 지정)
    let selectedCommId = state.selectedAdminCommunityId;
    if (selectedCommId === 'ALL' || !communities.some(c => c.id === selectedCommId)) {
      selectedCommId = communities[0].id;
      state.selectedAdminCommunityId = selectedCommId;
    }

    const currentComm = appStore.getCommunityById(selectedCommId);
    const commUi = appStore.getCommunityUiTexts(selectedCommId);

    container.innerHTML = `
      <div class="admin-card space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">커뮤니티별 화면 멘트 설정</h2>
            <p class="text-xs text-gray-500">각 커뮤니티마다 참여자 화면에 노출되는 배너 문구와 출석 완료 축하 문구를 자유롭게 맞춤 설정할 수 있습니다.</p>
          </div>
        </div>

        <div id="uitext-comm-filter-wrap"></div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <!-- 멘트 수정 폼 -->
          <form id="form-community-uitexts" class="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div class="flex items-center justify-between border-b pb-2">
              <span class="font-extrabold text-sm text-[#FF385C] flex items-center gap-1.5">
                <i data-lucide="edit-3" class="w-4 h-4"></i> [${currentComm.name}] 안내 멘트 편집
              </span>
              <button type="button" id="btn-reset-comm-uitext" class="text-xs text-gray-500 hover:text-red-500 font-semibold flex items-center gap-1">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> 기본 멘트로 복원
              </button>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-800">1. 상단 배너 메인 안내 문구 *</label>
              <textarea id="input-comm-banner-title" rows="2" class="form-control text-sm" placeholder="예: 자신의 사진이나 이름을 누르면 건강 활동 출석이 완료됩니다!">${commUi.bannerMainTitle}</textarea>
              <p class="text-[11px] text-gray-400">참여자 출석 화면 상단 배너에 가장 크게 노출되는 대표 안내 문구입니다.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-800">2. 상단 배너 보조 설명 문구</label>
              <input type="text" id="input-comm-banner-sub" class="form-control text-sm" value="${commUi.bannerSubTitle}" placeholder="예: 오늘도 활기차고 건강한 하루를 시작해보세요." />
              <p class="text-[11px] text-gray-400">대표 문구 아래에 작게 노출되는 부연 설명 문구입니다.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-800">3. 출석 완료 팝업 축하 제목 *</label>
              <input type="text" id="input-comm-success-title" class="form-control text-sm" value="${commUi.successModalTitle}" placeholder="예: 건강커뮤니티 출석 완료!" />
              <p class="text-[11px] text-gray-400">참여자가 본인 이름을 눌러 출석이 완료되었을 때 모달 팝업에 뜨는 문구입니다.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-800">4. 출석 완료 팝업 상세 설명</label>
              <input type="text" id="input-comm-success-desc" class="form-control text-sm" value="${commUi.successModalDesc}" placeholder="예: 오늘의 모든 프로그램에 정상 출석되었습니다." />
            </div>

            <div class="pt-2">
              <button type="submit" class="btn btn-primary w-full py-3 text-sm font-bold shadow-md">
                <i data-lucide="check" class="w-4 h-4"></i> [${currentComm.name}] 멘트 저장하기
              </button>
            </div>
          </form>

          <!-- 실시간 미리보기 카드 -->
          <div class="space-y-3">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">사용자 화면 실시간 미리보기</span>
            
            <div class="bg-gradient-to-r from-white to-[#FFF9F9] rounded-2xl p-5 border border-[#F0D5DA] shadow-sm space-y-3">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 bg-[#FF385C] text-white text-xs font-bold rounded-full">${currentComm.name}</span>
                <span class="text-xs font-semibold text-[#222222]">2026년 10월 6일 화요일</span>
              </div>
              <h3 class="text-lg font-black text-[#222222] tracking-tight" id="preview-banner-title">
                ${commUi.bannerMainTitle}
              </h3>
              <p class="text-xs text-[#717171]" id="preview-banner-sub">
                ${commUi.bannerSubTitle}
              </p>
            </div>

            <!-- 축하 모달 미리보기 -->
            <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center space-y-3">
              <div class="w-10 h-10 rounded-full bg-[#038026] text-white flex items-center justify-center mx-auto text-sm font-bold shadow">
                <i data-lucide="check" class="w-6 h-6"></i>
              </div>
              <div class="text-base font-black text-[#222222]">홍길동 님</div>
              <div class="text-lg font-bold text-[#038026]" id="preview-success-title">${commUi.successModalTitle}</div>
              <div class="text-xs text-[#717171]" id="preview-success-desc">${commUi.successModalDesc}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#uitext-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminUiTexts(container), false));

    // 실시간 타이핑 반영 이벤트
    const inTitle = container.querySelector('#input-comm-banner-title');
    const inSub = container.querySelector('#input-comm-banner-sub');
    const inSuccTitle = container.querySelector('#input-comm-success-title');
    const inSuccDesc = container.querySelector('#input-comm-success-desc');

    const prevTitle = container.querySelector('#preview-banner-title');
    const prevSub = container.querySelector('#preview-banner-sub');
    const prevSuccTitle = container.querySelector('#preview-success-title');
    const prevSuccDesc = container.querySelector('#preview-success-desc');

    inTitle.addEventListener('input', () => { prevTitle.textContent = inTitle.value || '멘트를 입력해주세요.'; });
    inSub.addEventListener('input', () => { prevSub.textContent = inSub.value || ''; });
    inSuccTitle.addEventListener('input', () => { prevSuccTitle.textContent = inSuccTitle.value || '출석 완료!'; });
    inSuccDesc.addEventListener('input', () => { prevSuccDesc.textContent = inSuccDesc.value || ''; });

    // 저장 폼 제출
    container.querySelector('#form-community-uitexts').addEventListener('submit', (e) => {
      e.preventDefault();
      appStore.saveCommunityUiTexts(selectedCommId, {
        bannerMainTitle: inTitle.value.trim() || '자신의 사진이나 이름을 누르면 출석이 완료됩니다!',
        bannerSubTitle: inSub.value.trim(),
        successModalTitle: inSuccTitle.value.trim() || '출석 완료!',
        successModalDesc: inSuccDesc.value.trim()
      });
      showToast(`'${currentComm.name}' 화면 멘트가 성공적으로 저장되었습니다.`);
      renderAdminUiTexts(container);
    });

    // 기본 멘트로 복원
    container.querySelector('#btn-reset-comm-uitext').addEventListener('click', () => {
      if (confirm(`'${currentComm.name}'의 멘트를 기본 문구로 복원하시겠습니까?`)) {
        appStore.saveCommunityUiTexts(selectedCommId, {
          bannerMainTitle: `자신의 사진이나 이름을 누르면 ${currentComm.name.replace('커뮤니티', '')} 활동 출석이 완료됩니다!`,
          bannerSubTitle: '오늘의 활동에 즐겁게 참여해 보세요.',
          successModalTitle: `${currentComm.name} 출석 완료!`,
          successModalDesc: '오늘의 모든 프로그램에 정상 출석되었습니다.'
        });
        showToast('기본 멘트로 복원되었습니다.');
        renderAdminUiTexts(container);
      }
    });
  }

  // ----------------------------------------------------
  // 2-3. 관리자 - 참여자 관리 (★ 파일 업로드로 사진 자유 변경 지원)
  // ----------------------------------------------------
  function renderAdminParticipants(container) {
    const filterCommId = state.selectedAdminCommunityId === 'ALL' ? null : state.selectedAdminCommunityId;
    const participants = appStore.getParticipants(filterCommId, false);
    const communities = appStore.getCommunities(false);
    const commMap = Object.fromEntries(communities.map(c => [c.id, c.name]));

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">참여자 관리</h2>
            <p class="text-xs text-gray-500">참여자 등록, 사진 파일 업로드 변경 및 소속 커뮤니티 관리</p>
          </div>
          <button id="btn-add-participant" class="btn btn-primary text-xs py-2 px-4">
            <i data-lucide="user-plus" class="w-4 h-4"></i> 참여자 추가
          </button>
        </div>

        <div id="part-comm-filter-wrap"></div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th class="w-16">사진</th>
                <th>이름</th>
                <th>소속 커뮤니티</th>
                <th>표시 순서</th>
                <th class="w-28">상태</th>
                <th class="w-48 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              ${participants.length === 0 ? `
                <tr><td colspan="6" class="text-center py-8 text-gray-400">해당 조건의 참여자가 없습니다.</td></tr>
              ` : participants.map(p => {
                const avatar = getParticipantAvatarHtml(p, commMap[p.community_id], false);

                return `
                  <tr>
                    <td>${avatar}</td>
                    <td><input type="text" aria-label="${p.name} 이름" data-field="name" class="form-control text-xs min-w-28" value="${p.name}" /></td>
                    <td><select aria-label="${p.name} 소속 커뮤니티" data-field="community_id" class="form-control text-xs min-w-32">
                      ${communities.map(c => `<option value="${c.id}" ${c.id === p.community_id ? 'selected' : ''}>${c.name}${c.active ? '' : ' (비활성)'}</option>`).join('')}
                    </select></td>
                    <td><input type="number" min="1" aria-label="${p.name} 표시 순서(이름순 자동)" data-field="sort_order" class="form-control text-xs w-20 bg-gray-100" value="${p.sort_order || 1}" readonly title="이름 오름차순으로 자동 설정됩니다." /></td>
                    <td>
                      <select aria-label="${p.name} 상태" data-field="active" class="form-control text-xs">
                        <option value="true" ${p.active ? 'selected' : ''}>사용 중</option>
                        <option value="false" ${!p.active ? 'selected' : ''}>비활성</option>
                      </select>
                    </td>
                    <td class="text-right space-x-1">
                      <button data-save-id="${p.id}" class="btn btn-primary text-xs py-1 px-2.5 btn-save-part">저장</button>
                      <button data-edit-id="${p.id}" class="btn btn-secondary text-xs py-1 px-2 btn-edit-part">사진/상세</button>
                      <button data-delete-id="${p.id}" class="btn btn-ghost text-xs py-1 px-2 text-red-600 btn-delete-part">삭제</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#part-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminParticipants(container), true));

    document.getElementById('btn-add-participant')?.addEventListener('click', () => {
      openParticipantFormModal();
    });

    container.querySelectorAll('.btn-edit-part').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        const part = appStore.getParticipantById(id);
        if (part) openParticipantFormModal(part);
      });
    });

    container.querySelectorAll('.btn-save-part').forEach(btn => {
      btn.addEventListener('click', () => {
        const part = appStore.getParticipantById(btn.dataset.saveId);
        const row = btn.closest('tr');
        if (!part || !row) return;
        const name = row.querySelector('[data-field="name"]').value.trim();
        if (!name) {
          alert('참여자 이름을 입력해 주세요.');
          return;
        }
        part.name = name;
        part.community_id = row.querySelector('[data-field="community_id"]').value;
        part.sort_order = Math.max(1, parseInt(row.querySelector('[data-field="sort_order"]').value, 10) || 1);
        part.active = row.querySelector('[data-field="active"]').value === 'true';
        appStore.saveParticipant(part);
        renderAdminParticipants(container);
        showToast(`'${name}' 참여자 정보가 저장되었습니다.`);
      });
    });

    container.querySelectorAll('.btn-delete-part').forEach(btn => {
      btn.addEventListener('click', () => {
        const part = appStore.getParticipantById(btn.dataset.deleteId);
        if (!part || !confirm(`'${part.name}' 참여자를 삭제할까요? 삭제한 참여자는 목록에서 제거됩니다.`)) return;
        appStore.deleteParticipant(part.id);
        renderAdminParticipants(container);
        showToast(`'${part.name}' 참여자가 삭제되었습니다.`);
      });
    });

    container.querySelectorAll('.btn-toggle-part').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-id');
        const part = appStore.getParticipantById(id);
        if (part) {
          part.active = !part.active;
          appStore.saveParticipant(part);
          renderAdminParticipants(container);
          showToast(`'${part.name}' 참여자 상태가 변경되었습니다.`);
        }
      });
    });
  }

  function openParticipantFormModal(part = null) {
    const isEdit = !!part;
    const communities = appStore.getCommunities(true);
    const commOptions = communities.map(c => `
      <option value="${c.id}" ${part && part.community_id === c.id ? 'selected' : ''}>${c.name}</option>
    `).join('');

    let uploadedPhotoBase64 = part ? (part.photo_url || '') : '';
    let uploadedPhotoFileId = part ? (part.photo_file_id || '') : '';
    let photoUploadPending = false;
    let photoPositionX = part && Number.isFinite(Number(part.photo_position_x)) ? Number(part.photo_position_x) : 50;
    let photoPositionY = part && Number.isFinite(Number(part.photo_position_y)) ? Number(part.photo_position_y) : 50;
    let photoZoom = part && Number.isFinite(Number(part.photo_zoom)) ? Number(part.photo_zoom) : 1;

    const colors = ['#FF5A5F', '#00A699', '#FC642D', '#484848', '#008489', '#FFB400', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];
    const colorPickers = colors.map(clr => `
      <label class="cursor-pointer">
        <input type="radio" name="form-part-color" value="${clr}" ${(!part && clr === colors[0]) || (part && part.avatar_color === clr) ? 'checked' : ''} class="sr-only peer" />
        <div class="w-7 h-7 rounded-full peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-black" style="background-color: ${clr};"></div>
      </label>
    `).join('');

    const bodyHtml = `
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">참여자 이름 *</label>
        <input type="text" id="form-part-name" class="form-control" value="${part ? part.name : ''}" placeholder="예: 홍길동" required />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">소속 커뮤니티 *</label>
        <select id="form-part-comm" class="form-control">
          ${commOptions}
        </select>
      </div>
      
      <!-- 사진 파일 업로드 & 미리보기 -->
      <div class="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <label class="text-xs font-bold text-gray-800 flex items-center justify-between">
          <span>사진 업로드 (PC 파일 선택)</span>
          <button type="button" id="btn-remove-part-photo" class="text-[11px] text-red-500 font-normal hover:underline ${!uploadedPhotoBase64 ? 'hidden' : ''}">사진 제거</button>
        </label>
        <div class="flex items-center gap-3">
          <div id="part-photo-preview" class="w-20 h-20 rounded-full border border-gray-300 bg-white overflow-hidden flex items-center justify-center shrink-0">
            ${uploadedPhotoBase64 ? `<img src="${uploadedPhotoBase64}" class="w-full h-full object-cover" style="object-position:${photoPositionX}% ${photoPositionY}%;transform:scale(${photoZoom})" />` : `<i data-lucide="user" class="w-7 h-7 text-gray-400"></i>`}
          </div>
          <div class="flex-1">
            <input type="file" id="form-part-file-input" accept="image/*" class="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#FFF0F2] file:text-[#FF385C] hover:file:bg-[#ffe0e5] cursor-pointer" />
            <p id="part-photo-upload-status" class="text-[11px] text-gray-500 mt-1">JPG/PNG/WebP 원본 최대 10MB. 자동 축소 후 Drive에 저장됩니다.</p>
            <button type="button" id="btn-open-drive-picker" class="mt-2 px-3 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-800 border border-blue-200">Google Drive에서 기존 사진 선택</button>
          </div>
        </div>
        <div id="drive-picker-panel" class="hidden bg-white border border-blue-200 rounded-lg p-3 space-y-2">
          <label for="drive-picker-folder" class="block text-xs font-bold">사진 폴더</label>
          <select id="drive-picker-folder" class="form-control text-xs"><option value="">폴더 선택</option></select>
          <p id="drive-picker-status" class="text-xs text-gray-500" aria-live="polite">폴더를 선택해 주세요.</p>
          <div id="drive-picker-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto"></div>
          <button type="button" id="drive-picker-apply" disabled class="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-40">선택한 사진 사용</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <label class="text-[11px] text-gray-600">가로 위치 <input type="range" id="form-part-photo-x" min="0" max="100" value="${photoPositionX}" class="w-full" /><span id="part-photo-x-value">${photoPositionX}%</span></label>
          <label class="text-[11px] text-gray-600">세로 위치 <input type="range" id="form-part-photo-y" min="0" max="100" value="${photoPositionY}" class="w-full" /><span id="part-photo-y-value">${photoPositionY}%</span></label>
          <label class="text-[11px] text-gray-600">확대 <input type="range" id="form-part-photo-zoom" min="100" max="200" value="${Math.round(photoZoom * 100)}" class="w-full" /><span id="part-photo-zoom-value">${Math.round(photoZoom * 100)}%</span></label>
        </div>
        <p class="text-[11px] text-gray-400">슬라이더를 움직여 출석 화면에 표시될 사진 영역을 조절하세요.</p>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">기본 아바타 배경색 (사진 미등록 시)</label>
        <div class="flex items-center gap-2 pt-1">
          ${colorPickers}
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">표시 순서 (이름 오름차순 자동)</label>
        <input type="number" id="form-part-order" class="form-control bg-gray-100" value="${part ? part.sort_order || 1 : 1}" readonly title="이름 오름차순으로 자동 설정됩니다." />
      </div>
      <div class="flex items-center gap-2 pt-2">
        <input type="checkbox" id="form-part-active" ${!part || part.active ? 'checked' : ''} class="w-4 h-4 text-[#FF385C]" />
        <label for="form-part-active" class="text-sm font-semibold text-gray-700">사용 활성화</label>
      </div>
    `;

    openGenericModal({
      title: isEdit ? '참여자 정보 수정' : '새 참여자 등록',
      bodyHtml: bodyHtml,
      onOpen: () => {
        const fileInput = document.getElementById('form-part-file-input');
        const previewEl = document.getElementById('part-photo-preview');
        const removeBtn = document.getElementById('btn-remove-part-photo');
        const photoXInput = document.getElementById('form-part-photo-x');
        const photoYInput = document.getElementById('form-part-photo-y');
        const photoZoomInput = document.getElementById('form-part-photo-zoom');

        const updatePhotoPreview = () => {
          photoPositionX = Number(photoXInput.value);
          photoPositionY = Number(photoYInput.value);
          photoZoom = Number(photoZoomInput.value) / 100;
          document.getElementById('part-photo-x-value').textContent = `${photoPositionX}%`;
          document.getElementById('part-photo-y-value').textContent = `${photoPositionY}%`;
          document.getElementById('part-photo-zoom-value').textContent = `${Math.round(photoZoom * 100)}%`;
          const img = previewEl.querySelector('img');
          if (img) {
            img.style.objectPosition = `${photoPositionX}% ${photoPositionY}%`;
            img.style.transform = `scale(${photoZoom})`;
          }
        };
        [photoXInput, photoYInput, photoZoomInput].forEach(input => input.addEventListener('input', updatePhotoPreview));

        // 직원 인증 쿠키로만 Drive 사진 목록에 접근. 공개 홈페이지에서는 호출 불가.
        const pickerPanel=document.getElementById('drive-picker-panel');
        const pickerSelect=document.getElementById('drive-picker-folder');
        const pickerGrid=document.getElementById('drive-picker-grid');
        const pickerStatus=document.getElementById('drive-picker-status');
        const pickerApply=document.getElementById('drive-picker-apply');
        let chosenDrivePhoto=null;
        async function callDrivePicker(payload){
          const res=await fetch('/.netlify/functions/photo-library',{
            method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
            body:JSON.stringify(payload)
          });
          const data=await res.json();
          if(!res.ok||!data.ok)throw Error(data.error||'Drive 사진 목록을 불러오지 못했습니다.');
          return data;
        }
        document.getElementById('btn-open-drive-picker').addEventListener('click',async()=>{
          pickerPanel.classList.remove('hidden');pickerStatus.textContent='폴더 목록을 불러오는 중...';
          pickerApply.disabled=true;chosenDrivePhoto=null;
          try{
            const data=await callDrivePicker({action:'listDrivePhotos'});
            pickerSelect.replaceChildren(new Option('폴더 선택',''));
            data.folders.forEach(f=>pickerSelect.add(new Option(f.name,f.id)));
            pickerStatus.textContent='사진이 들어 있는 폴더를 선택하세요.';
          }catch(err){pickerStatus.textContent='불러오기 실패: '+err.message;}
        });
        pickerSelect.addEventListener('change',async()=>{
          pickerGrid.replaceChildren();chosenDrivePhoto=null;pickerApply.disabled=true;
          if(!pickerSelect.value)return;
          const folderId=pickerSelect.value;pickerStatus.textContent='사진을 불러오는 중...';
          try{
            const data=await callDrivePicker({action:'listDrivePhotos',folderId});
            if(pickerSelect.value!==folderId)return;
            pickerStatus.textContent=`${data.photos.length}장 - 사용할 사진을 선택하세요.`;
            data.photos.forEach(photo=>{
              const btn=document.createElement('button');btn.type='button';
              btn.className='rounded-lg border p-1 text-left hover:border-blue-500 focus:outline-blue-600';
              const img=document.createElement('div');img.className='aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden';
              if(photo.thumbnail){const node=document.createElement('img');node.src=photo.thumbnail;node.alt=photo.name;node.className='w-full h-full object-cover';img.append(node);}
              else{img.textContent='사진';img.classList.add('text-xs');}
              const text=document.createElement('div');text.className='text-[10px] truncate mt-1';text.textContent=photo.name;
              btn.append(img,text);
              btn.addEventListener('click',()=>{
                pickerGrid.querySelectorAll('button').forEach(x=>x.classList.remove('border-blue-600','ring-2','ring-blue-300'));
                btn.classList.add('border-blue-600','ring-2','ring-blue-300');
                chosenDrivePhoto={...photo,folderId};pickerApply.disabled=false;
              });pickerGrid.append(btn);
            });
          }catch(err){pickerStatus.textContent='사진 목록 오류: '+err.message;}
        });
        pickerApply.addEventListener('click',async()=>{
          if(!chosenDrivePhoto||photoUploadPending)return;
          photoUploadPending=true;pickerApply.disabled=true;pickerStatus.textContent='사진을 연결하는 중...';
          try{
            const result=await callDrivePicker({action:'selectDrivePhoto',folderId:chosenDrivePhoto.folderId,fileId:chosenDrivePhoto.fileId});
            uploadedPhotoBase64=result.url;uploadedPhotoFileId=result.fileId;
            const image=document.createElement('img');image.src=result.url;image.className='w-full h-full object-cover';
            previewEl.replaceChildren(image);removeBtn.classList.remove('hidden');updatePhotoPreview();
            pickerStatus.textContent='사진을 선택했어. 아래 이용인 정보 저장 버튼을 눌러 확정해 주세요.';
            document.getElementById('part-photo-upload-status').textContent='Drive 기존 사진 연결 준비 완료';
            pickerPanel.classList.add('hidden');
          }catch(err){pickerStatus.textContent='연결 실패: '+err.message;}
          finally{photoUploadPending=false;pickerApply.disabled=!chosenDrivePhoto;}
        });


        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const status = document.getElementById('part-photo-upload-status');
          if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
            status.textContent = 'JPG/PNG/WebP 형식의 10MB 이하 사진만 가능합니다.';
            fileInput.value = '';
            return;
          }
          if (photoUploadPending) return;
          photoUploadPending = true;
          status.textContent = '사진을 자동 압축하고 Google Drive에 업로드 중...';
          try {
            // 업로드 전 브라우저에서 압축: Netlify/Apps Script 전송 한도 보호
            const base64 = await new Promise((resolve, reject) => {
              const url = URL.createObjectURL(file);
              const img = new Image();
              img.onload = () => {
                try {
                  let width = img.naturalWidth, height = img.naturalHeight;
                  const ratio = Math.min(1, 1600 / Math.max(width, height));
                  width = Math.max(1, Math.round(width * ratio));
                  height = Math.max(1, Math.round(height * ratio));
                  const canvas = document.createElement('canvas');
                  canvas.width = width; canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('이미지 압축을 지원하지 않는 브라우저입니다.');
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, width, height);
                  ctx.drawImage(img, 0, 0, width, height);
                  let result = '';
                  for (const quality of [0.85, 0.75, 0.65, 0.5, 0.35]) {
                    result = canvas.toDataURL('image/jpeg', quality);
                    if (result.length < 2400000) break;
                  }
                  if (result.length >= 2400000) throw new Error('사진 압축 후에도 용량이 큽니다. 다른 사진을 선택해 주세요.');
                  resolve(result);
                } catch (err) { reject(err); }
                finally { URL.revokeObjectURL(url); }
              };
              img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('사진을 읽지 못했습니다.')); };
              img.src = url;
            });
            const response = await fetch('/.netlify/functions/photo-upload', {
              method: 'POST', credentials: 'same-origin',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg', mimeType: 'image/jpeg', dataUrl: base64, participantId: part ? part.id : null })
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.error || '업로드 실패');
            uploadedPhotoBase64 = result.url;
            uploadedPhotoFileId = result.fileId;
            previewEl.innerHTML = `<img src="${uploadedPhotoBase64}" class="w-full h-full object-cover" style="object-position:${photoPositionX}% ${photoPositionY}%;transform:scale(${photoZoom})" />`;
            removeBtn.classList.remove('hidden');
            status.textContent = 'Drive 업로드 완료. 아래 저장 버튼을 눌러 이용인 정보에 반영하세요.';
          } catch (error) {
            status.textContent = '업로드 실패: ' + error.message;
            fileInput.value = '';
          } finally { photoUploadPending = false; }
        });

        removeBtn.addEventListener('click', () => {
          uploadedPhotoBase64 = '';
          uploadedPhotoFileId = '';
          fileInput.value = '';
          previewEl.innerHTML = `<i data-lucide="user" class="w-7 h-7 text-gray-400"></i>`;
          removeBtn.classList.add('hidden');
          lucide.createIcons();
        });
      },
      onSubmit: () => {
        if (photoUploadPending) { alert('사진 업로드가 끝난 뒤 저장해 주세요.'); return false; }
        const name = document.getElementById('form-part-name').value.trim();
        const commId = document.getElementById('form-part-comm').value;
        const colorRadio = document.querySelector('input[name="form-part-color"]:checked');
        const color = colorRadio ? colorRadio.value : '#FF5A5F';
        const order = parseInt(document.getElementById('form-part-order').value) || 1;
        const active = document.getElementById('form-part-active').checked;

        if (!name) {
          alert('참여자 이름을 입력해 주세요.');
          return false;
        }

        appStore.saveParticipant({
          id: part ? part.id : null,
          name: name,
          community_id: commId,
          photo_url: uploadedPhotoBase64,
          photo_file_id: uploadedPhotoFileId,
          photo_position_x: photoPositionX,
          photo_position_y: photoPositionY,
          photo_zoom: photoZoom,
          avatar_color: color,
          sort_order: order,
          active: active
        });

        showToast(`참여자 '${name}' 정보가 저장되었습니다.`);
        renderAdminParticipants(document.getElementById('admin-content-container'));
        return true;
      }
    });
  }

  // ----------------------------------------------------
  // 2-4. 관리자 - 영역 관리
  // ----------------------------------------------------
  function renderAdminAreas(container) {
    const filterCommId = state.selectedAdminCommunityId === 'ALL' ? null : state.selectedAdminCommunityId;
    const areas = appStore.getAreas(filterCommId, false);
    const communities = appStore.getCommunities(false);
    const commMap = Object.fromEntries(communities.map(c => [c.id, c.name]));

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">영역 관리</h2>
            <p class="text-xs text-gray-500">커뮤니티별 활동 영역 추가/수정 및 활성화 관리</p>
          </div>
          <button id="btn-add-area" class="btn btn-primary text-xs py-2 px-4">
            <i data-lucide="plus" class="w-4 h-4"></i> 영역 추가
          </button>
        </div>

        <div id="area-comm-filter-wrap"></div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th class="w-16">순서</th>
                <th>영역명</th>
                <th>소속 커뮤니티</th>
                <th class="w-24">프로그램 수</th>
                <th class="w-24">상태</th>
                <th class="w-32 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              ${areas.length === 0 ? `
                <tr><td colspan="6" class="text-center py-8 text-gray-400">해당 조건의 영역이 없습니다.</td></tr>
              ` : areas.map(a => {
                const progCount = appStore.getPrograms(null, a.id, false).length;
                return `
                  <tr>
                    <td class="font-bold text-gray-500">${a.sort_order || 1}</td>
                    <td class="font-bold text-gray-900">${a.name}</td>
                    <td><span class="badge-comm">${commMap[a.community_id] || '미지정'}</span></td>
                    <td class="text-sm font-semibold">${progCount}개</td>
                    <td>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${a.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}">
                        ${a.active ? '사용 중' : '비활성'}
                      </span>
                    </td>
                    <td class="text-right space-x-1">
                      <button data-edit-id="${a.id}" class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-area">수정</button>
                      <button data-toggle-id="${a.id}" class="btn btn-ghost text-xs py-1 px-2 btn-toggle-area">${a.active ? '비활성' : '활성'}</button>
                      <button data-delete-id="${a.id}" class="btn btn-ghost text-xs py-1 px-2 text-red-600 btn-delete-area">삭제</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#area-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminAreas(container), true));

    document.getElementById('btn-add-area')?.addEventListener('click', () => {
      openAreaFormModal();
    });

    container.querySelectorAll('.btn-edit-area').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        const area = appStore.getAreaById(id);
        if (area) openAreaFormModal(area);
      });
    });

    container.querySelectorAll('.btn-toggle-area').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-id');
        const area = appStore.getAreaById(id);
        if (area) {
          area.active = !area.active;
          appStore.saveArea(area);
          renderAdminAreas(container);
          showToast(`'${area.name}' 영역 상태가 변경되었습니다.`);
        }
      });
    });

    container.querySelectorAll('.btn-delete-area').forEach(btn => {
      btn.addEventListener('click', () => {
        const area = appStore.getAreaById(btn.dataset.deleteId);
        if (!area || !confirm(`'${area.name}' 영역을 영구 삭제할까요? 해당 영역의 프로그램 및 요일 일정도 삭제됩니다. 기존 출석 기록은 보존됩니다. 이 작업은 되돌릴 수 없습니다.`)) return;
        appStore.deleteArea(area.id);
        renderAdminAreas(container);
        showToast(`'${area.name}' 영역과 연결된 프로그램이 삭제되었습니다.`);
      });
    });
  }

  function openAreaFormModal(area = null) {
    const isEdit = !!area;
    const communities = appStore.getCommunities(true);
    const commOptions = communities.map(c => `
      <option value="${c.id}" ${area && area.community_id === c.id ? 'selected' : ''}>${c.name}</option>
    `).join('');

    const bodyHtml = `
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">소속 커뮤니티 *</label>
        <select id="form-area-comm" class="form-control">
          ${commOptions}
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">영역 이름 *</label>
        <input type="text" id="form-area-name" class="form-control" value="${area ? area.name : ''}" placeholder="예: 건강_신체적건강" required />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">정렬 순서</label>
        <input type="number" id="form-area-order" class="form-control" value="${area ? area.sort_order || 1 : 1}" />
      </div>
      <div class="flex items-center gap-2 pt-2">
        <input type="checkbox" id="form-area-active" ${!area || area.active ? 'checked' : ''} class="w-4 h-4 text-[#FF385C]" />
        <label for="form-area-active" class="text-sm font-semibold text-gray-700">사용 활성화</label>
      </div>
    `;

    openGenericModal({
      title: isEdit ? '영역 수정' : '새 영역 등록',
      bodyHtml: bodyHtml,
      onSubmit: () => {
        const name = document.getElementById('form-area-name').value.trim();
        const commId = document.getElementById('form-area-comm').value;
        const order = parseInt(document.getElementById('form-area-order').value) || 1;
        const active = document.getElementById('form-area-active').checked;

        if (!name) {
          alert('영역 이름을 입력해 주세요.');
          return false;
        }

        appStore.saveArea({
          id: area ? area.id : null,
          community_id: commId,
          name: name,
          sort_order: order,
          active: active
        });

        showToast(`영역 '${name}' 정보가 저장되었습니다.`);
        renderAdminAreas(document.getElementById('admin-content-container'));
        return true;
      }
    });
  }

  // ----------------------------------------------------
  // 2-5. 관리자 - 프로그램 관리 (★ 세부프로그램명 제거, 프로그램명만 입력)
  // ----------------------------------------------------
  function renderAdminPrograms(container) {
    const filterCommId = state.selectedAdminCommunityId === 'ALL' ? null : state.selectedAdminCommunityId;
    const programs = appStore.getPrograms(filterCommId, null, false);
    const communities = appStore.getCommunities(false);
    const commMap = Object.fromEntries(communities.map(c => [c.id, c.name]));
    const areas = appStore.getAreas(null, false);
    const areaMap = Object.fromEntries(areas.map(a => [a.id, a.name]));
    const staffs = appStore.getStaffs(false);
    const staffMap = Object.fromEntries(staffs.map(s => [s.id, s.name]));

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">프로그램 관리</h2>
            <p class="text-xs text-gray-500">프로그램명만 간편하게 입력하여 등록/수정하실 수 있습니다.</p>
          </div>
          <button id="btn-add-program" class="btn btn-primary text-xs py-2 px-4">
            <i data-lucide="plus" class="w-4 h-4"></i> 프로그램 추가
          </button>
        </div>

        <div id="prog-comm-filter-wrap"></div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th>프로그램명</th>
                <th>커뮤니티 / 소속 영역</th>
                <th>담당 직원</th>
                <th>운영시간 / 장소</th>
                <th class="w-20">상태</th>
                <th class="w-32 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              ${programs.length === 0 ? `
                <tr><td colspan="6" class="text-center py-8 text-gray-400">해당 조건의 프로그램이 없습니다.</td></tr>
              ` : programs.map(p => {
                return `
                  <tr>
                    <td class="font-bold text-gray-900">${p.name}</td>
                    <td>
                      <div class="text-xs font-bold text-gray-800">${commMap[p.community_id] || ''}</div>
                      <div class="text-[11px] text-gray-500">${areaMap[p.area_id] || ''}</div>
                    </td>
                    <td class="text-sm font-medium text-gray-700">${staffMap[p.staff_id] || p.staff_id || '-'}</td>
                    <td class="text-xs text-gray-600">
                      <div>${p.time || '-'}</div>
                      <div class="text-gray-400">${p.location || '-'}</div>
                    </td>
                    <td>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${p.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}">
                        ${p.active ? '사용 중' : '비활성'}
                      </span>
                    </td>
                    <td class="text-right space-x-1">
                      <button data-edit-id="${p.id}" class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-prog">수정</button>
                      <button data-toggle-id="${p.id}" class="btn btn-ghost text-xs py-1 px-2 btn-toggle-prog">${p.active ? '비활성' : '활성'}</button>
                      <button data-delete-id="${p.id}" class="btn btn-ghost text-xs py-1 px-2 text-red-600 btn-delete-prog">삭제</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#prog-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminPrograms(container), true));

    document.getElementById('btn-add-program')?.addEventListener('click', () => {
      openProgramFormModal();
    });

    container.querySelectorAll('.btn-edit-prog').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        const prog = appStore.getProgramById(id);
        if (prog) openProgramFormModal(prog);
      });
    });

    container.querySelectorAll('.btn-toggle-prog').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-id');
        const prog = appStore.getProgramById(id);
        if (prog) {
          prog.active = !prog.active;
          appStore.saveProgram(prog);
          renderAdminPrograms(container);
          showToast(`'${prog.name}' 프로그램 상태가 변경되었습니다.`);
        }
      });
    });

    container.querySelectorAll('.btn-delete-prog').forEach(btn => {
      btn.addEventListener('click', () => {
        const prog = appStore.getProgramById(btn.dataset.deleteId);
        if (!prog || !confirm(`'${prog.name}' 프로그램을 영구 삭제할까요? 요일 일정도 삭제되며 기존 출석 기록은 보존됩니다.`)) return;
        appStore.deleteProgram(prog.id);
        renderAdminPrograms(container);
        showToast(`'${prog.name}' 프로그램이 삭제되었습니다.`);
      });
    });
  }

  function openProgramFormModal(prog = null) {
    const isEdit = !!prog;
    const communities = appStore.getCommunities(true);
    const staffs = appStore.getStaffs(true);

    const commOptions = communities.map(c => `
      <option value="${c.id}" ${prog && prog.community_id === c.id ? 'selected' : ''}>${c.name}</option>
    `).join('');

    const staffOptions = staffs.map(s => `
      <option value="${s.id}" ${prog && prog.staff_id === s.id ? 'selected' : ''}>${s.name}</option>
    `).join('');

    const bodyHtml = `
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-700">소속 커뮤니티 *</label>
          <select id="form-prog-comm" class="form-control">
            ${commOptions}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-700">소속 영역 *</label>
          <select id="form-prog-area" class="form-control"></select>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">프로그램명 *</label>
        <input type="text" id="form-prog-name" class="form-control" value="${prog ? prog.name : ''}" placeholder="예: 스트레칭 또는 요리활동" required />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-700">담당 직원</label>
          <select id="form-prog-staff" class="form-control">
            <option value="">선택 안 함</option>
            ${staffOptions}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-700">운영 시간</label>
          <input type="text" id="form-prog-time" class="form-control" value="${prog ? prog.time || '' : '10:00~11:30'}" placeholder="10:00~11:30" />
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">운영 장소</label>
        <input type="text" id="form-prog-location" class="form-control" value="${prog ? prog.location || '' : ''}" placeholder="예: 1층 다목적실" />
      </div>
      <div class="flex items-center gap-2 pt-2">
        <input type="checkbox" id="form-prog-active" ${!prog || prog.active ? 'checked' : ''} class="w-4 h-4 text-[#FF385C]" />
        <label for="form-prog-active" class="text-sm font-semibold text-gray-700">사용 활성화</label>
      </div>
    `;

    openGenericModal({
      title: isEdit ? '프로그램 수정' : '새 프로그램 등록',
      bodyHtml: bodyHtml,
      onOpen: () => {
        const commSelect = document.getElementById('form-prog-comm');
        const areaSelect = document.getElementById('form-prog-area');

        function updateAreaOptions() {
          const selectedCommId = commSelect.value;
          const areas = appStore.getAreas(selectedCommId, true);
          areaSelect.innerHTML = areas.map(a => `
            <option value="${a.id}" ${prog && prog.area_id === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('');
        }

        commSelect.addEventListener('change', updateAreaOptions);
        updateAreaOptions();
      },
      onSubmit: () => {
        const commId = document.getElementById('form-prog-comm').value;
        const areaId = document.getElementById('form-prog-area').value;
        const name = document.getElementById('form-prog-name').value.trim();
        const staffId = document.getElementById('form-prog-staff').value;
        const time = document.getElementById('form-prog-time').value.trim();
        const location = document.getElementById('form-prog-location').value.trim();
        const active = document.getElementById('form-prog-active').checked;

        if (!name) {
          alert('프로그램명을 입력해 주세요.');
          return false;
        }

        const areaObj = appStore.getAreaById(areaId);

        appStore.saveProgram({
          id: prog ? prog.id : null,
          community_id: commId,
          area_id: areaId,
          name: name,
          detail_program_name: areaObj ? areaObj.name : name, // 세부프로그램명은 영역명 또는 프로그램명으로 자동 연동
          staff_id: staffId,
          time: time,
          location: location,
          active: active
        });

        showToast(`프로그램 '${name}' 정보가 저장되었습니다.`);
        renderAdminPrograms(document.getElementById('admin-content-container'));
        return true;
      }
    });
  }

  // ----------------------------------------------------
  // 2-6. 관리자 - 담당 직원 관리 (★ 신규: 직원 이름 자유 수정 및 등록)
  // ----------------------------------------------------
  function renderAdminStaffs(container) {
    const staffs = appStore.getStaffs(false);

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">담당 직원 관리</h2>
            <p class="text-xs text-gray-500">담당 복지사/지도 직원의 이름을 자유롭게 추가, 수정, 변경할 수 있습니다.</p>
          </div>
          <button id="btn-add-staff" class="btn btn-primary text-xs py-2 px-4">
            <i data-lucide="user-plus" class="w-4 h-4"></i> 담당 직원 추가
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th class="w-16">번호</th>
                <th>직원 이름</th>
                <th>담당 프로그램 수</th>
                <th class="w-24">상태</th>
                <th class="w-32 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              ${staffs.length === 0 ? `
                <tr><td colspan="5" class="text-center py-8 text-gray-400">등록된 담당 직원이 없습니다.</td></tr>
              ` : staffs.map((s, idx) => {
                const progCount = (appStore.data.programs || []).filter(p => p.staff_id === s.id).length;
                return `
                  <tr>
                    <td class="font-bold text-gray-500">${idx + 1}</td>
                    <td class="font-bold text-base text-gray-900">${s.name}</td>
                    <td class="text-sm font-semibold text-gray-600">${progCount}개 프로그램</td>
                    <td>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}">
                        ${s.active ? '재직/활성' : '비활성'}
                      </span>
                    </td>
                    <td class="text-right space-x-1">
                      <button data-edit-staff-id="${s.id}" class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-staff">이름 수정</button>
                      <button data-toggle-staff-id="${s.id}" class="btn btn-ghost text-xs py-1 px-2 btn-toggle-staff">${s.active ? '비활성' : '활성'}</button>
                      <button data-delete-staff-id="${s.id}" class="btn btn-ghost text-xs py-1 px-2 text-red-600 btn-delete-staff">삭제</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-add-staff')?.addEventListener('click', () => {
      openStaffFormModal();
    });

    container.querySelectorAll('.btn-edit-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-staff-id');
        const staff = appStore.getStaffById(id);
        if (staff) openStaffFormModal(staff);
      });
    });

    container.querySelectorAll('.btn-toggle-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-staff-id');
        const staff = appStore.getStaffById(id);
        if (staff) {
          staff.active = !staff.active;
          appStore.saveStaff(staff);
          renderAdminStaffs(container);
          showToast(`'${staff.name}' 직원의 상태가 변경되었습니다.`);
        }
      });
    });

    container.querySelectorAll('.btn-delete-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const staff = appStore.getStaffById(btn.dataset.deleteStaffId);
        if (!staff || !confirm(`'${staff.name}' 담당 직원을 영구 삭제할까요? 연결된 프로그램은 담당자 미배정으로 변경되며 기존 출석 기록은 보존됩니다.`)) return;
        appStore.deleteStaff(staff.id);
        renderAdminStaffs(container);
        showToast(`'${staff.name}' 담당 직원이 삭제되었습니다.`);
      });
    });
  }

  function openStaffFormModal(staff = null) {
    const isEdit = !!staff;
    const bodyHtml = `
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">직원 이름 *</label>
        <input type="text" id="form-staff-name" class="form-control" value="${staff ? staff.name : ''}" placeholder="예: 김복지, 박지도" required />
      </div>
      <div class="flex items-center gap-2 pt-2">
        <input type="checkbox" id="form-staff-active" ${!staff || staff.active ? 'checked' : ''} class="w-4 h-4 text-[#FF385C]" />
        <label for="form-staff-active" class="text-sm font-semibold text-gray-700">재직/사용 활성화</label>
      </div>
    `;

    openGenericModal({
      title: isEdit ? '담당 직원 정보 수정' : '새 담당 직원 등록',
      bodyHtml: bodyHtml,
      onSubmit: () => {
        const name = document.getElementById('form-staff-name').value.trim();
        const active = document.getElementById('form-staff-active').checked;

        if (!name) {
          alert('직원 이름을 입력해 주세요.');
          return false;
        }

        appStore.saveStaff({
          id: staff ? staff.id : null,
          name: name,
          active: active
        });

        showToast(`담당 직원 '${name}' 정보가 저장되었습니다.`);
        renderAdminStaffs(document.getElementById('admin-content-container'));
        return true;
      }
    });
  }

  // ----------------------------------------------------
  // 2-7. 관리자 - 요일별 운영 설정 (★ 삭제 아이콘 상시 눈에 띄게 노출)
  // ----------------------------------------------------
  function renderAdminSchedules(container) {
    const filterCommId = state.selectedAdminCommunityId === 'ALL' ? null : state.selectedAdminCommunityId;
    const communities = appStore.getCommunities(true);
    
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekdaysOrder = [1, 2, 3, 4, 5]; // 월~금만 운영

    const matrixHtml = weekdaysOrder.map(w => {
      const dayName = dayNames[w];
      const daySchedules = appStore.getSchedules(w, filterCommId, true);

      const itemsHtml = daySchedules.map(sch => {
        const prog = appStore.getProgramById(sch.program_id);
        const area = prog ? appStore.getAreaById(prog.area_id) : null;
        const comm = prog ? appStore.getCommunityById(prog.community_id) : null;
        if (!prog) return '';

        return `
          <div class="bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex items-center justify-between text-xs hover:border-[#FF385C] transition">
            <div class="space-y-0.5">
              <div class="font-bold text-gray-900">${prog.name}</div>
              <div class="text-[11px] text-gray-500">${comm ? comm.name : ''} > ${area ? area.name.replace(/^.*?_/, '') : ''}</div>
            </div>
            <!-- 삭제 아이콘 상시 표시 -->
            <button data-delete-sch="${sch.id}" title="일정 삭제" class="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 p-1.5 rounded-md transition shrink-0 ml-2 border border-red-200">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      }).join('');

      return `
        <div class="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-col gap-2 shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-gray-100">
            <span class="font-bold text-sm ${w === 0 || w === 6 ? 'text-red-600' : 'text-gray-900'}">${dayName}</span>
            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">${daySchedules.length}개</span>
          </div>
          <div class="space-y-1.5 min-h-[80px] flex-1">
            ${itemsHtml || '<div class="text-xs text-gray-400 py-6 text-center">배정된 일정 없음</div>'}
          </div>
          <button data-add-weekday="${w}" class="btn btn-secondary text-xs py-1.5 w-full btn-add-day-sch font-semibold">
            + 일정 추가
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">요일별 주간 운영 설정</h2>
            <p class="text-xs text-gray-500">배정된 일정 우측의 빨간색 휴지통 아이콘을 누르면 즉시 일정이 삭제됩니다.</p>
          </div>
        </div>

        <div id="sch-comm-filter-wrap"></div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          ${matrixHtml}
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#sch-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminSchedules(container), true));

    // 일정 추가 버튼
    container.querySelectorAll('.btn-add-day-sch').forEach(btn => {
      btn.addEventListener('click', () => {
        const weekday = parseInt(btn.getAttribute('data-add-weekday'));
        openScheduleFormModal(weekday);
      });
    });

    // 일정 삭제 버튼
    container.querySelectorAll('[data-delete-sch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const schId = btn.getAttribute('data-delete-sch');
        if (confirm('이 요일 운영 일정을 삭제하시겠습니까?')) {
          appStore.deleteSchedule(schId);
          renderAdminSchedules(container);
          showToast('요일 일정이 삭제되었습니다.');
        }
      });
    });
  }

  function openScheduleFormModal(weekday) {
    if (![1, 2, 3, 4, 5].includes(Number(weekday))) { alert('요일별 운영은 월요일부터 금요일까지만 설정할 수 있습니다.'); return; }
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const communities = appStore.getCommunities(true);
    const commOptions = communities.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const bodyHtml = `
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">설정 요일</label>
        <div class="font-bold text-sm text-[#FF385C] bg-[#FFF0F2] p-2 rounded-md">${dayNames[weekday]}</div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">커뮤니티 선택 *</label>
        <select id="form-sch-comm" class="form-control">${commOptions}</select>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-bold text-gray-700">운영 영역 및 프로그램 *</label>
        <select id="form-sch-prog" class="form-control"></select>
      </div>
    `;

    openGenericModal({
      title: `${dayNames[weekday]} 운영 프로그램 배정`,
      bodyHtml: bodyHtml,
      onOpen: () => {
        const commSelect = document.getElementById('form-sch-comm');
        const progSelect = document.getElementById('form-sch-prog');

        function updateProgOptions() {
          const cId = commSelect.value;
          const progs = appStore.getPrograms(cId, null, true);
          const areas = appStore.getAreas(cId, true);
          const areaMap = Object.fromEntries(areas.map(a => [a.id, a.name]));

          progSelect.innerHTML = progs.map(p => `
            <option value="${p.id}" data-area-id="${p.area_id}">[${areaMap[p.area_id] || '영역'}] ${p.name} (${p.time || '시간미정'})</option>
          `).join('');
        }

        commSelect.addEventListener('change', updateProgOptions);
        updateProgOptions();
      },
      onSubmit: () => {
        const commId = document.getElementById('form-sch-comm').value;
        const progSelect = document.getElementById('form-sch-prog');
        const progId = progSelect.value;
        const areaId = progSelect.options[progSelect.selectedIndex]?.getAttribute('data-area-id') || '';

        if (!progId) {
          alert('배정할 프로그램을 선택해 주세요.');
          return false;
        }

        appStore.saveSchedule({
          weekday: weekday,
          community_id: commId,
          area_id: areaId,
          program_id: progId,
          active: true
        });

        showToast(`${dayNames[weekday]} 운영 일정이 추가되었습니다.`);
        renderAdminSchedules(document.getElementById('admin-content-container'));
        return true;
      }
    });
  }

  // ----------------------------------------------------
  // 2-8. 관리자 - 출석 관리 (★ 미출석 인원도 자유롭게 출석으로 변경 지원)
  // ----------------------------------------------------
  function renderAdminAttendances(container) {
    const filterCommId = state.selectedAdminCommunityId === 'ALL' ? null : state.selectedAdminCommunityId;
    const dateStr = state.selectedAttendanceDate;
    
    // 대상 커뮤니티 목록
    const communities = appStore.getCommunities(true);
    const targetComms = filterCommId ? communities.filter(c => c.id === filterCommId) : communities;
    const commMap = Object.fromEntries(communities.map(c => [c.id, c.name]));

    // 전체 참여자 기준으로 목록 생성
    const participants = appStore.getParticipants(filterCommId, true);
    const dayAttendances = appStore.getAttendances({ date: dateStr, communityId: filterCommId });

    // 각 참여자별 출석 현황 계산
    const participantRows = participants.map(part => {
      const partAtts = dayAttendances.filter(a => a.participant_id === part.id);
      const isAttended = partAtts.length > 0;
      const status = isAttended ? partAtts[0].attendance_status : '미출석';

      let statusBadgeClass = 'bg-gray-100 text-gray-500';
      if (status === '출석') statusBadgeClass = 'bg-[#E6F6E9] text-[#038026]';
      if (status === '지각') statusBadgeClass = 'bg-[#FFF4E5] text-[#B75F00]';
      if (status === '조퇴') statusBadgeClass = 'bg-blue-50 text-blue-600';
      if (status === '결석') statusBadgeClass = 'bg-[#FFF0ED] text-[#C13515]';

      return `
        <tr>
          <td class="font-mono text-xs text-gray-500">${dateStr}</td>
          <td class="font-bold text-gray-900 text-sm">${part.name}</td>
          <td><span class="badge-comm">${commMap[part.community_id] || '커뮤니티'}</span></td>
          <td class="text-xs text-gray-600">
            ${isAttended ? partAtts.map(a => `<span class="inline-block bg-gray-50 border border-gray-200 px-2 py-0.5 rounded mr-1 mb-1">${a.program_name}</span>`).join('') : '<span class="text-gray-400">출석 대상 프로그램 대기</span>'}
          </td>
          <td>
            <select data-part-id="${part.id}" data-comm-id="${part.community_id}" class="form-control text-xs py-1 px-2.5 font-bold select-participant-status ${statusBadgeClass}">
              <option value="미출석" ${status === '미출석' ? 'selected' : ''}>미출석</option>
              <option value="출석" ${status === '출석' ? 'selected' : ''}>출석</option>
              <option value="지각" ${status === '지각' ? 'selected' : ''}>지각</option>
              <option value="조퇴" ${status === '조퇴' ? 'selected' : ''}>조퇴</option>
              <option value="결석" ${status === '결석' ? 'selected' : ''}>결석</option>
            </select>
          </td>
          <td class="text-right">
            ${status === '미출석' ? `
              <button data-quick-attend-part="${part.id}" data-comm-id="${part.community_id}" class="btn btn-primary text-xs py-1 px-3">
                출석 처리
              </button>
            ` : `
              <button data-cancel-attend-part="${part.id}" data-comm-id="${part.community_id}" class="btn btn-ghost text-xs py-1 px-2 text-gray-500 hover:text-red-500">
                취소(미출석)
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">일자별 전체 출석부 관리</h2>
            <p class="text-xs text-gray-500">미처 누르지 못한 미출석 인원도 드롭다운이나 [출석 처리] 버튼으로 손쉽게 출석으로 바꿀 수 있습니다.</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="date" id="att-date-picker" class="form-control text-xs py-1.5" value="${dateStr}" />
            <button id="btn-batch-attend-all" class="btn btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">
              <i data-lucide="check-check" class="w-3.5 h-3.5 text-[#038026]"></i> 미출석자 전체 일괄 출석
            </button>
          </div>
        </div>

        <div id="att-comm-filter-wrap"></div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th class="w-24">일자</th>
                <th class="w-24">참여자 이름</th>
                <th class="w-32">커뮤니티</th>
                <th>출석 프로그램</th>
                <th class="w-28">출석 상태</th>
                <th class="w-28 text-right">빠른 변경</th>
              </tr>
            </thead>
            <tbody>
              ${participants.length === 0 ? `
                <tr><td colspan="6" class="text-center py-8 text-gray-400">참여자 데이터가 없습니다.</td></tr>
              ` : participantRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#att-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminAttendances(container), true));

    document.getElementById('att-date-picker')?.addEventListener('change', (e) => {
      state.selectedAttendanceDate = e.target.value;
      renderAdminAttendances(container);
    });

    // 상태 선택 드롭다운 이벤트
    container.querySelectorAll('.select-participant-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const partId = select.getAttribute('data-part-id');
        const commId = select.getAttribute('data-comm-id');
        const newStatus = e.target.value;
        const res = appStore.setParticipantDailyStatus(partId, commId, state.selectedAttendanceDate, newStatus);
        showToast(res.message);
        renderAdminAttendances(container);
      });
    });

    // 빠른 출석 처리 버튼
    container.querySelectorAll('[data-quick-attend-part]').forEach(btn => {
      btn.addEventListener('click', () => {
        const partId = btn.getAttribute('data-quick-attend-part');
        const commId = btn.getAttribute('data-comm-id');
        const res = appStore.setParticipantDailyStatus(partId, commId, state.selectedAttendanceDate, '출석');
        showToast(res.message);
        renderAdminAttendances(container);
      });
    });

    // 취소(미출석) 버튼
    container.querySelectorAll('[data-cancel-attend-part]').forEach(btn => {
      btn.addEventListener('click', () => {
        const partId = btn.getAttribute('data-cancel-attend-part');
        const commId = btn.getAttribute('data-comm-id');
        const res = appStore.setParticipantDailyStatus(partId, commId, state.selectedAttendanceDate, '미출석');
        showToast(res.message);
        renderAdminAttendances(container);
      });
    });

    // 미출석자 전체 일괄 출석 버튼
    document.getElementById('btn-batch-attend-all')?.addEventListener('click', () => {
      if (confirm(`${state.selectedAttendanceDate} 기준 모든 미출석 인원을 '출석'으로 일괄 처리하시겠습니까?`)) {
        let count = 0;
        participants.forEach(part => {
          const hasAtt = dayAttendances.some(a => a.participant_id === part.id);
          if (!hasAtt) {
            appStore.setParticipantDailyStatus(part.id, part.community_id, state.selectedAttendanceDate, '출석');
            count++;
          }
        });
        showToast(`${count}명의 참여자가 일괄 출석 처리되었습니다.`);
        renderAdminAttendances(container);
      }
    });
  }

  // ----------------------------------------------------
  // 2-9. 관리자 - 월별 출석률 (PRD 계산식 반영)
  // ----------------------------------------------------
  function renderAdminAttendanceRates(container) {
    const filterCommId = state.selectedAdminCommunityId === 'ALL' ? null : state.selectedAdminCommunityId;
    const monthStr = state.selectedStatsMonth; // 'YYYY-MM'
    const stats = appStore.calculateMonthlyStats(monthStr, filterCommId);

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">월별 개인 출석률 분석</h2>
            <p class="text-xs text-gray-500">
              공식: <strong>출석률 = 실제 출석 횟수 ÷ 실제 운영된 출석 대상 횟수 × 100</strong>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <input type="month" id="stats-month-picker" class="form-control text-xs py-1.5" value="${monthStr}" />
          </div>
        </div>

        <div id="stats-comm-filter-wrap"></div>

        <div class="overflow-x-auto">
          <table class="table-custom">
            <thead>
              <tr>
                <th>커뮤니티</th>
                <th>참여자 이름</th>
                <th class="text-right">예정/운영 횟수</th>
                <th class="text-right">실제 출석</th>
                <th class="text-right">결석</th>
                <th class="text-right">출석률</th>
              </tr>
            </thead>
            <tbody>
              ${stats.length === 0 ? `
                <tr><td colspan="6" class="text-center py-8 text-gray-400">참여자 데이터가 없습니다.</td></tr>
              ` : stats.map(s => {
                return `
                  <tr>
                    <td><span class="badge-comm">${s.community_name}</span></td>
                    <td class="font-bold text-gray-900">${s.participant_name}</td>
                    <td class="text-right font-medium text-gray-700">${s.expected_count}회</td>
                    <td class="text-right font-bold text-[#038026]">${s.attended_count}회</td>
                    <td class="text-right font-semibold text-[#FF385C]">${s.absent_count}회</td>
                    <td class="text-right">
                      <span class="px-2.5 py-1 rounded-full text-xs font-black bg-[#E6F6E9] text-[#038026]">
                        ${s.attendance_rate}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const filterWrap = container.querySelector('#stats-comm-filter-wrap');
    filterWrap.appendChild(createCommunityFilterBar(() => renderAdminAttendanceRates(container), true));

    document.getElementById('stats-month-picker')?.addEventListener('change', (e) => {
      state.selectedStatsMonth = e.target.value;
      renderAdminAttendanceRates(container);
    });
  }

  // ----------------------------------------------------
  // 2-10. 관리자 - 담당자 주간 파트 배분표
  // ----------------------------------------------------
  function renderAdminStaffAssignments(container) {
    const staffs = appStore.getStaffs(true);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const weekdays = [1, 2, 3, 4, 5]; // 평일 월~금

    const tableRows = staffs.map(staff => {
      const dayCells = weekdays.map(w => {
        const schedules = appStore.getSchedules(w, null, true);
        const assignedProgs = [];
        schedules.forEach(sch => {
          const prog = appStore.getProgramById(sch.program_id);
          if (prog && prog.staff_id === staff.id) {
            const comm = appStore.getCommunityById(prog.community_id);
            assignedProgs.push(`[${comm ? comm.name.replace('커뮤니티', '') : ''}] ${prog.name}`);
          }
        });

        return `
          <td class="text-xs p-2.5 align-top">
            ${assignedProgs.length > 0 ? assignedProgs.map(p => `
              <div class="bg-gray-50 border border-gray-200 p-1 rounded mb-1 text-[11px] font-medium text-gray-800">${p}</div>
            `).join('') : '<span class="text-gray-300">-</span>'}
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td class="font-bold text-gray-900 bg-gray-50">${staff.name}</td>
          ${dayCells}
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="admin-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#222222]">담당자 주간 파트 배분표</h2>
            <p class="text-xs text-gray-500">복지사 및 지도 담당자별 요일별 프로그램 배정 현황</p>
          </div>
          <button id="btn-print-staff-table" class="btn btn-secondary text-xs py-1.5 px-3">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> 인쇄하기
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table-custom border text-center" id="staff-printable-table">
            <thead>
              <tr>
                <th class="w-24 text-center bg-gray-100">담당 직원</th>
                <th class="text-center bg-gray-50">월요일</th>
                <th class="text-center bg-gray-50">화요일</th>
                <th class="text-center bg-gray-50">수요일</th>
                <th class="text-center bg-gray-50">목요일</th>
                <th class="text-center bg-gray-50">금요일</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-print-staff-table')?.addEventListener('click', () => {
      window.print();
    });
  }

  // ----------------------------------------------------
  // 2-11. 관리자 - 출석 데이터 추출 (★ 세부프로그램명에 '영역명' 입력)
  // ----------------------------------------------------
  function renderAdminExportData(container) {
    container.innerHTML = `
      <div class="admin-card space-y-6">
        <div>
          <h2 class="text-xl font-bold text-[#222222]">출석 데이터 Excel / CSV 추출</h2>
          <p class="text-xs text-gray-500">요청사항에 맞추어 세부프로그램명 자리에 <strong>프로그램이 속한 영역명</strong>이 자동 입력되어 추출됩니다.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 1. 기관 제출용 9열 지정 포맷 -->
          <div class="bg-gradient-to-br from-white to-[#FFF9FA] border-2 border-[#FFD0D7] p-5 rounded-2xl space-y-4">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-[#FF385C] text-white flex items-center justify-center font-bold text-xs">1</span>
              <h3 class="text-base font-extrabold text-[#222222]">기관 제출용 9열 지정 형식 (표준)</h3>
            </div>
            
            <p class="text-xs text-gray-600 leading-relaxed">
              정부/기관 제출 표준 9개 열 규격:<br/>
              <strong>[1:이름 / 2~6:완전 공백 / 7:YYYY-MM-DD / 8:소속 영역명 / 9:담당자]</strong>
            </p>

            <div class="bg-white p-3 rounded-xl border border-gray-200 text-xs font-mono space-y-1">
              <div class="text-gray-400 font-bold text-[10px]">열 구성 미리보기:</div>
              <div class="text-gray-700">A열: 이름 (참여자 성명)</div>
              <div class="text-gray-400">B~F열: (완전 빈 열)</div>
              <div class="text-gray-700">G열: 날짜 (YYYY-MM-DD)</div>
              <div class="text-gray-700 font-bold text-[#FF385C]">H열: 소속 영역명 (예: 건강_신체적건강)</div>
              <div class="text-gray-700">I열: 담당 직원</div>
            </div>

            <div class="space-y-1">
              <label for="official-community-filter" class="text-xs font-bold text-gray-700">제출할 커뮤니티</label>
              <select id="official-community-filter" class="form-control w-full">
                <option value="ALL">전체 커뮤니티 (한 파일)</option>
                ${appStore.getCommunities(false).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
              <p class="text-xs text-gray-500">선택한 커뮤니티의 출석·지각·조퇴 기록만 추출합니다.</p>
            </div>
            <button id="btn-export-official-excel" class="btn btn-primary w-full py-3 text-sm font-bold shadow-md">
              <i data-lucide="download" class="w-4 h-4"></i> 기관 제출용 9열 Excel 다운로드
            </button>
          </div>

          <!-- 2. 운영·관리용 상세 엑셀 -->
          <div class="bg-white border border-gray-200 p-5 rounded-2xl space-y-4">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-xs">2</span>
              <h3 class="text-base font-extrabold text-[#222222]">운영·관리용 전체 상세 Excel</h3>
            </div>

            <p class="text-xs text-gray-600 leading-relaxed">
              복지관 내부 보관 및 데이터 분석용:<br/>
              이름, 커뮤니티, 영역, 프로그램, 날짜, 요일, 담당자, 출석상태, 입력시각 전체 포함
            </p>

            <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
              <div>- 커뮤니티 및 영역별 세부 필터링 가능</div>
              <div>- 지각/결석/조퇴 등 모든 출석 상태 분석</div>
            </div>

            <button id="btn-export-internal-excel" class="btn btn-secondary w-full py-3 text-sm font-bold">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> 운영 관리용 상세 Excel 다운로드
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-export-official-excel')?.addEventListener('click', () => {
      exportOfficial9ColumnExcel();
    });

    document.getElementById('btn-export-internal-excel')?.addEventListener('click', () => {
      exportInternalDetailExcel();
    });
  }

  function exportOfficial9ColumnExcel() {
    const selectedCommunityId = document.getElementById('official-community-filter')?.value || 'ALL';
    const attendances = appStore.getAttendances().filter(a => selectedCommunityId === 'ALL' || a.community_id === selectedCommunityId);
    if (attendances.length === 0) {
      alert('추출할 출석 데이터가 없습니다.');
      return;
    }

    const areas = appStore.getAreas(null, false);
    const areaMap = Object.fromEntries(areas.map(a => [a.id, a.name]));
    const progs = appStore.getPrograms(null, null, false);
    const progMap = Object.fromEntries(progs.map(p => [p.id, p]));
    const staffs = appStore.getStaffs(false);
    const staffMap = Object.fromEntries(staffs.map(s => [s.id, s.name]));

    // 9열 헤더
    const headers = ['이름', '', '', '', '', '', '날짜', '세부프로그램명', '담당자'];
    
    // 데이터 행 생성 (2~6열은 빈 문자열, 8열은 프로그램이 속한 '영역명')
    const rows = attendances
      .filter(a => a.attendance_status === '출석' || a.attendance_status === '지각' || a.attendance_status === '조퇴')
      .map(a => {
        const prog = progMap[a.program_id];
        const areaName = a.area_name || (prog ? areaMap[prog.area_id] : '') || a.detail_program_name || a.program_name || '';
        const staffName = a.staff_name || (prog ? staffMap[prog.staff_id] : '') || '';

        return [
          a.participant_name || '',
          '',
          '',
          '',
          '',
          '',
          a.attendance_date,
          areaName, // ★ 8열: 프로그램이 속한 영역명 입력
          staffName
        ];
      });

    const worksheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '기관제출용_출석기록');

    const selectedCommunity = appStore.getCommunities(false).find(c => c.id === selectedCommunityId);
    const safeCommunityName = (selectedCommunity?.name || '전체').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `기관제출_출석기록_${safeCommunityName}_${appStore.formatDateKey()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`'${fileName}' 파일이 다운로드되었습니다.`);
  }

  function exportInternalDetailExcel() {
    const attendances = appStore.getAttendances();
    if (attendances.length === 0) {
      alert('추출할 출석 데이터가 없습니다.');
      return;
    }

    const communities = appStore.getCommunities(false);
    const commMap = Object.fromEntries(communities.map(c => [c.id, c.name]));
    const areas = appStore.getAreas(null, false);
    const areaMap = Object.fromEntries(areas.map(a => [a.id, a.name]));
    const progs = appStore.getPrograms(null, null, false);
    const progMap = Object.fromEntries(progs.map(p => [p.id, p]));
    const staffs = appStore.getStaffs(false);
    const staffMap = Object.fromEntries(staffs.map(s => [s.id, s.name]));

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const headers = ['이름', '커뮤니티', '영역', '프로그램', '세부프로그램명(영역)', '날짜', '요일', '담당자', '출석상태', '입력시각'];
    
    const rows = attendances.map(a => {
      let dayName = '';
      if (a.attendance_date) {
        const [y, m, d] = a.attendance_date.split('-').map(Number);
        dayName = dayNames[new Date(y, m - 1, d).getDay()] || '';
      }

      const prog = progMap[a.program_id];
      const areaName = a.area_name || (prog ? areaMap[prog.area_id] : '') || '';
      const staffName = a.staff_name || (prog ? staffMap[prog.staff_id] : '') || '';

      return [
        a.participant_name || '',
        commMap[a.community_id] || a.community_id,
        areaName,
        a.program_name || '',
        areaName, // 세부프로그램명 열에 영역명 적용
        a.attendance_date,
        dayName,
        staffName,
        a.attendance_status || '',
        a.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : ''
      ];
    });

    const worksheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '운영관리_출석기록');

    const fileName = `운영관리_출석기록_전체_${appStore.formatDateKey()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`'${fileName}' 파일이 다운로드되었습니다.`);
  }

  // ----------------------------------------------------
  // 2-12. 관리자 - 시스템 설정 (데이터 백업 및 복원)
  // ----------------------------------------------------
  function renderAdminSystemSettings(container) {
    container.innerHTML = `
      <div class="admin-card space-y-6">
        <div>
          <h2 class="text-xl font-bold text-[#222222]">시스템 설정 & 데이터 관리</h2>
          <p class="text-xs text-gray-500">전체 데이터 백업/복원 및 기본 초기 샘플 데이터 재설정</p>
        </div>

        <div class="space-y-4">
          <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
            <h3 class="text-sm font-bold text-gray-800">전체 데이터 백업 및 복구</h3>
            <p class="text-xs text-gray-500">커뮤니티, 참여자, 사진 데이터, 영역, 프로그램, 담당 직원, 출석 기록 등 모든 데이터를 JSON 파일로 보관하거나 불러옵니다.</p>
            
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <button id="btn-export-backup-json" class="btn btn-secondary text-xs py-2 px-4 font-bold">
                <i data-lucide="download" class="w-4 h-4"></i> 백업 파일 다운로드 (JSON)
              </button>
              
              <label class="btn btn-secondary text-xs py-2 px-4 font-bold cursor-pointer">
                <i data-lucide="upload" class="w-4 h-4"></i> 백업 파일 불러오기 (JSON)
                <input type="file" id="file-import-backup" accept=".json" class="hidden" />
              </label>
            </div>
          </div>

          <div class="bg-[#FFF0F2] p-5 rounded-2xl border border-[#FFD0D7] space-y-3">
            <h3 class="text-sm font-bold text-[#FF385C]">기본 샘플 데이터로 초기화</h3>
            <p class="text-xs text-gray-600">시스템을 최초 4개 커뮤니티 및 기본 샘플 참여자/프로그램 상태로 재설정합니다.</p>
            
            <button id="btn-reset-system" class="btn btn-primary text-xs py-2 px-4 font-bold">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i> 기본 데이터로 초기화
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-export-backup-json')?.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(appStore.exportJson());
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `출석관리시스템_전체백업_${appStore.formatDateKey()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('백업 파일이 다운로드되었습니다.');
    });

    document.getElementById('file-import-backup')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = appStore.importJson(event.target.result);
        if (result.success) {
          showToast('백업 데이터가 성공적으로 복원되었습니다.');
          renderAdminSystemSettings(container);
          renderParticipantView();
        } else {
          alert('데이터 복원 실패: ' + result.error);
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-reset-system')?.addEventListener('click', () => {
      if (confirm('모든 현재 데이터를 지우고 기본 샘플 데이터로 초기화하시겠습니까?')) {
        appStore.resetToDefault();
        showToast('기본 데이터로 초기화되었습니다.');
        renderAdminSystemSettings(container);
        renderParticipantView();
      }
    });
  }

  // ----------------------------------------------------
  // 공통 모달 헬퍼 함수
  // ----------------------------------------------------
  let currentGenericSubmitHandler = null;

  function openGenericModal({ title, bodyHtml, onOpen, onSubmit }) {
    document.getElementById('generic-modal-title').textContent = title;
    document.getElementById('generic-modal-body').innerHTML = bodyHtml;
    
    currentGenericSubmitHandler = onSubmit;
    openModal('modal-generic-form');

    if (onOpen) onOpen();
    lucide.createIcons();
  }

  document.getElementById('generic-modal-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentGenericSubmitHandler) {
      const success = currentGenericSubmitHandler();
      if (success) {
        closeModal('modal-generic-form');
      }
    }
  });

  document.getElementById('btn-close-generic-modal')?.addEventListener('click', () => closeModal('modal-generic-form'));
  document.getElementById('btn-cancel-generic-modal')?.addEventListener('click', () => closeModal('modal-generic-form'));

  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  // 데이터 스토어 변경 시 실시간 반영 (구독 리스너)
  appStore.subscribe(() => {
    if (state.mode === 'participant') {
      renderParticipantView();
    }
  });

  // 초기 참여자 뷰 렌더링
  renderParticipantView();
  lucide.createIcons();
});
