/**
 * 발달장애인 디지털 출석관리 시스템 - 데이터 스토리지 모듈 (Store)
 */

const STORAGE_KEY = 'DISABILITY_ATTENDANCE_SYSTEM_V3';

// 초기 기본 데이터 시드
const DEFAULT_DATA = {
  communities: [
    { 
      id: 'comm-1', 
      name: '건강커뮤니티', 
      description: '신체 및 심리사회적 건강 활동', 
      active: true, 
      sort_order: 1,
      banner_title: '자신의 사진이나 이름을 누르면 건강 활동 출석이 완료됩니다!',
      banner_sub: '오늘도 활기차고 건강한 하루를 시작해보세요.',
      success_msg: '건강커뮤니티 출석 완료!',
      success_desc: '오늘의 모든 건강 프로그램에 정상 출석되었습니다.'
    },
    { 
      id: 'comm-2', 
      name: '스마트커뮤니티', 
      description: '디지털 및 문화여가 활동', 
      active: true, 
      sort_order: 2,
      banner_title: '자신의 사진이나 이름을 누르면 스마트 활동 출석이 완료됩니다!',
      banner_sub: '재미있고 스마트한 디지털 세상을 함께 즐겨요.',
      success_msg: '스마트커뮤니티 출석 완료!',
      success_desc: '오늘의 모든 스마트 프로그램에 정상 출석되었습니다.'
    },
    { 
      id: 'comm-3', 
      name: '스포츠커뮤니티', 
      description: '웰니스 및 체육 활동', 
      active: true, 
      sort_order: 3,
      banner_title: '자신의 사진이나 이름을 누르면 스포츠 활동 출석이 완료됩니다!',
      banner_sub: '신나게 땀 흘리고 튼튼한 체력을 길러보아요.',
      success_msg: '스포츠커뮤니티 출석 완료!',
      success_desc: '오늘의 모든 스포츠 프로그램에 정상 출석되었습니다.'
    },
    { 
      id: 'comm-4', 
      name: '컬처커뮤니티', 
      description: '사회문화소통 및 문화창작 활동', 
      active: true, 
      sort_order: 4,
      banner_title: '자신의 사진이나 이름을 누르면 컬처 활동 출석이 완료됩니다!',
      banner_sub: '다양한 예술 문화 활동으로 일상을 채워보세요.',
      success_msg: '컬처커뮤니티 출석 완료!',
      success_desc: '오늘의 모든 컬처 프로그램에 정상 출석되었습니다.'
    }
  ],
  areas: [
    // 건강커뮤니티 영역
    { id: 'area-1', community_id: 'comm-1', name: '건강_신체적건강', active: true, sort_order: 1 },
    { id: 'area-2', community_id: 'comm-1', name: '건강_심리사회적 건강', active: true, sort_order: 2 },
    { id: 'area-3', community_id: 'comm-1', name: '건강_자립실천', active: true, sort_order: 3 },
    // 스마트커뮤니티 영역
    { id: 'area-4', community_id: 'comm-2', name: '스마트_디지털영역', active: true, sort_order: 1 },
    { id: 'area-5', community_id: 'comm-2', name: '스마트_문화여가영역', active: true, sort_order: 2 },
    { id: 'area-6', community_id: 'comm-2', name: '스마트_자립실천영역', active: true, sort_order: 3 },
    // 스포츠커뮤니티 영역
    { id: 'area-7', community_id: 'comm-3', name: '스포츠_웰니스 영역', active: true, sort_order: 1 },
    { id: 'area-8', community_id: 'comm-3', name: '스포츠_공동체 활동', active: true, sort_order: 2 },
    { id: 'area-9', community_id: 'comm-3', name: '스포츠_스포츠 영역', active: true, sort_order: 3 },
    // 컬처커뮤니티 영역
    { id: 'area-10', community_id: 'comm-4', name: '컬처_사회문화소통', active: true, sort_order: 1 },
    { id: 'area-11', community_id: 'comm-4', name: '컬처_문화창작활동', active: true, sort_order: 2 },
    { id: 'area-12', community_id: 'comm-4', name: '컬처_문화리터러시', active: true, sort_order: 3 },
    { id: 'area-13', community_id: 'comm-4', name: '컬처_자립생활', active: true, sort_order: 4 }
  ],
  staffs: [
    { id: 'staff-1', name: '김복지', active: true },
    { id: 'staff-2', name: '이선생', active: true },
    { id: 'staff-3', name: '박담당', active: true },
    { id: 'staff-4', name: '최지도', active: true }
  ],
  programs: [
    // 건강커뮤니티 프로그램
    { id: 'prog-1', community_id: 'comm-1', area_id: 'area-1', name: '스트레칭', detail_program_name: '신체유연성 스트레칭', description: '관절 가동성 및 근육 이완', staff_id: 'staff-1', time: '10:00~11:00', location: '1층 웰니스실', active: true, sort_order: 1 },
    { id: 'prog-2', community_id: 'comm-1', area_id: 'area-1', name: '건강체조', detail_program_name: '활력 쑥쑥 건강체조', description: '음악과 함께하는 전신 유산소 체조', staff_id: 'staff-1', time: '11:00~12:00', location: '1층 다목적실', active: true, sort_order: 2 },
    { id: 'prog-3', community_id: 'comm-1', area_id: 'area-3', name: '요리활동', detail_program_name: '스스로 만드는 간식요리', description: '간단하고 영양가 높은 간식 만들기', staff_id: 'staff-2', time: '14:00~15:30', location: '2층 조리실습실', active: true, sort_order: 3 },
    
    // 스마트커뮤니티 프로그램
    { id: 'prog-4', community_id: 'comm-2', area_id: 'area-4', name: '스마트폰 활용', detail_program_name: '스마트폰 기초 및 앱 활용', description: '카카오톡 및 사진 촬영 익히기', staff_id: 'staff-3', time: '10:00~11:30', location: '3층 스마트룸', active: true, sort_order: 1 },
    { id: 'prog-5', community_id: 'comm-2', area_id: 'area-5', name: '태블릿 드로잉', detail_program_name: '디지털 그림 그리기', description: '태블릿 펜을 이용한 컬러링', staff_id: 'staff-3', time: '13:30~15:00', location: '3층 스마트룸', active: true, sort_order: 2 },
    
    // 스포츠커뮤니티 프로그램
    { id: 'prog-6', community_id: 'comm-3', area_id: 'area-7', name: '기초체력증진', detail_program_name: '밴드 및 소도구 운동', description: '근력 및 밸런스 트레이닝', staff_id: 'staff-4', time: '10:00~11:30', location: '체육관', active: true, sort_order: 1 },
    { id: 'prog-7', community_id: 'comm-3', area_id: 'area-9', name: '볼링활동', detail_program_name: '미니 볼링 & 공놀이', description: '팀 협동 볼링 게임', staff_id: 'staff-4', time: '14:00~15:30', location: '체육관', active: true, sort_order: 2 },
    
    // 컬처커뮤니티 프로그램
    { id: 'prog-8', community_id: 'comm-4', area_id: 'area-10', name: '사회문화소통', detail_program_name: '이야기 나눔 및 감정카드', description: '주간 일상 공유와 공감 소통', staff_id: 'staff-2', time: '10:00~11:30', location: '2층 나눔방', active: true, sort_order: 1 },
    { id: 'prog-9', community_id: 'comm-4', area_id: 'area-11', name: '도예교실', detail_program_name: '손으로 빚는 흙 도예', description: '점토를 활용한 그릇 빚기', staff_id: 'staff-1', time: '14:00~15:30', location: '창작공방', active: true, sort_order: 2 }
  ],
  participants: [
    // 건강커뮤니티 참여자 (실제 사진 매핑: 11명)
    { id: 'part-1', name: '김윤희', community_id: 'comm-1', photo_url: '', avatar_color: '#FF5A5F', active: true, sort_order: 1 },
    { id: 'part-2', name: '남궁기', community_id: 'comm-1', photo_url: '', avatar_color: '#00A699', active: true, sort_order: 2 },
    { id: 'part-3', name: '남승우', community_id: 'comm-1', photo_url: '', avatar_color: '#FC642D', active: true, sort_order: 3 },
    { id: 'part-4', name: '노윤호', community_id: 'comm-1', photo_url: '', avatar_color: '#484848', active: true, sort_order: 4 },
    { id: 'part-5', name: '문건모', community_id: 'comm-1', photo_url: '', avatar_color: '#767676', active: true, sort_order: 5 },
    { id: 'part-6', name: '송지은', community_id: 'comm-1', photo_url: '', avatar_color: '#8CE071', active: true, sort_order: 6 },
    { id: 'part-7', name: '전광식', community_id: 'comm-1', photo_url: '', avatar_color: '#3B82F6', active: true, sort_order: 7 },
    { id: 'part-8', name: '전청', community_id: 'comm-1', photo_url: '', avatar_color: '#10B981', active: true, sort_order: 8 },
    { id: 'part-9', name: '조영준', community_id: 'comm-1', photo_url: '', avatar_color: '#F59E0B', active: true, sort_order: 9 },
    { id: 'part-10', name: '지정은', community_id: 'comm-1', photo_url: '', avatar_color: '#8B5CF6', active: true, sort_order: 10 },
    { id: 'part-11', name: '차의재', community_id: 'comm-1', photo_url: '', avatar_color: '#EC4899', active: true, sort_order: 11 },
    
    // 스마트커뮤니티 참여자 (5명)
    { id: 'part-12', name: '윤서준', community_id: 'comm-2', photo_url: '', avatar_color: '#008489', active: true, sort_order: 1 },
    { id: 'part-13', name: '오다은', community_id: 'comm-2', photo_url: '', avatar_color: '#FFB400', active: true, sort_order: 2 },
    { id: 'part-14', name: '한도현', community_id: 'comm-2', photo_url: '', avatar_color: '#914669', active: true, sort_order: 3 },
    { id: 'part-15', name: '서유나', community_id: 'comm-2', photo_url: '', avatar_color: '#2B6CB0', active: true, sort_order: 4 },
    { id: 'part-16', name: '임재원', community_id: 'comm-2', photo_url: '', avatar_color: '#D43F3A', active: true, sort_order: 5 },
    
    // 스포츠커뮤니티 참여자 (5명)
    { id: 'part-17', name: '조민재', community_id: 'comm-3', photo_url: '', avatar_color: '#3B82F6', active: true, sort_order: 1 },
    { id: 'part-18', name: '신소율', community_id: 'comm-3', photo_url: '', avatar_color: '#10B981', active: true, sort_order: 2 },
    { id: 'part-19', name: '안태양', community_id: 'comm-3', photo_url: '', avatar_color: '#F59E0B', active: true, sort_order: 3 },
    { id: 'part-20', name: '배가은', community_id: 'comm-3', photo_url: '', avatar_color: '#EC4899', active: true, sort_order: 4 },
    { id: 'part-21', name: '노진우', community_id: 'comm-3', photo_url: '', avatar_color: '#6366F1', active: true, sort_order: 5 },
    
    // 컬처커뮤니티 참여자 (5명)
    { id: 'part-22', name: '송채원', community_id: 'comm-4', photo_url: '', avatar_color: '#8B5CF6', active: true, sort_order: 1 },
    { id: 'part-23', name: '유승현', community_id: 'comm-4', photo_url: '', avatar_color: '#14B8A6', active: true, sort_order: 2 },
    { id: 'part-24', name: '권보라', community_id: 'comm-4', photo_url: '', avatar_color: '#F43F5E', active: true, sort_order: 3 },
    { id: 'part-25', name: '황준호', community_id: 'comm-4', photo_url: '', avatar_color: '#0EA5E9', active: true, sort_order: 4 },
    { id: 'part-26', name: '문지아', community_id: 'comm-4', photo_url: '', avatar_color: '#84CC16', active: true, sort_order: 5 }
  ],
  schedules: [
    // 월요일 (1)
    { id: 'sch-1', weekday: 1, community_id: 'comm-1', area_id: 'area-1', program_id: 'prog-1', active: true },
    { id: 'sch-2', weekday: 1, community_id: 'comm-1', area_id: 'area-3', program_id: 'prog-3', active: true },
    { id: 'sch-3', weekday: 1, community_id: 'comm-2', area_id: 'area-4', program_id: 'prog-4', active: true },
    { id: 'sch-4', weekday: 1, community_id: 'comm-3', area_id: 'area-7', program_id: 'prog-6', active: true },
    { id: 'sch-5', weekday: 1, community_id: 'comm-4', area_id: 'area-10', program_id: 'prog-8', active: true },
    
    // 화요일 (2)
    { id: 'sch-6', weekday: 2, community_id: 'comm-1', area_id: 'area-1', program_id: 'prog-2', active: true },
    { id: 'sch-7', weekday: 2, community_id: 'comm-2', area_id: 'area-5', program_id: 'prog-5', active: true },
    { id: 'sch-8', weekday: 2, community_id: 'comm-3', area_id: 'area-9', program_id: 'prog-7', active: true },
    { id: 'sch-9', weekday: 2, community_id: 'comm-4', area_id: 'area-11', program_id: 'prog-9', active: true },
    
    // 수요일 (3) - 건강커뮤니티에 여러 프로그램 동시 배정 (PRD 예시 반영: 스트레칭, 건강체조, 요리활동)
    { id: 'sch-10', weekday: 3, community_id: 'comm-1', area_id: 'area-1', program_id: 'prog-1', active: true },
    { id: 'sch-11', weekday: 3, community_id: 'comm-1', area_id: 'area-1', program_id: 'prog-2', active: true },
    { id: 'sch-12', weekday: 3, community_id: 'comm-1', area_id: 'area-3', program_id: 'prog-3', active: true },
    { id: 'sch-13', weekday: 3, community_id: 'comm-2', area_id: 'area-4', program_id: 'prog-4', active: true },
    { id: 'sch-14', weekday: 3, community_id: 'comm-3', area_id: 'area-7', program_id: 'prog-6', active: true },
    { id: 'sch-15', weekday: 3, community_id: 'comm-4', area_id: 'area-10', program_id: 'prog-8', active: true },
    
    // 목요일 (4)
    { id: 'sch-16', weekday: 4, community_id: 'comm-1', area_id: 'area-1', program_id: 'prog-2', active: true },
    { id: 'sch-17', weekday: 4, community_id: 'comm-2', area_id: 'area-4', program_id: 'prog-4', active: true },
    { id: 'sch-18', weekday: 4, community_id: 'comm-2', area_id: 'area-5', program_id: 'prog-5', active: true },
    { id: 'sch-19', weekday: 4, community_id: 'comm-3', area_id: 'area-9', program_id: 'prog-7', active: true },
    { id: 'sch-20', weekday: 4, community_id: 'comm-4', area_id: 'area-11', program_id: 'prog-9', active: true },
    
    // 금요일 (5)
    { id: 'sch-21', weekday: 5, community_id: 'comm-1', area_id: 'area-3', program_id: 'prog-3', active: true },
    { id: 'sch-22', weekday: 5, community_id: 'comm-2', area_id: 'area-5', program_id: 'prog-5', active: true },
    { id: 'sch-23', weekday: 5, community_id: 'comm-3', area_id: 'area-7', program_id: 'prog-6', active: true },
    { id: 'sch-24', weekday: 5, community_id: 'comm-4', area_id: 'area-10', program_id: 'prog-8', active: true },
    { id: 'sch-25', weekday: 5, community_id: 'comm-4', area_id: 'area-11', program_id: 'prog-9', active: true },
    
    // 토요일 (6)
    { id: 'sch-26', weekday: 6, community_id: 'comm-1', area_id: 'area-1', program_id: 'prog-1', active: true },
    { id: 'sch-27', weekday: 6, community_id: 'comm-3', area_id: 'area-7', program_id: 'prog-6', active: true },
    // 일요일 (0)
    { id: 'sch-28', weekday: 0, community_id: 'comm-4', area_id: 'area-10', program_id: 'prog-8', active: true }
  ],
  attendances: [],
  staffAssignments: [],
  uiTexts: {
    headerSubtitle: '오늘 일정 확인 및 간편 출석',
    communitySelectTitle: '소속 커뮤니티 선택',
    communitySelectSub: '터치하여 이동',
    bannerMainTitle: '자신의 사진이나 이름을 누르면 출석이 완료됩니다!',
    todayProgramTitle: '오늘의 출석 대상 프로그램',
    participantListTitle: '참여자 목록',
    successModalTitle: '출석 완료!',
    successModalDesc: '오늘의 모든 프로그램에 정상 출석되었습니다.',
    ttsGreeting: '출석 완료되었습니다.'
  }
};

class DataStore {
  constructor() {
    this.data = this.loadData();
    this.listeners = [];
    this.sortParticipantsByName();
  }

  sortParticipantsByName(communityId = null) {
    const communityIds = communityId
      ? [communityId]
      : [...new Set((this.data.participants || []).map(p => p.community_id))];
    communityIds.forEach(id => {
      const ordered = (this.data.participants || [])
        .filter(p => p.community_id === id)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      ordered.forEach((participant, index) => { participant.sort_order = index + 1; });
    });
  }

  loadData() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        // 누락된 기본 필드 보정
        return {
          communities: parsed.communities || DEFAULT_DATA.communities,
          areas: parsed.areas || DEFAULT_DATA.areas,
          staffs: parsed.staffs || DEFAULT_DATA.staffs,
          programs: parsed.programs || DEFAULT_DATA.programs,
          participants: parsed.participants || DEFAULT_DATA.participants,
          schedules: parsed.schedules || DEFAULT_DATA.schedules,
          attendances: parsed.attendances || [],
          staffAssignments: parsed.staffAssignments || [],
          uiTexts: { ...DEFAULT_DATA.uiTexts, ...(parsed.uiTexts || {}) }
        };
      }
    } catch (e) {
      console.error('LocalStorage load failed:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  getUiTexts() {
    return { ...DEFAULT_DATA.uiTexts, ...(this.data.uiTexts || {}) };
  }

  saveUiTexts(texts) {
    this.data.uiTexts = { ...this.getUiTexts(), ...texts };
    this.saveData();
    return this.data.uiTexts;
  }

  getCommunityUiTexts(communityId) {
    const comm = this.getCommunityById(communityId);
    const globalUi = this.getUiTexts();
    if (!comm) return globalUi;
    return {
      bannerMainTitle: comm.banner_title || globalUi.bannerMainTitle,
      bannerSubTitle: comm.banner_sub || '오늘의 활동에 즐겁게 참여해 보세요.',
      successModalTitle: comm.success_msg || `${comm.name} 출석 완료!`,
      successModalDesc: comm.success_desc || '오늘의 모든 프로그램에 정상 출석되었습니다.'
    };
  }

  saveCommunityUiTexts(communityId, texts) {
    const comm = this.getCommunityById(communityId);
    if (comm) {
      if (texts.bannerMainTitle !== undefined) comm.banner_title = texts.bannerMainTitle;
      if (texts.bannerSubTitle !== undefined) comm.banner_sub = texts.bannerSubTitle;
      if (texts.successModalTitle !== undefined) comm.success_msg = texts.successModalTitle;
      if (texts.successModalDesc !== undefined) comm.success_desc = texts.successModalDesc;
      this.saveCommunity(comm);
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notifyListeners();
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch(e) { console.error(e); }
    });
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData();
  }

  exportJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.communities || !parsed.participants) {
        throw new Error('유효하지 않은 데이터 백업 파일입니다.');
      }
      this.data = parsed;
      this.saveData();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Helper ID Generator
  genId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  // ----------------------------------------------------
  // 커뮤니티 (Community) CRUD
  // ----------------------------------------------------
  getCommunities(onlyActive = true) {
    let list = this.data.communities || [];
    if (onlyActive) list = list.filter(c => c.active !== false);
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  getCommunityById(id) {
    return this.data.communities.find(c => c.id === id);
  }

  saveCommunity(community) {
    if (!community.id) {
      community.id = this.genId('comm');
      community.active = community.active !== undefined ? community.active : true;
    }
    
    // 순서 자동 밀림 재정렬 (Auto-shift)
    let list = this.data.communities.filter(c => c.id !== community.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    const targetOrder = parseInt(community.sort_order, 10) || (list.length + 1);
    const insertIdx = Math.max(0, Math.min(targetOrder - 1, list.length));
    list.splice(insertIdx, 0, community);
    
    list.forEach((c, idx) => {
      c.sort_order = idx + 1;
    });
    
    this.data.communities = list;
    this.saveData();
    return community;
  }

  deleteCommunity(id) {
    const comm = this.getCommunityById(id);
    if (comm) {
      comm.active = false;
      this.saveData();
    }
  }

  // ----------------------------------------------------
  // 참여자 (Participant) CRUD (★ 순서 자동 밀림 적용)
  // ----------------------------------------------------
  getParticipants(communityId = null, onlyActive = true) {
    let list = this.data.participants || [];
    if (communityId) {
      list = list.filter(p => p.community_id === communityId);
    }
    if (onlyActive) {
      list = list.filter(p => p.active !== false);
    }
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  getParticipantById(id) {
    return this.data.participants.find(p => p.id === id);
  }

  saveParticipant(part) {
    const existing = part.id ? this.data.participants.find(p => p.id === part.id) : null;
    if (part.id && !existing) {
      throw new Error('수정 대상 이용인을 찾을 수 없습니다. 새로고침 후 다시 시도하세요.');
    }
    if (!part.id) {
      const duplicate = this.data.participants.find(p => p.community_id === part.community_id && p.name.trim() === String(part.name || '').trim());
      if (duplicate) throw new Error('같은 커뮤니티에 동일한 이름의 이용인이 있습니다. 기존 이용인을 수정하거나 동명이인인지 확인하세요.');
      part.id = this.genId('part');
      part.active = part.active !== undefined ? part.active : true;
    }
    // 기존 ID 및 다른 속성(사진 파일 ID 등)은 유지한다.
    const updated = existing ? { ...existing, ...part, id: existing.id } : part;
    // 기존 ID를 전체 커뮤니티에서 한 번 제거해야 커뮤니티 이동 시 중복이 생기지 않는다.
    const all = this.data.participants.filter(p => p.id !== updated.id);
    all.push(updated);
    const byCommunity = new Map();
    all.forEach(p => {
      if (!byCommunity.has(p.community_id)) byCommunity.set(p.community_id, []);
      byCommunity.get(p.community_id).push(p);
    });
    byCommunity.forEach(group => {
      group.sort((a,b) => String(a.name||'').localeCompare(String(b.name||''),'ko'));
      group.forEach((p,i) => { p.sort_order=i+1; });
    });
    this.data.participants = all;
    this.saveData();
    return updated;
  }

  deleteParticipant(id) {
    const before = this.data.participants.length;
    this.data.participants = this.data.participants.filter(p => p.id !== id);
    if (this.data.participants.length !== before) this.saveData();
  }

  // ----------------------------------------------------
  // 영역 (Area) CRUD (★ 순서 자동 밀림 적용)
  // ----------------------------------------------------
  getAreas(communityId = null, onlyActive = true) {
    let list = this.data.areas || [];
    if (communityId) {
      list = list.filter(a => a.community_id === communityId);
    }
    if (onlyActive) {
      list = list.filter(a => a.active !== false);
    }
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  getAreaById(id) {
    return this.data.areas.find(a => a.id === id);
  }

  saveArea(area) {
    if (!area.id) {
      area.id = this.genId('area');
      area.active = area.active !== undefined ? area.active : true;
    }

    const commId = area.community_id;
    let sameCommList = this.data.areas
      .filter(a => a.community_id === commId && a.id !== area.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const targetOrder = parseInt(area.sort_order, 10) || (sameCommList.length + 1);
    const insertIdx = Math.max(0, Math.min(targetOrder - 1, sameCommList.length));
    sameCommList.splice(insertIdx, 0, area);

    sameCommList.forEach((a, idx) => {
      a.sort_order = idx + 1;
    });

    const otherList = this.data.areas.filter(a => a.community_id !== commId);
    this.data.areas = [...otherList, ...sameCommList];

    this.saveData();
    return area;
  }

  deleteArea(id) {
    const area = this.getAreaById(id);
    if (!area) return;
    // 영역 및 그 아래 프로그램은 실제 제거. 과거 출석 스냅샷은 보존.
    const programIds = new Set(this.data.programs.filter(p => p.area_id === id).map(p => p.id));
    this.data.areas = this.data.areas.filter(a => a.id !== id);
    this.data.programs = this.data.programs.filter(p => !programIds.has(p.id));
    this.data.schedules = this.data.schedules.filter(s => s.area_id !== id && !programIds.has(s.program_id));
    this.data.staffAssignments = (this.data.staffAssignments || []).filter(s => s.area_id !== id && !programIds.has(s.program_id));
    this.saveData();
  }

  // ----------------------------------------------------
  // 프로그램 (Program) CRUD (★ 순서 자동 밀림 적용)
  // ----------------------------------------------------
  getPrograms(communityId = null, areaId = null, onlyActive = true) {
    let list = this.data.programs || [];
    if (communityId) {
      list = list.filter(p => p.community_id === communityId);
    }
    if (areaId) {
      list = list.filter(p => p.area_id === areaId);
    }
    if (onlyActive) {
      list = list.filter(p => p.active !== false);
    }
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  getProgramById(id) {
    return this.data.programs.find(p => p.id === id);
  }

  saveProgram(prog) {
    if (!prog.id) {
      prog.id = this.genId('prog');
      prog.active = prog.active !== undefined ? prog.active : true;
    }

    const commId = prog.community_id;
    let sameCommList = this.data.programs
      .filter(p => p.community_id === commId && p.id !== prog.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const targetOrder = parseInt(prog.sort_order, 10) || (sameCommList.length + 1);
    const insertIdx = Math.max(0, Math.min(targetOrder - 1, sameCommList.length));
    sameCommList.splice(insertIdx, 0, prog);

    sameCommList.forEach((p, idx) => {
      p.sort_order = idx + 1;
    });

    const otherList = this.data.programs.filter(p => p.community_id !== commId);
    this.data.programs = [...otherList, ...sameCommList];

    this.saveData();
    return prog;
  }

  deleteProgram(id) {
    if (!this.getProgramById(id)) return;
    this.data.programs = this.data.programs.filter(p => p.id !== id);
    this.data.schedules = this.data.schedules.filter(s => s.program_id !== id);
    this.data.staffAssignments = (this.data.staffAssignments || []).filter(s => s.program_id !== id);
    // 출석 데이터는 삭제하지 않음.
    this.saveData();
  }

  // ----------------------------------------------------
  // 담당자 (Staff) CRUD
  // ----------------------------------------------------
  getStaffs(onlyActive = true) {
    let list = this.data.staffs || [];
    if (onlyActive) list = list.filter(s => s.active !== false);
    return list;
  }

  getStaffById(id) {
    return (this.data.staffs || []).find(s => s.id === id);
  }

  saveStaff(staff) {
    if (!this.data.staffs) this.data.staffs = [];
    if (!staff.id) {
      staff.id = this.genId('staff');
      staff.active = staff.active !== undefined ? staff.active : true;
      this.data.staffs.push(staff);
    } else {
      const idx = this.data.staffs.findIndex(s => s.id === staff.id);
      if (idx >= 0) {
        this.data.staffs[idx] = { ...this.data.staffs[idx], ...staff };
      }
    }
    this.saveData();
    return staff;
  }

  deleteStaff(id) {
    if (!this.getStaffById(id)) return;
    this.data.staffs = this.data.staffs.filter(s => s.id !== id);
    // 프로그램은 유지하되 담당자 미배정 처리.
    this.data.programs.forEach(p => { if (p.staff_id === id) p.staff_id = ''; });
    this.data.staffAssignments = (this.data.staffAssignments || []).filter(s => s.staff_id !== id);
    this.saveData();
  }

  // ----------------------------------------------------
  // 주간 요일별 운영 설정 (Schedule) CRUD
  // ----------------------------------------------------
  getSchedules(weekday = null, communityId = null, onlyActive = true) {
    let list = this.data.schedules || [];
    if (weekday !== null && weekday !== undefined) {
      list = list.filter(s => Number(s.weekday) === Number(weekday));
    }
    if (communityId) {
      list = list.filter(s => s.community_id === communityId);
    }
    if (onlyActive) {
      list = list.filter(s => s.active !== false);
    }
    return list;
  }

  saveSchedule(sch) {
    if (![1, 2, 3, 4, 5].includes(Number(sch.weekday))) throw new Error('운영 요일은 월요일부터 금요일까지만 선택할 수 있습니다.');
    if (!sch.id) {
      sch.id = this.genId('sch');
      sch.active = sch.active !== undefined ? sch.active : true;
      this.data.schedules.push(sch);
    } else {
      const idx = this.data.schedules.findIndex(s => s.id === sch.id);
      if (idx >= 0) {
        this.data.schedules[idx] = { ...this.data.schedules[idx], ...sch };
      }
    }
    this.saveData();
    return sch;
  }

  deleteSchedule(id) {
    this.data.schedules = this.data.schedules.filter(s => s.id !== id);
    this.saveData();
  }

  // ----------------------------------------------------
  // 당일 출석 대상 프로그램 조회
  // ----------------------------------------------------
  getTodayProgramsForCommunity(communityId, dateObj = new Date()) {
    const weekday = dateObj.getDay(); // 0(일)~6(토)
    if (weekday === 0 || weekday === 6) return []; // 주말 출석 대상 없음
    const schedules = this.getSchedules(weekday, communityId, true);
    
    const results = [];
    schedules.forEach(sch => {
      const prog = this.getProgramById(sch.program_id);
      if (prog && prog.active !== false) {
        const area = this.getAreaById(sch.area_id || prog.area_id);
        const staff = this.getStaffById(prog.staff_id);
        results.push({
          schedule_id: sch.id,
          program: prog,
          area: area,
          staff: staff
        });
      }
    });

    return results;
  }

  // ----------------------------------------------------
  // 출석 데이터 (Attendance) CRUD & 통계
  // ----------------------------------------------------
  formatDateKey(dateObj = new Date()) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getAttendances({ date = null, communityId = null, participantId = null, month = null } = {}) {
    let list = this.data.attendances || [];
    if (date) {
      list = list.filter(a => a.attendance_date === date);
    }
    if (communityId) {
      list = list.filter(a => a.community_id === communityId);
    }
    if (participantId) {
      list = list.filter(a => a.participant_id === participantId);
    }
    if (month) { // YYYY-MM
      list = list.filter(a => a.attendance_date && a.attendance_date.startsWith(month));
    }
    return list;
  }

  /**
   * 참여자 당일 원클릭 일괄 출석 처리
   * 당일 요일에 설정된 커뮤니티의 모든 출석 대상 프로그램에 출석 기록
   */
  recordParticipantDailyAttendance(participantId, communityId, dateStr = null) {
    const targetDate = dateStr || this.formatDateKey();
    const [year, month, day] = targetDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const todayPrograms = this.getTodayProgramsForCommunity(communityId, dateObj);
    const participant = this.getParticipantById(participantId);

    if (!participant) {
      return { success: false, message: '참여자 정보를 찾을 수 없습니다.' };
    }

    if (todayPrograms.length === 0) {
      return { success: false, message: '오늘 등록된 출석 대상 프로그램이 없습니다.' };
    }

    const nowIso = new Date().toISOString();
    let newlyRecorded = 0;
    let alreadyRecorded = 0;
    const recordedPrograms = [];

    todayPrograms.forEach(item => {
      const prog = item.program;
      const area = item.area;
      const staff = item.staff;

      // 중복 체크 (날짜 + 참여자 + 프로그램 ID)
      const existing = this.data.attendances.find(a => 
        a.attendance_date === targetDate && 
        a.participant_id === participantId && 
        a.program_id === prog.id
      );

      if (existing) {
        alreadyRecorded++;
      } else {
        const newAtt = {
          id: this.genId('att'),
          attendance_date: targetDate,
          community_id: communityId,
          participant_id: participantId,
          participant_name: participant.name,
          area_id: area ? area.id : '',
          area_name: area ? area.name : '',
          program_id: prog.id,
          program_name: prog.name,
          detail_program_name: prog.detail_program_name || prog.name,
          staff_id: staff ? staff.id : (prog.staff_id || ''),
          staff_name: staff ? staff.name : '',
          attendance_status: '출석', // 출석, 지각, 조퇴, 결석, 프로그램취소
          created_at: nowIso,
          updated_at: nowIso,
          updated_by: '참여자(키오스크)'
        };
        this.data.attendances.push(newAtt);
        newlyRecorded++;
        recordedPrograms.push(prog.name);
      }
    });

    this.saveData();

    if (newlyRecorded > 0) {
      return {
        success: true,
        type: 'success',
        participant: participant,
        programs: recordedPrograms,
        totalPrograms: todayPrograms.length,
        message: `${participant.name}님 출석 완료! (${newlyRecorded}개 프로그램)`
      };
    } else {
      return {
        success: true,
        type: 'already',
        participant: participant,
        message: `${participant.name}님은 오늘 이미 모든 프로그램에 출석 완료되었습니다.`
      };
    }
  }

  // 관리자 모드 개별 출석 상태 수정/추가
  saveAttendance(att) {
    const nowIso = new Date().toISOString();
    if (!att.id) {
      att.id = this.genId('att');
      att.created_at = nowIso;
      att.updated_at = nowIso;
      this.data.attendances.push(att);
    } else {
      const idx = this.data.attendances.findIndex(a => a.id === att.id);
      if (idx >= 0) {
        this.data.attendances[idx] = { ...this.data.attendances[idx], ...att, updated_at: nowIso };
      }
    }
    this.saveData();
    return att;
  }

  /**
   * 관리자 모드: 미출석 인원 또는 특정 참여자의 당일 상태를 일괄 설정/수정/삭제
   * status: '출석' | '지각' | '조퇴' | '결석' | '미출석' (미출석 선택 시 당일 출석 기록 삭제)
   */
  setParticipantDailyStatus(participantId, communityId, dateStr, status = '출석') {
    const targetDate = dateStr || this.formatDateKey();
    const [year, month, day] = targetDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const todayPrograms = this.getTodayProgramsForCommunity(communityId, dateObj);
    const participant = this.getParticipantById(participantId);

    if (!participant) {
      return { success: false, message: '참여자를 찾을 수 없습니다.' };
    }

    if (status === '미출석' || status === '삭제') {
      // 당일 해당 참여자의 출석 기록 삭제
      this.data.attendances = this.data.attendances.filter(a => 
        !(a.attendance_date === targetDate && a.participant_id === participantId)
      );
      this.saveData();
      return { success: true, message: `${participant.name}님의 ${targetDate} 출석 기록이 취소(미출석)되었습니다.` };
    }

    if (todayPrograms.length === 0) {
      return { success: false, message: '해당 날짜/요일에 배정된 프로그램 일정이 없습니다.' };
    }

    const nowIso = new Date().toISOString();

    todayPrograms.forEach(item => {
      const prog = item.program;
      const area = item.area;
      const staff = item.staff;

      const existingIdx = this.data.attendances.findIndex(a => 
        a.attendance_date === targetDate && 
        a.participant_id === participantId && 
        a.program_id === prog.id
      );

      if (existingIdx >= 0) {
        this.data.attendances[existingIdx].attendance_status = status;
        this.data.attendances[existingIdx].updated_at = nowIso;
        this.data.attendances[existingIdx].updated_by = '관리자(수동지정)';
      } else {
        const newAtt = {
          id: this.genId('att'),
          attendance_date: targetDate,
          community_id: communityId,
          participant_id: participantId,
          participant_name: participant.name,
          area_id: area ? area.id : '',
          area_name: area ? area.name : '',
          program_id: prog.id,
          program_name: prog.name,
          detail_program_name: area ? area.name : prog.name,
          staff_id: staff ? staff.id : (prog.staff_id || ''),
          staff_name: staff ? staff.name : '',
          attendance_status: status,
          created_at: nowIso,
          updated_at: nowIso,
          updated_by: '관리자(수동등록)'
        };
        this.data.attendances.push(newAtt);
      }
    });

    this.saveData();
    return { success: true, message: `${participant.name}님의 상태가 '${status}'(으)로 등록되었습니다.` };
  }

  deleteAttendance(id) {
    this.data.attendances = this.data.attendances.filter(a => a.id !== id);
    this.saveData();
  }

  // ----------------------------------------------------
  // 담당자 주간 파트 배분표 CRUD
  // ----------------------------------------------------
  getStaffAssignments() {
    return this.data.staffAssignments || [];
  }

  saveStaffAssignment(assignment) {
    if (!assignment.id) {
      assignment.id = this.genId('assign');
      this.data.staffAssignments.push(assignment);
    } else {
      const idx = this.data.staffAssignments.findIndex(s => s.id === assignment.id);
      if (idx >= 0) {
        this.data.staffAssignments[idx] = { ...this.data.staffAssignments[idx], ...assignment };
      }
    }
    this.saveData();
    return assignment;
  }

  deleteStaffAssignment(id) {
    this.data.staffAssignments = this.data.staffAssignments.filter(s => s.id !== id);
    this.saveData();
  }

  // ----------------------------------------------------
  // 월별 개인 출석률 통계 계산 로직
  // 공식: 출석률 = 실제 출석 횟수 ÷ 실제 운영된 출석 대상 횟수 × 100
  // (프로그램 취소·휴관 등 미운영 일정은 분모에서 제외)
  // ----------------------------------------------------
  calculateMonthlyStats(yearMonth, communityId = null) {
    // yearMonth: 'YYYY-MM'
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 대상 참여자
    const participants = this.getParticipants(communityId, true);
    const communities = this.getCommunities(false);
    const commMap = Object.fromEntries(communities.map(c => [c.id, c.name]));

    const monthlyAttendances = this.getAttendances({ month: yearMonth, communityId });

    const stats = participants.map(part => {
      const partCommId = part.community_id;
      
      // 해당 월 동안 이 참여자에게 예정되었던 총 프로그램 횟수 계산
      let expectedCount = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month - 1, d);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        const scheds = this.getSchedules(dayOfWeek, partCommId, true);
        expectedCount += scheds.length;
      }

      // 실제 출석 기록
      const partAtts = monthlyAttendances.filter(a => a.participant_id === part.id);
      const attendedCount = partAtts.filter(a => a.attendance_status === '출석' || a.attendance_status === '지각' || a.attendance_status === '조퇴').length;
      const absentCount = partAtts.filter(a => a.attendance_status === '결석').length;
      const canceledCount = partAtts.filter(a => a.attendance_status === '프로그램취소').length;

      // 실제 운영된 출석 대상 횟수 = 예정 횟수 - 취소 횟수
      const actualOperatedCount = Math.max(expectedCount - canceledCount, attendedCount);
      const rate = actualOperatedCount > 0 ? ((attendedCount / actualOperatedCount) * 100).toFixed(1) : '0.0';

      return {
        participant_id: part.id,
        participant_name: part.name,
        community_id: partCommId,
        community_name: commMap[partCommId] || '미정',
        expected_count: actualOperatedCount,
        attended_count: attendedCount,
        absent_count: absentCount,
        attendance_rate: `${rate}%`
      };
    });

    return stats;
  }
}

// 전역 인스턴스 생성
window.appStore = new DataStore();
