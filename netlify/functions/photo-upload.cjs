const {json,valid}=require('./_auth.cjs');
exports.handler=async(event)=>{
  if(!valid(event))return json(401,{error:'직원 로그인이 필요합니다.'});
  if(event.httpMethod!=='POST')return json(405,{error:'POST 요청만 가능합니다.'});
  let input;
  try{input=JSON.parse(event.body||'{}')}catch{return json(400,{error:'요청 형식 오류'})}
  if(!['image/jpeg','image/png','image/webp'].includes(input.mimeType))return json(400,{error:'지원하지 않는 이미지 형식'});
  const match=typeof input.dataUrl==='string'&&input.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!match||match[1]!==input.mimeType||match[2].length>2800000)return json(400,{error:'2MB 이하의 유효한 이미지가 필요합니다.'});
  const url=process.env.SHEETS_WEB_APP_URL,secret=process.env.SHEETS_API_SECRET;
  if(!url||!secret)return json(503,{error:'Apps Script 연동 설정이 없습니다.'});
  try{
    const r=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'uploadPhoto',secret,mimeType:input.mimeType,base64:match[2],participantId:input.participantId||'',fileName:String(input.fileName||'photo').slice(0,120)}),redirect:'follow',signal:AbortSignal.timeout(55000)});
    const body=await r.text();let data;
    try{data=JSON.parse(body)}catch{return json(502,{error:'Apps Script 응답을 읽을 수 없습니다.'})}
    return json(r.ok&&data.ok?200:502,data);
  }catch(e){return json(502,{error:'사진 업로드 연결 실패: '+e.message})}
};
