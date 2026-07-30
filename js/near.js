"use strict";
/* ================= 頁 3:附近探索 ================= */
var nearData=[], nearCatSel=[], nearR=1000, myPos=null, nearMode="explore", nearKwActive=null;
var LS_G="pocket_geo_v1", geoCache={};
try{geoCache=JSON.parse(localStorage.getItem(LS_G))||{};}catch(e){geoCache={};}
function saveGeo(){localStorage.setItem(LS_G,JSON.stringify(geoCache));}
function haversine(a,b,c,d){
  var R=6371000,r=Math.PI/180;
  var x=Math.sin((c-a)*r/2),y=Math.sin((d-b)*r/2);
  var h=x*x+Math.cos(a*r)*Math.cos(c*r)*y*y;
  return 2*R*Math.asin(Math.sqrt(h));
}
function distTxt(m){return m<1000?Math.round(m)+" 公尺":(m/1000).toFixed(1)+" 公里";}
var OSM_FOOD={restaurant:1,fast_food:1,food_court:1,ice_cream:1,bar:1,pub:1,biergarten:1,marketplace:1,nightclub:1};
var OSM_FOOD_SHOP={bakery:1,confectionery:1,pastry:1,beverages:1,deli:1,chocolate:1,seafood:1,
  butcher:1,greengrocer:1,alcohol:1,wine:1,convenience:1,supermarket:1,farm:1,dairy:1,cheese:1};
var FOOD_SUB_KW=[
  ["飲料",["飲料","手搖","茶飲","果汁","juice","bubble tea","boba","comebuy","五十嵐","可不可","迷客夏","清心","japan tea","歇腳亭","一沐日","茶湯會","cha","tea stand"]],
  ["火鍋",["火鍋","涮涮鍋","麻辣燙","鍋物","hotpot","hot pot","hot_pot"]],
  ["燒肉",["燒肉","燒烤","烤肉","炭火","yakiniku","bbq","barbecue"]],
  ["日式料理",["日式","日本料理","壽司","拉麵","丼","居酒屋","燒鳥","定食","sushi","ramen","izakaya","japanese"]],
  ["異國料理",["義式","義大利","法式","美式","墨西哥","泰式","韓式","印度","中東","越式","越南","西班牙","希臘","義大利麵","pizza","pasta","taco","curry","korean","thai","indian","italian","french","mexican","vietnamese","spanish","greek"]],
  ["台式料理",["台式","便當","滷味","肉圓","蚵仔煎","米粉","擔仔麵","切仔麵","魯肉飯","控肉飯","台菜"]],
  ["小吃",["小吃","夜市","路邊攤","攤","brunch","攤販","小攤"]]
];
function fineFoodCat(text){
  var n=(text||"").toLowerCase();
  for(var i=0;i<FOOD_SUB_KW.length;i++){
    for(var j=0;j<FOOD_SUB_KW[i][1].length;j++){
      if(n.indexOf(FOOD_SUB_KW[i][1][j].toLowerCase())>=0)return FOOD_SUB_KW[i][0];
    }
  }
  return null;
}
function isFoodCat(c){return c==="美食"||c==="咖啡"||FOOD_SUB.indexOf(c)>=0;}
function osmCat(t){
  var isCafeTag=t.amenity==="cafe"||t.shop==="coffee"||t.shop==="tea";
  var isFoodTag=OSM_FOOD[t.amenity]||OSM_FOOD_SHOP[t.shop];
  if(isCafeTag||isFoodTag){
    var fine=fineFoodCat((t.name||"")+" "+(t.cuisine||""));
    if(fine)return fine;
    return isCafeTag?"咖啡":"美食";
  }
  return "景點";
}
$("btnLoc").addEventListener("click",function(){
  if(!navigator.geolocation){$("locStat").textContent="這個瀏覽器不支援定位。";return;}
  $("btnLoc").disabled=true;
  $("locStat").innerHTML='<span class="spin">◌</span> 正在定位…(需要允許位置權限)';
  navigator.geolocation.getCurrentPosition(function(pos){
    myPos={lat:pos.coords.latitude,lng:pos.coords.longitude};
    $("nearTopbar").classList.remove("idle");
    $("ntbTitle").textContent="附近探索";
    refreshNearView();
  },function(err){
    $("btnLoc").disabled=false;
    $("locStat").textContent="無法取得位置:"+(err.code===1?"你拒絕了位置權限,請到瀏覽器設定開啟。":"請確認 GPS 已開啟後再試一次。");
  },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
});
function openNearFilter(){$("nfBk").classList.add("show");$("nfSheet").classList.add("show");}
function closeNearFilter(){$("nfBk").classList.remove("show");$("nfSheet").classList.remove("show");}
var bigMapPending=false;
function openBigMap(){
  if(!myPos){toast("先定位你的位置");return;}
  $("bmBk").classList.add("show");$("bmSheet").classList.add("show");
  if(!gKey()){
    $("bigMapBox").innerHTML='放大看地圖需要 Google 地圖資料。<br><a href="javascript:void(0)" onclick="closeBigMap();openGSet();" style="color:var(--a-text);font-weight:700;text-decoration:underline;">前往設定加入金鑰 ›</a>';
    return;
  }
  $("bigMapBox").innerHTML='<span class="spin">◌</span>&nbsp; 地圖載入中…';
  if(gmapsLoaded)renderBigMap();
  else{bigMapPending=true;ensureGoogleMapsLoaded();}
}
function renderBigMap(){
  if(!myPos||!$("bmSheet").classList.contains("show"))return;
  $("bigMapBox").innerHTML="";$("bigMapBox").style.display="block";
  var map=new google.maps.Map($("bigMapBox"),{center:{lat:myPos.lat,lng:myPos.lng},zoom:15,
    disableDefaultUI:true,zoomControl:true,gestureHandling:"greedy"});
  new google.maps.Marker({position:myPos,map:map,zIndex:999,
    icon:{path:google.maps.SymbolPath.CIRCLE,scale:7,fillColor:"#4C9EFF",fillOpacity:1,strokeColor:"#fff",strokeWeight:2}});
  nearRows().forEach(function(x){
    if(typeof x.lat!=="number"||typeof x.lng!=="number")return;
    new google.maps.Marker({position:{lat:x.lat,lng:x.lng},map:map,title:x.name});
  });
}
function onGmapsReadyNear(){
  if(bigMapPending){bigMapPending=false;renderBigMap();}
}
function closeBigMap(){$("bmBk").classList.remove("show");$("bmSheet").classList.remove("show");}
$("nearRBtns").querySelectorAll(".distCircle").forEach(function(b){
  b.addEventListener("click",function(){
    nearR=+b.dataset.r;
    $("nearRBtns").querySelectorAll(".distCircle").forEach(function(x){x.classList.remove("on");});
    $("nearRBtns").querySelectorAll(".distCap").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    b.nextElementSibling.classList.add("on");
    $("frRange").textContent=b.textContent+" 公里";
    if(myPos)refreshNearView();
  });
});
$("btnExpandMap").addEventListener("click",function(e){e.stopPropagation();openBigMap();});
function nearKwSearch(){
  var kw=$("nearKw").value.trim();
  if(!kw){$("nearKw").focus();return;}
  if(!myPos){toast("先定位你的位置");return;}
  nearKwRun(kw);
}
function nearKwRun(kw){
  if(!gKey()){
    nearKwActive=null;
    var hint=$("nearKwHint");
    hint.style.display="block";
    hint.innerHTML="自訂關鍵字搜尋需要 Google 地圖資料,免費的 OSM 模式店名資料不齊全,查不準。"+
      '<a href="javascript:void(0)" onclick="openGSet()" style="color:inherit;font-weight:700;text-decoration:underline;">前往設定加入金鑰 ›</a>';
    return;
  }
  $("nearKwHint").style.display="none";
  nearMode="explore";nearCatSel=[];
  $("nmMineBtn").checked=false;$("frMine").style.display="none";
  $("btnLoc").disabled=true;
  $("locStat").innerHTML='<span class="spin">◌</span> 正在用 Google 搜尋「'+esc(kw)+'」…';
  $("nearList").innerHTML="";
  googleTextSearch(kw,nearR,function(rows){
    nearKwActive=kw;
    nearData=rows.slice(0,90);
    $("btnLoc").disabled=false;
    $("locStat").textContent="「"+kw+"」找到 "+nearData.length+" 個地點(依距離排序)";
    $("nearCtrl").style.display="flex";$("nearCtrl").style.flexDirection="column";$("nearOut").style.display="flex";
    renderNearCats();renderNearSort();renderNear();
    var hint=$("nearKwHint");
    hint.style.display="block";
    hint.innerHTML="🔍 目前顯示「"+esc(kw)+'」的搜尋結果 <a href="javascript:void(0)" id="nearKwClear" style="color:inherit;font-weight:700;text-decoration:underline;margin-left:6px;">✕ 清除</a>';
    var c=$("nearKwClear");
    if(c)c.onclick=function(){nearKwActive=null;$("nearKw").value="";$("nearKwHint").style.display="none";fetchNear();};
  },function(e){
    $("btnLoc").disabled=false;
    var msg;
    if(e==="no-key")msg="尚未設定金鑰";
    else if(e.indexOf("cap:")===0)msg="已達今日上限("+e.slice(4)+" 次),明天再試或到設定調整";
    else if(/API key|API_KEY|denied|PERMISSION/i.test(e))msg="金鑰無效或未授權此網址,請到設定檢查";
    else msg="Google 查詢失敗:"+e;
    $("locStat").textContent=msg;
  });
}
$("nearKwGo").addEventListener("click",nearKwSearch);
$("nearKw").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();nearKwSearch();}});
$("nearSortBtns").querySelectorAll(".sortCircle").forEach(function(b){
  b.addEventListener("click",function(){
    nearSort=b.dataset.s;
    $("nearSortBtns").querySelectorAll(".sortCircle").forEach(function(x){x.classList.remove("on");});
    $("nearSortBtns").querySelectorAll(".distCap").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    b.nextElementSibling.classList.add("on");
    $("frSort").textContent=b.nextElementSibling.textContent;
    renderNear();
  });
});
$("nmMineBtn").addEventListener("change",function(){
  setNearMode(this.checked?"mine":"explore");
});
function setNearMode(m){
  nearMode=m;nearCatSel=[];
  if(m==="mine"){nearKwActive=null;$("nearKw").value="";$("nearKwHint").style.display="none";}
  $("nmMineBtn").checked=(m==="mine");
  $("frMine").style.display=(m==="mine")?"inline":"none";
  if(myPos)refreshNearView();
  else $("locStat").textContent=m==="mine"?"按上方定位後,列出你口袋名單裡離你最近的景點":"找出附近的景點與美食(資料來源:OpenStreetMap)";
}
function refreshNearView(){
  if(nearMode==="explore"){
    if(nearKwActive)nearKwRun(nearKwActive);
    else fetchNear();
  }else mineNear();
}
var geoBusy=false;
function coordOf(p){
  if(p.lat&&p.lng)return {lat:p.lat,lng:p.lng};
  var c=geoCache[p.name];
  if(c&&c.lat)return c;
  return null;
}
function mineNear(){
  $("btnLoc").disabled=false;
  $("nearCtrl").style.display="flex";$("nearCtrl").style.flexDirection="column";$("nearOut").style.display="flex";
  var noCoord=places.filter(function(p){return !coordOf(p)&&!(geoCache[p.name]&&geoCache[p.name].miss);});
  renderMine();
  if(noCoord.length&&!geoBusy)geocodeQueue(noCoord.slice(0,25));
}
function geocodeQueue(queue){
  geoBusy=true;
  var total=queue.length,done=0;
  function next(){
    if(!queue.length){geoBusy=false;saveGeo();renderMine();return;}
    var p=queue.shift();done++;
    $("locStat").innerHTML='<span class="spin">◌</span> 正在為口袋名單定位('+done+'/'+total+')…第一次比較久,結果會記住';
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(p.name))
    .then(function(r){return r.json();})
    .then(function(js){
      if(js&&js[0])geoCache[p.name]={lat:+js[0].lat,lng:+js[0].lon};
      else geoCache[p.name]={miss:true};
    })
    .catch(function(){})
    .then(function(){saveGeo();renderMine();setTimeout(next,1100);});
  }
  next();
}
function catFilter(rows){
  return nearCatSel.length===0?rows:rows.filter(function(x){return nearCatSel.indexOf(x.cat)>=0;});
}
var CATICON={
  "景點":'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/></svg>',
  "美食":'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a3 3 0 006 0V3M9 3v18M17 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/></svg>',
  "咖啡":'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h13v5a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M17 9h2a2 2 0 010 4h-2"/></svg>',
  "購物":'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M6 6L5 3H3"/></svg>',
  "住宿":'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20V5a1 1 0 011-1h2v16"/><path d="M6 10h14v10"/><path d="M6 14h14"/></svg>'
};
var CATICON_DEF='<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
var CATICON_ALL='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>';
var ICR={
  map:'<svg width="17" height="17" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.6 6.4 11.6 7.03 12.18a.7.7 0 0 0 .94 0C13.1 21.1 19.5 15.1 19.5 9.5 19.5 5.36 16.14 2 12 2z"/><circle cx="12" cy="9.5" r="3.1" fill="#fff"/></svg>',
  tabe:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F5860C" stroke-width="2" stroke-linecap="round"><line x1="4" y1="20" x2="17" y2="5"/><line x1="8" y1="20" x2="20" y2="7"/><circle cx="12.3" cy="11.8" r="1.4" fill="#F5860C" stroke="none"/></svg>'
};
function renderCatChips(rows,onChange){
  var seen=[];
  rows.forEach(function(x){if(seen.indexOf(x.cat)<0)seen.push(x.cat);});
  nearCatSel=nearCatSel.filter(function(c){return seen.indexOf(c)>=0;});
  $("nearCats").innerHTML='<button class="chip'+(nearCatSel.length===0?" on":"")+'" data-c="__all__"><span class="nc-ic">'+CATICON_ALL+'</span>全部</button>'+
    seen.map(function(c){
      return '<button class="chip'+(nearCatSel.indexOf(c)>=0?" on":"")+'" data-c="'+attr(c)+'"><span class="nc-ic">'+(CATICON[c]||CATICON_DEF)+'</span>'+esc(c)+'</button>';
    }).join("");
  $("nearCats").querySelectorAll(".chip").forEach(function(b){
    b.addEventListener("click",function(){
      var c=b.dataset.c;
      if(c==="__all__")nearCatSel=[];
      else{
        var i=nearCatSel.indexOf(c);
        if(i>=0)nearCatSel.splice(i,1);else nearCatSel.push(c);
      }
      onChange();
    });
  });
}
function renderMine(){
  var r=nearR;
  var rows=[],unknown=0;
  places.forEach(function(p){
    var c=coordOf(p);
    if(!c){unknown++;return;}
    var d=haversine(myPos.lat,myPos.lng,c.lat,c.lng);
    if(d<=r)rows.push({id:p.id,name:p.name,cat:p.cat,list:p.list,d:d,photoUrl:p.photoUrl});
  });
  rows.sort(function(a,b){return a.d-b.d;});
  renderCatChips(rows,renderMine);
  if(!geoBusy)$("locStat").textContent="你的口袋名單裡有 "+rows.length+" 個景點在 "+distTxt(r)+" 內"+(unknown?"(另有 "+unknown+" 個暫時無法定位)":"");
  var show=catFilter(rows);
  $("nearList").innerHTML=show.length?show.map(function(x){
    var food=isFoodCat(x.cat);
    return '<div class="place"><div class="place-top">'+placeThumb(x)+'<div class="place-body">'+
    '<div class="name">'+esc(x.name)+'</div>'+
    '<div class="cat-line">'+esc(x.cat)+'・'+esc(x.list)+'　'+IC.walk+' '+distTxt(x.d)+'</div>'+
    '</div>'+
    '<div class="place-actions">'+
    '<button class="btn-round" data-map="'+attr(x.name)+'" aria-label="開Google地圖" title="開Google地圖">'+ICR.map+'</button>'+
    (food?'<button class="btn-round" data-tabe="'+attr(x.name)+'" aria-label="Tabelog搜尋" title="Tabelog搜尋">'+ICR.tabe+'</button>':'')+
    '</div>'+
    '</div></div>';
  }).join(""):'<p class="empty">'+(geoBusy?"定位中,結果會陸續出現…":"這個範圍內沒有你名單裡的景點,試著加大範圍。")+'</p>';
  $("nearList").querySelectorAll("[data-map]").forEach(function(b){b.addEventListener("click",function(){gmapSearch(b.dataset.map);});});
  $("nearList").querySelectorAll("[data-tabe]").forEach(function(b){b.addEventListener("click",function(){tabelog(b.dataset.tabe);});});
}
function fetchNear(){
  var r=nearR;
  if(gKey()){ return fetchNearGoogle(r); }
  $("locStat").innerHTML='<span class="spin">◌</span> 正在搜尋附近 '+distTxt(+r)+' 內的景點與美食…';
  $("nearList").innerHTML="";
  var A="(around:"+r+","+myPos.lat+","+myPos.lng+");";
  var q="[out:json][timeout:25];("+
    'nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream|bar|pub|biergarten|marketplace|nightclub)$"]'+A+
    'nwr["shop"~"^(bakery|confectionery|pastry|tea|coffee|beverages|deli|chocolate|seafood|butcher|greengrocer|alcohol|wine|convenience|supermarket)$"]'+A+
    'nwr["tourism"~"^(attraction|museum|viewpoint|artwork|gallery|zoo|theme_park|aquarium)$"]'+A+
    'nwr["historic"~"^(monument|memorial|castle|ruins|archaeological_site|manor|fort|ship|city_gate|citywalls)$"]'+A+
    'nwr["leisure"~"^(park|garden)$"]'+A+
    ");out center 800;";
  fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent(q),
    headers:{"Content-Type":"application/x-www-form-urlencoded"}})
  .then(function(res){if(!res.ok)throw new Error("overpass "+res.status);return res.json();})
  .then(function(js){
    var seen={};
    nearData=(js.elements||[]).map(function(e){
      var t=e.tags||{},n=t["name:zh"]||t.name;
      if(!n)return null;
      var lat=e.lat||(e.center&&e.center.lat),lng=e.lon||(e.center&&e.center.lon);
      if(!lat)return null;
      var key=n+"@"+lat.toFixed(3)+","+lng.toFixed(3);
      if(seen[key])return null;seen[key]=1;
      return {name:n,cat:osmCat(t),d:haversine(myPos.lat,myPos.lng,lat,lng)};
    }).filter(Boolean).sort(function(a,b){return a.d-b.d;}).slice(0,90);
    $("btnLoc").disabled=false;
    $("locStat").textContent="找到 "+nearData.length+" 個地點(依距離排序)";
    $("nearCtrl").style.display="flex";$("nearCtrl").style.flexDirection="column";$("nearOut").style.display="flex";
    renderNearCats();renderNearSort();renderNear();
  })
  .catch(function(){
    $("btnLoc").disabled=false;
    $("locStat").textContent="附近搜尋暫時無法使用(伺服器忙碌),稍後再試,或直接用下方按鈕開 Google 地圖 / Tabelog。";
    $("nearOut").style.display="flex";
  });
}

function fetchNearGoogle(r){
  $("locStat").innerHTML='<span class="spin">◌</span> 正在用 Google 搜尋附近 '+distTxt(+r)+'…';
  $("nearList").innerHTML="";
  googleNearby(r,function(rows){
    nearData=rows.slice(0,90);
    $("btnLoc").disabled=false;
    $("locStat").textContent="找到 "+nearData.length+" 個地點(依距離排序)";
    $("nearCtrl").style.display="flex";$("nearCtrl").style.flexDirection="column";$("btnGNear").style.display="block";
    renderSrcBar();renderNearCats();renderNearSort();renderNear();
    if($("gsSheet")&&$("gsSheet").classList.contains("show"))openGSet();
  },function(e){
    $("btnLoc").disabled=false;
    var msg;
    if(e==="no-key")msg="尚未設定金鑰";
    else if(e.indexOf("cap:")===0)msg="已達今日上限("+e.slice(4)+" 次),明天再試或到設定調整";
    else if(/API key|API_KEY|denied|PERMISSION/i.test(e))msg="金鑰無效或未授權此網址,請到設定檢查";
    else msg="Google 查詢失敗:"+e;
    $("locStat").textContent=msg;
    $("btnGNear").style.display="block";
    renderSrcBar();
  });
}
function renderNearCats(){
  renderCatChips(nearData,function(){renderNearCats();renderNear();});
}
var nearSort="dist";
function renderNearSort(){
  var hasRating=nearData.some(function(x){return typeof x.rating==="number";});
  var ratingItem=$("nearSortBtns").querySelector('[data-s="rating"]').closest(".distItem");
  if(!hasRating){
    ratingItem.style.display="none";
    if(nearSort==="rating")nearSort="dist";
  }else{
    ratingItem.style.display="";
  }
  $("nearSortBtns").querySelectorAll(".sortCircle").forEach(function(b){
    var on=b.dataset.s===nearSort;
    b.classList.toggle("on",on);
    b.nextElementSibling.classList.toggle("on",on);
  });
}
function nearRows(){
  var rows=catFilter(nearData).slice();
  if(nearSort==="rating"){
    rows.sort(function(a,b){
      var ra=(typeof a.rating==="number")?a.rating:-1, rb=(typeof b.rating==="number")?b.rating:-1;
      if(rb!==ra)return rb-ra;
      return a.d-b.d;
    });
  }else if(nearSort==="inlist"){
    rows.sort(function(a,b){
      var ia=hasPlace(a.name)?1:0, ib=hasPlace(b.name)?1:0;
      if(ib!==ia)return ib-ia;
      return a.d-b.d;
    });
  }else{
    rows.sort(function(a,b){return a.d-b.d;});
  }
  return rows;
}
function renderNear(){
  var rows=nearRows();
  $("nearList").innerHTML=rows.length?rows.map(function(x,i){
    var inL=hasPlace(x.name);
    var food=isFoodCat(x.cat);
    var metaLine=esc(x.cat)+'・'+distTxt(x.d)+
      (typeof x.rating==="number"?'　<span class="g-star2">★'+x.rating.toFixed(1)+'</span>':'')+
      (x.open===true?'<span class="g-open">　● 營業中</span>':(x.open===false?'<span class="g-closed">　● 已打烊</span>':''));
    return '<div class="place"><div class="place-top">'+placeThumb({id:x.placeId||x.name,name:x.name,photoUrl:x.photoUrl})+
    '<div class="place-body">'+
    '<div class="name">'+esc(x.name)+'</div>'+
    '<div class="cat-line">'+metaLine+'</div>'+
    (x.addr?'<div class="g-addr">'+esc(x.addr)+'</div>':'')+
    '</div>'+
    '<div class="place-actions">'+
    '<button class="btn-round" data-map="'+attr(x.name)+'" aria-label="開Google地圖" title="開Google地圖">'+ICR.map+'</button>'+
    (food?'<button class="btn-round" data-tabe="'+attr(x.name)+'" aria-label="Tabelog搜尋" title="Tabelog搜尋">'+ICR.tabe+'</button>':'')+
    (inL?'<span class="near-add on">'+IC.check+'</span>':'<button class="near-add" data-nadd="'+i+'" aria-label="加入名單">'+IC.plus+'</button>')+
    '</div>'+
    '</div></div>';
  }).join(""):'<p class="empty">這個分類附近沒有結果,換個分類或加大範圍試試。</p>';
  $("nearList").querySelectorAll("[data-map]").forEach(function(b){b.addEventListener("click",function(){gmapSearch(b.dataset.map);});});
  $("nearList").querySelectorAll("[data-tabe]").forEach(function(b){b.addEventListener("click",function(){tabelog(b.dataset.tabe);});});
  $("nearList").querySelectorAll("[data-nadd]").forEach(function(b){
    b.addEventListener("click",function(){
      var rows2=nearRows();
      var x=rows2[+b.dataset.nadd];
      if(!x||hasPlace(x.name))return;
      if(cats.indexOf(x.cat)<0)cats.push(x.cat);
      var item={id:uid(),name:x.name,cat:x.cat,list:lists[0],note:"",done:false};
      if(x.lat&&x.lng){item.lat=x.lat;item.lng=x.lng;}
      places.unshift(item);
      save();renderList();renderNear();refreshSelects(null);toast("已加入「"+x.name+"」");
    });
  });
}
$("btnGNear").addEventListener("click",function(){
  var u=myPos?"https://www.google.com/maps/search/"+encodeURIComponent("附近的景點")+"/@"+myPos.lat+","+myPos.lng+",15z"
    :"https://www.google.com/maps/search/"+encodeURIComponent("附近的景點");
  window.open(u,"_blank");
});
$("btnTabeNear").addEventListener("click",function(){
  if(!myPos){tabelog("");return;}
  var old=$("btnTabeNear").textContent;
  $("btnTabeNear").textContent="定位地區中…";$("btnTabeNear").disabled=true;
  fetch("https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ja&zoom=14&lat="+myPos.lat+"&lon="+myPos.lng)
  .then(function(r){return r.json();})
  .then(function(js){
    var a=(js&&js.address)||{};
    var area=a.neighbourhood||a.suburb||a.quarter||a.city_district||a.town||a.city||a.county||"";
    tabelog(area||"");
  })
  .catch(function(){tabelog("");})
  .then(function(){$("btnTabeNear").textContent=old;$("btnTabeNear").disabled=false;});
});

