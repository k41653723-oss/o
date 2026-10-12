const {json,valid}=require('./_auth.cjs');
exports.handler=async(event)=>{
  if(!valid(event))return json(401,{ok:false,error:'관리자 인증이 필요합니다.'});
  if(event.httpMethod!=='POST')return json(405,{ok:false,error:'POST 요청만 가능합니다.'});
  let input;
  try{input=JSON.parse(event.body||'{}')}catch{return json(400,{ok:false,error:'잘못된 요청 형식'})}
  const action=input.action;
  if(!['listDrivePhotos','selectDrivePhoto'].includes(action))return json(400,{ok:false,error:'지원하지 않는 작업'});
  const url=process.env.SHEETS_WEB_APP_URL,secret=process.env.SHEETS_API_SECRET;
  if(!url||!secret)return json(503,{ok:false,error:'Google 연동 설정이 없습니다.'});
  try{
    const response=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action,secret,folderId:String(input.folderId||''),fileId:String(input.fileId||'')}),
      redirect:'follow',signal:AbortSignal.timeout(55000)});
    const output=await response.text();let data;
    try{data=JSON.parse(output)}catch{return json(502,{ok:false,error:'Google 응답을 읽지 못했습니다.'})}
    return json(response.ok&&data.ok?200:502,data);
  }catch(e){return json(502,{ok:false,error:'Google Drive 연결 실패: '+e.message})}
};
