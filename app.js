(()=>{"use strict";
const SB_URL="https://tunjhzdeslsliixoepep.supabase.co";
const SB_KEY="sb_publishable_9d8zAa-nMttJp0n02SyOhg_rvK3ypv-";
const db=window.supabase?window.supabase.createClient(SB_URL,SB_KEY):null;
const $=x=>document.getElementById(x), ar=n=>Number(n||0).toLocaleString("ar-SA");
let users=[], current=JSON.parse(localStorage.getItem("spaceCurrent")||"null");
let selected=null,built=new Set(),busy=false,pos={x:4,y:46},got=new Set(),correct=new Set();
const labels={color:"🎨 تلوين",build:"🧩 مجسم",launch:"🚀 إطلاق",fly:"🛰️ قيادة",quiz:"🧠 تحدي"};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function localFallback(){try{return JSON.parse(localStorage.getItem("spaceFallback")||"[]")}catch{return[]}}
function saveFallback(a){localStorage.setItem("spaceFallback",JSON.stringify(a))}
function currentUser(){return current&&users.find(x=>String(x.id)===String(current.id))}
function need(){if(currentUser())return true;alert("أدخلي اسمك أولًا حتى نسجل إنجازك.");$("pass").scrollIntoView({behavior:"smooth"});return false}

async function loadUsers(){
 let loaded=false;
 if(db){
  try{
   const {data,error}=await db.from("space_participants").select("*").order("created_at",{ascending:true});
   if(!error&&data){users=data.map(x=>({...x,done:Array.isArray(x.actions)?x.actions:[]}));loaded=true}
  }catch(e){console.warn("Supabase read:",e)}
 }
 if(!loaded)users=localFallback();
 render();
}

async function persist(u){
 localStorage.setItem("spaceCurrent",JSON.stringify({id:u.id,name:u.name,grade:u.grade}));
 let fb=localFallback(),i=fb.findIndex(x=>String(x.id)===String(u.id));
 if(i>=0)fb[i]=u;else fb.push(u);saveFallback(fb);
 if(db){
  const payload={id:String(u.id),name:u.name,grade:u.grade,actions:u.done};
  const {error}=await db.from("space_participants").upsert(payload,{onConflict:"id"});
  if(error)console.warn("Supabase save:",error);
 }
}

async function award(a){
 if(!need())return;
 let u=currentUser(); if(!u.done.includes(a))u.done.push(a);
 await persist(u); await loadUsers();
}

function render(){
 let u=currentUser();
 $("badge").innerHTML=u?`👩‍🚀 <b>${esc(u.name)}</b> • ${esc(u.grade)}<div class="chips">${Object.entries(labels).map(([k,v])=>`<span>${u.done.includes(k)?"✓":"○"} ${v}</span>`).join("")}</div>`:"أدخلي اسمك أولًا حتى تُحفظ شاراتك في لوحة الإنجاز.";
 $("sPeople").textContent=ar(users.length);
 $("sBuild").textContent=ar(users.filter(x=>x.done.includes("build")).length);
 $("sLaunch").textContent=ar(users.filter(x=>x.done.includes("launch")).length);
 $("sFly").textContent=ar(users.filter(x=>x.done.includes("fly")).length);
 $("sQuiz").textContent=ar(users.filter(x=>x.done.includes("quiz")).length);
 $("live").textContent=users.length?`🚀 آخر رائدة فضاء: ${esc(users[users.length-1].name)} • ${users[users.length-1].done.length} شارات`:"🚀 النظام جاهز لأول مهمة.";
 $("pioneers").innerHTML=users.length?users.map(x=>`<article class="pioneer"><div class="avatar">👩‍🚀</div><b>${esc(x.name)}</b><p>${esc(x.grade)}</p><div class="chips">${x.done.map(d=>`<span>${labels[d]||esc(d)}</span>`).join("")}</div></article>`).join(""):"بانتظار أول رائدة فضاء…";
}

$("register").onclick=async()=>{
 let n=$("name").value.trim(),g=$("grade").value;if(!n||!g)return alert("اكتبي الاسم واختاري الصف.");
 current={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name:n,grade:g};
 let u={...current,done:[]};users.push(u);await persist(u);await loadUsers();
};

// live coloring
$("cBody").oninput=e=>$("body").style.fill=e.target.value;
$("cNose").oninput=e=>$("nose").style.fill=e.target.value;
$("cWindow").oninput=e=>$("window").style.fill=e.target.value;
$("cWing").oninput=e=>{$("wingL").style.fill=e.target.value;$("wingR").style.fill=e.target.value};
$("rname").oninput=e=>$("rocketTitle").textContent=e.target.value||"صاروخي";
$("doneColor").onclick=async()=>{await award("color");$("doneColor").textContent="✓ تم حفظ شارة التلوين"};

// builder: touch/click + drag
document.querySelectorAll(".piece").forEach(p=>{
 p.draggable=true;
 p.onclick=()=>{document.querySelectorAll(".piece").forEach(x=>x.classList.remove("active"));selected=p.dataset.piece;p.classList.add("active")};
 p.ondragstart=e=>e.dataTransfer.setData("text/plain",p.dataset.piece);
});
async function place(part,slot){
 if(!part||part!==slot||built.has(part))return;
 built.add(part);
 let s=document.querySelector(`[data-slot="${part}"]`),p=document.querySelector(`[data-piece="${part}"]`);
 s.classList.add("done");s.textContent={nose:"▲",body:"▮",left:"◢",right:"◣",engine:"🔥"}[part];p.classList.add("used");
 if(built.size===5){$("buildMsg").textContent="🚀 اكتمل المجسم! حصلتِ على شارة مهندسة الصواريخ.";await award("build")}
}
document.querySelectorAll(".slot").forEach(s=>{
 s.onclick=()=>place(selected,s.dataset.slot);
 s.ondragover=e=>e.preventDefault();
 s.ondrop=e=>{e.preventDefault();place(e.dataTransfer.getData("text/plain"),s.dataset.slot)}
});
$("resetBuild").onclick=()=>{
 selected=null;built.clear();
 document.querySelectorAll(".piece").forEach(x=>x.classList.remove("active","used"));
 document.querySelectorAll(".slot").forEach(x=>{x.classList.remove("done");x.textContent=x.dataset.slot==="nose"?"المقدمة":x.dataset.slot==="body"?"الجسم":x.dataset.slot==="engine"?"المحرك":"جناح"});
 $("buildMsg").textContent="ابدئي بالمقدمة أو بأي قطعة تريدين.";
};

// launch
$("launch").onclick=async()=>{
 if(busy||!need())return;busy=true;let sky=$("sky");sky.className="";$("vehicle").style.transform="";
 for(let i=10;i>0;i--){$("counter").textContent=i;$("phase").textContent="العد التنازلي "+i;await new Promise(r=>setTimeout(r,300))}
 $("counter").textContent="LIFTOFF";sky.classList.add("ignition");$("phase").textContent="🔥 اشتعال المحركات";await new Promise(r=>setTimeout(r,700));
 sky.classList.add("launching");$("phase").textContent="🚀 الإقلاع والصعود";await new Promise(r=>setTimeout(r,1300));
 sky.classList.add("separated");$("phase").textContent="✨ انفصال المرحلة الداعمة";await new Promise(r=>setTimeout(r,1500));
 $("phase").textContent="🌍 وصل الصاروخ إلى المدار — نجحت المهمة!";await award("launch");busy=false;
};

// flight game
const stars=[{el:document.querySelector(".st1"),x:28,y:20,id:1},{el:document.querySelector(".st2"),x:53,y:68,id:2},{el:document.querySelector(".st3"),x:70,y:27,id:3}];
async function move(){
 $("ship").style.left=pos.x+"%";$("ship").style.top=pos.y+"%";
 stars.forEach(s=>{if(!got.has(s.id)&&Math.abs(pos.x-s.x)<9&&Math.abs(pos.y-s.y)<11){got.add(s.id);s.el.classList.add("got");$("starsGot").textContent=`${ar(got.size)} / ٣`;$("gameMsg").textContent=got.size===3?"الآن توجهي إلى المحطة ◎":"⭐ التقطتِ نجمة!"}});
 if(got.size===3&&pos.x>82&&pos.y>32&&pos.y<65){$("gameMsg").textContent="🛰️ تم الالتحام بالمحطة! نجحت المحاكاة.";await award("fly")}
}
document.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>{
 if(!need())return;let d=b.dataset.dir;
 if(d==="right")pos.x+=7;if(d==="left")pos.x-=7;if(d==="up")pos.y-=7;if(d==="down")pos.y+=7;
 pos.x=Math.max(1,Math.min(88,pos.x));pos.y=Math.max(4,Math.min(84,pos.y));move();
});

// quiz
const Q=[
 ["أي نشاط تنفذينه في مختبر الصاروخ؟",["تلوين وتركيب نموذج صاروخ","سباق سيارة","طبخ"],0],
 ["ما مثال تقنية فضائية؟",["الأقمار الصناعية والمركبات","الكرسي","السبورة"],0],
 ["ماذا تفعلين في محاكاة المركبة؟",["تقودين المركبة وتجمعين النجوم","تكتبين فقط","لا يحدث شيء"],0],
 ["من الأسماء السعودية الواردة في محتوى النشاط؟",["ريانة برناوي وعلي القرني","لا يوجد","أسماء خيالية"],0]
];
$("quiz").innerHTML=Q.map((q,i)=>`<div class="q"><b>${q[0]}</b>${q[1].map((a,j)=>`<button data-q="${i}" data-a="${j}">${a}</button>`).join("")}</div>`).join("");
$("quiz").onclick=async e=>{
 let b=e.target.closest("[data-q]");if(!b)return;let i=+b.dataset.q,j=+b.dataset.a,c=Q[i][2];
 b.parentElement.querySelectorAll("button").forEach(x=>x.disabled=true);
 if(j===c){b.classList.add("ok");correct.add(i)}else{b.classList.add("no");b.parentElement.querySelector(`[data-a="${c}"]`).classList.add("ok")}
 if(correct.size===Q.length){$("quizMsg").textContent="🏆 ممتاز! أصبحتِ خبيرة فضاء.";await award("quiz")}
};

// printables
const rocket=`<svg viewBox="0 0 300 520"><path d="M150 22 C108 67 94 110 96 150 H204 C206 110 192 67 150 22Z M96 150 H204 V355 Q150 400 96 355Z M96 255 L42 350 L101 329Z M204 255 L258 350 L199 329Z" fill="none" stroke="#000" stroke-width="5"/><circle cx="150" cy="210" r="31" fill="none" stroke="#000" stroke-width="5"/></svg>`;
const sheets={color:["لوّن صاروخك",rocket],cut:["قصّي وركّبي الصاروخ","△ &nbsp; ▯ &nbsp; ◢ &nbsp; ◣ &nbsp; 🔥"],future:["صاروخ المستقبل","🚀"],vehicle:["مركبتي الفضائية","🛰️"],planet:["الكوكب الذي أتمنى زيارته","🪐"],model:["مجسم صاروخي ورقي","△<br>▯ &nbsp; ◢ &nbsp; ◣<br>🔥"]};
document.querySelectorAll("[data-print]").forEach(b=>b.onclick=()=>{
 let s=sheets[b.dataset.print];
 $("printArea").innerHTML=`<div class="sheet"><h1>أسبوع الفضاء العالمي ٢٠٢٦</h1><h2>${s[0]}</h2><p>الاسم: ____________________ &nbsp; الصف: ________</p><div class="work">${s[1]}</div><p>فكرتي / ملاحظتي: ____________________________________________</p><p>الابتدائية والمتوسطة الأولى بصخيبرة – قطاع الحناكية</p></div>`;
 window.print();
});

$("lang").onclick=()=>alert("واجهة الألعاب العربية مفعّلة بالكامل.");

const BUCKET="space-participations";
let adminMode=false;
// This is a lightweight UI gate, not strong authentication.
// Database DELETE policies still determine whether deletion is allowed.
const ADMIN_CODE="2026";

async function loadWorks(){
 if(!db){$("worksGallery").innerHTML="<p>تعذر الاتصال بالمعرض.</p>";return}
 try{
  const {data,error}=await db.from("space_gallery").select("*").order("created_at",{ascending:false});
  if(error)throw error;
  $("galleryCount").textContent=ar(data.length);
  $("worksGallery").innerHTML=data.length?data.map(x=>`<article class="workCard" data-id="${x.id}" data-url="${esc(x.image_url)}"><button class="deleteWork" title="حذف">🗑️</button><img src="${esc(x.image_url)}" loading="lazy" alt="عمل ${esc(x.name)}"><div class="workMeta"><b>${esc(x.name)}</b><small>${esc(x.grade)} • ${esc(x.activity)}</small></div></article>`).join(""):"<p>بانتظار أول عمل في المعرض 🚀</p>";
  $("worksGallery").classList.toggle("adminMode",adminMode);
 }catch(e){console.warn(e);$("worksGallery").innerHTML="<p>تعذر تحميل المعرض حاليًا.</p>"}
}

$("galleryUpload").onclick=async()=>{
 let name=$("galleryName").value.trim(),grade=$("galleryGrade").value,activity=$("galleryActivity").value,file=$("galleryFile").files[0];
 if(!name||!grade||!activity||!file){$("galleryStatus").textContent="أكملي الاسم والصف ونوع العمل واختاري الصورة.";return}
 if(!file.type.startsWith("image/")){$("galleryStatus").textContent="اختاري ملف صورة فقط.";return}
 if(file.size>5*1024*1024){$("galleryStatus").textContent="حجم الصورة كبير؛ الحد الأقصى ٥ ميجابايت.";return}
 $("galleryUpload").disabled=true;$("galleryStatus").textContent="جارٍ رفع العمل…";
 try{
  const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-zA-Z0-9]/g,"");
  const path=`gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const up=await db.storage.from(BUCKET).upload(path,file,{cacheControl:"3600",upsert:false});
  if(up.error)throw up.error;
  const pub=db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const ins=await db.from("space_gallery").insert({participant_id:current?.id||null,name,grade,activity,image_url:pub});
  if(ins.error){await db.storage.from(BUCKET).remove([path]);throw ins.error}
  $("galleryStatus").textContent="✓ أضيف العمل إلى معرض رواد الفضاء.";
  $("galleryFile").value="";await loadWorks();
 }catch(e){console.error(e);$("galleryStatus").textContent="تعذر رفع العمل. تحققي من اتصال Supabase وسياسات التخزين."}
 finally{$("galleryUpload").disabled=false}
};

$("adminToggle").onclick=()=>{
 if(adminMode){adminMode=false;$("adminState").textContent="";$("worksGallery").classList.remove("adminMode");return}
 const code=prompt("أدخلي رمز إدارة المعرض:");
 if(code===ADMIN_CODE){adminMode=true;$("adminState").textContent="وضع الإدارة مفعّل";$("worksGallery").classList.add("adminMode")}else if(code!==null){alert("رمز الإدارة غير صحيح.")}
};

$("worksGallery").onclick=async e=>{
 const btn=e.target.closest(".deleteWork");if(!btn||!adminMode)return;
 const card=btn.closest(".workCard"),id=card.dataset.id,url=card.dataset.url;
 const nm=card.querySelector(".workMeta b")?.textContent||"هذه المشاركة";
 if(!confirm(`هل تريدين حذف مشاركة ${nm}؟`))return;
 btn.disabled=true;
 try{
  const del=await db.from("space_gallery").delete().eq("id",id);
  if(del.error)throw del.error;
  // Best effort: remove the storage object too.
  const token=`/${BUCKET}/`;
  const idx=url.indexOf(token);
  if(idx>=0){
   const path=decodeURIComponent(url.slice(idx+token.length));
   const rem=await db.storage.from(BUCKET).remove([path]);
   if(rem.error)console.warn("Storage remove:",rem.error);
  }
  await loadWorks();
 }catch(e){console.error(e);alert("تعذر الحذف. يلزم السماح بالحذف في سياسات Supabase للمشرفة.")}
};

loadWorks();
loadUsers();
})();