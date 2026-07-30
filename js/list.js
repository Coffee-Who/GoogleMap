"use strict";
/* ================= 頁 1:口袋名單 ================= */
var curCat="全部", qText="", doneOpen=true, editMode=false;
function pool(){
  var l=$("fList").value||"__all__";
  return places.filter(function(p){return l==="__all__"||p.list===l;});
}
function renderList(){
  renderHero();
  var p=pool();
  var seen=["全部"];
  p.forEach(function(x){if(seen.indexOf(x.cat)<0)seen.push(x.cat);});
  if(seen.indexOf(curCat)<0)curCat="全部";
  $("fCats").innerHTML=seen.map(function(c){
    var n=c==="全部"?p.length:p.filter(function(x){return x.cat===c;}).length;
    return '<button class="chip'+(c===curCat?" on":"")+'" data-c="'+attr(c)+'"><span class="cc">'+n+'</span><span class="cn">'+esc(c)+'</span></button>';
  }).join("");
  $("fCats").querySelectorAll(".chip").forEach(function(b){
    b.addEventListener("click",function(){curCat=b.dataset.c;renderList();});
  });
  var rows=p.filter(function(x){
    if(curCat!=="全部"&&x.cat!==curCat)return false;
    if(qText&&x.name.indexOf(qText)<0&&(x.note||"").indexOf(qText)<0)return false;
    return true;
  });
  var rows=p.filter(function(x){
    if(curCat!=="全部"&&x.cat!==curCat)return false;
    if(qText&&x.name.indexOf(qText)<0&&(x.note||"").indexOf(qText)<0)return false;
    return true;
  });
  $("hdCount").textContent=places.length?places.length+" 個景點":"開始收集你的口袋景點";
  $("placeList").innerHTML=rows.length?rows.map(function(x){
    return '<div class="place">'+placeThumb(x)+'<div class="place-body">'+
    '<div class="top"><span class="name">'+esc(x.name)+'</span>'+
    '<button class="icon-map-btn" data-map="'+attr(x.name)+'" aria-label="開啟地圖">'+IC.pin+'</button>'+
    (editMode?'<button class="del-x" data-del="'+attr(x.id)+'" aria-label="刪除">'+IC.trash+'</button>':'')+
    '</div>'+
    '<div class="cat-line"><span>'+esc(x.list)+'・'+esc(x.cat)+'</span>'+
    (typeof x.rating==="number"?'<span class="rate-inline">★ '+x.rating.toFixed(1)+'</span>':'')+
    '</div>'+
    ((x.note||x.autoDesc)?'<p class="note">'+esc(x.note||x.autoDesc)+'</p>':'')+
    '</div></div>';
  }).join(""):'<p class="empty">目前沒有符合條件的景點,按下方導覽列中央「＋」新增一個吧。</p>';
  $("placeList").querySelectorAll("[data-map]").forEach(function(b){b.addEventListener("click",function(){gmapSearch(b.dataset.map);});});
  $("placeList").querySelectorAll("[data-del]").forEach(function(b){b.addEventListener("click",function(){
    var p=places.find(function(x){return x.id===b.dataset.del;});
    if(p&&confirm("刪除「"+p.name+"」?")){
      places=places.filter(function(x){return x.id!==p.id;});
      route=route.filter(function(s){return s.pid!==p.id;});
      save();renderList();
    }
  });});
  queuePlacePhotos();
}
if($("btnEditMode"))$("btnEditMode").addEventListener("click",function(){
  editMode=!editMode;
  this.classList.toggle("on",editMode);
  renderList();
  toast(editMode?"刪除模式開啟,點景點右上角垃圾桶可刪除":"已離開刪除模式");
});
function bindListActions(root){
  root.querySelectorAll("[data-map]").forEach(function(b){b.addEventListener("click",function(){gmapSearch(b.dataset.map);});});
  root.querySelectorAll("[data-done]").forEach(function(b){b.addEventListener("click",function(){
    var p=places.find(function(x){return x.id===b.dataset.done;});
    if(p){p.done=true;save();renderList();toast("已標記「"+p.name+"」");}
  });});
  root.querySelectorAll("[data-undo]").forEach(function(b){b.addEventListener("click",function(){
    var p=places.find(function(x){return x.id===b.dataset.undo;});
    if(p){p.done=false;save();renderList();}
  });});
  root.querySelectorAll("[data-del]").forEach(function(b){b.addEventListener("click",function(){
    var p=places.find(function(x){return x.id===b.dataset.del;});
    if(p&&confirm("刪除「"+p.name+"」?")){
      places=places.filter(function(x){return x.id!==p.id;});
      route=route.filter(function(s){return s.pid!==p.id;});
      save();renderList();
    }
  });});
}
$("btnAdd").addEventListener("click",function(){
  var n=$("inName").value.trim();
  if(!n){$("inName").focus();return;}
  if(hasPlace(n)){toast("「"+n+"」已經在名單裡了");return;}
  var item={id:uid(),name:n,cat:$("inCat").value,list:$("inList").value,note:$("inNote").value.trim(),done:false};
  if($("inDur").value)item.dur=+$("inDur").value;
  if(sheetLoc){item.lat=sheetLoc.lat;item.lng=sheetLoc.lng;}
  places.unshift(item);
  sheetLoc=null;$("inLocBadge").style.display="none";
  $("inName").value="";$("inNote").value="";$("inLink").value="";$("inDur").value="";
  $("linkHint").style.display="none";
  save();renderList();closeSheet();toast("已加入「"+n+"」");
});
$("q").addEventListener("input",function(){qText=this.value.trim();renderList();});
$("fList").addEventListener("change",function(){curCat="全部";renderList();});

