"use strict";
/* ================= 捷運圖 ================= */
var mCity="大阪", mST=[], mSc=1, mTx=0, mTy=0, mLine=null, mPos=null, mNearIdx=-1, mRecent=[];
var mSvg,mRoot,mWrap;
function mInit(){
  mSvg=$("mMap"); mRoot=$("mRoot"); mWrap=$("mWrap");
  $("mCities").innerHTML=Object.keys(METRO).filter(function(c){return c!=="台北";}).map(function(c){
    return '<button data-c="'+c+'">'+c+'</button>';}).join("");
  $("mCities").querySelectorAll("button").forEach(function(b){
    b.onclick=function(){mLoad(b.dataset.c);};});
  $("mZin").onclick=function(){mZoom(1.4);};
  $("mZout").onclick=function(){mZoom(1/1.4);};
  $("mFit").onclick=function(){mSc=1;mTx=0;mTy=0;mApply();};
  $("mLoc").onclick=mLocate;
  $("mInfo").onclick=mShowInfo;
  $("mHelp").onclick=mShowHelp;
  $("mFs").onclick=mToggleFullscreen;
  $("rpToggle").onclick=function(){
    var open=$("rpBody").style.display!=="none";
    $("rpBody").style.display=open?"none":"block";
    $("rpCaret").textContent=open?"輸入起訖點,依票券規劃 ⌄":"輸入起訖點,依票券規劃 ⌃";
    if(!open)ensureGoogleMapsLoaded();
  };
  $("mQ").addEventListener("input",mSearch);
  $("mQ").addEventListener("focus",mSearch);
  $("mModal").onclick=function(e){if(e.target===$("mModal"))mCloseModal();};
  mBindPan();
  mLoad("大阪");
}
function mLoad(c){
  mCity=c; var d=METRO[c]; mST=d.st; mLine=null; mNearIdx=-1;
  mSvg.setAttribute("viewBox","0 0 "+d.W+" "+d.H);
  mRoot.innerHTML=d.svg;
  $("mCities").querySelectorAll("button").forEach(function(b){b.classList.toggle("on",b.dataset.c===c);});
  $("mLoc").style.display=d.geo?"block":"none";
  mSc=1;mTx=0;mTy=0;mApply();mBindHits();mCloseSheet();mLayers();mApplyLayer();
  $("mQ").value="";mSearch();
  rpSyncToolLabels();mApplyPassOverlay();
  mFillRouteSelects();
}
function mApply(){mRoot.setAttribute("transform","translate("+mTx+","+mTy+") scale("+mSc+")");}
function mK(){var r=mSvg.getBoundingClientRect(),vb=mSvg.viewBox.baseVal;
  return Math.max(vb.width/Math.max(r.width,1),vb.height/Math.max(r.height,1));}
function mZoom(f,cx,cy){
  var ns=Math.max(.5,Math.min(6,mSc*f)),r=mSvg.getBoundingClientRect(),vb=mSvg.viewBox.baseVal;
  cx=(cx===undefined?r.width/2:cx);cy=(cy===undefined?r.height/2:cy);
  var k=mK(),mx=cx*k+vb.x,my=cy*k+vb.y;
  mTx=mx-(mx-mTx)*(ns/mSc);mTy=my-(my-mTy)*(ns/mSc);mSc=ns;mApply();
}
function mCenter(x,y,z){var vb=mSvg.viewBox.baseVal;mSc=z||2.3;
  mTx=vb.width/2-x*mSc;mTy=vb.height/2-y*mSc;mApply();}
var mDrag=null,mPinch=null,mMoved=false;
function mBindPan(){
  mWrap.addEventListener("touchstart",function(e){mMoved=false;
    if(e.touches.length===1)mDrag={x:e.touches[0].clientX,y:e.touches[0].clientY,tx:mTx,ty:mTy};
    else if(e.touches.length===2){mDrag=null;
      mPinch={d:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),s:mSc};}
  },{passive:true});
  mWrap.addEventListener("touchmove",function(e){
    var r=mSvg.getBoundingClientRect();
    if(mPinch&&e.touches.length===2){
      var dd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      mZoom((dd/mPinch.d)*(mPinch.s/mSc),(e.touches[0].clientX+e.touches[1].clientX)/2-r.left,
            (e.touches[0].clientY+e.touches[1].clientY)/2-r.top);
      mMoved=true;e.preventDefault();
    }else if(mDrag&&e.touches.length===1){
      var k=mK();
      mTx=mDrag.tx+(e.touches[0].clientX-mDrag.x)*k;mTy=mDrag.ty+(e.touches[0].clientY-mDrag.y)*k;
      if(Math.abs(e.touches[0].clientX-mDrag.x)+Math.abs(e.touches[0].clientY-mDrag.y)>6)mMoved=true;
      mApply();e.preventDefault();
    }},{passive:false});
  mWrap.addEventListener("touchend",function(){mDrag=null;mPinch=null;});
  mWrap.addEventListener("mousedown",function(e){mDrag={x:e.clientX,y:e.clientY,tx:mTx,ty:mTy};mMoved=false;});
  mWrap.addEventListener("mousemove",function(e){if(!mDrag)return;var k=mK();
    mTx=mDrag.tx+(e.clientX-mDrag.x)*k;mTy=mDrag.ty+(e.clientY-mDrag.y)*k;
    if(Math.abs(e.clientX-mDrag.x)+Math.abs(e.clientY-mDrag.y)>6)mMoved=true;mApply();});
  window.addEventListener("mouseup",function(){mDrag=null;});
  mWrap.addEventListener("wheel",function(e){var r=mSvg.getBoundingClientRect();
    mZoom(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);e.preventDefault();},{passive:false});
}
function mBindHits(){
  mRoot.querySelectorAll(".hit").forEach(function(h){
    h.addEventListener("click",function(e){e.stopPropagation();if(mMoved)return;mOpen(+h.dataset.i);});
  });
  var bg=mRoot.querySelector("#bgrect");
  if(bg)bg.addEventListener("click",mCloseSheet);
}
function mLayers(){
  var d=METRO[mCity],names=Object.keys(d.col);
  $("mLayers").innerHTML='<button class="'+(mLine?"":"on")+'" data-l="">全部</button>'+
    names.map(function(n){return '<button class="'+(mLine===n?"on":"")+'" data-l="'+attr(n)+'">'+
      '<i style="background:'+d.col[n]+'"></i>'+esc(n)+'</button>';}).join("");
  $("mLayers").querySelectorAll("button").forEach(function(b){
    b.onclick=function(){mLine=b.dataset.l||null;mApplyLayer();mLayers();};});
}
function mApplyLayer(){
  var polys=mRoot.querySelectorAll("polyline");
  mRoot.querySelectorAll(".trmark").forEach(function(e){e.remove();});
  if(!mLine){
    mRoot.querySelectorAll(".dim").forEach(function(e){e.classList.remove("dim");});
    $("mNote").textContent=METRO[mCity].note;return;
  }
  var col=METRO[mCity].col[mLine];
  [].forEach.call(polys,function(e){
    var st=e.getAttribute("stroke");
    e.classList.toggle("dim",!(st===col||st==="#0b1119"));});
  var on={};
  mST.forEach(function(s,i){if(s.l.indexOf(mLine)>=0)on[i]=1;});
  mST.forEach(function(s,i){
    var hit=mRoot.querySelector('.hit[data-i="'+i+'"]');
    if(!hit)return;
    var cx=hit.getAttribute("cx"),cy=hit.getAttribute("cy");
    mRoot.querySelectorAll("circle:not(.hit)").forEach(function(c){
      if(c.getAttribute("cx")===cx&&c.getAttribute("cy")===cy)c.classList.toggle("dim",!on[i]);});
    mRoot.querySelectorAll("text").forEach(function(t){
      if(Math.abs(parseFloat(t.getAttribute("x"))-cx)<32&&Math.abs(parseFloat(t.getAttribute("y"))-cy)<26)
        t.classList.toggle("dim",!on[i]);});
  });
  var NS="http://www.w3.org/2000/svg",first=mRoot.querySelector(".hit");
  var host=first?first.parentNode:mRoot;
  mST.forEach(function(s,i){
    if(!on[i]||s.l.length<2)return;
    var hit=mRoot.querySelector('.hit[data-i="'+i+'"]');
    var c=document.createElementNS(NS,"circle");
    c.setAttribute("class","trmark");
    c.setAttribute("cx",hit.getAttribute("cx"));c.setAttribute("cy",hit.getAttribute("cy"));
    c.setAttribute("r","13");c.setAttribute("fill","none");
    c.setAttribute("stroke","#4da3ff");c.setAttribute("stroke-width","2.6");
    host.insertBefore(c,first);
  });
  $("mNote").textContent=mLine+"・"+Object.keys(on).length+" 站・藍圈 = 可轉乘";
}
function mCodeHtml(cd,sm){return (cd||[]).map(function(c){
  return '<span class="mcode'+(sm?" sm":"")+'" style="background:'+c.c+'">'+
  '<span class="l">'+c.l+'</span><span class="n">'+c.n+'</span></span>';}).join("");}
function mSearch(){
  var v=$("mQ").value.trim().toLowerCase(),box=$("mResults");
  if(!v){
    if(mRecent.length){box.style.display="block";
      box.innerHTML=mRecent.slice(0,5).map(function(o){var s=METRO[o.c].st[o.i];
        return '<div class="mres" data-i="'+o.i+'" data-c="'+attr(o.c)+'">'+mCodeHtml(s.cd,1)+
        '<span class="rn">'+esc(s.n)+'</span><span class="ln">'+esc(o.c)+'</span></div>';}).join("");
      mBindRes();
    }else box.style.display="none";
    return;
  }
  var hit=[];
  Object.keys(METRO).forEach(function(c){
    METRO[c].st.forEach(function(s,i){if(hit.length<20&&s.q.indexOf(v)>=0)hit.push({c:c,i:i,s:s});});});
  box.style.display="block";
  box.innerHTML=hit.length?hit.map(function(h){
    return '<div class="mres" data-i="'+h.i+'" data-c="'+attr(h.c)+'">'+mCodeHtml(h.s.cd,1)+
    '<span class="rn">'+esc(h.s.n)+'</span><span class="ln">'+esc(h.c)+'</span></div>';}).join("")
   :'<p style="font-size:13px;color:var(--muted);padding:12px 4px;margin:0">找不到「'+esc($("mQ").value)+'」</p>';
  mBindRes();
}
function mBindRes(){
  document.querySelectorAll(".mres").forEach(function(r){
    r.onclick=function(){
      var i=+r.dataset.i,c=r.dataset.c;
      mRecent=[{c:c,i:i}].concat(mRecent.filter(function(x){return !(x.c===c&&x.i===i);}));
      $("mQ").value="";$("mQ").blur();
      if(c!==mCity)mLoad(c);
      mSearch();mCenter(METRO[c].st[i].sx,METRO[c].st[i].sy,2.6);mOpen(i);
    };});
}
function mLocate(){
  if(!navigator.geolocation){toast("這個瀏覽器不支援定位");return;}
  var d=METRO[mCity];
  if(!d.geo){toast(mCity+"路線圖尚無座標,無法定位");return;}
  toast("定位中…");
  navigator.geolocation.getCurrentPosition(function(p){
    mPos={lat:p.coords.latitude,lng:p.coords.longitude};
    var list=mST.map(function(s,i){return {i:i,d:haversine(mPos.lat,mPos.lng,s.lat,s.lng)};})
      .sort(function(a,b){return a.d-b.d;});
    mNearIdx=list[0].i;var s=mST[mNearIdx];
    var h=mRoot.querySelector("#here");
    if(h){h.style.display="";
      ["hereRing","hereDot"].forEach(function(id){
        var e=mRoot.querySelector("#"+id);
        if(e){e.setAttribute("cx",s.sx);e.setAttribute("cy",s.sy);}});}
    mCenter(s.sx,s.sy,2.5);mOpen(mNearIdx);
    toast(list[0].d>3000?"離捷運網較遠,最近是"+s.n:"離你最近:"+s.n+"・"+distTxt(list[0].d));
  },function(err){toast(err.code===1?"你拒絕了位置權限":"定位失敗,請確認 GPS");},
  {enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}
/* 車站座標:台北內建;其他城市首次點擊時查詢並記住 */
function mStationCoord(s,cb){
  if(s.lat&&s.lng)return cb({lat:s.lat,lng:s.lng});
  var key="駅:"+mCity+":"+s.n, c=geoCache[key];
  if(c&&c.lat)return cb(c);
  if(c&&c.miss)return cb(null);
  var q=s.n+" 駅 "+(mCity==="關西全域"?"関西":mCity);
  fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(js){
      if(js&&js[0]){geoCache[key]={lat:+js[0].lat,lng:+js[0].lon};}
      else geoCache[key]={miss:true};
      saveGeo();cb(geoCache[key].lat?geoCache[key]:null);
    }).catch(function(){cb(null);});
}
function mNearPlaces(coord){
  if(!coord)return null;
  var rows=[];
  places.forEach(function(p){
    var c=coordOf(p);
    if(!c)return;
    var d=haversine(coord.lat,coord.lng,c.lat,c.lng);
    if(d<=1500)rows.push({p:p,d:d});
  });
  rows.sort(function(a,b){return a.d-b.d;});
  return rows.slice(0,6);
}
function mShowPick(s){
  var NS="http://www.w3.org/2000/svg";
  var g=mRoot.querySelector("#pickDyn");
  if(!g){
    g=document.createElementNS(NS,"g");
    g.id="pickDyn";
    g.innerHTML=
      '<circle id="pdRing" r="15" fill="none" stroke="var(--a-500)" stroke-width="3" opacity=".6">'+
        '<animate attributeName="r" values="10;20;10" dur="1.6s" repeatCount="indefinite"/>'+
        '<animate attributeName="opacity" values=".6;.05;.6" dur="1.6s" repeatCount="indefinite"/>'+
      '</circle>'+
      '<circle id="pdDot" r="7" fill="var(--a-500)" stroke="var(--m-bg)" stroke-width="2.5"/>'+
      '<rect id="pdBg" height="22" rx="11" fill="var(--a-500)"/>'+
      '<text id="pdTxt" font-size="12" font-weight="700" fill="#1E1204" text-anchor="middle"></text>';
    mRoot.appendChild(g);
  }
  g.style.display="";
  var ring=g.querySelector("#pdRing"),dot=g.querySelector("#pdDot"),bg=g.querySelector("#pdBg"),txt=g.querySelector("#pdTxt");
  ring.setAttribute("cx",s.sx);ring.setAttribute("cy",s.sy);
  dot.setAttribute("cx",s.sx);dot.setAttribute("cy",s.sy);
  txt.textContent=s.n;
  txt.setAttribute("x",s.sx);txt.setAttribute("y",s.sy-24);
  var w=Math.max(40,s.n.length*13+16);
  bg.setAttribute("x",s.sx-w/2);bg.setAttribute("y",s.sy-40);bg.setAttribute("width",w);
}
function mHidePick(){
  var g=mRoot&&mRoot.querySelector("#pickDyn"); if(g)g.style.display="none";
}
