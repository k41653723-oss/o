const crypto=require('node:crypto');
const {json,valid,sign,cookie}=require('./_auth.cjs');
exports.handler=async(event)=>{
 if(event.httpMethod==='GET')return json(200,{authenticated:valid(event)});
 if(event.httpMethod!=='POST')return json(405,{error:'허용되지 않은 요청'});
 if(!process.env.STAFF_PASSWORD||!process.env.SESSION_SECRET)return json(503,{error:'서버 환경변수가 설정되지 않았습니다.'});
 let password='';try{password=JSON.parse(event.body||'{}').password||''}catch{return json(400,{error:'요청 오류'})}
 const a=crypto.createHash('sha256').update(password).digest(),b=crypto.createHash('sha256').update(process.env.STAFF_PASSWORD).digest();
 if(!crypto.timingSafeEqual(a,b))return json(401,{error:'비밀번호가 올바르지 않습니다.'});
 const exp=String(Date.now()+8*60*60*1000);
 return json(200,{authenticated:true},{'set-cookie':cookie(`${exp}.${sign(exp)}`,8*60*60)});
};
