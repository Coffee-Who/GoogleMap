"use strict";
/* ================= 關西機場交通(捷運圖第 4 個分頁) =================
   資料來源:massi.tw〈關西機場交通攻略〉+ 各業者官方頁
   路線圖:assets/kix-route-map.jpg(圖片作者:馬摩)
   線色比照路線圖圖示說明
------------------------------------------------------------------ */

var KIX_IMG   = "assets/kix-route-map.jpg";
var KIX_CREDIT= "https://massi.tw/kansai-airport-transportation/";

/* 圖示說明配色 */
var KIX_COL = {
  nankaiMain : "#009944",  /* 南海本線 綠 */
  nankaiLtd  : "#0068B7",  /* 南海特急 藍 */
  haruka     : "#E60012",  /* HARUKA  紅 */
  kanku      : "#E60012",  /* 關空快速 紅白雙線(hollow) */
  bus        : "var(--text)", /* 機場巴士 黑(淺色主題為黑,深色主題自動轉白) */
  ferry      : "#14539E"   /* 高速船 藍 */
};

/* grp:篩選分類 / hollow:紅白雙線 / mins:站名與最快特急班次車程(分) */
var KIX_ROUTES = [
 {
  id:"rapit", grp:"南海", name:"南海特急 Rapi:t", col:KIX_COL.nankaiLtd,
  badge:"行李多推薦", fare:null, fareNote:"票價請查官方頁",
  head:"38 分直達南海難波・全車指定席",
  mins:[["臨空城",5],["泉佐野",null],["天下茶屋",33],["新今宮",35],["南海難波",38]],
  desc:"全車指定席、有專屬行李區,適合帶大型行李。2026/4/1 起實施新票價,建議先在 OTA 或官方線上購票;直接上車補票,特急費會被加收至 ¥700。",
  url:"https://www.nankai.co.jp/traffic/rapit.html"
 },
 {
  id:"kugo", grp:"南海", name:"南海本線 空港急行", col:KIX_COL.nankaiMain,
  badge:"最省", fare:"¥970", fareNote:null,
  head:"約 45 分到難波・可刷 IC 卡",
  mins:[["臨空城",5],["泉佐野",null],["天下茶屋",null],["新今宮",null],["南海難波",45]],
  desc:"單程 ¥970,SUICA / ICOCA 直接嗶卡進站,免劃位。缺點是通勤電車,沒有專屬行李區,人多時可能要一路站到市區。",
  url:"https://www.nankai.co.jp/traffic/airport.html"
 },
 {
  id:"haruka", grp:"JR", name:"關空特急 HARUKA", col:KIX_COL.haruka,
  badge:"去京都首選", fare:null, fareNote:"票價依區間請查官方頁",
  head:"直達天王寺・大阪・京都",
  mins:[["天王寺",32],["大阪",47],["新大阪",50],["京都",80]],
  desc:"住天王寺、梅田、新大阪或首站直奔京都都最順。記得買外國人專屬「HARUKA 單程車票」,可用 QR code 快速上車,指定席能上專用網站劃位。早班機回台不建議從京都搭 HARUKA 去機場,容易延遲。",
  url:"https://www.westjr.co.jp/travel-information/tc/tickets-passes/oneway/haruka/"
 },
 {
  id:"kankuRapid", grp:"JR", name:"關空快速", col:KIX_COL.kanku, hollow:true,
  badge:null, fare:"¥1,210", fareNote:null,
  head:"約 70 分到大阪站・免特急費",
  mins:[["日根野",null],["天王寺",null],["新今宮",null],["西九條",null],["大阪",70],["京橋",null]],
  desc:"單程 ¥1,210,免特急費,可刷 IC 卡直達大阪站與京橋,會繞行大阪環狀線。一樣是通勤電車、沒有行李區,行李超多的話建議改搭 HARUKA。",
  url:"https://www.westjr.co.jp/global/tc/"
 },
 {
  id:"bus", grp:"巴士", name:"利木津機場巴士", col:KIX_COL.bus,
  badge:"親子・長輩", fare:null, fareNote:"票價依路線請查官方頁",
  head:"保證有位・第 2 航廈直接上車",
  mins:[["神戶三宮",65],["環球影城 USJ",70],["JR 奈良",100],["京都",null]],
  desc:"三種情況特別推薦搭巴士:一是親子或長輩同行,保證有座位、不用扛行李上下月台;二是飛第 2 航廈的晚班機,不必趕接駁車去 1 航廈;三是第一天直衝環球影城、姬路、神戶、奈良這類較遠地區,省掉轉乘的時間與體力。",
  note:"往京都末班車:23:07(第 2 航廈)、23:20(第 1 航廈)",
  url:"https://www.kate.co.jp/tw/"
 },
 {
  id:"ferry", grp:"高速船", name:"神戶高速船 Bay Shuttle", col:KIX_COL.ferry,
  badge:"往神戶最快", fare:"¥500", fareNote:"外國人優惠,需線上訂票",
  head:"30 分橫渡大阪灣到神戶機場",
  mins:[["神戶機場",30]],
  desc:"行程從神戶開始的話,直接在機場搭高速船橫跨大阪灣,航程只要 30 分鐘,是去神戶最快也最便宜的路線。需在官網訂票,優惠代碼 B3792。",
  note:"外國人 ¥500 優惠只到 2026/07/01,之後請以官網公告為準",
  url:"https://www.kobe-access.jp/chi2/reserve"
 }
];

var KIX_FAQ = [
 {q:"南海特急與南海電鐵本線有什麼差別?",
  a:"特急有專屬座位與行李區,舒適度極高;本線便宜但要自己顧行李,熱門時段沒位子就得一路站到市區。"},
 {q:"JR 的 HARUKA 與關空快速差別在哪?",
  a:"HARUKA 直達大站且舒適;關空快速較便宜但會繞行環狀線。關空快速是通勤路線,行李超級多的話建議搭 HARUKA。"},
 {q:"晚班機抵達,但住宿訂在京都怎麼辦?",
  a:"建議更改住宿地點。往京都的機場巴士末班車為 23:07(二航廈)、23:20(一航廈)。班機晚於 19:00 起飛,抵達加上出關通常已經 23:00 以後,很高機率趕不上直達京都的巴士或特急列車。晚班機抵達建議把第一晚安排在大阪市區。"},
 {q:"早班機回台(例如 8 點起飛、6 點要到機場),交通怎麼安排?",
  a:"住大阪、梅田:搭機場巴士(凌晨 5 點左右就有車,且先停靠 2 航廈)。住難波附近:搭南海電鐵(最早 05:13 難波出發、06:16 抵達)。京都或其他地區:前一晚改住臨空城站附近,前一天行程直接排臨空城 Outlet,隔天搭一站電車過海就到機場。"}
];

/* ================= 分頁切換 ================= */
var kixOn=false, kixFilter="全部", kixOpen={rapit:1,haruka:1};

function kixInit(){
  var wrap=$("mCities");
  if(!wrap||$("kixTab"))return;
  var b=document.createElement("button");
  b.id="kixTab"; b.type="button"; b.innerHTML="&#9992; 關西機場";
  b.onclick=kixShow;
  wrap.appendChild(b);

  var host=document.getElementById("kixPage");
  if(host)host.innerHTML=kixRender();
  kixBind();
}

function kixShow(){
  if(document.body.classList.contains("mFsOn"))$("mFs").click();
  if(typeof mPickOn!=="undefined"&&mPickOn)$("mPickMode").click();
  kixOn=true;
  document.body.classList.add("kixOn");
  $("mCities").querySelectorAll("button").forEach(function(x){x.classList.remove("on");});
  $("kixTab").classList.add("on");
  var p=$("kixPage"); if(p)p.scrollTop=0;
}

function kixHide(){
  if(!kixOn)return;
  kixOn=false;
  document.body.classList.remove("kixOn");
  var t=$("kixTab"); if(t)t.classList.remove("on");
}

/* ================= 版面 ================= */
function kixRender(){
  return ''+
  '<div class="kix-img" id="kixImgBtn">'+
    '<img src="'+KIX_IMG+'" alt="關西機場交通路線圖" loading="lazy">'+
    '<span class="kix-zoom">&#9974; 點擊放大</span>'+
  '</div>'+
  '<p class="kix-credit">圖片作者:馬摩・'+
    '<a href="'+KIX_CREDIT+'" target="_blank" rel="noopener">查看原文 &#8599;</a></p>'+

  '<div class="kix-chips" id="kixChips">'+
    ["全部","南海","JR","巴士","高速船"].map(function(g){
      return '<button type="button" data-g="'+attr(g)+'"'+(g===kixFilter?' class="on"':'')+'>'+esc(g)+'</button>';
    }).join("")+
  '</div>'+

  '<div id="kixList"></div>'+

  '<div class="kix-warn">'+
    '<b>&#9888; 第 2 航廈提醒</b>'+
    '<p>樂桃航空在第 2 航廈。要搭 JR 或南海,必須先坐免費接駁巴士到第 1 航廈(車程約 7 分鐘、5~7 分一班),請把這段時間算進去。過海關前經常收不到訊號,建議事先截圖 Visit Japan QR Code 或準備紙本入境卡。機場巴士在 2 航廈有專屬站牌,不用跑到 1 航廈轉車。</p>'+
  '</div>'+

  '<h4 class="kix-h">常見問題</h4>'+
  '<div class="kix-faq" id="kixFaq">'+
    KIX_FAQ.map(function(f,i){
      return '<div class="kix-fq" data-i="'+i+'">'+
        '<div class="q"><span class="ar">&#9656;</span>'+esc(f.q)+'</div>'+
        '<div class="a">'+esc(f.a)+'</div></div>';
    }).join("")+
  '</div>'+

  '<p class="kix-src">車程為最快特急班次的參考時間,票價與時刻請以各業者官方公告為準。'+
    '<a href="'+KIX_CREDIT+'" target="_blank" rel="noopener">資料來源:一直玩的馬摩</a></p>';
}

function kixCard(r){
  var open=!!kixOpen[r.id];
  var bar=r.hollow
    ? '<span class="kix-bar hollow" style="--c:'+r.col+'"></span>'
    : '<span class="kix-bar" style="background:'+r.col+'"></span>';
  var fare=r.fare
    ? '<span class="kix-fare">'+esc(r.fare)+'</span>'
    : '<span class="kix-fare mut">'+esc(r.fareNote||"")+'</span>';

  var dests=r.mins.map(function(m){
    return '<button type="button" class="kix-dest" data-to="'+attr(m[0])+'">'+
      esc(m[0])+(m[1]!=null?'<i>'+m[1]+'</i>':'')+'</button>';
  }).join("");

  return '<div class="kix-card'+(open?' open':'')+'" data-id="'+attr(r.id)+'">'+
    '<div class="kix-hd">'+bar+
      '<span class="nm">'+esc(r.name)+'</span>'+
      (r.badge?'<span class="bdg">'+esc(r.badge)+'</span>':'')+
      fare+'<span class="car">&#9662;</span>'+
    '</div>'+
    '<div class="kix-bd">'+
      '<p class="kix-head">'+esc(r.head)+'</p>'+
      '<div class="kix-dests">'+dests+'</div>'+
      '<p class="kix-desc">'+esc(r.desc)+'</p>'+
      (r.note?'<p class="kix-note">&#9432; '+esc(r.note)+'</p>':'')+
      '<div class="kix-acts">'+
        '<button type="button" class="kix-act" data-plan="'+attr(r.mins[r.mins.length-1][0])+'">帶入路線規劃</button>'+
        '<a class="kix-act" href="'+r.url+'" target="_blank" rel="noopener">官方頁 &#8599;</a>'+
      '</div>'+
    '</div></div>';
}

function kixList(){
  var box=$("kixList"); if(!box)return;
  var rows=KIX_ROUTES.filter(function(r){return kixFilter==="全部"||r.grp===kixFilter;});
  box.innerHTML=rows.length?rows.map(kixCard).join("")
    :'<p class="hint" style="padding:8px 4px">沒有符合的路線。</p>';

  box.querySelectorAll(".kix-hd").forEach(function(h){
    h.onclick=function(){
      var c=h.parentNode,id=c.dataset.id;
      kixOpen[id]=kixOpen[id]?0:1;
      c.classList.toggle("open",!!kixOpen[id]);
    };
  });
  box.querySelectorAll("[data-to]").forEach(function(b){
    b.onclick=function(){kixToRoute(b.dataset.to);};
  });
  box.querySelectorAll("[data-plan]").forEach(function(b){
    b.onclick=function(){kixToRoute(b.dataset.plan);};
  });
}

/* 帶入路線規劃:起點固定關西機場 */
function kixToRoute(dest){
  var to=String(dest).replace(/\s*(USJ|Outlet)\s*/g,"").trim();
  $("rpFrom").value="関西空港";
  $("rpTo").value=to;
  if(typeof rpFromPlace!=="undefined")rpFromPlace=null;
  if(typeof rpToPlace!=="undefined")rpToPlace=null;
  kixHide();
  mLoad("關西全域");
  if($("rpBody").style.display==="none"){
    $("rpBody").style.display="block";
    $("rpCaret").textContent="輸入起訖點,依票券規劃 ⌃";
    if(typeof ensureGoogleMapsLoaded==="function")ensureGoogleMapsLoaded();
  }
  if(typeof mPickSync==="function")mPickSync();
  $("rpBody").scrollIntoView({behavior:"smooth",block:"center"});
  toast("關西機場 → "+to);
}

/* ================= 事件 ================= */
function kixBind(){
  var chips=$("kixChips");
  if(chips)chips.querySelectorAll("button").forEach(function(b){
    b.onclick=function(){
      kixFilter=b.dataset.g;
      chips.querySelectorAll("button").forEach(function(x){x.classList.toggle("on",x===b);});
      kixList();
    };
  });

  var faq=$("kixFaq");
  if(faq)faq.querySelectorAll(".kix-fq .q").forEach(function(q){
    q.onclick=function(){q.parentNode.classList.toggle("open");};
  });

  var ib=$("kixImgBtn");
  if(ib)ib.onclick=kixImgOpen;

  kixList();
}

/* ================= 路線圖放大檢視 ================= */
var kixZoom=1;
function kixImgOpen(){
  var v=$("kixView");
  if(!v){
    v=document.createElement("div");
    v.id="kixView";
    v.innerHTML='<div class="kv-bar">'+
        '<button type="button" data-z="out">&minus;</button>'+
        '<button type="button" data-z="fit">&#9635;</button>'+
        '<button type="button" data-z="in">+</button>'+
        '<button type="button" data-z="close">&times;</button>'+
      '</div>'+
      '<div class="kv-vp"><img id="kixViewImg" src="'+KIX_IMG+'" alt="關西機場交通路線圖"></div>';
    document.body.appendChild(v);
    v.querySelectorAll("[data-z]").forEach(function(b){
      b.onclick=function(){
        var z=b.dataset.z;
        if(z==="close"){v.classList.remove("on");return;}
        if(z==="fit")kixZoom=1;
        if(z==="in")kixZoom=Math.min(4,kixZoom*1.4);
        if(z==="out")kixZoom=Math.max(1,kixZoom/1.4);
        $("kixViewImg").style.width=(kixZoom*100)+"%";
      };
    });
  }
  kixZoom=1;
  $("kixViewImg").style.width="100%";
  v.classList.add("on");
}
