"use strict";
/* ================= Google Places 資料源 ================= */
var LS_GK="pocket_gkey_v1", LS_GU="pocket_gusage_v1", LS_GR="pocket_grating_v1", LS_GC="pocket_gcap_v1";
function gKey(){return (localStorage.getItem(LS_GK)||"").trim();}
function gRating(){var v=localStorage.getItem(LS_GR);return v===null?false:v!=="0";}   /* 預設關閉,省額度;使用者手動開過就照使用者的選擇 */
function gCap(){var v=localStorage.getItem(LS_GC);return v===null?150:(+v||0);}
function ymNow(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2);}
function dayNow(){var d=new Date();return ymNow()+"-"+("0"+d.getDate()).slice(-2);}
function gUsage(){
  var u;try{u=JSON.parse(localStorage.getItem(LS_GU))||{};}catch(e){u={};}
  if(u.ym!==ymNow()){u={ym:ymNow(),n:0,day:dayNow(),dn:0};}
  if(u.day!==dayNow()){u.day=dayNow();u.dn=0;}
  return u;
}
function gBump(){var u=gUsage();u.n=(u.n||0)+1;u.dn=(u.dn||0)+1;localStorage.setItem(LS_GU,JSON.stringify(u));return u;}
function gFreeCap(){return gRating()?1000:5000;}   /* 含評分屬 Enterprise 級,額度較少 */

/* ---- 分項用量追蹤(涵蓋 App 有用到的每一種 Google 服務,免費額度依官方2026年價目表) ---- */
var LS_GD="pocket_gusage_detail_v1";
var G_DETAIL_CATS=[
  {key:"nearby",         label:"附近搜尋 Nearby Search",       cap:function(){return gRating()?1000:5000;}},
  {key:"textsearch",     label:"關鍵字/照片查詢 Text Search",   cap:function(){return gRating()?1000:5000;}},
  {key:"photos",         label:"地點縮圖照片 Place Photos",     cap:function(){return 1000;}},
  {key:"mapsjs",         label:"地圖顯示 Maps JavaScript",      cap:function(){return 10000;}},
  {key:"distancematrix", label:"交通時間 Distance Matrix",      cap:function(){return 10000;}},
  {key:"directions",     label:"路線繪製 Directions",           cap:function(){return 10000;}},
  {key:"autocomplete",   label:"地址自動完成 Autocomplete",     cap:function(){return 10000;}},
  {key:"geocoding",      label:"地址轉座標 Geocoding",          cap:function(){return 10000;}}
];
function gDetailUsage(){
  var u;try{u=JSON.parse(localStorage.getItem(LS_GD))||{};}catch(e){u={};}
  if(u.ym!==ymNow()){u={ym:ymNow()};}
  G_DETAIL_CATS.forEach(function(c){if(typeof u[c.key]!=="number")u[c.key]=0;});
  return u;
}
function gTrackDetail(key){
  var u=gDetailUsage();
  u[key]=(u[key]||0)+1;
  localStorage.setItem(LS_GD,JSON.stringify(u));
  if($("gsSheet")&&$("gsSheet").classList.contains("show"))renderGDetail();
}
function renderGDetail(){
  var el=$("gDetail"); if(!el)return;
  if(!gKey()){el.innerHTML="";return;}
  var u=gDetailUsage();
  el.innerHTML=G_DETAIL_CATS.map(function(c){
    var used=u[c.key]||0, cap=c.cap();
    var pct=Math.min(100,Math.round(used/cap*100));
    var over=used>cap;
    return '<div class="kv gd-row"><span>'+c.label+'</span>'+
      '<span style="color:'+(over?"var(--danger)":"var(--text2)")+'">'+used.toLocaleString()+' / '+cap.toLocaleString()+'</span></div>'+
      '<div class="q-bar" style="margin:2px 0 10px;"><i style="width:'+pct+'%'+(over?';background:var(--danger)':'')+'"></i></div>';
  }).join("");
}

var G_TYPES=["restaurant","cafe","bakery","bar","meal_takeaway","tourist_attraction",
             "museum","park","art_gallery","shopping_mall","food_court","ice_cream_shop",
             "sandwich_shop","convenience_store","supermarket","liquor_store","butcher_shop",
             "grocery_store","night_club"];
var G_FOOD={restaurant:1,cafe:1,bakery:1,bar:1,meal_takeaway:1,meal_delivery:1,
            ice_cream_shop:1,sandwich_shop:1,food:1,coffee_shop:1,convenience_store:1,
            supermarket:1,liquor_store:1,butcher_shop:1,grocery_store:1};
function gCat(types,name){
  types=types||[];
  var isCafeType=types.indexOf("cafe")>=0||types.indexOf("coffee_shop")>=0;
  var isFoodType=types.some(function(t){return G_FOOD[t];});
  if(isCafeType||isFoodType){
    var fine=fineFoodCat(name);
    if(fine)return fine;
    return isCafeType?"咖啡":"美食";
  }
  return "景點";
}
function googleNearby(radius,cb,err){
  var key=gKey();
  if(!key)return err("no-key");
  var u=gUsage(), cap=gCap();
  if(cap>0 && u.dn>=cap)return err("cap:"+cap);
  var mask="places.id,places.displayName,places.formattedAddress,places.location,places.types";
  if(gRating())mask+=",places.rating,places.userRatingCount,places.currentOpeningHours.openNow";
  fetch("https://places.googleapis.com/v1/places:searchNearby",{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":mask},
    body:JSON.stringify({
      includedTypes:G_TYPES, maxResultCount:20, rankPreference:"DISTANCE",
      locationRestriction:{circle:{center:{latitude:myPos.lat,longitude:myPos.lng},radius:+radius}},
      languageCode:"zh-TW"
    })
  }).then(function(r){
    if(!r.ok)return r.json().then(function(j){throw new Error((j.error&&j.error.message)||("HTTP "+r.status));});
    return r.json();
  }).then(function(js){
    gBump();gTrackDetail("nearby");
    var rows=(js.places||[]).map(function(p){
      var lat=p.location&&p.location.latitude, lng=p.location&&p.location.longitude;
      if(!p.displayName||!lat)return null;
      return {name:p.displayName.text, cat:gCat(p.types,p.displayName.text),
              d:haversine(myPos.lat,myPos.lng,lat,lng),
              lat:lat, lng:lng, addr:p.formattedAddress||"",
              rating:p.rating||null, cnt:p.userRatingCount||null,
              open:(p.currentOpeningHours&&typeof p.currentOpeningHours.openNow==="boolean")?p.currentOpeningHours.openNow:null};
    }).filter(Boolean).sort(function(a,b){return a.d-b.d;});
    cb(rows);
  }).catch(function(e){err(e.message||"error");});
}
function googlePlacePhoto(name,hint,cb,err){
  var key=gKey();
  if(!key)return err("no-key");
  var u=gUsage(), cap=gCap();
  if(cap>0 && u.dn>=cap)return err("cap:"+cap);
  var mask="places.id,places.photos,places.editorialSummary";
  if(gRating())mask+=",places.rating";
  fetch("https://places.googleapis.com/v1/places:searchText",{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":mask},
    body:JSON.stringify({textQuery:name+(hint?(" "+hint):""), maxResultCount:1, languageCode:"zh-TW"})
  }).then(function(r){
    if(!r.ok)return r.json().then(function(j){throw new Error((j.error&&j.error.message)||("HTTP "+r.status));});
    return r.json();
  }).then(function(js){
    gBump();gTrackDetail("textsearch");
    var p=(js.places||[])[0];
    if(!p){cb(null);return;}
    var photoName=p.photos&&p.photos[0]&&p.photos[0].name;
    var url=photoName?("https://places.googleapis.com/v1/"+photoName+"/media?maxWidthPx=300&key="+encodeURIComponent(key)):null;
    if(url)gTrackDetail("photos");
    var desc=p.editorialSummary&&p.editorialSummary.overview?p.editorialSummary.overview:null;
    var rating=typeof p.rating==="number"?p.rating:null;
    cb({placeId:p.id||null, photoUrl:url, autoDesc:desc, rating:rating});
  }).catch(function(e){err(e.message||"error");});
}
/* 背景排隊抓景點縮圖:一次一個,避免瞬間打爆額度;失敗或無金鑰就靜靜跳過
   同一次呼叫也會一併帶回評分(視「顯示評分」設定而定);已有照片但還沒有評分的舊景點也會補抓一次 */
var photoQueueBusy=false;
function queuePlacePhotos(){
  if(photoQueueBusy)return;
  if(!gKey())return;
  var target=places.filter(function(p){
    if(p.done)return false;
    if(!p.photoUrl && !p.photoAt)return true;
    if(gRating() && typeof p.rating!=="number" && !p.ratingAt)return true;
    return false;
  })[0];
  if(!target)return;
  photoQueueBusy=true;
  googlePlacePhoto(target.name, target.list||"", function(res){
    target.photoAt=Date.now();
    target.ratingAt=Date.now();
    if(res){
      if(res.placeId)target.placeId=res.placeId;
      if(res.photoUrl)target.photoUrl=res.photoUrl;
      if(res.autoDesc)target.autoDesc=res.autoDesc;
      if(typeof res.rating==="number")target.rating=res.rating;
    }
    save();
    patchThumbDom(target);
    photoQueueBusy=false;
    setTimeout(queuePlacePhotos,400);
  }, function(e){
    photoQueueBusy=false;
    if(String(e).indexOf("cap:")===0)return; /* 額度用完,今天先停,不標記已嘗試,明天會再排 */
    target.photoAt=Date.now(); /* 其他錯誤(找不到景點等)標記已嘗試,避免每次都重打 */
    target.ratingAt=Date.now();
    save();
    setTimeout(queuePlacePhotos,400);
  });
}
function patchThumbDom(x){
  var el=document.querySelector('.place-thumb[data-tid="'+x.id+'"]');
  if(!el)return;
  if(x.photoUrl){
    el.style.background=""; el.style.color="";
    el.innerHTML="";
    var img=document.createElement("img");
    img.alt=""; img.loading="lazy";
    img.onerror=function(){
      el.style.background=placeGradient(x.id||x.name);
      if(img.parentNode)img.parentNode.removeChild(img);
    };
    img.src=x.photoUrl;
    el.appendChild(img);
  }
  var card=el.closest(".place");
  if(!card)return;
  if(typeof x.rating==="number"){
    var line=card.querySelector(".cat-line");
    if(line&&!line.querySelector(".rate-inline")){
      var span=document.createElement("span");
      span.className="rate-inline";
      span.textContent="★ "+x.rating.toFixed(1);
      line.appendChild(span);
    }
  }
  if((x.note||x.autoDesc)&&!card.querySelector(".note")){
    var body=card.querySelector(".place-body");
    if(body){
      var p=document.createElement("p");
      p.className="note";
      p.textContent=x.note||x.autoDesc;
      body.appendChild(p);
    }
  }
}
function googleTextSearch(query,radius,cb,err){
  var key=gKey();
  if(!key)return err("no-key");
  var u=gUsage(), cap=gCap();
  if(cap>0 && u.dn>=cap)return err("cap:"+cap);
  var mask="places.id,places.displayName,places.formattedAddress,places.location,places.types";
  if(gRating())mask+=",places.rating,places.userRatingCount,places.currentOpeningHours.openNow";
  fetch("https://places.googleapis.com/v1/places:searchText",{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":mask},
    body:JSON.stringify({
      textQuery:query, maxResultCount:20, rankPreference:"DISTANCE",
      locationBias:{circle:{center:{latitude:myPos.lat,longitude:myPos.lng},radius:+radius}},
      languageCode:"zh-TW"
    })
  }).then(function(r){
    if(!r.ok)return r.json().then(function(j){throw new Error((j.error&&j.error.message)||("HTTP "+r.status));});
    return r.json();
  }).then(function(js){
    gBump();gTrackDetail("textsearch");
    var rows=(js.places||[]).map(function(p){
      var lat=p.location&&p.location.latitude, lng=p.location&&p.location.longitude;
      if(!p.displayName||!lat)return null;
      return {name:p.displayName.text, cat:gCat(p.types,p.displayName.text),
              d:haversine(myPos.lat,myPos.lng,lat,lng),
              lat:lat, lng:lng, addr:p.formattedAddress||"",
              rating:p.rating||null, cnt:p.userRatingCount||null,
              open:(p.currentOpeningHours&&typeof p.currentOpeningHours.openNow==="boolean")?p.currentOpeningHours.openNow:null};
    }).filter(Boolean).sort(function(a,b){return a.d-b.d;});
    cb(rows);
  }).catch(function(e){err(e.message||"error");});
}
function renderSrcBar(){
  var el=$("srcBar"); if(!el)return;
  var k=gKey(), u=gUsage(), cap=gFreeCap(), dcap=gCap();
  var leftM=Math.max(0,cap-(u.n||0)), leftD=dcap>0?Math.max(0,dcap-(u.dn||0)):null;
  el.innerHTML='<span class="src-dot" style="background:'+(k?"#6BB6FF":"var(--muted)")+'"></span>'+
   '<span style="flex:1;min-width:0">'+
     '<span class="src-t">'+(k?"Google 地圖資料":"OpenStreetMap")+'</span>'+
     '<span class="mtag" style="margin-left:6px">'+(k?"已設定金鑰":"免金鑰")+'</span>'+
     '<span class="src-s" style="display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+
       (k
         ? "本月剩 "+leftM.toLocaleString()+" 次"+(leftD!==null?"・今日剩 "+leftD+" 次":"")
         : "免費・小店較少・設金鑰可切換 Google")+
     '</span>'+
   '</span><span style="color:var(--muted);font-size:13px;white-space:nowrap">設定 ›</span>';
}
/* ---- 設定面板 ---- */
function openGSet(){
  var k=gKey(),u=gUsage();
  $("gkInput").value=k;
  $("gRate").checked=gRating();
  $("gCapSel").value=String(gCap());
  var cap=gFreeCap(), leftM=Math.max(0,cap-(u.n||0)), dcap=gCap();
  $("gStat").innerHTML= k
    ? '<div class="quota"><div class="q-n">'+leftM.toLocaleString()+'</div>'+
      '<div class="q-k">本月剩餘免費次數</div>'+
      '<div class="q-bar"><i style="width:'+Math.min(100,Math.round((u.n||0)/cap*100))+'%"></i></div>'+
      '<div class="q-s">已用 '+(u.n||0)+' / '+cap.toLocaleString()+' 次・每月 1 號歸零</div></div>'+
      '<div class="kv"><span>今日已用</span><span>'+(u.dn||0)+(dcap>0?" / "+dcap+" 次(還剩 "+Math.max(0,dcap-(u.dn||0))+")":" 次(未限制)")+'</span></div>'+
      '<div class="kv"><span>免費額度依據</span><span>'+(gRating()?"含評分 1,000 次/月":"不含評分 5,000 次/月")+'</span></div>'+
      '<div class="kv"><span>預估費用</span><span style="color:'+((u.n||0)<=cap?"var(--ok)":"var(--danger)")+'">'+((u.n||0)<=cap?"$0":"已超出免費額度")+'</span></div>'
    : '<p class="note" style="margin:0">尚未設定金鑰,目前使用免費的 OpenStreetMap(無次數限制)。<br>設定金鑰後,這裡會顯示本月剩餘的免費查詢次數。</p>';
  renderGDetail();
  $("gsBk").classList.add("show");$("gsSheet").classList.add("show");
}
function closeGSet(){$("gsBk").classList.remove("show");$("gsSheet").classList.remove("show");}
function saveGSet(){
  localStorage.setItem(LS_GK,$("gkInput").value.trim());
  localStorage.setItem(LS_GR,$("gRate").checked?"1":"0");
  localStorage.setItem(LS_GC,$("gCapSel").value);
  renderSrcBar();closeGSet();
  toast(gKey()?"已切換到 Google 資料":"已切回 OpenStreetMap");
  ensureGoogleMapsLoaded();
}

