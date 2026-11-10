'use strict';
/* ---------- helpers & storage ---------- */
const $=s=>document.querySelector(s);
const K={diet:'bonecare_diet_history',rec:'bonecare_recovery',meta:'bonecare_recovery_meta',set:'bonecare_settings',act:'bonecare_activity',th:'bonecare_theme'};
const rd=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'?v:f}catch{return f}};
let HC=null;
const wr=(k,v)=>{if(k===K.diet)HC=null;try{localStorage.setItem(k,JSON.stringify(v))}catch{alert('Could not save: browser storage unavailable or full.')}};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dt=s=>new Date(s+'T00:00:00');
const addD=(s,n)=>{const d=dt(s);d.setDate(d.getDate()+n);return iso(d)};
const TODAY=()=>iso(new Date());
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=t=>{const[h,m]=(t||'00:00').split(':');return `${(+h)%12||12}:${m} ${+h<12?'AM':'PM'}`};
const r1=x=>Math.round(x*10)/10;
const pc=(v,t)=>+t>0?Math.round(v/t*100):0;
const N=a=>({kcal:a[0],p:a[1],ca:a[2],fe:a[3],d:a[4],c:a[5],carb:a[6],fat:a[7],chol:a[8]||0,sodium:a[9]||0,potassium:a[10]||0});
const NUT=[['kcal','Calories','kcal'],['p','Protein','g'],['ca','Calcium','mg'],['fe','Iron','mg'],['d','Vitamin D','mcg'],['c','Vitamin C','mg'],['carb','Carbohydrates','g'],['fat','Fats','g'],['chol','Cholesterol','mg'],['sodium','Sodium','mg'],['potassium','Potassium','mg']];

/* approximate nutrition for a standard serving: kcal, protein g, calcium mg, iron mg, vit D mcg, vit C mg, carbs g, fat g */
const FOODS=[
['Milk (toned)','ml',200,[120,6.4,240,.1,1,2,9.5,6]],['Curd','cup',1,[90,5,180,.1,0,1,7,5]],['Paneer','g',50,[132,9,100,.2,0,0,1.5,10]],
['Ragi porridge','cup',1,[150,3,130,1.5,0,0,30,1]],['Sesame seeds (til)','tbsp',1,[52,1.6,88,1.3,0,0,2,4.5]],['Almonds','pcs',5,[35,1.3,19,.2,0,0,1.2,3]],
['Drumstick leaves','cup',1,[13,1.8,40,.8,0,11,2,.2]],['Egg (boiled)','pcs',2,[156,12.6,50,1.8,2,0,1.1,10.6]],['Dal (cooked)','cup',1,[200,12,60,3.3,0,2,30,3]],
['Chickpeas (cooked)','cup',1,[270,14,80,4.7,0,2,45,4]],['Rajma (cooked)','cup',1,[225,15,50,3.9,0,2,40,1]],['Soya chunks (dry)','g',30,[100,15,100,4,0,0,10,.5]],
['Chicken (cooked)','g',100,[165,31,15,1,.1,0,0,3.6,85,74,256]],['Mutton (cooked, lean)','g',100,[250,26,18,2,.2,0,0,15,80,70,320]],['Protein powder (33 g scoop)','serving',1,[125,24,120,0,0,0,4,0,4,140,200]],['Fish (cooked)','g',100,[140,22,40,.5,5,0,0,5]],['Dates (khajoor)','pcs',3,[165,1.2,30,.9,0,0,44,.1]],
['Amla','pcs',1,[20,.3,10,.2,0,240,4.5,.1]],['Guava','pcs',1,[68,2.6,18,.3,0,228,14,1]],['Banana','pcs',1,[105,1.3,6,.3,0,10,27,.4]],
['Green vegetables (cooked)','cup',1,[50,3,80,2,0,30,8,.5]],['Cucumber, carrot & beetroot salad (one each)','serving',1,[100,3,45,1.3,0,12,23,.5]],['Sweet corn (one medium cob)','pcs',1,[100,3.5,2,.5,0,6,22,1.5]],['Rice (cooked)','cup',1,[200,4,10,.5,0,0,45,.4]],['Roasted peanuts','g',30,[170,7.7,20,.7,0,0,5,14]],
['Sattu drink','cup',1,[105,6,20,1.5,0,0,18,1.5]],['Jaggery (gur)','g',10,[38,0,8,.1,0,0,9.7,0]],['Lemon water','cup',1,[10,0,5,0,0,20,3,0]]
].map(([name,unit,qty,a])=>({name,unit,qty,n:N(a)}));
/* default daily timetable (your original foods) */
const LUNCH_CHOICES=[
  {id:'veg',label:'Vegetarian',name:'Rice + dal + vegetables + curd (vegetarian)',n:N([540,24,330,5.9,0,33,90,9])},
  {id:'chicken',label:'Chicken 150 g',name:'Rice + vegetables + chicken (150 g cooked)',n:N([498,53.5,112.5,4,.15,30,53,6.3,128,111,384])},
  {id:'mutton',label:'Mutton 150 g',name:'Rice + vegetables + mutton (150 g cooked)',n:N([625,46,117,5.5,.3,30,53,23.4,124,105,480])}
];
const DINNER_CHOICES=[
  {id:'veg',label:'Vegetarian',name:'Moong dal khichdi + vegetables (vegetarian)',n:N([330,12,60,3,0,10,55,6])},
  {id:'chicken',label:'Chicken 150 g',name:'Rice + vegetables + chicken (150 g cooked)',n:N([498,53.5,112.5,4,.15,30,53,6.3,128,111,384])},
  {id:'mutton',label:'Mutton 150 g',name:'Rice + vegetables + mutton (150 g cooked)',n:N([625,46,117,5.5,.3,30,53,23.4,124,105,480])}
];
const DEF=[
['08:00','Milk (toned, 200 ml) + protein powder (1 scoop, 33 g)','serving',1,[245,30.4,360,.1,1,2,13.5,6,4,140,200]],
['09:30','2 boiled eggs + Ragi porridge','serving',1,[306,15.6,180,3.3,2,0,31,11.6]],
['11:30','Amla or Guava','pcs',1,[44,1.5,14,.3,0,234,9.8,.5]],
['13:30',LUNCH_CHOICES[0].name,'plate',1,[540,24,330,5.9,0,33,90,9],LUNCH_CHOICES],
['13:30','Cucumber + carrot + beetroot salad (one each)','serving',1,[100,3,45,1.3,0,12,23,.5]],
['16:00','2–3 Dates (Khajoor) + 5 Almonds','serving',1,[200,2.5,50,1.1,0,0,45,3.5]],
['16:30','Sweet corn (one medium cob)','pcs',1,[100,3.5,2,.5,0,6,22,1.5]],
['18:30','Milk (toned)','ml',200,[120,6.4,240,.1,1,2,9.5,6]],
['20:30',DINNER_CHOICES[0].name,'plate',1,[330,12,60,3,0,10,55,6],DINNER_CHOICES]
].map(([time,name,unit,qty,a,choices])=>({time,name,unit,qty,n:N(a),...(choices?{choices,selectedChoice:'veg'}:{})}));
const DT={kcal:2200,p:60,ca:1000,fe:8,d:15,c:75,carb:'',fat:'',chol:'',sodium:'',potassium:'',water:2500};
const cfg=()=>({...DT,...rd(K.set,{})});

/* ---------- date-wise records ---------- */
const hist=()=>HC||(HC=rd(K.diet,{}));
const isSaved=d=>!!hist()[d];
function getDay(d){ // load a day (or an unsaved default copy of the timetable; nothing is written until you change something)
  const x=hist()[d];
  const clean=(m,i)=>({id:m.id||`meal-${d}-${i}`,name:m.name||'Food',qty:+m.qty||1,unit:m.unit||'serving',time:m.time||'12:00',n:{...N([0,0,0,0,0,0,0,0]),...(m.n||{})},status:['taken','skipped'].includes(m.status)?m.status:'pending',note:m.note||'',reason:m.reason||'',...(Array.isArray(m.choices)?{choices:m.choices.map(c=>({...c,n:{...c.n}})),selectedChoice:m.selectedChoice||m.choices[0]?.id}:{})});
  if(x&&Array.isArray(x.meals))return{...x,meals:x.meals.map(clean),water:+x.water||0};
  return{meals:DEF.map((m,i)=>clean({...m,n:{...m.n}},i)),water:0,sun:false,clinic:false};
}
function saveDay(d,day){day.nutrition=totals(day);day.completionPercentage=stats(day).pct;const h=hist();h[d]=day;wr(K.diet,h)}
function totals(day){const t={kcal:0,p:0,ca:0,fe:0,d:0,c:0,carb:0,fat:0,chol:0,sodium:0,potassium:0};day.meals.forEach(m=>{if(m.status==='taken')for(const k in t)t[k]+=+m.n[k]||0});for(const k in t)t[k]=r1(t[k]);return t} // only TAKEN counts
function stats(day){const t=day.meals.length,tk=day.meals.filter(m=>m.status==='taken').length,sk=day.meals.filter(m=>m.status==='skipped').length;return{t,tk,sk,pe:t-tk-sk,pct:t?Math.round(tk/t*100):0}}
function isLogged(d){const x=hist()[d];return d<=TODAY()&&!!x&&((x.meals||[]).some(m=>m.status==='taken'||m.status==='skipped')||x.water>0)}
function log(m){const a=rd(K.act,[]);a.unshift({t:Date.now(),m:`${m} (${S.date})`});wr(K.act,a.slice(0,15))}
function mut(fn,msg){const day=getDay(S.date);fn(day);saveDay(S.date,day);if(msg)log(msg);render()}

/* ---------- state ---------- */
const VIEWS=['dash','diet','nut','rec','set'];
let S={date:TODAY(),view:'dash'},CH={},MM=null,base=null,logMode=false,bs=null;
const readHash=()=>{const v=location.hash.slice(1);S.view=VIEWS.includes(v)?v:'dash'};

/* ---------- shared UI pieces ---------- */
const bar=p=>`<div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:8px"><div class="progress-bar ${p>100?'bg-info':'bg-success'}" style="width:${Math.min(p,100)}%"></div></div><small>${p}%</small></div>`;
const RF=`<div class="alert alert-danger"><b><i class="bi bi-exclamation-triangle-fill"></i> Emergency clinical red flags</b> – contact your orthopaedic doctor or seek urgent medical assessment if you notice:<ul class="mb-1"><li>Toes turning blue or pale, or feeling unusually cold</li><li>Numbness, tingling, or inability to move your toes</li><li>Severe or worsening pain, or increasing swelling</li><li>POP becoming excessively tight, cracked, loose or wet</li></ul><small><b>POP care:</b> keep it dry and intact, do not push objects inside or trim it, and follow your doctor's instructions on elevation, movement and weight-bearing.</small></div>`;
const INFO='25-year-old male · Left-foot injury after slipping while running · POP slab · BPK Lotus Hospital, Orthopaedics. Diagnosis is whatever your orthopaedic doctor confirms.';
function mealRow(m,fut){
  const b=[['taken','Taken','success'],['skipped','Skipped','danger'],['pending','Pending','warning']].map(([s,l,c])=>`<button class="btn btn-${m.status===s?'':'outline-'}${c}" ${fut?'disabled':''} data-a="st" data-id="${m.id}" data-v="${s}">${l}</button>`).join('');
  const choices=Array.isArray(m.choices)?`<div class="btn-group btn-group-sm mt-2" role="group" aria-label="Choose one meal option">${m.choices.map(c=>`<button class="btn btn-${m.selectedChoice===c.id?'success':'outline-success'}" data-a="choice" data-id="${m.id}" data-v="${esc(c.id)}" aria-pressed="${m.selectedChoice===c.id}" ${fut||m.status==='taken'?'disabled':''}>${esc(c.label)}</button>`).join('')}</div><div class="small text-secondary">${m.status==='taken'?'Choice locked because this meal is marked Taken. Set Pending to change it.':'Choose one option; rice is included with both non-vegetarian options.'}</div>`:'';
  const details=`${m.qty} ${esc(m.unit)} · ≈${Math.round(m.n.kcal)} kcal · P ${m.n.p}g · Ca ${m.n.ca}mg · Fe ${m.n.fe}mg`;
  const extra=[['Carbs',m.n.carb,'g'],['Chol',m.n.chol,'mg'],['Sodium',m.n.sodium,'mg'],['Potassium',m.n.potassium,'mg']].filter(([,v])=>+v>0).map(([l,v,u])=>`${l} ${v}${u}`).join(' · ');
  return `<div class="meal st-${m.status}"><div class="mt">${fmt(m.time)}</div><div class="mi"><b>${esc(m.name)}</b><div class="small text-secondary">${details}</div>${extra?`<div class="small text-secondary">${extra}</div>`:''}${choices}${m.note?`<div class="small fst-italic">📝 ${esc(m.note)}</div>`:''}${m.status==='skipped'?`<input class="form-control form-control-sm mt-1" placeholder="Reason for skipping (optional)" value="${esc(m.reason)}" data-c="reason" data-id="${m.id}">`:''}</div><div class="ma"><div class="btn-group btn-group-sm">${b}</div><button class="btn btn-sm btn-light" data-a="edit" data-id="${m.id}" title="Edit"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-light text-danger" data-a="del" data-id="${m.id}" title="Delete"><i class="bi bi-trash"></i></button></div></div>`;
}
const futNote=f=>f?'<div class="alert alert-info py-2 small">Planning day: you can edit foods, but Taken/Skipped can only be set for today or past dates.</div>':'';
const waterCard=(day,c,fut)=>`<div class="c mb-3"><h6><i class="bi bi-droplet-half text-primary"></i> Water: ${day.water||0} / ${c.water} ml</h6>${bar(pc(day.water||0,c.water))}<div class="d-flex flex-wrap gap-2 mt-2"><button class="btn btn-sm btn-outline-primary" ${fut?'disabled':''} data-a="water" data-v="250">+250 ml</button><button class="btn btn-sm btn-outline-primary" ${fut?'disabled':''} data-a="water" data-v="500">+500 ml</button><button class="btn btn-sm btn-outline-secondary" ${fut?'disabled':''} data-a="water" data-v="-250">−250 ml</button><input type="number" min="0" class="form-control form-control-sm" style="width:130px" placeholder="Set total ml" ${fut?'disabled':''} data-c="water"></div></div>`;

/* ---------- views ---------- */
function vDash(day,fut){
  const c=cfg(),t=totals(day),s=stats(day),r=rd(K.rec,{})[S.date],A=rd(K.act,[]);
  const observed=hasRecoveryObservations(r);
  const mini=[['ca','Calcium','mg'],['p','Protein','g'],['fe','Iron','mg'],['d','Vitamin D','mcg'],['c','Vitamin C','mg']].map(([k,l,u])=>`<div class="mb-2"><div class="d-flex justify-content-between small"><span>${l}</span><span>${t[k]} / ${c[k]} ${u}</span></div>${bar(pc(t[k],c[k]))}</div>`).join('');
  return `<h4 class="mb-1">Welcome back 👋</h4><p class="text-secondary small">${INFO}</p>${futNote(fut)}
  <div class="row g-3 mb-3">
   <div class="col-6 col-lg-3"><div class="c stat"><small>Diet completion</small><h3>${s.pct}%</h3>${bar(s.pct)}</div></div>
   <div class="col-6 col-lg-3"><div class="c stat"><small>Meals</small><h5><span class="text-success">${s.tk} taken</span> · <span class="text-danger">${s.sk} skipped</span></h5><small>${s.pe} pending of ${s.t}</small></div></div>
   <div class="col-6 col-lg-3"><div class="c stat"><small>Water</small><h3>${day.water||0} ml</h3><small>Target ${c.water} ml</small></div></div>
   <div class="col-6 col-lg-3"><div class="c stat"><small>Pain · POP</small><h5>${observed?r.pain+'/10':'Not logged'}</h5><small>${observed?esc(r.pop):'POP: not logged'}</small></div></div></div>
  <div class="row g-3"><div class="col-lg-7"><div class="c"><h6>Nutrition from foods marked Taken (approximate)</h6>${mini}<small class="text-secondary">General references only – not a fracture-specific prescription.</small></div></div>
  <div class="col-lg-5"><div class="c mb-3"><h6>Quick actions</h6><div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-primary" ${fut?'disabled':''} data-a="water" data-v="250"><i class="bi bi-droplet"></i> +250 ml</button><a class="btn btn-sm btn-success" href="#diet"><i class="bi bi-calendar-check"></i> Diet</a><button class="btn btn-sm btn-outline-success" data-a="log"><i class="bi bi-plus-lg"></i> Log food</button><a class="btn btn-sm btn-outline-primary" href="#rec"><i class="bi bi-bandaid"></i> Recovery</a></div></div>
  <div class="c mb-3"><h6>Meal status</h6><div class="cs"><div class="cw" style="min-width:0;height:170px"><canvas id="cMeal"></canvas></div></div></div>${RF}
  <div class="c"><h6>Recent activity</h6>${A.length?A.slice(0,6).map(a=>`<div class="small border-bottom py-1">${esc(a.m)} <span class="text-secondary">· ${new Date(a.t).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>`).join(''):'<p class="small text-secondary mb-0">No activity yet.</p>'}</div></div></div>`;
}
function vDiet(day,fut){
  const s=stats(day),meals=[...day.meals].sort((a,b)=>a.time.localeCompare(b.time));
  const sec=(title,ic,f,extra='')=>{const l=meals.filter(f);return `<div class="sec"><h6><i class="bi ${ic}"></i> ${title}</h6>${l.length?l.map(m=>mealRow(m,fut)).join(''):'<p class="small text-secondary">No foods in this slot.</p>'}${extra}</div>`};
  const card=(t,body)=>`<div class="c mb-2 small">${body}</div>`;
  return `<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2"><h4 class="mb-0">🦴 Fracture Healing Daily Tracker</h4><div class="d-flex gap-2"><button class="btn btn-success btn-sm" data-a="add"><i class="bi bi-plus-lg"></i> Add food</button><button class="btn btn-outline-danger btn-sm" data-a="delDay"><i class="bi bi-trash"></i> Delete this date's record</button></div></div>
  <p class="text-secondary small">Your daily budget-friendly nutrition &amp; clinical recovery guide. Nutritional values are approximate.</p>${futNote(fut)}
  <details class="c mb-3"><summary class="fw-semibold"><i class="bi bi-clipboard2-heart text-success"></i> Nutrition plan · for discussion with your clinician</summary><div class="mt-3">
  <p class="small mb-2"><b>Protein powder:</b> the label values you provided for one 33 g scoop are 125 kcal, protein 24 g, carbohydrate 4 g, cholesterol 4 mg, calcium 120 mg, sodium 140 mg and potassium 200 mg. The scheduled morning drink adds 200 ml toned milk; its nutrients are additional and vary by brand.</p>
  <p class="small mb-2"><b>Lunch and dinner:</b> choose exactly one option at each meal. The chicken or mutton option is served <b>with rice</b> and vegetables. Once the meal is marked Taken, the options lock to prevent counting both; change it back to Pending if you need to correct your selection.</p>
  <p class="small mb-2"><b>Produce:</b> have one cucumber, one carrot and one beetroot as a washed salad with lunch; have one cooked sweet-corn cob as the afternoon snack. Estimates depend on produce size and preparation.</p>
  <p class="small mb-2"><b>Clinical note:</b> this is a general food schedule, not an individualized fracture-healing prescription. Confirm protein powder, portions and any kidney-related, allergy, diabetes or other dietary restrictions with your doctor or dietitian. Nutrition supports general health but cannot guarantee bone union.</p>
  <small class="text-secondary">References: <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer">USDA FoodData Central</a> (approximate food values); <a href="https://ods.od.nih.gov/factsheets/Calcium-Consumer/" target="_blank" rel="noopener noreferrer">NIH Office of Dietary Supplements: Calcium</a>; <a href="https://ods.od.nih.gov/factsheets/VitaminD-Consumer/" target="_blank" rel="noopener noreferrer">NIH Office of Dietary Supplements: Vitamin D</a>.</small></div></details>
  <div class="c mb-2"><div class="d-flex flex-wrap gap-3 mb-2"><span><b>${s.t}</b> meals</span><span class="text-success"><b>${s.tk}</b> taken</span><span class="text-danger"><b>${s.sk}</b> skipped</span><span class="text-warning"><b>${s.pe}</b> pending</span><span><b>${s.pct}%</b> completion</span></div>${bar(s.pct)}</div>
  ${sec('Morning &amp; Breakfast','bi-sunrise',m=>m.time<'11:00')}
  ${sec('Mid-Morning Vitamin C','bi-brightness-high',m=>m.time>='11:00'&&m.time<'12:00')}
  <div class="sec"><h6><i class="bi bi-sun"></i> Natural Sunlight Exposure</h6>${card('',`Vitamin D is made when bare skin is exposed to direct outdoor sunlight. Sitting behind a window glass is <b>not</b> an effective source because glass blocks UVB. Ask your doctor how much sun is suitable for you and whether a supplement or vitamin D test is needed.<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="sun" ${day.sun?'checked':''} ${fut?'disabled':''} data-c="sun"><label class="form-check-label" for="sun">Got outdoor sunlight today</label></div>`)}</div>
  ${sec('Afternoon &amp; Lunch','bi-sun',m=>m.time>='12:00'&&m.time<'15:00')}
  <div class="sec"><h6><i class="bi bi-clipboard2-pulse"></i> Clinical Check</h6>${card('',`Follow your orthopaedic doctor's instructions about elevation and toe movement. Check toe colour, warmth, sensation, swelling and the POP, and record them in the <a href="#rec">Recovery Tracker</a>.<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="cl" ${day.clinic?'checked':''} ${fut?'disabled':''} data-c="clinic"><label class="form-check-label" for="cl">Clinical check done</label></div>`)}</div>
  ${sec('Evening Snack &amp; Dinner','bi-moon-stars',m=>m.time>='15:00')}
  <div class="sec"><h6><i class="bi bi-exclamation-triangle"></i> Emergency Clinical Red Flags</h6>${RF}</div>
  <div class="c small"><b>Things to limit:</b> very salty or processed snacks (high sodium increases calcium lost in urine). Colas and sugary fizzy drinks are not proven to directly remove calcium from bones, but they can replace milk and other nutritious drinks. No food guarantees bone healing; healing is guided by your doctor.</div>`;
}
function vNut(day,fut){
  const c=cfg(),t=totals(day),sl=isLogged(S.date),any=[...Array(7)].some((_,i)=>isLogged(addD(S.date,i-6)));
  const rows=NUT.map(([k,l,u])=>{const tg=+c[k]||0;return `<tr><td>${l}</td><td>${t[k]} ${u}</td><td>${tg?tg+' '+u:'–'}</td><td>${tg?r1(Math.max(tg-t[k],0))+' '+u:'–'}</td><td style="min-width:140px">${tg?bar(pc(t[k],tg)):'<small class="text-secondary">No target</small>'}</td></tr>`}).join('');
  const grp=(title,cl,st)=>{const l=day.meals.filter(m=>m.status===st).sort((a,b)=>a.time.localeCompare(b.time));return `<div class="c mb-3"><h6 class="text-${cl}">${title} (${l.length})</h6>${l.length?l.map(m=>mealRow(m,fut)).join(''):'<p class="small text-secondary mb-0">None</p>'}</div>`};
  const ch=(id,title,ok)=>`<div class="col-lg-6"><div class="c h-100"><h6>${title}</h6>${ok?`<div class="cs"><div class="cw"><canvas id="${id}"></canvas></div></div>`:'<p class="text-secondary small mb-0">No logged data for this period yet.</p>'}</div></div>`;
  return `<div class="d-flex justify-content-between align-items-center mb-2"><h4 class="mb-0">Daily Nutrition Tracker</h4><button class="btn btn-success btn-sm" data-a="log"><i class="bi bi-plus-lg"></i> Log food</button></div>${futNote(fut)}
  <div class="c mb-3"><h6>Totals from foods marked Taken (approximate)</h6><div class="table-responsive"><table class="table table-sm align-middle mb-0"><thead><tr><th>Nutrient</th><th>Consumed</th><th>Target</th><th>Remaining</th><th>Completion</th></tr></thead><tbody>${rows}</tbody></table></div>
  <small class="text-secondary">Skipped and pending foods are excluded. Percentages are not capped. Reference: calcium ≈1,000 mg, iron ≈8 mg, a protein source in every main meal, fruit/vegetables for vitamin C. These are general references, not a fracture-specific prescription, and food does not guarantee healing. Change targets in Settings.</small></div>
  ${waterCard(day,c,fut)}${grp('Food taken','success','taken')}${grp('Food skipped','danger','skipped')}${grp('Pending','warning','pending')}
  <div class="row g-3">${ch('cBar','Consumed vs target (selected date, % of target)',sl)}${ch('cLine','Last 7 days – % of target',any)}${ch('cCons','Diet completion % – last 7 days',any)}${ch('cWater','Water (ml) – last 7 days',any)}${ch('cMeal','Meal completion (selected date)',sl)}</div>`;
}
const OPT={pop:['Intact and comfortable','Feels tight','Feels loose','Cracked or damaged','Wet or damp','Skin irritation at edges'],sw:['None','Mild','Moderate','Severe','Increasing'],mv:['Normal','Reduced','Unable to move'],col:['Normal pink','Pale','Blue or purple'],warm:['Warm','Cold'],nb:['None','Tingling','Numb'],wb:['Not yet advised by doctor','Non-weight-bearing (as advised by doctor)','Partial weight-bearing (as advised by doctor)','Full weight-bearing (as advised by doctor)']};
const sel=(id,o,v)=>`<select id="${id}" class="form-select form-select-sm">${o.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select>`;
function hasRecoveryObservations(r){return !!r&&['pop','sw','mv','col','warm','nb','pain','note'].some(k=>Object.prototype.hasOwnProperty.call(r,k))}
function warns(r){const w=[];if(!r)return w;if(r.col&&r.col!=='Normal pink')w.push('Toes pale or blue');if(r.warm==='Cold')w.push('Cold toes');if(r.nb&&r.nb!=='None')w.push('Numbness or tingling');if(r.mv==='Unable to move')w.push('Unable to move toes');if(r.sw==='Increasing'||r.sw==='Severe')w.push('Swelling increasing or severe');if(r.pain>=8)w.push('Severe pain');if(['Feels tight','Feels loose','Cracked or damaged','Wet or damp'].includes(r.pop))w.push('POP problem: '+r.pop.toLowerCase());return w}
function vRec(day,fut){
  const rec=rd(K.rec,{}),r=rec[S.date],observed=hasRecoveryObservations(r),m=rd(K.meta,{}),w=warns(r),meds=Array.isArray(m.meds)?m.meds:[];
  const hl=Object.keys(rec).filter(d=>hasRecoveryObservations(rec[d])).sort().reverse().slice(0,10);
  return `<h4>Personal Injury Recovery Tracker</h4><p class="text-secondary small">${INFO}</p>${RF}
  ${w.length?`<div class="alert alert-danger"><b>⚠ Warning signs logged for this date: ${w.join(', ')}.</b> Seek urgent medical assessment / contact your orthopaedic doctor now.</div>`:''}
  <div class="row g-3"><div class="col-lg-7"><div class="c"><h6>Observations for this date</h6>${fut?'<p class="small text-secondary">Observations can be logged for today or past dates only.</p>':`<div class="row g-2">
   <div class="col-sm-6"><label class="small">POP condition</label>${sel('rPop',OPT.pop,r?.pop)}</div><div class="col-sm-6"><label class="small">Swelling</label>${sel('rSw',OPT.sw,r?.sw)}</div>
   <div class="col-sm-6"><label class="small">Toe movement</label>${sel('rMv',OPT.mv,r?.mv)}</div><div class="col-sm-6"><label class="small">Toe colour</label>${sel('rCol',OPT.col,r?.col)}</div>
   <div class="col-sm-6"><label class="small">Toe warmth</label>${sel('rWarm',OPT.warm,r?.warm)}</div><div class="col-sm-6"><label class="small">Numbness / tingling</label>${sel('rNb',OPT.nb,r?.nb)}</div>
   <div class="col-12"><label class="small">Pain level: <b>${r?.pain??0}</b>/10</label><input id="rPain" type="range" min="0" max="10" value="${r?.pain??0}" class="form-range" oninput="this.previousElementSibling.querySelector('b').textContent=this.value"></div>
   <div class="col-12"><label class="small">Notes</label><textarea id="rNote" class="form-control form-control-sm" rows="2">${esc(r?.note||'')}</textarea></div></div><button class="btn btn-success btn-sm mt-2" data-a="recsave">Save observations</button> ${observed?'<button class="btn btn-outline-danger btn-sm mt-2" data-a="recdel">Delete this entry</button>':''}`}</div></div>
  <div class="col-lg-5"><div class="c mb-3"><h6>Doctor's instructions</h6><label class="small">Weight-bearing status (as told by your doctor)</label><select class="form-select form-select-sm mb-2" data-c="meta" data-k="wb">${OPT.wb.map(x=>`<option ${x===(m.wb||OPT.wb[0])?'selected':''}>${x}</option>`).join('')}</select><label class="small">Doctor follow-up date</label><input type="date" class="form-control form-control-sm" value="${esc(m.follow||'')}" data-c="meta" data-k="follow">${m.follow?`<small class="text-secondary">${m.follow<TODAY()?'Follow-up date has passed – check with your doctor.':'Follow-up scheduled.'}</small>`:''}</div>
  <div class="c"><h6>Medicine taken today</h6><p class="small text-secondary">Tick each time period after taking your prescribed medicine. Follow your prescription; this tracker does not set doses or times.</p><div class="d-flex flex-wrap gap-3">${[['morning','Morning'],['afternoon','Afternoon'],['night','Night']].map(([k,l])=>`<div class="form-check"><input class="form-check-input" type="checkbox" id="med-${k}" data-c="medication" data-k="${k}" ${r?.medicationChecks?.[k]?'checked':''} ${fut?'disabled':''}><label class="form-check-label" for="med-${k}">${l} medicine taken</label></div>`).join('')}</div>
  <h6 class="mt-3">Medication schedule (copy from your prescription)</h6>${meds.map((x,i)=>`<div class="d-flex justify-content-between small border-bottom py-1"><span><b>${esc(x.name)}</b> – ${esc(x.dose)}</span><button class="btn btn-sm text-danger p-0" data-a="medDel" data-v="${i}"><i class="bi bi-x-lg"></i></button></div>`).join('')||'<p class="small text-secondary">No medicines entered.</p>'}<div class="input-group input-group-sm mt-2"><input id="medN" class="form-control" placeholder="Medicine"><input id="medD" class="form-control" placeholder="Dose &amp; timing as prescribed"><button class="btn btn-success" data-a="medAdd">Add</button></div><small class="text-secondary">This app never suggests or changes medicines.</small></div></div></div>
  <div class="c mt-3"><h6>History</h6>${hl.length?hl.map(d=>`<button class="btn btn-sm btn-light me-1 mb-1" data-a="date" data-v="${d}">${d} · pain ${rec[d].pain}/10 · ${esc(rec[d].pop)}</button>`).join(''):'<p class="small text-secondary mb-0">No observations logged yet.</p>'}</div>`;
}
function vSet(){
  const c=cfg(),f=[['kcal','Calories (kcal)'],['p','Protein (g)'],['ca','Calcium (mg)'],['fe','Iron (mg)'],['d','Vitamin D (mcg)'],['c','Vitamin C (mg)'],['carb','Carbohydrates (g, optional)'],['fat','Fats (g, optional)'],['water','Water (ml)']];
  return `<h4>Settings</h4><div class="c mb-3"><h6>Daily targets</h6><div class="row g-2">${f.map(([k,l])=>`<div class="col-6 col-md-4"><label class="small">${l}</label><input type="number" min="0" class="form-control form-control-sm" value="${c[k]}" data-c="set" data-k="${k}"></div>`).join('')}</div><small class="text-secondary">Leave blank for no target. Defaults are general adult references; ask your doctor or dietitian about your own needs.</small></div>
  <div class="c"><h6>Backup &amp; restore</h6><p class="small text-secondary">Data lives only in this browser (LocalStorage) and does not sync. Export regularly.</p><button class="btn btn-success btn-sm" data-a="exp"><i class="bi bi-download"></i> Export JSON</button> <button class="btn btn-outline-primary btn-sm" data-a="imp"><i class="bi bi-upload"></i> Import JSON</button></div>`;
}

/* ---------- date strip ---------- */
function strip(){
  const t=TODAY(),mon=addD(S.date,-((dt(S.date).getDay()+6)%7)),c=cfg();let h='';
  for(let i=0;i<7;i++){const d=addD(mon,i),fut=d>t,sv=isSaved(d),day=sv?getDay(d):null,s=day&&stats(day),n=day&&totals(day);
    h+=`<button class="dc ${d===S.date?'sel':''} ${d===t?'tod':''}" data-a="date" data-v="${d}"><small>${dt(d).toLocaleDateString('en-US',{weekday:'short'})}</small><b>${String(dt(d).getDate()).padStart(2,'0')}</b><span class="tg">${d===t?'TODAY':fut?'PLAN':''}</span>${s&&!fut?`<div class="progress"><div class="progress-bar bg-warning" style="width:${s.pct}%"></div></div><small>✓${s.tk} ✗${s.sk}</small><small>Ca ${pc(n.ca,c.ca)}% · P ${pc(n.p,c.p)}%</small>`:`<small>${fut?'Planned':'No log'}</small>`}</button>`}
  return h;
}

/* ---------- charts ---------- */
function mk(id,cfgc){const el=document.getElementById(id);if(el)CH[id]=new Chart(el,cfgc)}
function charts(day){
  if(!window.Chart)return;
  const c=cfg(),t=totals(day),s=stats(day),O={maintainAspectRatio:false};
  Chart.defaults.color=document.documentElement.dataset.bsTheme==='dark'?'#b8c4c9':'#555';
  mk('cMeal',{type:'doughnut',data:{labels:['Taken','Skipped','Pending'],datasets:[{data:[s.tk,s.sk,s.pe],backgroundColor:['#2e9e6b','#dc3545','#f59f00']}]},options:O});
  if(S.view!=='nut')return;
  const ks=['ca','p','fe','d','c'];
  mk('cBar',{type:'bar',data:{labels:['Calcium','Protein','Iron','Vitamin D','Vitamin C'],datasets:[{label:'Consumed (% of target)',data:ks.map(k=>pc(t[k],c[k])),backgroundColor:'#2b7bd6'},{label:'Target (100%)',data:ks.map(()=>100),backgroundColor:'#bfe3d0'}]},options:O});
  const W=[...Array(7)].map((_,i)=>addD(S.date,i-6)),L=W.map(isLogged),D=W.map(getDay),T=D.map(totals),lb=W.map(d=>d.slice(5));
  const ser=(k,col,l)=>({label:l,data:T.map((x,i)=>L[i]?pc(x[k],c[k]):null),borderColor:col,backgroundColor:col,spanGaps:false,tension:.25});
  mk('cLine',{type:'line',data:{labels:lb,datasets:[ser('ca','#2b7bd6','Calcium'),ser('p','#2e9e6b','Protein'),ser('fe','#f59f00','Iron')]},options:O});
  mk('cCons',{type:'bar',data:{labels:lb,datasets:[{label:'Completion %',data:D.map((x,i)=>L[i]?stats(x).pct:null),backgroundColor:'#2e9e6b'}]},options:{...O,scales:{y:{beginAtZero:true,max:100}}}});
  mk('cWater',{type:'bar',data:{labels:lb,datasets:[{label:'Water (ml)',data:D.map((x,i)=>L[i]?x.water:null),backgroundColor:'#2b7bd6'},{type:'line',label:'Target',data:W.map(()=>+c.water||null),borderColor:'#dc3545',pointRadius:0}]},options:{...O,scales:{y:{beginAtZero:true}}}});
}

/* ---------- render ---------- */
function render(){
  Object.values(CH).forEach(x=>x.destroy());CH={};
  const day=getDay(S.date),fut=S.date>TODAY(),t=TODAY();
  $('#strip').innerHTML=strip();
  $('#dlabel').innerHTML=`${dt(S.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} <span class="badge ${S.date===t?'bg-success':fut?'bg-info':'bg-secondary'} align-middle">${S.date===t?'Today':fut?'Planning':'Past record'}</span>`;
  $('#app').innerHTML={dash:vDash,diet:vDiet,nut:vNut,rec:vRec,set:vSet}[S.view](day,fut);
  document.querySelectorAll('[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===S.view));
  if(S.view==='dash'||S.view==='nut')charts(day);
  const sc=$('.dc.sel');if(sc)sc.scrollIntoView({inline:'center',block:'nearest'});
}

/* ---------- add / edit modal ---------- */
function openM(id,lg){
  if(!bs){alert('Bootstrap failed to load – check your internet connection and reload.');return}
  const fut=S.date>TODAY(),m=id?getDay(S.date).meals.find(x=>x.id===id):null;MM=id||null;logMode=!!lg&&!fut;
  $('#mTitle').textContent=m?'Edit food':'Add food';
  const v=m||{name:'',qty:1,unit:'serving',time:'12:00',note:'',n:{}};
  $('#mName').value=v.name;$('#mQty').value=v.qty;$('#mUnit').value=v.unit;$('#mTime').value=v.time;$('#mNote').value=v.note||'';
  document.querySelectorAll('#mN input').forEach(i=>i.value=v.n[i.dataset.k]??'');
  base=m?{qty:v.qty,n:{...v.n}}:null;bs.show();
}
function saveM(){
  const name=$('#mName').value.trim(),qty=+$('#mQty').value,time=$('#mTime').value||'12:00';
  if(!name||!(qty>0)){alert('Enter a food name and a quantity greater than 0.');return}
  const n={};document.querySelectorAll('#mN input').forEach(i=>n[i.dataset.k]=r1(Math.max(+i.value||0,0)));
  const day=getDay(S.date);
  if(day.meals.some(m=>m.id!==MM&&m.name.toLowerCase()===name.toLowerCase()&&m.time===time)){alert('This food is already scheduled at that time on this date.');return}
  if(MM){const m=day.meals.find(x=>x.id===MM);Object.assign(m,{name,qty,unit:$('#mUnit').value,time,note:$('#mNote').value.trim(),n})}
  else day.meals.push({id:uid(),name,qty,unit:$('#mUnit').value,time,note:$('#mNote').value.trim(),n,status:logMode?'taken':'pending',reason:''});
  saveDay(S.date,day);log((MM?'Edited ':'Added ')+name);bs.hide();render();
}

/* ---------- backup ---------- */
function exportData(){const b=new Blob([JSON.stringify({app:'BoneCare',exported:new Date().toISOString(),diet:hist(),recovery:rd(K.rec,{}),meta:rd(K.meta,{}),settings:rd(K.set,{})},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`bonecare-backup-${TODAY()}.json`;a.click();URL.revokeObjectURL(a.href)}
function importData(f){if(!f)return;const rdr=new FileReader();rdr.onload=()=>{try{const j=JSON.parse(rdr.result);if(j.app!=='BoneCare'||typeof j.diet!=='object')throw 0;if(!confirm('Replace ALL current data with this backup?'))return;wr(K.diet,j.diet||{});wr(K.rec,j.recovery||{});wr(K.meta,j.meta||{});wr(K.set,j.settings||{});render();alert('Backup restored.')}catch{alert('Invalid BoneCare backup file.')}$('#file').value=''};rdr.readAsText(f)}

/* ---------- events ---------- */
const ACT={
  date:v=>{S.date=v;render()},today:()=>{S.date=TODAY();render()},wk:v=>{S.date=addD(S.date,7*v);render()},
  choice:(id,v)=>mut(d=>{const m=d.meals.find(x=>x.id===id);if(!m||m.status==='taken')return;const c=m.choices?.find(x=>x.id===v);if(!c)return;m.selectedChoice=c.id;m.name=c.name;m.n={...c.n}},`Selected meal option: ${getDay(S.date).meals.find(x=>x.id===id)?.choices?.find(x=>x.id===v)?.label||v}`),
  st:(id,v)=>mut(d=>{const m=d.meals.find(x=>x.id===id);m.status=v;if(v!=='skipped')m.reason=m.reason},`${v} – ${getDay(S.date).meals.find(x=>x.id===id)?.name}`),
  edit:id=>openM(id),add:()=>openM(null,false),log:()=>openM(null,true),save:saveM,
  del:id=>{if(confirm('Delete this food entry for this date?'))mut(d=>d.meals=d.meals.filter(m=>m.id!==id),'Deleted a food entry')},
  delDay:()=>{if(confirm('Delete the entire diet record for this date? This cannot be undone.')){const h=hist();delete h[S.date];wr(K.diet,h);log('Deleted day record');render()}},
  water:v=>mut(d=>d.water=Math.max(0,(d.water||0)+ +v),`Water ${v>0?'+':''}${v} ml`),
  theme:()=>{const t=document.documentElement.dataset.bsTheme==='dark'?'light':'dark';document.documentElement.dataset.bsTheme=t;wr(K.th,{t});render()},
  recsave:()=>{const rec=rd(K.rec,{}),previous=rec[S.date]||{};rec[S.date]={...previous,pop:$('#rPop').value,sw:$('#rSw').value,mv:$('#rMv').value,col:$('#rCol').value,warm:$('#rWarm').value,nb:$('#rNb').value,pain:+$('#rPain').value,note:$('#rNote').value.trim()};wr(K.rec,rec);log('Saved recovery observations');render()},
  recdel:()=>{if(confirm('Delete this recovery entry?')){const rec=rd(K.rec,{}),entry=rec[S.date];if(entry?.medicationChecks)rec[S.date]={medicationChecks:entry.medicationChecks};else delete rec[S.date];wr(K.rec,rec);render()}},
  medAdd:()=>{const n=$('#medN').value.trim(),d=$('#medD').value.trim();if(!n)return alert('Enter the medicine name from your prescription.');const m=rd(K.meta,{});m.meds=[...(m.meds||[]),{name:n,dose:d}];wr(K.meta,m);render()},
  medDel:v=>{const m=rd(K.meta,{});m.meds=(m.meds||[]).filter((_,i)=>i!=v);wr(K.meta,m);render()},
  exp:exportData,imp:()=>$('#file').click()
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||!ACT[b.dataset.a])return;if(b.dataset.a==='st'||b.dataset.a==='choice')ACT[b.dataset.a](b.dataset.id,b.dataset.v);else ACT[b.dataset.a](b.dataset.v??b.dataset.id,b)});
document.addEventListener('change',e=>{
  const el=e.target,c=el.dataset.c;if(!c)return;
  if(c==='reason')mut(d=>{d.meals.find(m=>m.id===el.dataset.id).reason=el.value.trim()});
  else if(c==='sun'||c==='clinic')mut(d=>{d[c]=el.checked});
  else if(c==='medication'){const rec=rd(K.rec,{}),entry=rec[S.date]||{},checks={...(entry.medicationChecks||{})};if(el.checked)checks[el.dataset.k]=true;else delete checks[el.dataset.k];if(Object.keys(checks).length)entry.medicationChecks=checks;else delete entry.medicationChecks;if(!Object.keys(entry).length)delete rec[S.date];else rec[S.date]=entry;wr(K.rec,rec);render()}
  else if(c==='water'){if(el.value!=='')mut(d=>{d.water=Math.max(0,+el.value||0)},'Water updated')}
  else if(c==='set'){const s=rd(K.set,{});s[el.dataset.k]=el.value===''?'':Math.max(0,+el.value);wr(K.set,s);render()}
  else if(c==='meta'){const m=rd(K.meta,{});m[el.dataset.k]=el.value;wr(K.meta,m);render()}
  else if(c==='file')importData(el.files[0]);
});
window.addEventListener('hashchange',()=>{readHash();render()});

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.dataset.bsTheme=rd(K.th,{}).t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  $('#foodsList').innerHTML=FOODS.map(f=>`<option value="${esc(f.name)}">`).join('');
  try{bs=new bootstrap.Modal('#mod')}catch{bs=null}
  document.querySelectorAll('.side .nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();if(location.hash!=='#'+a.dataset.view)location.hash=a.dataset.view;else{readHash();render()}try{const o=bootstrap.Offcanvas.getInstance('#side');if(o)o.hide()}catch{}}));
  $('#mName').addEventListener('change',e=>{if(MM)return;const f=FOODS.find(x=>x.name.toLowerCase()===e.target.value.trim().toLowerCase());if(!f)return;$('#mQty').value=f.qty;$('#mUnit').value=f.unit;document.querySelectorAll('#mN input').forEach(i=>i.value=f.n[i.dataset.k]);base={qty:f.qty,n:f.n}});
  $('#mQty').addEventListener('input',e=>{const q=+e.target.value;if(base&&base.qty>0&&q>0)document.querySelectorAll('#mN input').forEach(i=>i.value=r1((base.n[i.dataset.k]||0)*q/base.qty))});
  $('#mN').addEventListener('input',()=>{base=null});
  readHash();render();
});