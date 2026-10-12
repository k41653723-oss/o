const {json,valid}=require('./_auth.cjs');
exports.handler=async(event)=>{
 if(!valid(event))return json(401,{error:'로그인이 필요합니다.'});
 if(event.httpMethod!=='POST')return json(405,{error:'허용되지 않은 요청'});
 const url=process.env.SHEETS_WEB_APP_URL,secret=process.env.SHEETS_API_SECRET;
 if(!url||!secret)return json(503,{error:'구글시트 연결 설정이 없습니다.'});
 let input;try{input=JSON.parse(event.body||'{}')}catch{return json(400,{error:'요청 형식 오류'})}
 if(!['load','save'].includes(input.action))return json(400,{error:'지원하지 않는 동작'});
 if(input.action==='save'&&(!Number.isInteger(input.revision)||!input.data||!Array.isArray(input.data.participants)||!Array.isArray(input.data.attendances)))return json(400,{error:'저장 데이터 형식 오류'});
 try{
  const response=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({...input,secret}),redirect:'follow',signal:AbortSignal.timeout(25000)});
  const body=await response.text();let parsed;try{parsed=JSON.parse(body)}catch{return json(502,{error:'Apps Script 응답이 JSON이 아닙니다. 웹 앱 접근 권한과 배포 버전을 확인하세요.'})}
  return json(response.ok?200:502,parsed);
 }catch(e){return json(502,{error:'구글시트 연결 실패: '+e.message})}
};
