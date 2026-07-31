"use strict";
/* ================= 圖示 ================= */
var IC={
  pin:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  up:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  x:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  edit:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  star:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>',
  ext:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
  walk:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M10.5 21l2-5-3-3 1-5 4 2 2 2"/><path d="M7 21l2.5-6"/></svg>',
  img:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>',
  bmOutline:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  bmFill:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  plus:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};
/* ================= 資料層(格式與舊版相同) ================= */
var LS_P="pocket_places_v1", LS_C="pocket_cats_v1", LS_L="pocket_lists_v1";
var DEF_CATS=["美食","景點","咖啡","購物","住宿","火鍋","燒肉","台式料理","日式料理","異國料理","小吃","飲料"];
var FOOD_SUB=["火鍋","燒肉","台式料理","日式料理","異國料理","小吃","飲料"];
var places=[], cats=[], lists=[];
function load(){
  try{places=JSON.parse(localStorage.getItem(LS_P))||[];}catch(e){places=[];}
  try{cats=JSON.parse(localStorage.getItem(LS_C))||DEF_CATS.slice();}catch(e){cats=DEF_CATS.slice();}
  try{lists=JSON.parse(localStorage.getItem(LS_L))||["我的口袋名單"];}catch(e){lists=["我的口袋名單"];}
  if(!cats.length)cats=DEF_CATS.slice();
  FOOD_SUB.forEach(function(c){if(cats.indexOf(c)<0)cats.push(c);});
  if(!lists.length)lists=["我的口袋名單"];
}
function save(){
  localStorage.setItem(LS_P,JSON.stringify(places));
  localStorage.setItem(LS_C,JSON.stringify(cats));
  localStorage.setItem(LS_L,JSON.stringify(lists));
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
/* ============ 設定頁:備份/還原/關於我們/清除資料 ============ */
function exportBackup(){
  var data={
    ver:1, exportedAt:new Date().toISOString(),
    pocket_places_v1:localStorage.getItem("pocket_places_v1"),
    pocket_cats_v1:localStorage.getItem("pocket_cats_v1"),
    pocket_lists_v1:localStorage.getItem("pocket_lists_v1"),
    pocket_trips_v1:localStorage.getItem("pocket_trips_v1"),
    pocket_mypass_v1:localStorage.getItem("pocket_mypass_v1"),
    pocket_theme_v1:localStorage.getItem("pocket_theme_v1")
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url; a.download="pocket_spots_backup_"+(new Date().toISOString().slice(0,10))+".json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
  toast("已匯出備份檔");
}
function restoreBackupFile(file){
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      ["pocket_places_v1","pocket_cats_v1","pocket_lists_v1","pocket_trips_v1","pocket_mypass_v1","pocket_theme_v1"]
        .forEach(function(k){ if(data[k]!=null)localStorage.setItem(k,data[k]); });
      toast("還原完成,重新整理中…");
      setTimeout(function(){location.reload();},900);
    }catch(err){ toast("備份檔格式不正確,還原失敗"); }
  };
  reader.readAsText(file);
}
if($("bkRestoreFile"))$("bkRestoreFile").addEventListener("change",function(){
  if(this.files&&this.files[0])restoreBackupFile(this.files[0]);
  this.value="";
});
function showAbout(){
  alert("口袋景點 Pocket Spots\n個人旅行景點與交通規劃工具\n\n資料完全儲存在你自己的裝置上(localStorage),不會上傳到任何伺服器。");
}
if($("btnResetAll"))$("btnResetAll").addEventListener("click",function(){
  if(!confirm("確定要清除所有本機資料嗎?這會刪除口袋名單、行程、票券選擇等所有內容,且無法復原。建議先備份。"))return;
  localStorage.clear();
  location.reload();
});
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function attr(s){return esc(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function $(i){return document.getElementById(i);}
/* ================= Google Maps JS API(路線規劃自動完成 + 票券推薦地理編碼共用) =================
   沿用「資料來源設定」裡貼的同一把 Google API 金鑰(gKey()),不用另外設定。
   除了原本的「Places API (New)」,請再到 Google Cloud Console 多啟用「Maps JavaScript API」
   與「Geocoding API」,兩個功能才會生效;金鑰記得設定 HTTP referrer 限制只給你的網域用。 */
var gmapsLoaded=false, gmapsLoading=false, gmapsGeocoder=null;
function gmapsReady(){
  gmapsLoaded=true;gmapsLoading=false;
  gmapsGeocoder=new google.maps.Geocoder();
  rpInitAutocomplete();
  asInitAutocomplete();
  if(typeof ppInitRecoAutocomplete==="function")ppInitRecoAutocomplete();
  if($("rpHint"))$("rpHint").textContent="";
  if(typeof ensureLegTimes==="function")ensureLegTimes();
  if(typeof renderRouteMap==="function")renderRouteMap();
  if(typeof onGmapsReadyNear==="function")onGmapsReadyNear();
}
function ensureGoogleMapsLoaded(){
  if(gmapsLoaded||gmapsLoading)return;
  var key=gKey();
  if(!key)return;
  gmapsLoading=true;
  var s=document.createElement("script");
  s.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(key)+
    "&libraries=places&callback=gmapsReady&loading=async";
  s.async=true;s.defer=true;
  s.onerror=function(){gmapsLoading=false;};
  document.head.appendChild(s);
}
function hasPlace(name){name=name.trim();return places.some(function(p){return p.name===name;});}
var toastT=null;
function toast(msg){
  var t=$("toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove("show");},2200);
}
function gmapSearch(name){
  window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(name),"_blank");
}
function tabelog(kw){
  window.open("https://tabelog.com/rstLst/?sw="+encodeURIComponent(kw),"_blank");
}
/* 分類徽章顏色 */
var BADGE_COLORS={"咖啡":"#b48ef2","美食":"#f28b6b","景點":"#7db8f2","購物":"#6ee7b7","住宿":"#f9a8d4",
  "火鍋":"#f2846b","燒肉":"#e0765a","台式料理":"#f2b56b","日式料理":"#f2d06b","異國料理":"#8ec6f2","小吃":"#f2a06b","飲料":"#7ee0c9"};
var THUMB_GRADIENTS=[
  "linear-gradient(150deg,#241d1a,#7a5236,#e0b878)",
  "linear-gradient(150deg,#3a1e16,#a83a24,#e28b52)",
  "linear-gradient(150deg,#242a33,#4a5568,#9fb0c4)",
  "linear-gradient(150deg,#2a2418,#8a6a2a,#e0c060)",
  "linear-gradient(150deg,#1a2e24,#2f6b4f,#7fd9a8)",
  "linear-gradient(150deg,#1a2436,#2f4f7a,#7fb3ff)",
  "linear-gradient(150deg,#2e1a30,#7a3d8a,#c98be0)",
  "linear-gradient(150deg,#301a1a,#8a3d3d,#e08b8b)"
];
function hashStr(s){s=String(s||"");var h=0;for(var i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function placeGradient(key){return THUMB_GRADIENTS[hashStr(key)%THUMB_GRADIENTS.length];}
function durTxt(h){
  if(!h)return "";
  if(h<1)return Math.round(h*60)+" 分鐘";
  if(h===Math.floor(h))return h+" 小時";
  return h+" 小時";
}
function catBadge(c){
  var col=BADGE_COLORS[c]||"#8fa0b8";
  return '<span class="badge" style="color:'+col+';background:'+col+'1f;">'+esc(c)+'</span>';
}
function placeThumb(x){
  if(x.photoUrl)return '<div class="place-thumb" data-tid="'+attr(x.id)+'"><img src="'+attr(x.photoUrl)+'" alt="" loading="lazy" onerror="phThumbErr(this,\''+attr(x.id||x.name)+'\')"></div>';
  return '<div class="place-thumb" data-tid="'+attr(x.id)+'" style="background:'+placeGradient(x.id||x.name)+';"></div>';
}
/* 縮圖載入失敗時的退場處理:拿掉壞圖,退回原本無照片時的漸層色塊,避免顯示破圖問號 */
function phThumbErr(img,key){
  var box=img.parentElement;
  if(box)box.style.background=placeGradient(key);
  if(img.parentNode)img.parentNode.removeChild(img);
}

/* ================= 分頁切換 ================= */
var curPage="home";
function syncHeaderVisibility(){
  var hide=curPage==="metro"||(curPage==="route"&&!!curTrip);
  var hd=document.querySelector("header");
  if(hd)hd.style.display=hide?"none":"flex";
}
var homeFeatureIdx=0;
function renderHomeFeature(){
  var box=$("homeFeature");
  if(!box)return;
  if(!places.length){
    box.innerHTML='<div class="home-feature-empty"><span class="fe-ic">📍</span>還沒有收藏的景點,按下方導覽列中央「＋」新增一個吧</div>';
    return;
  }
  var items=places.slice(-3).reverse();
  if(homeFeatureIdx>=items.length)homeFeatureIdx=0;
  var f=items[homeFeatureIdx];
  var bg=f.photoUrl?'<div class="hf-bg" data-tid="'+attr(f.id||f.name)+'"><img src="'+attr(f.photoUrl)+'" alt="" onerror="phThumbErr(this,\''+attr(f.id||f.name)+'\')"></div>':
    '<div class="hf-bg" style="background:'+placeGradient(f.id||f.name)+';"></div>';
  var dots=items.length>1?'<div class="hf-dots">'+items.map(function(x,i){
    return '<button type="button" data-i="'+i+'" class="'+(i===homeFeatureIdx?"on":"")+'" aria-label="第'+(i+1)+'張"></button>';
  }).join("")+'</div>':"";
  box.innerHTML='<div class="home-feature">'+bg+
    '<span class="hf-tag">'+esc(f.cat||"景點")+'</span>'+
    (typeof f.rating==="number"?'<span class="hf-rate">★ '+f.rating.toFixed(1)+'</span>':"")+
    '<div class="hf-txt"><div class="t1">'+esc(f.name)+'</div><div class="t2">'+esc(f.list||"我的口袋名單")+'</div></div>'+
    dots+'</div>';
  box.querySelector(".home-feature").addEventListener("click",function(e){
    if(e.target.closest(".hf-dots"))return;
    goPage("list");
  });
  box.querySelectorAll(".hf-dots button").forEach(function(b){
    b.addEventListener("click",function(e){
      e.stopPropagation();
      homeFeatureIdx=+b.dataset.i;
      renderHomeFeature();
    });
  });
}
function renderHomeRecent(){
  var box=$("homeRecent");
  if(!box)return;
  var recent=places.slice(-3).reverse();
  if(!recent.length){box.innerHTML='<div class="home-recent-empty">還沒有加入任何景點</div>';return;}
  box.innerHTML=recent.map(function(p){
    return '<div class="home-recent-item"><div class="hri-thumb" style="background:'+placeGradient(p.id||p.name)+';"></div><div class="hri-body">'+
      '<div class="hri-name">'+p.name+'</div><div class="hri-sub">'+(p.cat||"景點")+'・'+(p.list||"")+'</div></div></div>';
  }).join("");
}
function goPage(p){
  curPage=p;
  document.querySelectorAll("nav button").forEach(function(x){x.classList.toggle("on",x.dataset.p===p);});
  $("hdImport").classList.toggle("on",p==="import");
  document.querySelectorAll(".page").forEach(function(pg){pg.classList.remove("active");});
  $("page-"+p).classList.add("active");
  $("fabAdd").style.display=(p==="list"||p==="near")?"flex":"none";
  if(p!=="metro"){document.body.classList.remove("mFsOn");var fb=$("mFs");if(fb){fb.innerHTML="&#9974;";fb.title="全螢幕";}}
  if(p==="route"){if(curTrip){renderTripEditor();}else{showTripScreen("overview");renderTripList();}}
  if(p==="near"){try{renderSrcBar();}catch(e){}}
  if(p==="metro"){ if(!mSvg){mMeasure();mInit();} else {mMeasure();mApply();} }
  if(p==="home"){renderHero();renderHomeFeature();renderHomeRecent();if($("stSettingsCount"))$("stSettingsCount").textContent="共 "+places.length+" 個地點・"+lists.length+" 個清單";}
  if(p==="tickets"){renderTixMine();ppOpen();}
  if(p==="settings"){if($("stSettingsCount"))$("stSettingsCount").textContent="共 "+places.length+" 個地點・"+lists.length+" 個清單";}
  if($("hdTitle"))$("hdTitle").textContent=(p==="list")?"我的景點":"口袋景點";
  if($("hdCount")){
    if(p==="list")$("hdCount").textContent=places.length?places.length+" 個地點":"開始收集你的口袋景點";
    else if(p==="home")$("hdCount").textContent=places.length?("共 "+places.length+" 個地點・"+lists.length+" 個清單"):"開始收集你的口袋景點";
  }
  syncHeaderVisibility();
  window.scrollTo(0,0);
}
document.querySelectorAll("nav button[data-p]").forEach(function(b){
  b.addEventListener("click",function(){goPage(b.dataset.p);});
});
$("navAdd").addEventListener("click",openSheet);
$("hdImport").addEventListener("click",function(){goPage("import");});

/* ================= 新增景點 Sheet ================= */
var sheetLoc=null;
function openSheet(){
  if(curPage==="near"&&myPos){
    sheetLoc={lat:myPos.lat,lng:myPos.lng};
    $("inLocBadge").style.display="block";
    $("inLocBadge").textContent="📍 已帶入目前定位("+myPos.lat.toFixed(4)+", "+myPos.lng.toFixed(4)+")";
  }else{
    sheetLoc=null;
    $("inLocBadge").style.display="none";
  }
  $("sheetBk").classList.add("show");$("sheet").classList.add("show");
  ensureGoogleMapsLoaded();
  inNameInitAutocomplete();
  setTimeout(function(){$("inName").focus();},260);
}
/* 新增景點:名稱欄位掛 Google 自動完成,選到地點會一併帶入座標與地址 */
var inNamePlace=null, inNameAutoDone=false, inNameLastAC="";
function inNameInitAutocomplete(){
  if(inNameAutoDone||!window.google||!google.maps||!google.maps.places)return;
  inNameAutoDone=true;
  var ac=new google.maps.places.Autocomplete($("inName"),{fields:["place_id","formatted_address","name","geometry","types"]});
  ac.addListener("place_changed",function(){
    inNamePlace=ac.getPlace();
    if(typeof gTrackDetail==="function")gTrackDetail("autocomplete");
    /* Google 選完會把整串地址塞回輸入框,改回店名,避免地址被當成景點名稱 */
    if(inNamePlace&&inNamePlace.name){inNameLastAC=inNamePlace.name;$("inName").value=inNamePlace.name;}
    else{inNameLastAC=$("inName").value;}
    /* 依 Google 回傳的類型自動選分類,選不到就維持使用者原本的選擇 */
    if(inNamePlace&&inNamePlace.types&&typeof gCat==="function"){
      var c=gCat(inNamePlace.types,inNamePlace.name||"");
      if(c&&cats.indexOf(c)>=0)$("inCat").value=c;
    }
  });
  $("inName").addEventListener("input",function(){
    if(this.value!==inNameLastAC)inNamePlace=null;
  });
}
function closeSheet(){inNamePlace=null;$("sheetBk").classList.remove("show");$("sheet").classList.remove("show");}
$("btnParseLink").addEventListener("click",function(){
  var link=$("inLink").value.trim();
  if(!link){$("inLink").focus();return;}
  var isSocial=/instagram\.com|threads\.net/i.test(link);
  var note=$("inNote").value.trim();
  if(note.indexOf(link)<0)$("inNote").value=note?note+" "+link:link;
  var name=$("inName").value.trim();
  if(name){
    var g=guessCat(name);
    if(g&&cats.indexOf(g)>=0)$("inCat").value=g;
  }
  $("linkHint").style.display="block";
  $("linkHint").textContent=isSocial
    ? "已把連結記到備註。IG／Threads 不開放讀取貼文內容,店名與分類還是要你自己確認一下再送出。"
    : "這不像 IG 或 Threads 連結,不過還是幫你記到備註裡了。";
  if(!name)$("inName").focus();
});
$("fabAdd").addEventListener("click",openSheet);
$("sheetBk").addEventListener("click",closeSheet);

/* ================= 下拉選單(含自訂) ================= */
function fillSelect(sel,arr,cur,addLabel){
  var h=arr.map(function(x){return '<option value="'+attr(x)+'"'+(x===cur?" selected":"")+'>'+esc(x)+'</option>';}).join("");
  h+='<option value="__add__">＋ '+addLabel+'…</option>';
  sel.innerHTML=h;
}
function bindAddable(sel,arr,label,after){
  sel.addEventListener("change",function(){
    if(sel.value!=="__add__")return;
    var v=prompt("輸入新的"+label+"名稱:");
    if(v){v=v.trim();}
    if(v&&arr.indexOf(v)<0){arr.push(v);save();}
    refreshSelects(v&&arr.indexOf(v)>=0?{sel:sel,val:v}:null);
    if(after)after();
  });
}
function refreshSelects(pick){
  fillSelect($("inCat"),cats,pick&&pick.sel===$("inCat")?pick.val:$("inCat").value||cats[0],"新增分類");
  fillSelect($("inList"),lists,pick&&pick.sel===$("inList")?pick.val:$("inList").value||lists[0],"新增清單");
  var fl=$("fList"),cur=fl.value||"__all__";
  var h='<option value="__all__">全部清單</option>';
  lists.forEach(function(l){h+='<option value="'+attr(l)+'"'+(l===cur?" selected":"")+'>'+esc(l)+'</option>';});
  fl.innerHTML=h;
  if(pick&&pick.sel===$("inCat")&&$("inCat").querySelector('option[value="'+pick.val.replace(/"/g,'\\"')+'"]'))$("inCat").value=pick.val;
  if(pick&&pick.sel===$("inList"))$("inList").value=pick.val;
}

/* ================= 左右滑動切換分頁 ================= */
/* 只在「明顯是水平滑動」時才切頁,且避開地圖、橫向滾動列、開著的面板 */
var SWIPE_PAGES=["home","list","route","settings"];
var swX=0, swY=0, swOK=false;
function swipeBlocked(el){
  /* 開著任何 bottom sheet 就不切頁 */
  if(document.querySelector(".sheet.show"))return true;
  /* 捷運地圖要能自由拖曳縮放 */
  if(curPage==="metro")return true;
  /* 起點落在地圖、SVG、或會橫向滾動的容器上就交給它們處理 */
  while(el&&el!==document.body){
    if(el.tagName==="SVG"||el.tagName==="svg")return true;
    if(el.classList&&(el.classList.contains("near-mapprev")||el.classList.contains("chips")||
       el.classList.contains("distRow")||el.classList.contains("cat-row")||
       el.classList.contains("day-tabs")||el.classList.contains("gm-style")))return true;
    if(el.id==="bigMapBox"||el.id==="rMapCanvas"||el.id==="routeMap")return true;
    /* 任何實際可橫向滾動的元素 */
    if(el.scrollWidth>el.clientWidth+8){
      var ov=getComputedStyle(el).overflowX;
      if(ov==="auto"||ov==="scroll")return true;
    }
    el=el.parentElement;
  }
  return false;
}
document.addEventListener("touchstart",function(e){
  if(e.touches.length!==1){swOK=false;return;}
  var t=e.touches[0];
  swX=t.clientX;swY=t.clientY;
  swOK=!swipeBlocked(e.target);
},{passive:true});
document.addEventListener("touchend",function(e){
  if(!swOK)return;
  swOK=false;
  var t=e.changedTouches&&e.changedTouches[0];
  if(!t)return;
  var dx=t.clientX-swX, dy=t.clientY-swY;
  /* 距離要夠長,而且水平位移明顯大於垂直,才算是切頁手勢 */
  if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.8)return;
  var i=SWIPE_PAGES.indexOf(curPage);
  if(i<0)return;
  var next=dx<0?i+1:i-1;
  if(next<0||next>=SWIPE_PAGES.length)return;
  goPage(SWIPE_PAGES[next]);
},{passive:true});
