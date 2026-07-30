"use strict";
/* ================= 頁 4:Takeout 匯入 ================= */
var impData=[];
$("btnTakeout").addEventListener("click",function(){
  window.open("https://takeout.google.com/settings/takeout/custom/saved,maps_your_places","_blank");
});
$("btnPick").addEventListener("click",function(){$("impFile").click();});
$("impFile").addEventListener("change",function(){
  var files=Array.from(this.files||[]);
  if(!files.length)return;
  $("impStatus").innerHTML='<div class="notice info"><span class="spin">◌</span> 正在讀取檔案…</div>';
  $("impPreview").innerHTML="";impData=[];
  var jobs=[];
  files.forEach(function(f){
    var n=f.name.toLowerCase();
    if(n.endsWith(".zip"))jobs.push(readZip(f));
    else if(n.endsWith(".csv"))jobs.push(readText(f).then(function(t){parseCsv(t,baseName(f.name));}));
    else if(n.endsWith(".json")||n.endsWith(".geojson"))jobs.push(readText(f).then(function(t){parseGeo(t,baseName(f.name));}));
  });
  Promise.all(jobs).then(showPreview).catch(function(e){
    $("impStatus").innerHTML='<div class="notice warn">讀取失敗:'+esc(e.message||e)+'。請確認選的是 Takeout 匯出的 zip 或 csv/json 檔。</div>';
  });
  this.value="";
});
function baseName(n){return n.replace(/\.[^.]+$/,"").split("/").pop();}
function readText(f){
  return new Promise(function(res,rej){
    var r=new FileReader();
    r.onload=function(){res(r.result);};
    r.onerror=function(){rej(new Error("無法讀取 "+f.name));};
    r.readAsText(f,"utf-8");
  });
}
function readZip(f){
  return f.arrayBuffer().then(function(buf){return JSZip.loadAsync(buf);}).then(function(zip){
    var jobs=[];
    zip.forEach(function(path,entry){
      if(entry.dir)return;
      var n=path.toLowerCase();
      if(n.endsWith(".csv"))jobs.push(entry.async("string").then(function(t){parseCsv(t,baseName(path));}));
      else if(n.endsWith(".json")||n.endsWith(".geojson"))jobs.push(entry.async("string").then(function(t){parseGeo(t,baseName(path));}));
    });
    return Promise.all(jobs);
  });
}
function parseCsvRows(text){
  var rows=[],row=[],cell="",inQ=false;
  for(var i=0;i<text.length;i++){
    var ch=text[i];
    if(inQ){
      if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else inQ=false;}
      else cell+=ch;
    }else{
      if(ch==='"')inQ=true;
      else if(ch===","){row.push(cell);cell="";}
      else if(ch==="\n"||ch==="\r"){
        if(ch==="\r"&&text[i+1]==="\n")i++;
        row.push(cell);cell="";
        if(row.some(function(c){return c.trim()!=="";}))rows.push(row);
        row=[];
      }else cell+=ch;
    }
  }
  row.push(cell);
  if(row.some(function(c){return c.trim()!=="";}))rows.push(row);
  return rows;
}
function parseCsv(text,listName){
  var rows=parseCsvRows(text);
  if(rows.length<2)return;
  var head=rows[0].map(function(h){return h.trim().toLowerCase();});
  var iName=head.findIndex(function(h){return h==="title"||h==="標題"||h==="name"||h==="名稱";});
  var iNote=head.findIndex(function(h){return h==="note"||h==="備註"||h==="comment"||h==="註解";});
  var iUrl=head.findIndex(function(h){return h==="url"||h==="網址"||h==="link";});
  if(iName<0)iName=0;
  for(var i=1;i<rows.length;i++){
    var name=(rows[i][iName]||"").trim();
    if(!name)continue;
    var item={name:name,note:iNote>=0?(rows[i][iNote]||"").trim():"",list:listName,cat:guessCat(name)};
    if(iUrl>=0){
      var m=(rows[i][iUrl]||"").match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||(rows[i][iUrl]||"").match(/[@\/](-?\d+\.\d{3,}),(-?\d+\.\d{3,})/);
      if(m){item.lat=+m[1];item.lng=+m[2];}
    }
    impData.push(item);
  }
}
function parseGeo(text,listName){
  var js;try{js=JSON.parse(text);}catch(e){return;}
  var feats=js.features||[];
  feats.forEach(function(f){
    var p=f.properties||{},loc=p.location||{};
    var name=(loc.name||p.title||p.Title||"").trim();
    if(!name&&loc.address)name=loc.address.split(",")[0].trim();
    if(!name)return;
    var item={name:name,note:"",list:listName,cat:guessCat(name)};
    var g=f.geometry;
    if(g&&g.type==="Point"&&g.coordinates&&g.coordinates.length>=2){item.lng=+g.coordinates[0];item.lat=+g.coordinates[1];}
    else if(loc.coordinates){item.lng=+loc.coordinates.longitude;item.lat=+loc.coordinates.latitude;}
    impData.push(item);
  });
}
var CAT_KW=[
  ["咖啡",["咖啡","cafe","coffee","珈琲"]],
  ["美食",["餐","食","飯","麵","麵包","牛排","火鍋","燒肉","壽司","拉麵","小吃","夜市","冰","甜點","蛋糕","茶","飲","粥","雞","鵝","鴨","肉圓","滷味","燒臘","便當","豆花","早餐","披薩","pizza","restaurant","bistro","食堂","居酒屋","串","丼","鍋"]],
  ["住宿",["飯店","旅館","民宿","hotel","hostel","酒店","旅店","青年旅舍"]],
  ["購物",["百貨","商場","市場","outlet","mall","商店","書店","超市"]]
];
function guessCat(name){
  var n=name.toLowerCase();
  for(var i=0;i<CAT_KW.length;i++){
    for(var j=0;j<CAT_KW[i][1].length;j++){
      if(n.indexOf(CAT_KW[i][1][j])>=0)return CAT_KW[i][0];
    }
  }
  return "景點";
}
function showPreview(){
  if(!impData.length){
    $("impStatus").innerHTML='<div class="notice warn">檔案裡沒有找到地點。請確認 Takeout 匯出時有勾選「已儲存」(Saved)。</div>';
    return;
  }
  var dup=impData.filter(function(x){return hasPlace(x.name);}).length;
  var byList={};
  impData.forEach(function(x){byList[x.list]=(byList[x.list]||0)+1;});
  var listSummary=Object.keys(byList).map(function(l){return esc(l)+"("+byList[l]+")";}).join("、");
  $("impStatus").innerHTML='<div class="notice ok">找到 '+impData.length+' 個地點,來自清單:'+listSummary+
    (dup?"。其中 "+dup+" 個已在名單裡,會自動略過":"")+'。</div>';
  var h='<div class="card"><div class="section-label" style="margin-top:0;">確認分類(自動判斷,可修改)</div><div class="imp-list">';
  impData.forEach(function(x,i){
    h+='<div class="imp-row"><span class="n">'+esc(x.name)+
    (hasPlace(x.name)?' <span style="color:var(--muted);font-size:12px;">(已存在,略過)</span>':"")+'</span>'+
    '<select data-ic="'+i+'">'+cats.map(function(c){
      return '<option'+(c===x.cat?" selected":"")+'>'+esc(c)+'</option>';}).join("")+'</select></div>';
  });
  h+='</div><button class="btn-primary" id="btnImpGo" style="margin-top:12px;">匯入 '+(impData.length-dup)+' 個地點</button></div>';
  $("impPreview").innerHTML=h;
  $("impPreview").querySelectorAll("[data-ic]").forEach(function(s){
    s.addEventListener("change",function(){impData[+s.dataset.ic].cat=s.value;});
  });
  $("btnImpGo").addEventListener("click",function(){
    var add=0;
    impData.forEach(function(x){
      if(hasPlace(x.name))return;
      if(lists.indexOf(x.list)<0)lists.push(x.list);
      if(cats.indexOf(x.cat)<0)cats.push(x.cat);
      var item={id:uid(),name:x.name,cat:x.cat,list:x.list,note:x.note,done:false};
      if(x.lat&&x.lng){item.lat=x.lat;item.lng=x.lng;}
      places.push(item);
      add++;
    });
    save();refreshSelects(null);renderList();
    $("impPreview").innerHTML="";impData=[];
    $("impStatus").innerHTML='<div class="notice ok">已匯入 '+add+' 個地點,到「口袋名單」分頁查看。</div>';
    toast("匯入完成:"+add+" 個地點");
  });
}

