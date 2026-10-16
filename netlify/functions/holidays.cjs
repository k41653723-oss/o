// 공식 한국천문연구원 공휴일 정보 API를 중계합니다. 인증키는 서버 환경변수에서만 사용합니다.
const {json} = require('./_auth.cjs');
exports.handler = async event => {
  if (event.httpMethod !== 'GET') return json(405,{ok:false,error:'GET 요청만 가능합니다.'});
  const year = String(event.queryStringParameters?.year || '');
  if (!/^(19|20|21)\d{2}$/.test(year)) return json(400,{ok:false,error:'연도 형식이 올바르지 않습니다.'});
  const key = process.env.KOREA_HOLIDAY_API_KEY;
  if (!key || key.startsWith('여기에_')) return json(503,{ok:false,error:'Netlify .env에 KOREA_HOLIDAY_API_KEY를 입력해주세요.'});
  try {
    const endpoint = new URL('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo');
    endpoint.searchParams.set('serviceKey',key);
    endpoint.searchParams.set('solYear',year);
    endpoint.searchParams.set('numOfRows','150');
    endpoint.searchParams.set('pageNo','1');
    endpoint.searchParams.set('_type','json');
    const response = await fetch(endpoint,{signal:AbortSignal.timeout(18000)});
    if (!response.ok) throw Error('공휴일 API HTTP '+response.status);
    const raw = await response.text();
    let payload;
    try {payload = JSON.parse(raw)} catch {throw Error('공휴일 API가 JSON을 반환하지 않았습니다. 인증키 또는 API 권한을 확인해주세요.')}
    const header = payload?.response?.header;
    if (!header || String(header.resultCode) !== '00') throw Error('공휴일 API 오류: '+(header?.resultMsg||'응답 형식 오류'));
    const body = payload.response.body || {};
    let rows = body.items?.item || [];
    if (!Array.isArray(rows)) rows = [rows];
    if (body.totalCount && rows.length < Number(body.totalCount)) throw Error('공휴일 정보가 일부만 수신되었습니다.');
    const dates = [...new Set(rows.filter(row=>String(row.isHoliday)==='Y')
      .map(row=>String(row.locdate||''))
      .filter(d=>new RegExp('^'+year+'\\d{4}$').test(d))
      .map(d=>d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8)))].sort();
    if (dates.length < 8) throw Error('해당 연도의 공휴일 자료가 부족하거나 아직 공개되지 않았습니다.');
    return {statusCode:200,headers:{'content-type':'application/json;charset=utf-8','cache-control':'public, max-age=3600, s-maxage=21600'},body:JSON.stringify({ok:true,year,dates,source:'한국천문연구원 공휴일 API'})};
  } catch(error) {return json(502,{ok:false,error:error.message||'공휴일 조회 실패'})}
};
