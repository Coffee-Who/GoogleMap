"use strict";
/* ================= 主題 ================= */
var LS_TH="pocket_theme_v1";
function prefersLight(){
  try{ return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches); }
  catch(e){ return false; }
}
function applyTheme(){
  var t=localStorage.getItem(LS_TH)||"auto";
  var dark = t==="dark" || (t==="auto" && !prefersLight());
  document.documentElement.setAttribute("data-theme", dark?"dark":"light");
  var b=$("thBtn"); if(b) b.textContent = t==="auto"?"🌗":(dark?"🌙":"☀️");
  var mt=document.querySelector('meta[name="theme-color"]');
  if(mt) mt.setAttribute("content", dark?"#153756":"#EDF3F9");
}
if($("thBtn")) $("thBtn").addEventListener("click",function(){
  var cur=localStorage.getItem(LS_TH)||"auto";
  var next={auto:"dark",dark:"light",light:"auto"}[cur];
  localStorage.setItem(LS_TH,next);applyTheme();
  toast({auto:"跟隨系統",dark:"深色模式",light:"淺色模式"}[next]);
});
try{window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",function(){
  if((localStorage.getItem(LS_TH)||"auto")==="auto")applyTheme();});}catch(e){}

/* ================= 首頁摘要 ================= */
function renderHero(){
  var hr=new Date().getHours();
  var g=hr<5?"夜深了":hr<11?"早安":hr<14?"午安":hr<18?"下午好":hr<23?"晚安":"夜深了";
  var pend=places.filter(function(p){return !p.done;}).length;
  var done=places.length-pend;
  if($("heroGreet"))$("heroGreet").textContent=g;
  if($("heroSub"))$("heroSub").textContent=places.length?("共 "+places.length+" 個地點・"+lists.length+" 個清單"):"開始收集你的口袋景點";
  if($("heroTitle"))$("heroTitle").innerHTML=places.length
    ? '你的口袋裡<br>有 <em>'+places.length+'</em> 個好地方'
    : '開始把想去的<br>地方 <em>收進口袋</em>';
  if($("stPend"))$("stPend").textContent=pend;
  if($("stDone"))$("stDone").textContent=done;
  if($("stList"))$("stList").textContent=lists.length;
}

