const SB_URL="https://tunjhzdeslsliixoepep.supabase.co";
const SB_KEY="sb_publishable_9d8zAa-nMttJp0n02SyOhg_rvK3ypv-";
const BUCKET="space-participations";
const db=window.supabase?supabase.createClient(SB_URL,SB_KEY):null;
const $=id=>document.getElementById(id), arabic=n=>Number(n||0).toLocaleString("ar-SA");
let current=JSON.parse(localStorage.getItem("space_user")||"null");
let localRecords=JSON.parse(localStorage.getItem("space_records")||"[]");
let allParticipants=[], selectedPart=null, assembled=new Set(), ship={x:5,y:45}, collected=new Set(), quizCorrect=new Set(), lang="ar";

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function requireUser(){if(current)return true;alert("أصدري تصريح المهمة أولًا حتى يُسجل إنجازك باسمك.");$("mission").scrollIntoView({behavior:"smooth"});return false}
function getLocalCurrent(){return current?localRecords.find(x=>x.id===current.id):null}
function mark(action){
 if(!requireUser())return;
 let r=getLocalCurrent();
 if(!r){r={...current,actions:[]};localRecords.push(r)}
 if(!r.actions.includes(action))r.actions.push(action);
 localStorage.setItem("space_records",JSON.stringify(localRecords));
 syncCurrent(); renderPassport(); loadParticipants();
}
async function syncCurrent(){
 if(!db||!current)return;
 let r=getLocalCurrent(); if(!r)return;
 try{await db.from("space_participants").upsert({id:r.id,name:r.name,grade:r.grade,actions:r.actions},{onConflict:"id"})}catch(e){console.warn(e)}
}

$("registerBtn").addEventListener("click",async()=>{
 let name=$("studentName").value.trim(), grade=$("grade").value;
 if(!name||!grade){alert("اكتبي الاسم واختاري الصف.");return}
 current={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name,grade};
 localRecords.push({...current,actions:[]});
 localStorage.setItem("space_user",JSON.stringify(current)); localStorage.setItem("space_records",JSON.stringify(localRecords));
 await syncCurrent(); renderPassport(); loadParticipants();
});
function renderPassport(){
 let r=getLocalCurrent();
 if(!r){$("passport").classList.add("hidden");return}
 $("passport").classList.remove("hidden");
 const map={design:"🎨 التصميم",assembly:"🧩 المجسم",launch:"🚀 الإطلاق",simulation:"🛰️ المحاكاة",challenge:"🧠 التحدي",upload:"📸 الصورة"};
 $("passport").innerHTML=`<b>👩‍🚀 رائدة الفضاء: ${esc(r.name)}</b><br><span>${esc(r.grade)}</span><div class="badges">${Object.entries(map).map(([k,v])=>`<span>${r.actions.includes(k)?"✓ ":"○ "}${v}</span>`).join("")}</div>`;
}

function initStars(){
 const c=$("starCanvas"),ctx=c.getContext("2d"); let stars=[];
 function size(){c.width=c.clientWidth*devicePixelRatio;c.height=c.clientHeight*devicePixelRatio;stars=Array.from({length:100},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*2*devicePixelRatio,a:Math.random()}))}
 function draw(){ctx.clearRect(0,0,c.width,c.height);stars.forEach(s=>{s.a+=.01;ctx.globalAlpha=.25+.5*Math.abs(Math.sin(s.a));ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(draw)}
 size();window.addEventListener("resize",size);draw()
} initStars();

$("rocketName").addEventListener("input",e=>$("rocketLabel").textContent=e.target.value||"صاروخي");
$("bodyColor").addEventListener("input",e=>$("rocketBody").style.fill=e.target.value);
$("noseColor").addEventListener("input",e=>$("rocketNose").style.fill=e.target.value);
$("wingColor").addEventListener("input",e=>{$("rocketLeftWing").style.fill=e.target.value;$("rocketRightWing").style.fill=e.target.value});
$("windowColor").addEventListener("input",e=>$("rocketWindow").style.fill=e.target.value);
$("saveDesign").addEventListener("click",()=>{mark("design");$("saveDesign").textContent="✓ تم حفظ إنجاز التصميم"});

function placePart(part,slot){
 if(!part||part!==slot||assembled.has(part))return;
 assembled.add(part); let el=document.querySelector(`[data-slot="${part}"]`),btn=document.querySelector(`[data-part="${part}"]`);
 el.classList.add("filled"); el.textContent=({nose:"▲",body:"▮",left:"◢",right:"◣",engine:"🔥"})[part]; btn.classList.add("placed","selected");
 if(assembled.size===5){$("assemblyMsg").textContent="🚀 اكتمل مجسم الصاروخ! أحسنتِ.";mark("assembly")}
}
document.querySelectorAll(".part").forEach(btn=>{
 btn.draggable=true;
 btn.addEventListener("click",()=>{document.querySelectorAll(".part").forEach(x=>x.classList.remove("selected"));selectedPart=btn.dataset.part;btn.classList.add("selected")});
 btn.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",btn.dataset.part));
});
document.querySelectorAll(".slot").forEach(slot=>{
 slot.addEventListener("click",()=>placePart(selectedPart,slot.dataset.slot));
 slot.addEventListener("dragover",e=>e.preventDefault());
 slot.addEventListener("drop",e=>{e.preventDefault();placePart(e.dataTransfer.getData("text/plain"),slot.dataset.slot)});
});
$("resetAssembly").addEventListener("click",()=>{assembled.clear();selectedPart=null;document.querySelectorAll(".slot").forEach(x=>{x.classList.remove("filled");x.textContent=x.dataset.slot==="body"?"الجسم":x.dataset.slot==="engine"?"المحرك":x.dataset.slot==="nose"?"المقدمة":"جناح"});document.querySelectorAll(".part").forEach(x=>x.classList.remove("placed","selected"));$("assemblyMsg").textContent="اختاري قطعة ثم اضغطي مكانها الصحيح، أو اسحبيها إليه."});

let launching=false;
$("launchBtn").addEventListener("click",async()=>{
 if(launching)return;if(!requireUser())return;launching=true;
 const scene=$("launchScene");scene.className="";$("launchVehicle").style.transform="";$("countdown").textContent="10";
 for(let i=10;i>=1;i--){$("countdown").textContent=i;$("launchStage").textContent=`العد التنازلي: ${i}`;await new Promise(r=>setTimeout(r,420))}
 $("countdown").textContent="LIFTOFF!";$("launchStage").textContent="🔥 اشتعال المحركات";scene.classList.add("ignite");await new Promise(r=>setTimeout(r,800));
 scene.classList.add("ascend");$("launchStage").textContent="🚀 الإقلاع والصعود";await new Promise(r=>setTimeout(r,1600));
 scene.classList.add("separate");$("launchStage").textContent="✨ انفصال المرحلة الداعمة";await new Promise(r=>setTimeout(r,1200));
 $("launchStage").textContent="🌍 الوصول إلى المدار — إطلاق ناجح!";mark("launch");launching=false;
});

function updateShip(){
 $("ship").style.left=ship.x+"%";$("ship").style.top=ship.y+"%";
 document.querySelectorAll(".simStar").forEach(st=>{
  if(collected.has(st.dataset.star))return;
  let sx=parseFloat(st.style.left),sy=parseFloat(st.style.top);
  if(Math.abs(ship.x-sx)<8&&Math.abs(ship.y-sy)<10){collected.add(st.dataset.star);st.classList.add("collected");$("starCount").textContent=`${arabic(collected.size)} / ٣`;$("simMessage").textContent=collected.size<3?"⭐ ممتاز! تابعي جمع النجوم.":"الآن توجهي إلى محطة الفضاء ◎"}
 });
 if(collected.size===3&&ship.x>82&&ship.y>32&&ship.y<65){$("simMessage").textContent="🛰️ تم الالتحام بالمحطة بنجاح!";mark("simulation")}
}
document.querySelectorAll("[data-move]").forEach(b=>b.addEventListener("click",()=>{
 if(!requireUser())return;let m=b.dataset.move;if(m==="right")ship.x+=7;if(m==="left")ship.x-=7;if(m==="up")ship.y-=7;if(m==="down")ship.y+=7;ship.x=Math.max(1,Math.min(88,ship.x));ship.y=Math.max(5,Math.min(82,ship.y));updateShip()
}));

const questions=[
 ["ما الذي يجعل بيئة الفضاء مختلفة عن الأرض؟",["تتوافر فيها كل ظروف الحياة نفسها","لا تتوافر فيها ظروف الحياة الأرضية المعتادة","لأنها مليئة بالأشجار"],1],
 ["أي نشاط من أنشطة الدليل؟",["تصميم وتلوين وتركيب نموذج صاروخ","سباق سيارات","إعداد وصفة طعام"],0],
 ["أي مثال يمثل تقنية فضائية؟",["الأقمار الصناعية والمركبات","الدفتر فقط","المقعد"],0],
 ["ما الفكرة المرتبطة بالمركبة الفضائية؟",["تصميمها والتفكير في أجزائها ووظائفها","عدم وجود أجزاء لها","استخدامها في البحر"],0],
 ["من الأسماء السعودية المذكورة في الأدلة؟",["ريانة برناوي وعلي القرني","أسماء غير مرتبطة بالنشاط","لا يوجد رواد سعوديون"],0],
 ["ما النشاط الفني المتعلق بالكواكب؟",["رسم كوكب أتمنى زيارته وذكر السبب","رسم سيارة","كتابة جدول الضرب"],0]
];
$("quiz").innerHTML=questions.map((q,i)=>`<article class="quizCard"><b>${i+1}. ${q[0]}</b>${q[1].map((a,j)=>`<button data-q="${i}" data-a="${j}">${a}</button>`).join("")}</article>`).join("");
$("quiz").addEventListener("click",e=>{
 let b=e.target.closest("button[data-q]");if(!b)return;let i=+b.dataset.q,j=+b.dataset.a,correct=questions[i][2];b.parentElement.querySelectorAll("button").forEach(x=>x.disabled=true);
 if(j===correct){b.classList.add("correct");quizCorrect.add(i)}else{b.classList.add("wrong");b.parentElement.querySelector(`[data-a="${correct}"]`).classList.add("correct")}
 if(quizCorrect.size===questions.length){$("quizResult").textContent="🏆 خبيرة فضاء! أجبتِ جميع الأسئلة إجابة صحيحة.";mark("challenge")}
});

const rocketSVG=`<svg viewBox="0 0 300 520"><path d="M150 28 C105 75 95 115 95 145 L205 145 C205 115 195 75 150 28Z" fill="none" stroke="#000" stroke-width="5"/><path d="M95 145 H205 V360 Q150 400 95 360Z" fill="none" stroke="#000" stroke-width="5"/><circle cx="150" cy="205" r="32" fill="none" stroke="#000" stroke-width="5"/><path d="M95 260 L45 345 L100 330Z M205 260 L255 345 L200 330Z" fill="none" stroke="#000" stroke-width="5"/></svg>`;
window.printActivity=type=>{
 const info={
  color:["لوّن صاروخك",rocketSVG,"لوّني أجزاء الصاروخ بألوانك المفضلة."],
  cut:["قصّ وركّب الصاروخ",`<div class="cutparts">△ &nbsp; ▯ &nbsp; ◢ &nbsp; ◣ &nbsp; 🔥</div>`,"لوّني القطع ثم قصّيها وركّبي منها صاروخًا."],
  future:["صمّم صاروخ المستقبل",`<div style="font-size:130px">🚀</div>`,"ارسمي صاروخ المستقبل واكتبي فكرة واحدة تميز تصميمك."],
  model:["مجسم صاروخي ورقي",`<div class="cutparts">△<br>▯ &nbsp; ◢ &nbsp; ◣<br>🔥</div>`,"قصّي الأجزاء وركّبي نموذجًا ورقيًا."],
  vehicle:["صمّم مركبة فضائية",`<div style="font-size:130px">🛰️</div>`,"صممي مركبتك وحددي جزءًا منها واكتبي وظيفته."],
  planet:["الكوكب الذي أتمنى زيارته",`<div style="font-size:130px">🪐</div>`,"ارسمي الكوكب واكتبي لماذا تتمنين زيارته."]
 }[type];
 $("printArea").innerHTML=`<div class="sheet"><h1>أسبوع الفضاء العالمي ٢٠٢٦</h1><h2>${info[0]}</h2><p>الاسم: ____________________ &nbsp;&nbsp; الصف: __________</p><p>${info[2]}</p><div class="work">${info[1]}</div><div class="lines">فكرتي / ملاحظتي:</div><div class="lines"></div><p>الابتدائية والمتوسطة الأولى بصخيبرة – قطاع الحناكية</p></div>`;window.print()
};

$("uploadBtn").addEventListener("click",async()=>{
 if(!requireUser())return;let f=$("photoInput").files[0],status=$("uploadStatus");
 if(!f){status.textContent="اختاري صورة أولًا.";return}if(!f.type.startsWith("image/")){status.textContent="الملف يجب أن يكون صورة.";return}if(f.size>5*1024*1024){status.textContent="الحد الأقصى للصورة 5MB.";return}
 status.textContent="جارٍ رفع المشاركة…";
 try{
  let path=`${current.id}/${Date.now()}-${f.name.replace(/[^\w.\-]/g,"_")}`;
  let up=await db.storage.from(BUCKET).upload(path,f,{upsert:false});if(up.error)throw up.error;
  let url=db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  let ins=await db.from("space_gallery").insert({participant_id:current.id,name:current.name,grade:current.grade,activity:$("activityType").value,image_url:url});if(ins.error)throw ins.error;
  status.textContent="✓ تم رفع المشاركة إلى المعرض.";mark("upload");loadGallery()
 }catch(e){console.error(e);status.textContent="تعذر الرفع. تأكدي أن Bucket space-participations وسياسات Supabase تم إنشاؤها."}
});
async function loadGallery(){
 if(!db)return;
 try{let {data,error}=await db.from("space_gallery").select("*").order("created_at",{ascending:false}).limit(60);if(error)throw error;
 $("photoGallery").innerHTML=data.length?data.map(x=>`<article class="photoCard"><img src="${esc(x.image_url)}" loading="lazy"><b>${esc(x.name)}</b><small>${esc(x.grade)} • ${esc(x.activity)}</small></article>`).join(""):`<p>بانتظار أول مشاركة مصورة…</p>`;
 }catch(e){$("photoGallery").innerHTML="<p>المعرض جاهز وسيظهر المحتوى بعد أول رفع ناجح.</p>"}
}
async function loadParticipants(){
 let remote=[];
 if(db){try{let r=await db.from("space_participants").select("*").order("created_at",{ascending:true});if(!r.error)remote=r.data||[]}catch(e){}}
 allParticipants=remote.length?remote:localRecords;
 renderPioneers();renderDashboard()
}
function renderPioneers(){
 let term=$("pioneerSearch").value.trim(),gf=$("gradeFilter").value;
 let list=allParticipants.filter(x=>(!term||x.name.includes(term))&&(!gf||x.grade===gf));
 const labels={design:"🎨 تصميم",assembly:"🧩 مجسم",launch:"🚀 إطلاق",simulation:"🛰️ محاكاة",challenge:"🧠 تحدي",upload:"📸 صورة"};
 $("pioneerGallery").innerHTML=list.length?list.map(x=>`<article class="pioneerCard"><div class="pioneerIcon">👩‍🚀</div><b>رائدة الفضاء: ${esc(x.name)}</b><small>${esc(x.grade)}</small><div class="badges">${(x.actions||[]).map(a=>labels[a]?`<span>${labels[a]}</span>`:"").join("")}</div></article>`).join(""):"<p>لا توجد نتائج بعد.</p>"
}
$("pioneerSearch").addEventListener("input",renderPioneers);$("gradeFilter").addEventListener("change",renderPioneers);
function renderDashboard(){
 let p=allParticipants||[],count=a=>p.filter(x=>(x.actions||[]).includes(a)).length,total=p.reduce((s,x)=>s+(x.actions||[]).length,0);
 $("mParticipants").textContent=arabic(p.length);$("mLaunches").textContent=arabic(count("launch"));$("mBuilds").textContent=arabic(count("design")+count("assembly"));$("mSims").textContent=arabic(count("simulation"));$("mQuiz").textContent=arabic(count("challenge"));$("mPhotos").textContent=arabic(count("upload"));
 let last=p[p.length-1];$("liveTicker").textContent=last?`🚀 ${last.name} • ${last.grade} • ${(last.actions||[]).length} إنجازات مسجلة`:"🚀 مركز القيادة جاهز لاستقبال أول مهمة.";
 $("impactGrid").innerHTML=`<article><b>${arabic(p.length)}</b>رائدة فضاء</article><article><b>${arabic(count("launch"))}</b>إطلاق ناجح</article><article><b>${arabic(count("assembly"))}</b>مجسم مكتمل</article><article><b>${arabic(total)}</b>إجمالي الإنجازات</article>`
}
$("langBtn").addEventListener("click",()=>{
 lang=lang==="ar"?"en":"ar";document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";$("langBtn").textContent=lang==="ar"?"English":"العربية";
 document.querySelectorAll("[data-ar]").forEach(el=>el.textContent=lang==="ar"?el.dataset.ar:el.dataset.en)
});
renderPassport();loadParticipants();loadGallery();