const {json}=require('./_auth.cjs');
const upstream=async(payload)=>{
 const url=process.env.SHEETS_WEB_APP_URL,secret=process.env.SHEETS_API_SECRET;
 if(!url||!secret)throw Error('Google Sheets 환경변수가 누락되었습니다.');
 const r=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,secret}),redirect:'follow',signal:AbortSignal.timeout(25000)});
 const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Google Sheets 요청 실패');return d;
};
const visible=d=>({communities:d.communities||[],areas:d.areas||[],programs:d.programs||[],staffs:d.staffs||[],schedules:d.schedules||[],uiTexts:d.uiTexts||{},participants:(d.participants||[]).filter(x=>x.active!==false).map(x=>({id:x.id,name:x.name,community_id:x.community_id,photo_url:x.photo_url,avatar_color:x.avatar_color,active:x.active,sort_order:x.sort_order})),attendances:(d.attendances||[]).map(x=>({id:x.id,attendance_date:x.attendance_date,community_id:x.community_id,participant_id:x.participant_id,program_id:x.program_id,attendance_status:x.attendance_status})),staffAssignments:[]});
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return json(405,{error:'POST 요청만 가능합니다.'});
 let req;try{req=JSON.parse(event.body||'{}')}catch{return json(400,{error:'요청 형식 오류'})}
 try{
  if(req.action==='load'){const v=await upstream({action:'loadPublic'});return json(200,{ok:true,revision:v.revision,attendanceRevision:v.attendanceRevision,data:visible(v.data)});}
  if(req.action==='checkin'){
   if(typeof req.participantId!=='string'||typeof req.communityId!=='string'||req.participantId.length>120||req.communityId.length>120)return json(400,{error:'잘못된 출석 요청'});
   return json(200,await upstream({action:'checkin',participantId:req.participantId,communityId:req.communityId}));
  }
  return json(400,{error:'지원하지 않는 작업'});
 }catch(e){return json(502,{error:e.message})}
};
