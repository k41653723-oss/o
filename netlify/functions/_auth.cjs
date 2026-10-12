const crypto=require('node:crypto');
const json=(statusCode,data,extra={})=>({statusCode,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra},body:JSON.stringify(data)});
const sign=(v)=>crypto.createHmac('sha256',process.env.SESSION_SECRET||'').update(v).digest('hex');
const valid=(event)=>{const raw=(event.headers.cookie||event.headers.Cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('staff_session='))?.slice(14);if(!raw||!process.env.SESSION_SECRET)return false;const [exp,sig]=raw.split('.');if(!/^\d+$/.test(exp)||Number(exp)<Date.now()||!sig)return false;const correct=sign(exp);return sig.length===correct.length&&crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(correct));};
const cookie=(value,maxAge)=>`staff_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
module.exports={json,valid,sign,cookie};
