"use strict";
/* ================= 啟動 ================= */
load();
try{applyTheme();}catch(e){}
try{renderSrcBar();}catch(e){}
refreshSelects(null);
bindAddable($("inCat"),cats,"分類",renderList);
bindAddable($("inList"),lists,"清單",renderList);
renderList();
renderHomeFeature();
renderHomeRecent();
if($("stSettingsCount"))$("stSettingsCount").textContent="共 "+places.length+" 個地點・"+lists.length+" 個清單";
openTripOrEmpty();
