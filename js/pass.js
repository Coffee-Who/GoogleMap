"use strict";
/* ================= 依 PASS 篩選(簡化版規則,依城市顯示不同票券) ================= */
/* ================= 統一票券系統(以 PASS_CATALOG 為單一資料來源,可複選) ================= */
var LS_MYPASS="pocket_mypass_v1";
var myPasses=[];   /* 存 PASS_CATALOG 的 id */
try{myPasses=JSON.parse(localStorage.getItem(LS_MYPASS)||"[]");}catch(e){myPasses=[];}
var mGrayOn=true;
function saveMyPasses(){try{localStorage.setItem(LS_MYPASS,JSON.stringify(myPasses));}catch(e){}}
function myPassObjs(){
  return myPasses.map(function(id){
    return PASS_CATALOG.filter(function(p){return p.id===id;})[0];
  }).filter(Boolean);
}
/* ============ 票券頁(page-tickets) ============ */
var TICKET_GRADIENTS=[
  "linear-gradient(135deg,#1c3a63,#2c5a92)",
  "linear-gradient(135deg,#1f5a3a,#2f8a58)",
  "linear-gradient(135deg,#432c78,#6845b0)",
  "linear-gradient(135deg,#7a4a1c,#b8752c)",
  "linear-gradient(135deg,#7a1c3a,#b82c5a)"
];
function renderTixMine(){
  var box=$("tixMine"); if(!box)return;
  var ps=myPassObjs();
  box.innerHTML=(ps.length?ps.map(function(p,i){
    var grad=TICKET_GRADIENTS[i%TICKET_GRADIENTS.length];
    return '<div class="tix-card" style="background:'+grad+';" onclick="window.open(\''+attr(p.url)+'\',\'_blank\')">'+
      '<div class="tix-top"><span class="tix-name">'+esc(p.name)+'</span><span class="tix-badge">已選用</span></div>'+
      '<div class="tix-sub">'+esc(p.region||"")+'</div>'+
      '<div class="tix-price">'+esc(p.price||"")+'</div>'+
      '<button class="tix-rm" data-rm="'+attr(p.id)+'" onclick="event.stopPropagation();" aria-label="移除">'+IC.x+'</button>'+
      '</div>';
  }).join(""):'<p class="empty">還沒有選擇任何票券,按下面「新增票券」從總覽挑選。</p>')+
  '<button class="tix-add" onclick="mpOpen();">'+IC.plus+' 新增票券</button>';
  box.querySelectorAll("[data-rm]").forEach(function(b){
    b.addEventListener("click",function(){
      var id=b.dataset.rm, i=myPasses.indexOf(id);
      if(i>=0){myPasses.splice(i,1);saveMyPasses();renderTixMine();if(typeof rpSyncToolLabels==="function")rpSyncToolLabels();}
    });
  });
}
document.querySelectorAll(".tix-tabs button").forEach(function(b){
  b.addEventListener("click",function(){
    document.querySelectorAll(".tix-tabs button").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    var t=b.dataset.t;
    $("tixMine").style.display=t==="mine"?"block":"none";
    $("tixReco").style.display=t==="reco"?"block":"none";
    if(t==="mine")renderTixMine();
  });
});
/* 路線是否被「手上任一張票券」涵蓋 */
function mPassLineStatus(lineName){
  var ps=myPassObjs().filter(function(p){return !p.singleTrip;});
  if(!ps.length)return "ok";                       /* 沒選票券 = 不篩選 */
  if(lineName===WALK_LINE)return "ok";             /* 走路不需要票券 */
  return ps.some(function(p){return ppLineCovered(p.kind,lineName);})?"ok":"off";
}
function mStationPassStatus(s){
  var sts=s.l.map(mPassLineStatus);
  return sts.indexOf("ok")>=0?"ok":"off";
}
function mPassSummaryName(){
  var ps=myPassObjs();
  if(!ps.length)return null;
  if(ps.length===1)return ps[0].name;
  return ps[0].name+" 等 "+ps.length+" 張";
}
function mApplyPassOverlay(){
  if(!mRoot)return;
  mRoot.querySelectorAll(".passOff").forEach(function(e){e.classList.remove("passOff");});
  var ps=myPassObjs().filter(function(p){return !p.singleTrip;});
  var note=$("mPassNote");
  if(!ps.length||!mGrayOn){
    if(note)note.textContent=ps.length?"":"在「路線規劃 → 我的票券」選票券,不能搭的路線車站會變灰。";
    return;
  }
  var d=METRO[mCity];
  var polys=mRoot.querySelectorAll("polyline");
  Object.keys(d.col).forEach(function(n){
    if(mPassLineStatus(n)==="off"){
      var col=d.col[n];
      [].forEach.call(polys,function(e){
        if(e.getAttribute("stroke")===col)e.classList.add("passOff");
      });
    }
  });
  var off=0;
  mST.forEach(function(s,i){
    if(mStationPassStatus(s)==="off"){
      off++;
      var hit=mRoot.querySelector('.hit[data-i="'+i+'"]');
      if(!hit)return;
      var cx=hit.getAttribute("cx"),cy=hit.getAttribute("cy");
      mRoot.querySelectorAll("circle:not(.hit)").forEach(function(c){
        if(c.getAttribute("cx")===cx&&c.getAttribute("cy")===cy)c.classList.add("passOff");});
      mRoot.querySelectorAll("text").forEach(function(t){
        if(Math.abs(parseFloat(t.getAttribute("x"))-cx)<32&&Math.abs(parseFloat(t.getAttribute("y"))-cy)<26)
          t.classList.add("passOff");});
    }
  });
  if(note)note.textContent=off
    ?("灰色 = 手上票券不含的路線與車站,共 "+off+" 站(僅供參考,實際範圍請以票券官方資訊為準)")
    :"手上的票券涵蓋這張圖上的所有路線。";
}
/* ---- 我的票券選擇頁 ---- */
function mpOpen(){mpRender();$("myPassPage").classList.add("on");}
function mpClose(){
  $("myPassPage").classList.remove("on");
  saveMyPasses(); rpSyncToolLabels(); mApplyPassOverlay();
}
function mpRender(){
  var cats=[];
  PASS_CATALOG.forEach(function(p){if(cats.indexOf(p.cat)<0)cats.push(p.cat);});
  var html="";
  cats.forEach(function(cat){
    html+='<div class="pp-cat">'+esc(cat)+'</div><div class="pp-group" style="padding:0 12px">'+
      PASS_CATALOG.filter(function(p){return p.cat===cat;}).map(function(p){
        var on=myPasses.indexOf(p.id)>=0;
        return '<div class="mp-row'+(on?" on":"")+'" data-id="'+attr(p.id)+'">'+
          '<span class="mp-ck">✓</span>'+
          '<span class="mp-nm">'+esc(p.name)+
          (p.singleTrip?'<small>單程票,不參與路線規劃</small>':'')+'</span>'+
          '<span class="mp-p">'+esc(p.price)+'</span></div>';
      }).join("")+'</div>';
  });
  $("mpBody").innerHTML=html;
  $("mpBody").querySelectorAll(".mp-row").forEach(function(el){
    el.addEventListener("click",function(){
      var id=el.dataset.id, i=myPasses.indexOf(id);
      if(i>=0)myPasses.splice(i,1); else myPasses.push(id);
      el.classList.toggle("on");
      saveMyPasses(); rpSyncToolLabels();
    });
  });
}
function rpSyncToolLabels(){
  var c=$("rpPassCount"); if(c)c.textContent=myPasses.length?("已選 "+myPasses.length+" 張"):"未選";
  var g=$("rpGrayState"); if(g)g.textContent=mGrayOn?"開啟":"關閉";
  var gb=$("rpGrayBtn"); if(gb)gb.classList.toggle("off",!mGrayOn);
}
/* ================= 票券總覽頁(獨立於地圖篩選,涵蓋更廣的關西周遊券) ================= */
var PASS_CATALOG=[
 {id:"jr_kansai_1",cat:"JR系",name:"JR關西地區鐵路周遊券・1日券",region:"大阪・京都・神戶・姫路",price:"成人 ¥2,800",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai/",
  img:"https://www.westjr.co.jp/travel-information/tc/assets/img/tickets-passes/jrwest-rail-pass/kansai_map.jpg",
  desc:"可自由搭乘大阪、京都、神戶、姫路一帶的JR普通・快速・新快速列車,含HARUKA指定席2次,不含新幹線。",kind:"jr"},
 {id:"jr_kansai_2",cat:"JR系",name:"JR關西地區鐵路周遊券・2日券",region:"大阪・京都・神戶・姫路",price:"成人 ¥4,800",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai/",
  img:"https://www.westjr.co.jp/travel-information/tc/assets/img/tickets-passes/jrwest-rail-pass/kansai_map.jpg",
  desc:"範圍與1日券相同,適合停留2天以上的行程。",kind:"jr"},
 {id:"jr_kansai_3",cat:"JR系",name:"JR關西地區鐵路周遊券・3日券",region:"大阪・京都・神戶・姫路",price:"成人 ¥5,800",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai/",
  img:"https://www.westjr.co.jp/travel-information/tc/assets/img/tickets-passes/jrwest-rail-pass/kansai_map.jpg",
  desc:"範圍與1日券相同,適合停留3天以上的行程。",kind:"jr"},
 {id:"jr_kansai_4",cat:"JR系",name:"JR關西地區鐵路周遊券・4日券",region:"大阪・京都・神戶・姫路",price:"成人 ¥7,000",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai/",
  img:"https://www.westjr.co.jp/travel-information/tc/assets/img/tickets-passes/jrwest-rail-pass/kansai_map.jpg",
  desc:"範圍與1日券相同,適合停留4天以上的行程。",kind:"jr"},
 {id:"jr_wide_5",cat:"JR系",name:"JR關西廣域鐵路周遊券・5日券",region:"關西全域・岡山・鳥取・城崎",price:"成人 ¥12,000",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai_wide/",
  img:"https://www.westjr.co.jp/travel-information/tc/assets/img/tickets-passes/jrwest-rail-pass/kansai_wide_map.jpg",
  desc:"涵蓋範圍比地區版更廣,含山陽新幹線新大阪⇔岡山指定席與HARUKA等特急列車。",kind:"jr",
  note:"可延伸至岡山、鳥取、城崎,超出本圖範圍,詳見官方地圖"},
 {id:"jr_mini",cat:"JR系",name:"JR關西迷你鐵路周遊券",region:"大阪・京都・難波・神戶・奈良",price:"價格請查官方頁",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansaimini/",
  img:null,
  desc:"範圍比地區版略小,主打大阪、京都、難波、神戶、奈良之間移動。",kind:"jr"},
 {id:"jr_hiroshima",cat:"JR系",name:"JR關西&廣島地區鐵路周遊券",region:"關西・岡山・廣島",price:"價格請查官方頁",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai_hiroshima/",
  img:null,
  desc:"關西加碼延伸到廣島、宮島一帶,含JR西日本宮島渡輪。",kind:"jr",
  note:"可延伸至岡山、廣島,超出本圖範圍,詳見官方地圖"},
 {id:"jr_sanin",cat:"JR系",name:"JR關西&山陰地區鐵路周遊券",region:"關西・城崎・鳥取",price:"價格請查官方頁",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/jrwest-rail-pass/kansai_sanin/",
  img:null,
  desc:"關西加碼延伸到城崎溫泉、鳥取砂丘一帶的山陰地區。",kind:"jr",
  note:"可延伸至城崎、鳥取,超出本圖範圍,詳見官方地圖"},
 {id:"haruka",cat:"JR系",name:"HARUKA 單程優惠票",region:"關西機場↔大阪／京都",price:"價格依區間請查官方頁",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/oneway/haruka/",img:null,
  desc:"關西機場往返大阪、京都的特急HARUKA單程優惠票,適合只需要機場接駁的旅客。",
  kind:"single",excludeFromReco:true,singleTrip:true},
 {id:"kintetsu",cat:"近鐵系",name:"近鐵電車周遊券(KINTETSU RAIL PASS 系列)",region:"大阪・奈良・伊勢・名古屋",
  price:"依版本不同,請查官方頁",
  url:"https://www.kintetsu.co.jp/foreign/chinese-han/ticket/",img:null,
  desc:"近鐵電車全線周遊券,依範圍與天數分好幾種版本,適合會去奈良、伊勢志摩,甚至一路到名古屋的行程。",
  kind:"kintetsu",note:"部分版本可延伸至伊勢、名古屋,超出本圖範圍"},
 {id:"keihan_ko_1d",cat:"京阪系",name:"京都、大阪觀光一日券",region:"京都・大阪(京阪沿線)",price:"成人 ¥1,650",
  url:"https://www.keihan.co.jp/travel/tw/trains/passes-for-visitors-to-japan/kyoto-osaka.html",
  img:"https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/special-sightseeing-pass/img_specialsightseeingpass_pass_01.jpg",
  desc:"京阪電車(大津線除外)、宇治線、交野線、石清水八幡宮參道纜車自由上下車。",kind:"keihan_main"},
 {id:"keihan_ko_24h",cat:"京阪系",name:"京都、大阪觀光24小時券",region:"京都・大阪(京阪沿線)",price:"成人 ¥1,850",
  url:"https://www.keihan.co.jp/travel/tw/trains/passes-for-visitors-to-japan/kyoto-osaka.html",
  img:"https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/special-sightseeing-pass/img_specialsightseeingpass_pass_01.jpg",
  desc:"範圍與一日券相同,從啟用時刻起算24小時內有效,彈性較高。",kind:"keihan_main"},
 {id:"keihan_k_1d",cat:"京阪系",name:"京都觀光一日券",region:"京都(京阪沿線)",price:"成人 ¥1,100",
  url:"https://www.keihan.co.jp/travel/tw/trains/passes-for-visitors-to-japan/kyoto-osaka.html",
  img:"https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/special-sightseeing-pass/img_specialsightseeingpass_pass_02.jpg",
  desc:"京都市內京阪電車路段自由上下車,範圍比大阪版小,價格也較低。",kind:"keihan_main"},
 {id:"keihan_k_24h",cat:"京阪系",name:"京都觀光24小時券",region:"京都(京阪沿線)",price:"成人 ¥1,300",
  url:"https://www.keihan.co.jp/travel/tw/trains/passes-for-visitors-to-japan/kyoto-osaka.html",
  img:"https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/special-sightseeing-pass/img_specialsightseeingpass_pass_02.jpg",
  desc:"範圍與京都一日券相同,24小時制。",kind:"keihan_main"},
 {id:"keihan_osaka_metro",cat:"京阪系",name:"京阪+Osaka Metro觀光乘車券・一日券",region:"京都(京阪)・大阪地鐵",
  price:"成人 ¥2,160",
  url:"https://www.keihan.co.jp/travel/tw/trains/passes-for-visitors-to-japan/osaka-subway.html",
  img:"https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/special-osaka/img_specialsightseeingpass_pass.jpg",
  desc:"京阪電車再加碼大阪地鐵(Osaka Metro)與市巴士(部分路線除外)全線自由搭乘。",kind:"keihan_osaka"},
 {id:"keihan_eizan",cat:"京阪系",name:"京都、大阪觀光乘車券(鞍馬&貴船地區擴大版)・一日券",region:"京都北部(鞍馬・貴船)",
  price:"成人 ¥2,100",
  url:"https://www.keihan.co.jp/travel/tw/trains/passes-for-visitors-to-japan/eizan-railway.html",
  img:"https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/special-eizan-railway/img_special_eizanrailway_pass.jpg",
  desc:"京阪電車再加碼叡山電車,可以到京都北部的鞍馬、貴船神社一帶。",kind:"keihan_eizan"},
 {id:"krp_lite_2d",cat:"私鐵地鐵周遊券系",name:"KANSAI RAILWAY PASS LITE・2日券",
  region:"大阪・京都・奈良・神戶/姫路・和歌山",price:"成人 ¥5,200",
  url:"https://www.surutto.com/kansai_rwpl/zh-TW/krp.html",
  img:"https://www.surutto.com/kansai_rwpl/assets/images/areamap_tw.jpg",
  desc:"舊稱 KANSAI THRU PASS。關西各地地下鐵、私鐵幾乎都能搭,但不含JR、京都市營地下鐵、京阪大津線、嵐電與公車。",
  kind:"krplite"},
 {id:"krp_lite_3d",cat:"私鐵地鐵周遊券系",name:"KANSAI RAILWAY PASS LITE・3日券",
  region:"大阪・京都・奈良・神戶/姫路・和歌山",price:"成人 ¥6,500",
  url:"https://www.surutto.com/kansai_rwpl/zh-TW/krp.html",
  img:"https://www.surutto.com/kansai_rwpl/assets/images/areamap_tw.jpg",
  desc:"範圍與2日券相同,多一天可用。",kind:"krplite"},
 {id:"osaka_amazing",cat:"特定城市周遊票系",name:"Osaka Amazing Pass",region:"大阪市區(含私鐵短程段)",
  price:"依1日／2日版本,請查官方頁",
  url:"https://osaka-amazing-pass.com/cht/",img:null,
  desc:"大阪地鐵、市巴士全線自由搭乘,加上大阪市區內的阪急、阪神、京阪、近鐵、南海路段,還能免費進約40個景點設施。",
  kind:"osaka_amazing"}
];
var PP_OSAKA_METRO_LINES=["御堂筋線","中央線","堺筋線","谷町線","四つ橋線","千日前線","長堀鶴見緑地線"];
var PASS_AREA_KEYWORDS={
  jr_kansai_1:["Osaka","Kyoto","Kobe","Himeji","Nara","Otsu"],
  jr_kansai_2:["Osaka","Kyoto","Kobe","Himeji","Nara","Otsu"],
  jr_kansai_3:["Osaka","Kyoto","Kobe","Himeji","Nara","Otsu"],
  jr_kansai_4:["Osaka","Kyoto","Kobe","Himeji","Nara","Otsu"],
  jr_wide_5:["Osaka","Kyoto","Kobe","Himeji","Nara","Otsu","Okayama","Tottori","Kinosaki","Amanohashidate","Takamatsu","Shirahama"],
  jr_mini:["Osaka","Kyoto","Namba","Kobe","Nara"],
  jr_hiroshima:["Osaka","Kyoto","Kobe","Okayama","Hiroshima","Miyajima"],
  jr_sanin:["Osaka","Kyoto","Kobe","Kinosaki","Tottori"],
  haruka:["Kansai Airport","Osaka","Kyoto","Tennoji","Shin-Osaka"],
  kintetsu:["Osaka","Nara","Ise","Nagoya","Kyoto"],
  keihan_ko_1d:["Kyoto","Osaka","Uji"],
  keihan_ko_24h:["Kyoto","Osaka","Uji"],
  keihan_k_1d:["Kyoto","Uji"],
  keihan_k_24h:["Kyoto","Uji"],
  keihan_osaka_metro:["Kyoto","Osaka"],
  keihan_eizan:["Kyoto","Kurama","Kibune"],
  krp_lite_2d:["Osaka","Kyoto","Nara","Kobe","Himeji","Wakayama","Koyasan"],
  krp_lite_3d:["Osaka","Kyoto","Nara","Kobe","Himeji","Wakayama","Koyasan"],
  osaka_amazing:["Osaka"]
};
function ppLineCovered(passKind,lineName){
  var isJR=lineName.indexOf("JR")===0;
  var isKintetsu=lineName.indexOf("近鉄")===0;
  switch(passKind){
    case "jr": return isJR;
    case "kintetsu": return isKintetsu;
    case "keihan_main": return lineName==="京阪本線";
    case "keihan_osaka": return lineName==="京阪本線"||PP_OSAKA_METRO_LINES.indexOf(lineName)>=0;
    case "keihan_eizan": return lineName==="京阪本線"||lineName==="叡山電車";
    case "krplite":
      if(isJR)return false;
      if(lineName==="烏丸線"||lineName==="東西線")return false;
      if(lineName==="嵐電(京福電鐵)")return false;
      return true;
    case "osaka_amazing":
      return PP_OSAKA_METRO_LINES.indexOf(lineName)>=0||
        lineName.indexOf("阪急")>=0||lineName.indexOf("阪神")>=0||lineName.indexOf("南海")>=0;
  }
  return false;
}
function ppOpen(){
  ppRender();
  $("passPage").classList.add("on");
  ensureGoogleMapsLoaded();
}
function ppClose(){
  $("passPage").classList.remove("on");
  if(curPage==="tickets")goPage("home");
}
function ppRender(){
  $("ppSub").textContent="共 "+PASS_CATALOG.length+" 張,依系統分類。點卡片展開說明,點官方頁前往購票資訊。價格為成人價,實際請以官網公告為準。";
  var cats=[];
  PASS_CATALOG.forEach(function(p){if(cats.indexOf(p.cat)<0)cats.push(p.cat);});
  var html=ppRecoHtml();
  cats.forEach(function(cat){
    html+='<div class="pp-cat">'+esc(cat)+'</div><div class="pp-group">'+
      PASS_CATALOG.filter(function(p){return p.cat===cat;}).map(ppItemHtml).join("")+'</div>';
  });
  $("ppBody").innerHTML=html;
  ppBindReco();
}
function ppItemHtml(p){
  return '<details class="pp-item"><summary>'+
    '<div class="pp-ic">🎫</div>'+
    '<div style="flex:1;min-width:0"><div class="pp-nm">'+esc(p.name)+'</div>'+
    '<span class="pp-tag">'+esc(p.region)+'</span></div>'+
    '<span style="font-size:12.5px;font-weight:700;color:var(--a-text);white-space:nowrap;margin-left:8px">'+esc(p.price)+'</span>'+
    '<span class="pp-car">⌄</span></summary>'+
    '<div class="pp-detail">'+
    (p.img?'<img src="'+p.img+'" alt="'+esc(p.name)+' 官方區域地圖" style="width:100%;border-radius:12px;display:block;margin:10px 0" />':'')+
    '<p>'+esc(p.desc)+'</p>'+
    (p.note?'<div class="pp-warn">⚠ '+esc(p.note)+'</div>':'')+
    '<a class="pp-link" href="'+p.url+'" target="_blank" rel="noopener">前往官方頁 ↗</a></div></details>';
}
function ppRecoHtml(){
  return '<div class="pp-reco">'+
    '<div class="pp-reco-hd">✨ 依你的行程推薦票券</div>'+
    '<p class="hint" style="margin:0 0 8px">輸入想去的地點(一個地點一個欄位),幫你比對最適合的票券(僅比對本圖收錄的大阪／京都／關西全域車站資料,無法涵蓋所有景點)</p>'+
    '<button type="button" id="ppImportTripBtn" style="width:100%;margin-bottom:10px;border-style:dashed">📥 從行程帶入地點</button>'+
    '<div id="ppPlaceList">'+
      '<input type="text" class="pp-place-input" placeholder="地點 1">'+
      '<input type="text" class="pp-place-input" placeholder="地點 2">'+
      '<input type="text" class="pp-place-input" placeholder="地點 3">'+
    '</div>'+
    '<button type="button" id="ppAddPlace" style="width:100%;margin:4px 0 10px;border-style:dashed">＋ 新增地點</button>'+
    '<div class="pp-reco-row">'+
      '<div class="f"><label>天數</label><input type="text" id="ppDays" placeholder="例如 2 天"></div>'+
    '</div>'+
    '<button class="btn-primary" style="width:100%" onclick="ppRecommend()">推薦適合的票券</button>'+
    '<div id="ppRecoRes"></div></div>';
}
function ppAttachAutocomplete(inp){
  if(!window.google||!google.maps||!google.maps.places)return;
  if(inp._ppAcDone)return;
  inp._ppAcDone=true;
  var opts={componentRestrictions:{country:"jp"},
    fields:["place_id","formatted_address","address_components","name","geometry"]};
  var ac=new google.maps.places.Autocomplete(inp,opts);
  ac.addListener("place_changed",function(){
    gTrackDetail("autocomplete");
    var p=ac.getPlace();
    if(p&&p.geometry&&p.geometry.location){
      inp._ppPlace={
        lat:p.geometry.location.lat(), lng:p.geometry.location.lng(),
        formatted:p.formatted_address||"",
        comps:(p.address_components||[]).map(function(c){return c.long_name;})
      };
    }else{inp._ppPlace=null;}
  });
  inp.addEventListener("input",function(){inp._ppPlace=null;});
}
function ppInitRecoAutocomplete(){
  document.querySelectorAll(".pp-place-input").forEach(ppAttachAutocomplete);
}
function ppBindReco(){
  ppInitRecoAutocomplete();
  if(gKey())ensureGoogleMapsLoaded();
  var addBtn=$("ppAddPlace");
  if(!addBtn)return;
  addBtn.onclick=function(){
    var list=$("ppPlaceList");
    var n=list.querySelectorAll(".pp-place-input").length+1;
    var inp=document.createElement("input");
    inp.type="text";inp.className="pp-place-input";inp.placeholder="地點 "+n;
    inp.style.marginTop="8px";
    list.appendChild(inp);
    ppAttachAutocomplete(inp);
  };
  var impBtn=$("ppImportTripBtn");
  if(impBtn)impBtn.onclick=function(){ppOpenImportSheet();};
}
/* ---- 從行程帶入地點(整個行程 或 只帶入某幾天,都可選) ---- */
var ppImpSelDays=[];
function ppImpCurTrip(){var el=$("ppImpTrip");return el?tripById(el.value):null;}
function ppOpenImportSheet(){
  if(!trips.length){toast("還沒有建立行程,先到「行程」頁建立一個吧");return;}
  var sel=$("ppImpTrip");
  sel.innerHTML=trips.map(function(t){
    return '<option value="'+attr(t.id)+'">'+esc(t.name)+'('+esc(tripRangeStr(t))+')</option>';
  }).join("");
  sel.value=(curTrip&&tripById(curTrip))?curTrip:trips[0].id;
  sel.onchange=ppImpRenderDays;
  ppImpRenderDays();
  $("ppImportBk").classList.add("show");$("ppImportSheet").classList.add("show");
}
function ppImpCloseSheet(){$("ppImportBk").classList.remove("show");$("ppImportSheet").classList.remove("show");}
function ppImpRenderDays(){
  var t=ppImpCurTrip(); if(!t)return;
  ppImpSelDays=t.days.map(function(_,i){return i;});   /* 預設全選 = 整個行程 */
  $("ppImpDays").innerHTML=t.days.map(function(d,i){
    var dt=dayDateStr(t,i);
    var lbl="Day "+(i+1)+(dt?" · "+dt:"")+" · "+(d.stops.length?d.stops.length+" 站":"無地點");
    return '<button type="button" class="chip on" data-i="'+i+'">'+esc(lbl)+'</button>';
  }).join("");
  $("ppImpDays").querySelectorAll(".chip").forEach(function(b){
    b.addEventListener("click",function(){
      var i=+b.dataset.i, idx=ppImpSelDays.indexOf(i);
      if(idx>=0){ppImpSelDays.splice(idx,1);b.classList.remove("on");}
      else{ppImpSelDays.push(i);b.classList.add("on");}
    });
  });
}
$("ppImportBk").addEventListener("click",ppImpCloseSheet);
$("ppImpSelAll").addEventListener("click",function(){
  var t=ppImpCurTrip(); if(!t)return;
  var allOn=ppImpSelDays.length===t.days.length;
  ppImpSelDays=allOn?[]:t.days.map(function(_,i){return i;});
  $("ppImpDays").querySelectorAll(".chip").forEach(function(b){b.classList.toggle("on",!allOn);});
});
$("ppImpConfirm").addEventListener("click",function(){
  var t=ppImpCurTrip(); if(!t)return;
  if(!ppImpSelDays.length){toast("至少選一天");return;}
  var days=ppImpSelDays.slice().sort(function(a,b){return a-b;});
  var names=[];
  days.forEach(function(i){
    (t.days[i].stops||[]).forEach(function(s){
      if(s.name&&names.indexOf(s.name)<0)names.push(s.name);
    });
  });
  if(!names.length){toast("這幾天還沒有排景點");return;}
  var list=$("ppPlaceList");
  list.innerHTML=names.map(function(n,idx){
    return '<input type="text" class="pp-place-input"'+(idx>0?' style="margin-top:8px"':'')+
      ' placeholder="地點 '+(idx+1)+'" value="'+attr(n)+'">';
  }).join("");
  $("ppDays").value=days.length+" 天";
  ppImpCloseSheet();
  toast("已帶入「"+t.name+"」"+days.length+" 天的地點");
});
var LANDMARK_ALIAS={
  "清水寺":"清水五条","金閣寺":"北野白梅町","銀閣寺":"出町柳","銀閣寺道":"出町柳",
  "伏見稻荷":"伏見稲荷","伏見稲荷大社":"伏見稲荷","嵯峨野":"嵯峨嵐山","嵐山竹林":"嵐山",
  "環球影城":"ユニバーサルシティ","大阪環球影城":"ユニバーサルシティ","USJ":"ユニバーサルシティ",
  "大阪城":"大阪城公園","道頓堀":"なんば","心齋橋":"心斎橋","南海難波":"なんば",
  "奈良公園":"近鉄奈良","東大寺":"近鉄奈良","春日大社":"近鉄奈良",
  "貴船神社":"貴船口","鞍馬寺":"鞍馬","平等院":"宇治","姬路城":"姫路",
  "有馬溫泉":"三宮","北野異人館":"三宮","高野山":"近鉄奈良"
};
function ppResolveName(name){
  if(LANDMARK_ALIAS[name])return LANDMARK_ALIAS[name];
  for(var k in LANDMARK_ALIAS){if(name.indexOf(k)>=0)return LANDMARK_ALIAS[k];}
  return null;
}
function ppStationMatch(city,name){
  var d=METRO[city]; if(!d)return [];
  var exact=d.st.filter(function(s){return s.n===name;});
  if(exact.length)return exact;
  return d.st.filter(function(s){return s.n.indexOf(name)>=0||name.indexOf(s.n)>=0;});
}
function ppFindStationLines(rawName){
  var cities=["大阪","京都","關西全域"],found=[];
  cities.forEach(function(c){found=found.concat(ppStationMatch(c,rawName));});
  if(found.length)return found;
  var alias=ppResolveName(rawName);
  if(alias){
    cities.forEach(function(c){found=found.concat(ppStationMatch(c,alias));});
  }
  return found;
}
var ppGeoCacheKey="ppGeoCache_v1";
function ppGeoCacheLoad(){
  try{return JSON.parse(localStorage.getItem(ppGeoCacheKey)||"{}");}catch(e){return {};}
}
function ppGeoCacheSave(c){
  try{localStorage.setItem(ppGeoCacheKey,JSON.stringify(c));}catch(e){}
}
function ppGeocode(query){
  var cache=ppGeoCacheLoad();
  var key=query.trim().toLowerCase();
  if(cache[key])return Promise.resolve(cache[key]);
  if(!gmapsLoaded||!gmapsGeocoder)return Promise.resolve(null);
  return new Promise(function(resolve){
    gTrackDetail("geocoding");
    gmapsGeocoder.geocode({address:query,region:"jp"},function(results,status){
      if(status!=="OK"||!results||!results.length){resolve(null);return;}
      var r=results[0];
      var comps=(r.address_components||[]).map(function(c){return c.long_name;});
      var loc=r.geometry&&r.geometry.location;
      var entry={formatted:r.formatted_address,comps:comps,
        lat:loc?loc.lat():null,lng:loc?loc.lng():null};
      cache[key]=entry;ppGeoCacheSave(cache);
      resolve(entry);
    });
  });
}
function ppNearestStation(lat,lng){
  var best=null,bestD=Infinity,bestCity=null;
  ["大阪","京都","關西全域"].forEach(function(c){
    var d=METRO[c]; if(!d)return;
    d.st.forEach(function(s){
      if(s.lat==null||s.lng==null)return;
      var dist=haversine(lat,lng,s.lat,s.lng);
      if(dist<bestD){bestD=dist;best=s;bestCity=c;}
    });
  });
  return best?{station:best,city:bestCity,dist:bestD}:null;
}
function ppAreaMatchKeyword(geo,areaKeywords){
  if(!geo)return null;
  var hay=(geo.formatted+" "+geo.comps.join(" ")).toLowerCase();
  for(var i=0;i<areaKeywords.length;i++){
    if(hay.indexOf(areaKeywords[i].toLowerCase())>=0)return areaKeywords[i];
  }
  return null;
}
async function ppRecommend(){
  var box=$("ppRecoRes");
  var btn=document.querySelector("#passPage .pp-reco button.btn-primary");
  var inputs=[].slice.call(document.querySelectorAll(".pp-place-input")).filter(function(i){return i.value.trim();});
  if(!inputs.length){box.innerHTML='<p class="hint" style="margin:10px 0 0">先輸入至少一個地點再推薦。</p>';return;}
  if(btn){btn.disabled=true;btn.textContent="查詢中…";}
  box.innerHTML='<p class="hint" style="margin:10px 0 0">正在比對地點與票券範圍…</p>';
  var unresolved=[],resolved=[];
  for(var idx=0;idx<inputs.length;idx++){
    var inp=inputs[idx];
    var pl=inp.value.trim();
    var picked=inp._ppPlace;
    if(picked&&picked.lat!=null){
      var nearPicked=ppNearestStation(picked.lat,picked.lng);
      if(nearPicked&&nearPicked.dist<=1200){
        resolved.push({place:pl,lines:nearPicked.station.l,kind:"near",
          stationName:nearPicked.station.n,dist:nearPicked.dist});
      }else{
        resolved.push({place:pl,geo:{formatted:picked.formatted||pl,comps:picked.comps||[]},kind:"area"});
      }
      continue;
    }
    var hits=ppFindStationLines(pl);
    if(hits.length){
      resolved.push({place:pl,hits:hits,kind:"station"});
      continue;
    }
    var geo=await ppGeocode(pl+", 日本");
    if(geo&&geo.lat!=null){
      var near=ppNearestStation(geo.lat,geo.lng);
      if(near&&near.dist<=1200){
        resolved.push({place:pl,lines:near.station.l,kind:"near",
          stationName:near.station.n,dist:near.dist});
        continue;
      }
    }
    if(geo){resolved.push({place:pl,geo:geo,kind:"area"});}
    else unresolved.push(pl);
  }
  if(btn){btn.disabled=false;btn.textContent="推薦適合的票券";}
  if(!resolved.length){
    box.innerHTML='<div class="pp-reco-res"><p class="hint" style="margin:0">'+
      (gmapsLoaded?"這幾個地點查不到車站資料,Google 地理編碼也找不到,請確認地名是否正確。":
       "這幾個地點都不在本圖收錄的車站資料裡,而且尚未在「資料來源設定」貼上 Google API 金鑰無法進一步查詢,建議直接查各票券官方頁確認範圍。")+
      '</p></div>';
    return;
  }
  var scored=PASS_CATALOG.filter(function(p){return !p.excludeFromReco;}).map(function(p){
    var matched=[],unmatched=[];
    resolved.forEach(function(r){
      if(r.kind==="station"){
        var hitLine=null,hitStation=null;
        for(var hi=0;hi<r.hits.length;hi++){
          var s2=r.hits[hi];
          var l2=s2.l.filter(function(l){return ppLineCovered(p.kind,l);})[0];
          if(l2){hitLine=l2;hitStation=s2;break;}
        }
        if(hitLine){
          var dupNote=r.hits.length>1
            ? "(「"+r.place+"」在地圖上有 "+r.hits.length+" 個同名車站:"+
              r.hits.map(function(s3){return s3.l.join("/");}).join("、")+
              ",這張票只涵蓋「"+hitLine+"」那一個,不是其他同名車站,請注意實際位置可能有落差)"
            : "";
          matched.push({place:r.place,reason:"車站在「"+hitLine+"」,這張票券有涵蓋這條路線"+dupNote});
        }else{
          var noCoverNote=r.hits.length>1
            ?"這個地名對應的 "+r.hits.length+" 個同名車站(分別在"+
             r.hits.map(function(s3){return s3.l.join("/");}).join("、")+")都不在這張票券範圍內"
            :"這張票券不含這個地點附近的路線";
          unmatched.push({place:r.place,note:noCoverNote});
        }
      }else if(r.kind==="near"){
        var line=r.lines.filter(function(l){return ppLineCovered(p.kind,l);})[0];
        if(line){
          matched.push({place:r.place,reason:"離「"+r.stationName+"」站約 "+distTxt(r.dist)+
            ",這站在「"+line+"」,這張票券有涵蓋這條路線"});
        }else unmatched.push({place:r.place,note:"這張票券不含這個地點附近的路線"});
      }else{
        var kw=ppAreaMatchKeyword(r.geo,PASS_AREA_KEYWORDS[p.id]||[]);
        if(kw)matched.push({place:r.place,reason:"地理位置估算落在「"+kw+"」一帶,這張票券的範圍有包含(依地理位置估算,較粗略)"});
        else unmatched.push({place:r.place,note:"這張票券不含這個地點附近的路線"});
      }
    });
    return {pass:p,matched:matched,unmatched:unmatched,score:matched.length};
  }).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,3);
  var medals=["🥇","🥈","🥉"];
  var html='<div class="pp-reco-res"><div class="hint" style="margin:0 0 8px">推薦結果</div>';
  if(!scored.length){
    html+='<p class="hint" style="margin:0">目前收錄的票券裡,沒有一張完整涵蓋這些地點,建議分開查詢或考慮 ICOCA 逐站付費。</p>';
  }else{
    scored.forEach(function(x,i){
      var reasonRows=x.matched.map(function(m){
        return '<div class="pp-why-row ok"><span>✓</span><div><b>'+esc(m.place)+'</b><br>'+esc(m.reason)+'</div></div>';
      }).join("")+x.unmatched.map(function(u){
        return '<div class="pp-why-row no"><span>✗</span><div><b>'+esc(u.place)+'</b><br>'+esc(u.note)+'</div></div>';
      }).join("");
      html+='<div class="pp-reco-item'+(i===0?" top":"")+'"><span class="medal">'+medals[i]+'</span>'+
        '<div style="flex:1;min-width:0"><div class="nm">'+esc(x.pass.name)+' '+esc(x.pass.price)+'</div>'+
        '<div class="pp-why-list">'+reasonRows+'</div>'+
        '<div class="pp-group" style="margin-top:8px">'+ppItemHtml(x.pass)+'</div>'+
        '</div></div>';
    });
  }

  if(unresolved.length)html+='<p class="hint" style="margin:8px 0 0">查不到地點資料,建議手動確認:'+unresolved.map(esc).join("、")+'</p>';
  html+='<p class="hint" style="margin:8px 0 0">車站名稱比對最精確;地理編碼查到最近車站(1.2公里內)次之;真的找不到最近站時才退回「城市/區域」層級,較粗略。未計入票價與天數,實際請以官方資訊為準。</p></div>';
  box.innerHTML=html;
}
/* ================= 兩站間路線規劃:選起訖站後直接開 Google 地圖導航 ================= */
var rpFromPlace=null, rpToPlace=null, rpAutoDone=false;
function rpInitAutocomplete(){
  if(rpAutoDone||!window.google||!google.maps||!google.maps.places)return;
  rpAutoDone=true;
  var opts={componentRestrictions:{country:"jp"},fields:["place_id","formatted_address","name","geometry"]};
  var acFrom=new google.maps.places.Autocomplete($("rpFrom"),opts);
  var acTo=new google.maps.places.Autocomplete($("rpTo"),opts);
  acFrom.addListener("place_changed",function(){rpFromPlace=acFrom.getPlace();gTrackDetail("autocomplete");});
  acTo.addListener("place_changed",function(){rpToPlace=acTo.getPlace();gTrackDetail("autocomplete");});
  $("rpFrom").addEventListener("input",function(){rpFromPlace=null;});
  $("rpTo").addEventListener("input",function(){rpToPlace=null;});
}
/* ================= 本地地點建議清單(不依賴Google,用我們自己的車站+景點資料) ================= */
var rpAllPlaceNames=null;
function rpBuildPlaceIndex(){
  if(rpAllPlaceNames)return rpAllPlaceNames;
  var list=[];
  ["大阪","京都","關西全域"].forEach(function(c){
    (METRO[c]&&METRO[c].st||[]).forEach(function(s){list.push({name:s.n,tag:c});});
  });
  Object.keys(LANDMARK_ALIAS).forEach(function(k){list.push({name:k,tag:"景點"});});
  var seen={}, dedup=[];
  list.forEach(function(item){
    if(seen[item.name])return; seen[item.name]=1; dedup.push(item);
  });
  rpAllPlaceNames=dedup;
  return dedup;
}
function rpSuggest(query){
  if(!query)return [];
  var list=rpBuildPlaceIndex();
  return list.filter(function(item){return item.name.indexOf(query)>=0;}).slice(0,8);
}
function rpBindLocalSuggest(inputId,sugId,onPick){
  var inp=$(inputId), sug=$(sugId);
  inp.addEventListener("input",function(){
    var v=inp.value.trim();
    var items=rpSuggest(v);
    if(!items.length){sug.classList.remove("on");sug.innerHTML="";return;}
    sug.innerHTML=items.map(function(item){
      return '<div class="rp-sug-item" data-n="'+attr(item.name)+'">'+esc(item.name)+
        '<span class="tag">'+esc(item.tag)+'</span></div>';
    }).join("");
    sug.classList.add("on");
    sug.querySelectorAll(".rp-sug-item").forEach(function(el){
      el.addEventListener("mousedown",function(e){
        e.preventDefault();
        inp.value=el.dataset.n;
        sug.classList.remove("on");sug.innerHTML="";
        if(onPick)onPick();
      });
    });
  });
  inp.addEventListener("blur",function(){setTimeout(function(){sug.classList.remove("on");},150);});
  inp.addEventListener("input",function(){if(typeof mPickSync==="function")mPickSync();});
  inp.addEventListener("focus",function(){if(inp.value.trim())inp.dispatchEvent(new Event("input"));});
}
rpBindLocalSuggest("rpFrom","rpFromSug",function(){rpFromPlace=null;});
rpBindLocalSuggest("rpTo","rpToSug",function(){rpToPlace=null;});

/* ---- 新版路線規劃卡片控制項 ---- */
var rpMode="transit", rpStops=[];
document.querySelectorAll(".rp-seg button").forEach(function(b){
  b.addEventListener("click",function(){
    document.querySelectorAll(".rp-seg button").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    rpMode=b.dataset.mode;
    var add=$("rpAddStop");
    add.disabled=(rpMode!=="driving");
    if(rpMode!=="driving"){rpStops=[];rpRenderStops();}
  });
});
$("rpSwap").addEventListener("click",function(){
  var a=$("rpFrom").value, b=$("rpTo").value;
  $("rpFrom").value=b; $("rpTo").value=a;
  var t=rpFromPlace; rpFromPlace=rpToPlace; rpToPlace=t;
});
$("rpPassBtn").addEventListener("click",mpOpen);
$("rpGrayBtn").addEventListener("click",function(){
  mGrayOn=!mGrayOn; rpSyncToolLabels(); mApplyPassOverlay();
});
$("rpAddStop").disabled=true;
$("rpAddStop").addEventListener("click",function(){
  if(rpMode!=="driving")return;
  rpStops.push(""); rpRenderStops();
});
function rpRenderStops(){
  var wrap=$("rpStopWrap");
  if(!wrap){
    wrap=document.createElement("div"); wrap.id="rpStopWrap";
    $("rpAddStop").parentNode.insertBefore(wrap,$("rpAddStop"));
  }
  wrap.innerHTML=rpStops.map(function(v,i){
    return '<input type="text" class="rp-stop" data-i="'+i+'" placeholder="停靠站 '+(i+1)+
      '" value="'+attr(v)+'" style="margin-top:8px" autocomplete="off">';
  }).join("");
  wrap.querySelectorAll(".rp-stop").forEach(function(inp){
    inp.addEventListener("input",function(){rpStops[+inp.dataset.i]=inp.value;});
  });
}
rpSyncToolLabels();
function mFillRouteSelects(){
  $("rpFrom").value="";$("rpTo").value="";
  rpFromPlace=null;rpToPlace=null;
  $("rpHint").textContent=gmapsLoaded?"":"(未在「資料來源設定」貼上 Google API 金鑰,只能輸入車站名稱給 Google 地圖自行判斷)";
}
$("rpGo").addEventListener("click",function(){
  var fromTxt=$("rpFrom").value.trim(),toTxt=$("rpTo").value.trim();
  if(!fromTxt||!toTxt){$("rpHint").textContent="請輸入起點和迄點。";return;}
  if(fromTxt===toTxt){$("rpHint").textContent="起點和迄點一樣,換一個試試。";return;}
  $("rpHint").textContent="";
  rpPlanRoute(fromTxt,toTxt);
});
/* ================= 票券限定路徑搜尋:只用選定票券涵蓋的路線,在我們自己的路網圖裡找路 ================= */
var rpGraphCache={};
function rpBuildGraph(city){
  if(rpGraphCache[city])return rpGraphCache[city];
  var d=METRO[city], adj={};
  (d.links||[]).forEach(function(e){
    var a=e[0],b=e[1],line=e[2];
    (adj[a]=adj[a]||[]).push({to:b,line:line});
    (adj[b]=adj[b]||[]).push({to:a,line:line});
  });
  rpGraphCache[city]=adj;
  return adj;
}
function rpResolveInCity(city,name){
  var d=METRO[city]; if(!d)return null;
  var direct=ppStationMatch(city,name);
  if(direct.length)return direct[0].n;
  var alias=ppResolveName(name);
  if(alias){
    var hits=ppStationMatch(city,alias);
    if(hits.length)return hits[0].n;
  }
  return null;
}
function rpFindCommonCity(fromTxt,toTxt){
  var order=[mCity,"大阪","京都","關西全域"].filter(function(c,i,a){return a.indexOf(c)===i;});
  for(var i=0;i<order.length;i++){
    var c=order[i];
    var f=rpResolveInCity(c,fromTxt), t=rpResolveInCity(c,toTxt);
    if(f&&t&&f!==t)return {city:c,from:f,to:t};
  }
  return null;
}
function rpBFS(city,fromName,toName,allowedLines){
  var adj=rpBuildGraph(city);
  if(!adj[fromName]||!adj[toName])return null;
  var queue=[fromName], visited={};
  visited[fromName]={prev:null,line:null};
  while(queue.length){
    var cur=queue.shift();
    if(cur===toName)break;
    (adj[cur]||[]).forEach(function(e){
      if(visited[e.to])return;
      if(allowedLines&&allowedLines.indexOf(e.line)<0)return;
      visited[e.to]={prev:cur,line:e.line};
      queue.push(e.to);
    });
  }
  if(!visited[toName])return null;
  var path=[],cur=toName;
  while(cur){
    path.unshift({station:cur,lineFromPrev:visited[cur].line});
    cur=visited[cur].prev;
  }
  return path;
}
var WALK_LINE="徒步轉乘";
function rpAllowedLines(){
  var ps=myPassObjs().filter(function(p){return !p.singleTrip;});
  if(!ps.length)return null;                    /* 沒選票券 = 不限制 */
  var d=METRO[mCity]; var lines=[WALK_LINE];    /* 走路不需要票券,一律允許 */
  Object.keys(d.col||{}).forEach(function(l){if(mPassLineStatus(l)==="ok")lines.push(l);});
  return lines;
}
function rpPlanRoute(fromTxt,toTxt){
  var box=$("rpPassWarn");
  try{
    var found=rpFindCommonCity(fromTxt,toTxt);
    if(!found){
      box.innerHTML='<div class="pp-reco" style="margin-top:8px;padding:12px">'+
        '<p class="hint" style="margin:0 0 8px">起訖點不在本圖收錄的車站範圍內(或跨越不同圖的範圍),我們自己的路網算不出來。</p>'+
        '<button id="rpOpenGmapBtn" class="btn-sm" style="width:100%;justify-content:center">改用 Google 地圖看路線 ↗</button></div>';
      $("rpOpenGmapBtn").onclick=function(){rpOpenGoogleMaps(fromTxt,toTxt);};
      return;
    }
    if(found.city!==mCity)mLoad(found.city);
    var allowed=rpAllowedLines();
    var path=rpBFS(found.city,found.from,found.to,allowed);
    var full=allowed?rpBFS(found.city,found.from,found.to,null):path;
    rpClearPathOnMap();
    if(path){
      rpRenderPathResult(path,true,null);
      rpDrawPathOnMap(found.city,path);
    }else if(full){
      var blockIdx=full.findIndex(function(step,i){return i>0&&allowed.indexOf(step.lineFromPrev)<0;});
      rpRenderPathResult(full,false,blockIdx);
      rpDrawPathOnMap(found.city,full,blockIdx);
    }else{
      box.innerHTML='<div class="pp-reco" style="margin-top:8px;padding:12px">'+
        '<p class="hint" style="margin:0 0 8px">在本圖的路網裡找不到「'+esc(fromTxt)+'」到「'+esc(toTxt)+'」的路徑(可能中間有資料沒收錄到)。</p>'+
        '<button id="rpOpenGmapBtn" class="btn-sm" style="width:100%;justify-content:center">改用 Google 地圖看路線 ↗</button></div>';
      $("rpOpenGmapBtn").onclick=function(){rpOpenGoogleMaps(fromTxt,toTxt);};
      return;
    }
    $("rpOpenGmapBtn").style.display="inline-flex";
    $("rpOpenGmapBtn").onclick=function(){rpOpenGoogleMaps(fromTxt,toTxt);};
  }catch(err){
    console.error("rpPlanRoute error:",err);
    box.innerHTML='<div class="pp-reco" style="margin-top:8px;padding:12px">'+
      '<p class="hint" style="margin:0 0 8px">路徑規劃時發生問題。</p>'+
      '<button id="rpOpenGmapBtn" class="btn-sm" style="width:100%;justify-content:center">改用 Google 地圖看路線 ↗</button></div>';
    $("rpOpenGmapBtn").onclick=function(){rpOpenGoogleMaps(fromTxt,toTxt);};
  }
}
function rpRenderPathResult(path,ok,blockIdx){
  var box=$("rpPassWarn");
  var passName=mPassSummaryName();
  var transfers0=path.filter(function(s,i){return i>0&&i<path.length-1&&path[i+1].lineFromPrev!==s.lineFromPrev;}).length;
  var html='<div class="rp-tabs">'+
    '<button type="button" class="rp-tab on"><div class="t">🎫 票券可走路線</div>'+
    '<div class="s">'+(ok?"✓ 全程涵蓋":"✗ 中間卡住")+'・'+(path.length-1)+' 站'+(transfers0?" "+transfers0+" 轉乘":"")+'</div></button>'+
    '<button type="button" class="rp-tab" id="rpTabGmap"><div class="t">🗺️ Google 路線</div>'+
    '<div class="s">實際班次・不限票券</div></button></div>';
  html+='<div class="pp-reco" style="margin-top:0;padding:12px">';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
  html+='<span style="font-size:13px;font-weight:600">'+(passName?esc(passName):"未指定票券(僅顯示路徑,不限制路線)")+'</span>';
  html+='<span style="margin-left:auto;font-size:11px;padding:3px 9px;border-radius:999px;'+
    (ok?'background:var(--ok-bg);color:var(--ok)">✓ 全程涵蓋':'background:var(--warn-bg);color:var(--warn)">✗ 中間卡住')+'</span>';
  html+='</div>';
  html+='<div style="position:relative;padding-left:22px">';
  html+='<div style="position:absolute;left:6px;top:6px;bottom:6px;width:2px;background:var(--stroke)"></div>';
  path.forEach(function(step,i){
    var blocked=(blockIdx!=null&&i>=blockIdx);
    var isTransfer=i>0&&i<path.length-1&&path[i+1].lineFromPrev!==step.lineFromPrev;
    var dot=blocked?"#e07a7a":(i===0||i===path.length-1?"#8fd39a":(isTransfer?"#f2a93b":"#8fd39a"));
    html+='<div style="position:relative;margin-bottom:14px;'+(blocked&&i>blockIdx?"opacity:.5":"")+'">';
    html+='<span style="position:absolute;left:-22px;top:2px;width:12px;height:12px;border-radius:50%;background:'+dot+'"></span>';
    html+='<div style="font-size:13.5px;font-weight:600">'+esc(step.station)+(isTransfer&&!blocked?'<span style="color:var(--muted);font-weight:400;font-size:11.5px"> · 換乘站</span>':'')+'</div>';
    if(i<path.length-1){
      var nextBlocked=blockIdx!=null&&(i+1)>=blockIdx;
      html+='<div style="font-size:11.5px;color:'+(nextBlocked?"var(--warn)":"var(--muted)")+';margin-top:2px">'+
        (nextBlocked?"往下一站需要「"+esc(path[i+1].lineFromPrev)+"」,這張票不含這條線"
          :(path[i+1].lineFromPrev===WALK_LINE?"🚶 步行轉乘(同一車站群,走過去即可)":"搭乘 "+esc(path[i+1].lineFromPrev)))+'</div>';
    }
    html+='</div>';
  });
  html+='</div>';
  if(ok){
    var transfers=path.filter(function(s,i){return i>0&&i<path.length-1&&path[i+1].lineFromPrev!==s.lineFromPrev;}).length;
    html+='<div style="margin-top:6px;padding-top:10px;border-top:1px solid var(--stroke);font-size:12px;color:var(--muted)">全程 '+(path.length-1)+' 站、'+transfers+' 次換乘'+(passName?",都在「"+esc(passName)+"」範圍內。":"。")+'</div>';
  }else{
    html+='<div style="margin-top:6px;padding-top:10px;border-top:1px solid var(--stroke);font-size:12px;color:var(--warn)">這張票到不了終點,卡住的那一段需要另外買票,或考慮下面更適合的票券。</div>';
    var fromS=path[0].station,toS=path[path.length-1].station;
    var fromHits=[{n:fromS,l:[path[Math.min(blockIdx,path.length-1)].lineFromPrev].filter(Boolean)}];
    var alt=PASS_CATALOG.filter(function(p){return !p.excludeFromReco;}).map(function(p){
      var lines=path.slice(1).map(function(s){return s.lineFromPrev;});
      var coversAll=lines.every(function(l){return ppLineCovered(p.kind,l);});
      var coversN=lines.filter(function(l){return ppLineCovered(p.kind,l);}).length;
      return {pass:p,coversAll:coversAll,score:coversN};
    }).filter(function(x){return x.score>0;}).sort(function(a,b){return (b.coversAll-a.coversAll)||(b.score-a.score);}).slice(0,3);
    if(alt.length){
      html+='<p class="hint" style="margin:8px 0 6px">比較適合這段路線的票券:</p>';
      alt.forEach(function(x){
        html+='<div class="pp-reco-item"><div style="flex:1"><div class="nm">'+esc(x.pass.name)+' '+esc(x.pass.price)+
          '</div><div class="pp-why-row '+(x.coversAll?"ok":"no")+'"><span>'+(x.coversAll?"✓":"~")+'</span><div>'+
          (x.coversAll?"整段路徑都在範圍內":"涵蓋大部分路段,請再確認細節")+'</div></div></div></div>';
      });
    }
  }
  html+='<p class="hint" style="margin:8px 0 0">路徑依我們自己收錄的車站資料算最少換乘,不是即時班次;實際班次、月台請以 Google 地圖或官方資訊為準。</p>';
  html+='<div id="rpGmapWrap" style="margin-top:8px"><button id="rpOpenGmapBtn" class="btn-sm" style="display:none;width:100%;justify-content:center">改用 Google 地圖看實際路線 ↗</button></div>';
  html+='</div>';
  box.innerHTML=html;
  var tg=$("rpTabGmap");
  if(tg)tg.onclick=function(){
    rpOpenGoogleMaps($("rpFrom").value.trim(),$("rpTo").value.trim());
  };
}
function rpOpenGoogleMaps(fromTxt,toTxt){
  var u="https://www.google.com/maps/dir/?api=1&travelmode="+(rpMode==="driving"?"driving":"transit");
  if(rpFromPlace&&rpFromPlace.place_id&&rpFromPlace.name===fromTxt)
    u+="&origin="+encodeURIComponent(fromTxt)+"&origin_place_id="+encodeURIComponent(rpFromPlace.place_id);
  else u+="&origin="+encodeURIComponent(fromTxt);
  if(rpToPlace&&rpToPlace.place_id&&rpToPlace.name===toTxt)
    u+="&destination="+encodeURIComponent(toTxt)+"&destination_place_id="+encodeURIComponent(rpToPlace.place_id);
  else u+="&destination="+encodeURIComponent(toTxt);
  if(rpMode==="driving"){
    var stops=rpStops.filter(function(s){return s&&s.trim();});
    if(stops.length)u+="&waypoints="+stops.map(encodeURIComponent).join("%7C");
  }
  window.open(u,"_blank");
}
function rpClearPathOnMap(){
  if(mRoot){var g=mRoot.querySelector("#rpPathG"); if(g)g.remove();}
}
function rpDrawPathOnMap(city,path,blockIdx){
  if(!mRoot||city!==mCity)return;
  var d=METRO[city];
  var byName={}; d.st.forEach(function(s){byName[s.n]=s;});
  var NS="http://www.w3.org/2000/svg";
  var g=document.createElementNS(NS,"g"); g.id="rpPathG";
  for(var i=0;i<path.length-1;i++){
    var blocked=blockIdx!=null&&(i+1)>=blockIdx;
    var a=byName[path[i].station], b=byName[path[i+1].station];
    if(!a||!b)continue;
    var line=document.createElementNS(NS,"line");
    line.setAttribute("x1",a.sx);line.setAttribute("y1",a.sy);
    line.setAttribute("x2",b.sx);line.setAttribute("y2",b.sy);
    var isWalk=path[i+1].lineFromPrev===WALK_LINE;
    line.setAttribute("stroke",blocked?"#e07a7a":(isWalk?"#c7d2dd":(d.col[path[i+1].lineFromPrev]||"#f2a93b")));
    line.setAttribute("stroke-width",isWalk?"3":"6");
    line.setAttribute("stroke-linecap","round");
    line.setAttribute("stroke-dasharray",blocked?"4,4":(isWalk?"2,5":"none"));
    line.setAttribute("opacity","0.9");
    g.appendChild(line);
  }
  path.forEach(function(step,i){
    var s=byName[step.station]; if(!s)return;
    var blocked=blockIdx!=null&&i>=blockIdx;
    var c=document.createElementNS(NS,"circle");
    c.setAttribute("cx",s.sx);c.setAttribute("cy",s.sy);c.setAttribute("r",blocked?"7":"9");
    c.setAttribute("fill",blocked?"#e07a7a":(i===0||i===path.length-1?"#8fd39a":"#f2a93b"));
    c.setAttribute("stroke","#12263c");c.setAttribute("stroke-width","2");
    g.appendChild(c);
  });
  mRoot.appendChild(g);
}
/* ---- 全螢幕選站模式 ---- */
var mPickOn=false;
$("mPickMode").addEventListener("click",function(){
  mPickOn=!mPickOn;
  document.body.classList.toggle("mPickOn",mPickOn);
  $("mPickMode").classList.toggle("on",mPickOn);
  mPickSync();
  toast(mPickOn?"選站模式:點車站直接設起訖點":"已關閉選站模式");
});
function mPickSync(){
  var f=$("rpFrom").value.trim(), t=$("rpTo").value.trim();
  $("mFsFrom").innerHTML=f?esc(f):'<em>點車站選出發…</em>';
  $("mFsTo").innerHTML=t?esc(t):'<em>點車站選目的地…</em>';
}
$("mFsGo").addEventListener("click",function(){
  var f=$("rpFrom").value.trim(), t=$("rpTo").value.trim();
  if(!f||!t){toast("先選好出發和目的地");return;}
  if(document.body.classList.contains("mFsOn"))$("mFs").click();
  if($("rpBody").style.display==="none"){
    $("rpBody").style.display="block";
    $("rpCaret").textContent="輸入起訖點,依票券規劃 ⌃";
  }
  $("rpGo").click();
});
function mPickCard(i){
  var s=mST[i];
  var old=document.querySelector(".mp-pick"); if(old)old.remove();
  var el=document.createElement("div");
  el.className="mp-pick";
  el.innerHTML='<button class="cl">&times;</button>'+
    '<div class="nm">'+esc(s.n)+'</div><div class="ln">'+esc(s.l.join("・"))+'</div>'+
    '<div class="bs"><button data-w="from">🔵 設為出發</button>'+
    '<button data-w="to">🔴 設為目的地</button></div>';
  document.body.appendChild(el);
  el.querySelector(".cl").onclick=function(){el.remove();};
  el.querySelectorAll("[data-w]").forEach(function(b){
    b.onclick=function(){
      var w=b.dataset.w;
      if(w==="from"){$("rpFrom").value=s.n;rpFromPlace=null;}
      else{$("rpTo").value=s.n;rpToPlace=null;}
      mPickSync(); el.remove();
      toast(w==="from"?("出發:"+s.n):("目的地:"+s.n));
    };
  });
}
function rpSetFromStation(i,which){
  if(i<0||i>=mST.length)return;
  var name=mST[i].n;
  if(which==="from"){$("rpFrom").value=name; rpFromPlace=null;}
  else{$("rpTo").value=name; rpToPlace=null;}
  mCloseSheet(); mPickSync();
  /* 確保路線規劃面板是展開的,並捲到看得見 */
  if($("rpBody").style.display==="none"){
    $("rpBody").style.display="block";
    $("rpCaret").textContent="輸入起訖點,依票券規劃 ⌃";
    ensureGoogleMapsLoaded();
  }
  if(document.body.classList.contains("mFsOn")&&$("mFs"))$("mFs").click();
  $("rpBody").scrollIntoView({behavior:"smooth",block:"center"});
  toast(which==="from"?("出發設為 "+name):("目的地設為 "+name));
}
function mOpen(i){
  if(i<0||i>=mST.length)return;
  var s=mST[i];
  mShowPick(s);
  if(mPickOn){mPickCard(i);return;}
  var inRoute=route.some(function(r){return r.name===mStName(s);});
  var transferRows=s.l.map(function(lineName,idx){
    var cd=s.cd[idx];
    var codeTxt=cd?(cd.l+cd.n):"";
    var col=cd?cd.c:"#8fa0b8";
    return '<div class="msh-transfer">'+(codeTxt?'<span class="msh-tcode" style="background:'+col+';">'+esc(codeTxt)+'</span>':'')+
      '<span class="msh-tname">'+esc(lineName)+'</span><span class="msh-chev">›</span></div>';
  }).join("");
  var head='<div class="msh-top">'+mCodeHtml(s.cd)+'<span class="nm">'+esc(s.n)+'</span>'+
    (i===mNearIdx?'<span class="mtag ok">離你最近</span>':'')+
    (s.l.length>1?'<span class="mtag">轉乘站</span>':'')+
    '<button class="x" onclick="mCloseSheet()">&times;</button></div>'+
    '<div class="mlines">'+esc(s.l.join("・"))+'</div>'+
    '<div class="msh-tabs">'+
      '<button type="button" class="on" onclick="mshTab(0,this)">車站資訊</button>'+
      '<button type="button" onclick="mshTab(1,this)">附近景點</button>'+
    '</div>'+
    '<div class="msh-pane on" id="mshP0">'+
      (transferRows?'<div class="section-label" style="margin:0 0 4px">'+(s.l.length>1?"轉乘路線":"所屬路線")+'</div>'+transferRows:'')+
      '<div class="msh-grid">'+
      '<button onclick="rpSetFromStation('+i+',\'from\')"><span class="mg-ic">'+IC.pin+'</span><span>設為出發</span></button>'+
      '<button onclick="rpSetFromStation('+i+',\'to\')"><span class="mg-ic">'+IC.pin+'</span><span>設為目的地</span></button>'+
      (inRoute?'<button disabled style="color:var(--ok);"><span class="mg-ic" style="color:var(--ok);">'+IC.check+'</span><span>已在路線中</span></button>'
             :'<button onclick="mAddRoute('+i+')"><span class="mg-ic">'+IC.plus+'</span><span>插入路線</span></button>')+
      '<button onclick="mGmap('+i+')"><span class="mg-ic">'+IC.ext+'</span><span>Google 地圖</span></button>'+
      '</div>'+
    '</div>'+
    '<div class="msh-pane" id="mshP1"><div id="mNearBox">'+
      '<p style="font-size:13px;color:var(--muted);margin:4px 0 0">正在計算附近的口袋景點…</p></div></div>';
  $("mSheet").innerHTML=head;
  $("mSheet").classList.add("on");
  mStationCoord(s,function(coord){
    var box=$("mNearBox"); if(!box)return;
    if(!coord){box.innerHTML='<p style="font-size:13px;color:var(--muted);margin:4px 0 0">'+
      '查不到這站的座標,無法計算附近景點</p>';return;}
    var near=mNearPlaces(coord);
    var myD=mPos?'距離你約 '+distTxt(haversine(mPos.lat,mPos.lng,coord.lat,coord.lng))+'・':'';
    if(!near||!near.length){
      box.innerHTML='<div class="msh-dist">'+myD+'這站 1.5 公里內沒有你收藏的景點</div>';return;
    }
    box.innerHTML='<div class="msh-dist">'+myD+'1.5 公里內有 '+near.length+' 個口袋景點</div>'+
      '<div class="near-cards">'+near.map(function(r){
        var p=r.p, key=p.id||p.name;
        var ph=p.photoUrl
          ? '<div class="ph"><img src="'+attr(p.photoUrl)+'" alt="" loading="lazy" onerror="phThumbErr(this,\''+attr(key)+'\')"></div>'
          : '<div class="ph" style="background:'+placeGradient(key)+'"></div>';
        return '<div class="near-card">'+ph+
          '<div class="nm">'+esc(p.name)+'</div>'+
          '<div class="mt">'+esc(p.cat||"")+'・🚶 '+distTxt(r.d)+'</div></div>';
      }).join("")+'</div>';
  });
}
/* 車站面板分頁切換 */
function mshTab(i,btn){
  var wrap=$("mSheet");
  wrap.querySelectorAll(".msh-tabs button").forEach(function(b){b.classList.remove("on");});
  btn.classList.add("on");
  var p0=$("mshP0"),p1=$("mshP1");
  if(p0)p0.classList.toggle("on",i===0);
  if(p1)p1.classList.toggle("on",i===1);
}
function mStName(s){
  return mCity==="台北"?("捷運"+s.n+"站"):(s.n+"駅");
}
function mCloseSheet(){
  $("mSheet").classList.remove("on");
  mHidePick();
}
function mAddRoute(i){
  if(i<0||i>=mST.length)return;
  if(!curTrip){toast("先到「行程」建立或打開一個行程再插入");return;}
  var s=mST[i],n=mStName(s);
  route.push({name:n,pid:null,tmp:true});
  doneLeg={};syncDayFromRoute();
  toast("已加入 Day "+(curDay+1)+":"+s.n);
  mOpen(i);
}
function mGmap(i){if(i<0||i>=mST.length)return;gmapSearch(mStName(mST[i]));}
function mModal(html){$("mBox").innerHTML=html;$("mModal").classList.add("on");}
function mCloseModal(){$("mModal").classList.remove("on");}
function mShowHelp(){
  mModal('<h3>使用說明<button class="x" onclick="mCloseModal()">&times;</button></h3>'+
   '<p><b>基本操作</b></p><ul>'+
   '<li>拖曳平移、雙指縮放,或用右下 ＋／−／⬛</li>'+
   '<li>上排切換城市,下排色點列可只看單一路線</li></ul>'+
   '<p><b>站點</b></p><ul>'+
   '<li>點站可看站號、轉乘路線,並<b>直接插入路線規劃</b></li>'+
   '<li>面板會列出這站 1.5 公里內你收藏的口袋景點</li>'+
   '<li>單線模式下,藍圈代表該站可轉乘其他路線</li></ul>'+
   '<p><b>搜尋與定位</b></p><ul>'+
   '<li>可用站名或站號(M20、BL14)跨城市搜尋</li>'+
   '<li>台北圖可用 ◎ 定位,找出離你最近的車站</li></ul>'+
   '<p style="color:var(--muted);font-size:12px">首末班車與票價未收錄,請以官方公告為準。</p>');
}
function mShowInfo(){
  var d=METRO[mCity];
  if(!mLine){
    mModal('<h3>'+esc(mCity)+'<button class="x" onclick="mCloseModal()">&times;</button></h3>'+
     '<p>共 '+Object.keys(d.col).length+' 條路線、'+d.st.length+' 站</p>'+
     Object.keys(d.col).map(function(n){
       var c=d.st.filter(function(s){return s.l.indexOf(n)>=0;}).length;
       return '<div class="mkv"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+
       d.col[n]+';margin-right:7px"></i>'+esc(n)+'</span><span>'+c+' 站</span></div>';}).join(''));
    return;
  }
  var sts=d.st.filter(function(s){return s.l.indexOf(mLine)>=0;});
  var trs=sts.filter(function(s){return s.l.length>1;});
  var o={};trs.forEach(function(s){s.l.forEach(function(l){if(l!==mLine)o[l]=1;});});
  mModal('<h3><i style="display:inline-block;width:11px;height:11px;border-radius:50%;background:'+d.col[mLine]+'"></i>'+
   esc(mLine)+'<button class="x" onclick="mCloseModal()">&times;</button></h3>'+
   '<div class="mkv"><span>站數</span><span>'+sts.length+' 站</span></div>'+
   '<div class="mkv"><span>起訖</span><span>'+esc(sts[0].n)+' ↔ '+esc(sts[sts.length-1].n)+'</span></div>'+
   '<div class="mkv"><span>轉乘站</span><span>'+trs.length+' 站</span></div>'+
   '<div class="mkv"><span>可轉乘</span><span style="text-align:right">'+(Object.keys(o).map(esc).join('<br>')||'—')+'</span></div>'+
   '<p style="margin-top:12px;color:var(--muted);font-size:12px">首末班車與票價未收錄,請查官方時刻表。</p>');
}


function mMeasure(){
  var hd=document.querySelector("header"), nv=document.querySelector("nav");
  if(hd)document.documentElement.style.setProperty("--hdH",hd.offsetHeight+"px");
  if(nv)document.documentElement.style.setProperty("--navH",nv.offsetHeight+"px");
}
function mToggleFullscreen(){
  var on=document.body.classList.toggle("mFsOn");
  $("mFs").innerHTML=on?"&#10005;":"&#9974;";
  $("mFs").title=on?"退出全螢幕":"全螢幕";
  setTimeout(function(){mMeasure();mApply();},50);
}
window.addEventListener("resize",function(){if(mSvg){mMeasure();mApply();}});



/* ================= 從行程匯入起訖點 ================= */
var rpImpTrip=null, rpImpDay=0, rpImpFrom=null, rpImpTo=null;
function rpImpOpen(){
  /* 預設選目前正在編輯的行程,沒有就選第一個 */
  if(!trips.length){toast("還沒有任何行程,先到行程頁建立一個");return;}
  var exists=rpImpTrip&&trips.some(function(t){return t.id===rpImpTrip;});
  if(!exists){rpImpTrip=(curTrip&&tripById(curTrip))?curTrip:trips[0].id;rpImpDay=0;}
  rpImpFrom=null;rpImpTo=null;
  rpImpRender();
  $("mddBk").classList.add("show");
  $("mddImp").classList.add("show");
}
function rpImpStops(){
  var t=tripById(rpImpTrip); if(!t)return [];
  var d=t.days[rpImpDay]; if(!d)return [];
  return d.stops||[];
}
function rpImpRender(){
  var t=tripById(rpImpTrip);
  if(!t){$("rpImpBody").innerHTML='<p class="note">找不到行程</p>';return;}
  var tripHtml=trips.map(function(x){
    var n=x.days.reduce(function(a,d){return a+d.stops.length;},0);
    return '<button type="button" class="imp-trip'+(x.id===rpImpTrip?" on":"")+'" data-t="'+attr(x.id)+'">'+
      '<span class="nm">'+esc(x.name)+'<span class="sub">'+esc(tripRangeStr(x))+'・'+n+' 個地點</span></span>'+
      (x.id===rpImpTrip?'<span class="ck">✓</span>':'')+'</button>';
  }).join("");
  var dayHtml=t.days.map(function(d,i){
    return '<button type="button" class="imp-day'+(i===rpImpDay?" on":"")+'" data-d="'+i+'">D'+(i+1)+
      '<small>'+d.stops.length+' 站</small></button>';
  }).join("");
  var stops=rpImpStops();
  var stopHtml=stops.length?stops.map(function(s,i){
    return '<div class="imp-stop">'+
      '<span class="n">'+(i+1)+'</span>'+
      '<span class="nm">'+esc(s.name)+'</span>'+
      '<span class="pick">'+
        '<button type="button" class="f'+(rpImpFrom===i?" on":"")+'" data-f="'+i+'">出發</button>'+
        '<button type="button" class="t'+(rpImpTo===i?" on":"")+'" data-t2="'+i+'">目的</button>'+
      '</span></div>';
  }).join(""):'<p class="note">這天還沒有安排停靠點</p>';
  var fromTxt=(rpImpFrom!=null&&stops[rpImpFrom])?stops[rpImpFrom].name:"(未選,可自己打)";
  var toTxt=(rpImpTo!=null&&stops[rpImpTo])?stops[rpImpTo].name:"(未選,可自己打)";
  $("rpImpBody").innerHTML=
    '<div class="section-label" style="margin-top:0">選行程</div>'+tripHtml+
    '<div class="section-label">選日期</div><div class="imp-days">'+dayHtml+'</div>'+
    '<div class="section-label">點站名右邊,指定它當「出發」或「目的地」</div>'+stopHtml+
    '<div class="imp-preview">出發:<b>'+esc(fromTxt)+'</b><br>目的地:<b>'+esc(toTxt)+'</b></div>'+
    '<p class="note">也可以只選其中一個,另一個自己打。按「帶入」只會填進欄位,不會直接搜尋。</p>'+
    '<button class="btn-primary" style="width:100%;margin-top:14px" onclick="rpImpApply()">帶入起訖點</button>';
  $("rpImpBody").querySelectorAll("[data-t]").forEach(function(b){
    b.onclick=function(){rpImpTrip=b.dataset.t;rpImpDay=0;rpImpFrom=null;rpImpTo=null;rpImpRender();};});
  $("rpImpBody").querySelectorAll("[data-d]").forEach(function(b){
    b.onclick=function(){rpImpDay=+b.dataset.d;rpImpFrom=null;rpImpTo=null;rpImpRender();};});
  $("rpImpBody").querySelectorAll("[data-f]").forEach(function(b){
    b.onclick=function(){var i=+b.dataset.f;rpImpFrom=(rpImpFrom===i)?null:i;
      if(rpImpTo===rpImpFrom)rpImpTo=null;rpImpRender();};});
  $("rpImpBody").querySelectorAll("[data-t2]").forEach(function(b){
    b.onclick=function(){var i=+b.dataset.t2;rpImpTo=(rpImpTo===i)?null:i;
      if(rpImpFrom===rpImpTo)rpImpFrom=null;rpImpRender();};});
}
function rpImpApply(){
  var stops=rpImpStops();
  if(rpImpFrom==null&&rpImpTo==null){toast("先指定出發或目的地");return;}
  if(rpImpFrom!=null&&stops[rpImpFrom]){$("rpFrom").value=stops[rpImpFrom].name;rpFromPlace=null;}
  if(rpImpTo!=null&&stops[rpImpTo]){$("rpTo").value=stops[rpImpTo].name;rpToPlace=null;}
  mClosePick();
  if($("rpBody").style.display==="none"){
    $("rpBody").style.display="block";
    $("rpCaret").textContent="輸入起訖點,依票券規劃 ⌃";
    ensureGoogleMapsLoaded();
  }
  toast("已帶入起訖點");
}
