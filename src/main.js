const $ = (id) => document.getElementById(id);
const poster = $("poster");
const inputs = ["headline","distance","unit","duration","pace","elevation","heartrate","date","runner"];
const themes = ["lime","paper","night","coral","blue","violet"];
const dimensions = {
  portrait:{w:1080,h:1350,label:"1080 × 1350 px"},
  story:{w:1080,h:1920,label:"1080 × 1920 px"},
  square:{w:1080,h:1080,label:"1080 × 1080 px"},
  landscape:{w:1600,h:900,label:"1600 × 900 px"}
};
const defaults = {
  headline:"ONE MORE MILE.",distance:"10.00",unit:"KM",duration:"52:18",
  pace:"5:14 /km",elevation:"128 m",heartrate:"154 bpm",
  date:"SUNDAY · 6:12 AM",runner:"YOUR NAME",canvasSize:"portrait",
  fontChoice:"sans",headlineSize:"100",texture:"orbit",theme:"lime",layout:"classic",
  stats:{duration:true,pace:true,elevation:true,heartrate:true}
};
let currentTheme = "lime";
let currentLayout = "classic";
let photoData = null;
let toastTimer;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function getState() {
  const state = {};
  inputs.forEach(id => state[id] = $(id).value);
  state.canvasSize = $("canvasSize").value;
  state.fontChoice = $("fontChoice").value;
  state.headlineSize = $("headlineSize").value;
  state.texture = $("texture").value;
  state.theme = currentTheme;
  state.layout = currentLayout;
  state.photoData = photoData;
  state.stats = {};
  document.querySelectorAll("[data-toggle]").forEach(el => state.stats[el.dataset.toggle] = el.checked);
  return state;
}
function applyState(state, shouldToast = false) {
  inputs.forEach(id => { if (state[id] !== undefined) $(id).value = state[id]; });
  $("canvasSize").value = state.canvasSize || defaults.canvasSize;
  $("fontChoice").value = state.fontChoice || defaults.fontChoice;
  $("headlineSize").value = state.headlineSize || defaults.headlineSize;
  $("texture").value = state.texture || defaults.texture;
  currentTheme = themes.includes(state.theme) ? state.theme : "lime";
  currentLayout = ["classic","editorial","impact"].includes(state.layout) ? state.layout : "classic";
  photoData = state.photoData || null;
  document.querySelectorAll("[data-toggle]").forEach(el => {
    el.checked = state.stats ? state.stats[el.dataset.toggle] !== false : true;
  });
  const img = $("posterPhoto");
  if (photoData) { img.src = photoData; $("removePhoto").disabled = false; }
  else { img.removeAttribute("src"); $("removePhoto").disabled = true; }
  render();
  if (shouldToast) showToast("Design loaded");
}
function render() {
  $("previewDate").textContent = $("date").value.toUpperCase();
  const headline = $("headline").value.trim() || "YOUR RUN";
  const words = headline.split(/\s+/);
  const splitAt = Math.ceil(words.length / 2);
  $("previewHeadline").replaceChildren();
  if (words.length > 1) {
    const first = document.createElement("span");
    const second = document.createElement("em");
    first.textContent = words.slice(0, splitAt).join(" ");
    second.textContent = words.slice(splitAt).join(" ");
    $("previewHeadline").append(first);
    if (second.textContent) $("previewHeadline").append(second);
  } else {
    $("previewHeadline").textContent = headline;
  }
  $("previewDistance").textContent = $("distance").value || "0.00";
  $("previewUnit").textContent = $("unit").value;
  $("previewDuration").textContent = $("duration").value;
  $("previewPace").textContent = $("pace").value;
  $("previewElevation").textContent = $("elevation").value;
  $("previewHeartrate").textContent = $("heartrate").value;
  $("previewRunner").textContent = ($("runner").value || "YOUR NAME").toUpperCase();

  const dim = dimensions[$("canvasSize").value];
  poster.style.aspectRatio = `${dim.w}/${dim.h}`;
  $("dimensions").textContent = dim.label;
  poster.style.fontFamily = $("fontChoice").value === "serif" ? 'Georgia, "Times New Roman", serif'
    : $("fontChoice").value === "mono" ? 'ui-monospace, SFMono-Regular, Consolas, monospace'
    : 'Inter, ui-sans-serif, system-ui, sans-serif';
  poster.style.setProperty("--headline-scale", Number($("headlineSize").value) / 100);
  $("headlineSizeValue").textContent = `${$("headlineSize").value}%`;
  poster.querySelector(".poster-headline").style.fontSize = "";
  poster.className = `poster theme-${currentTheme} layout-${currentLayout} texture-${$("texture").value}${photoData ? " has-photo" : ""}`;
  document.querySelectorAll("[data-toggle]").forEach(el => {
    const stat = poster.querySelector(`[data-stat="${el.dataset.toggle}"]`);
    if (stat) stat.style.display = el.checked ? "" : "none";
  });
  document.querySelectorAll("[data-theme]").forEach(el => el.classList.toggle("selected", el.dataset.theme === currentTheme));
  document.querySelectorAll("[data-layout]").forEach(el => el.classList.toggle("selected", el.dataset.layout === currentLayout));
  poster.querySelector(".poster-headline").style.transform = `scale(${Number($("headlineSize").value)/100})`;
  poster.querySelector(".poster-headline").style.transformOrigin = "left top";
}
function exportPNG() {
  const dim = dimensions[$("canvasSize").value];
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = dim.w * scale;
  canvas.height = dim.h * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const w = dim.w, h = dim.h, pad = w * .08;
  const palette = {
    lime:["#c5fa68","#172016"], paper:["#f4f1e6","#1b2520"],
    night:["#1d2521","#eaf1e7"], coral:["#ff8067","#281a16"],
    blue:["#9de0ee","#10252e"], violet:["#c4b4f5","#211832"]
  };
  const [bg, fg] = palette[currentTheme];
  const photo = photoData && currentLayout === "photo";
  // Photo mode is automatically enabled when a photo exists; exported composition uses the same photo.
  const drawPoster = () => {
    if (photoData) {
      const img = $("posterPhoto");
      const iw = img.naturalWidth || w, ih = img.naturalHeight || h;
      const factor = Math.max(w / iw, h / ih);
      const dw = iw * factor, dh = ih * factor;
      ctx.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh);
      const shade = ctx.createLinearGradient(0,0,0,h);
      shade.addColorStop(0,"#07100a28"); shade.addColorStop(.4,"#07100a60"); shade.addColorStop(1,"#07100aeb");
      ctx.fillStyle = shade; ctx.fillRect(0,0,w,h);
    } else {
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
      if ($("texture").value === "grid") {
        ctx.strokeStyle = fg + "18"; ctx.lineWidth = 1;
        for(let x=0;x<w;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
        for(let y=0;y<h;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      } else if ($("texture").value === "orbit") {
        ctx.strokeStyle = fg + "28"; ctx.lineWidth = 1.4;
        [w*.33,w*.43,w*.53].forEach(r=>{ctx.beginPath();ctx.arc(w*.93,-h*.02,r,0,Math.PI*2);ctx.stroke();});
      }
    }
    const ink = photoData ? "#ffffff" : fg;
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.textBaseline = "top";
    const fontFamily = $("fontChoice").value === "serif" ? "Georgia" : $("fontChoice").value === "mono" ? "monospace" : "system-ui";
    ctx.font = `900 ${Math.max(17,w*.012)}px ${fontFamily}`;
    ctx.letterSpacing = `${Math.max(1,w*.002)}px`;
    ctx.fillText("●  " + $("date").value.toUpperCase(), pad, h*.075);

    let headline = ($("headline").value.trim() || "YOUR RUN").toUpperCase();
    const maxWidth = w - pad*2;
    const words = headline.split(/\s+/), lines = [];
    let line = "";
    const headlineSize = (currentLayout === "impact" ? .105 : currentLayout === "editorial" ? .067 : .084) * w * Number($("headlineSize").value)/100;
    ctx.font = `${currentLayout === "editorial" ? "700" : "950"} ${headlineSize}px ${currentLayout === "editorial" ? "Georgia" : fontFamily}`;
    ctx.letterSpacing = "-3px";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
    if (lines.length > 3) { lines.splice(2, lines.length-2, lines.slice(2).join(" ")); }
    let hy = h * (currentLayout === "editorial" ? .25 : currentLayout === "impact" ? .18 : .16);
    lines.forEach((text,i)=>ctx.fillText(text,pad,hy+i*headlineSize*.9,maxWidth));
    const distanceY = hy + lines.length*headlineSize*.91 + h*.055;
    ctx.font = `${currentLayout === "editorial" ? "700" : "950"} ${w*(currentLayout==="impact"?.115:currentLayout==="editorial"?.09:.1)}px ${fontFamily}`;
    ctx.letterSpacing = "-3px";
    const distanceText = $("distance").value || "0.00";
    ctx.fillText(distanceText,pad,distanceY);
    const distW = ctx.measureText(distanceText).width;
    ctx.font = `900 ${w*.032}px ${fontFamily}`; ctx.letterSpacing = "1px";
    ctx.fillText($("unit").value,pad+distW+10,distanceY+w*.048);

    const stats = [
      ["TIME",$("duration").value,"duration"],["PACE",$("pace").value,"pace"],
      ["ELEVATION",$("elevation").value,"elevation"],["AVG. HEART RATE",$("heartrate").value,"heartrate"]
    ].filter(item => document.querySelector(`[data-toggle="${item[2]}"]`).checked);
    const startY = Math.max(distanceY+h*.19,h*.59);
    const cellW = (w-pad*2)/2, cellH = h*.09;
    stats.forEach((item,i)=>{
      const x = pad+(i%2)*cellW, y = startY+Math.floor(i/2)*cellH;
      ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cellW-w*.025,y);ctx.stroke();
      ctx.font=`850 ${w*.012}px ${fontFamily}`;ctx.letterSpacing="2px";ctx.fillText(item[0],x,y+10);
      ctx.font=`900 ${w*.034}px ${fontFamily}`;ctx.letterSpacing="-1px";ctx.fillText(item[1],x,y+31,cellW-w*.04);
    });
    const bottomY=h-pad*.85;
    ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(pad,bottomY-14);ctx.lineTo(w-pad,bottomY-14);ctx.stroke();
    ctx.font=`850 ${w*.012}px ${fontFamily}`;ctx.letterSpacing="1px";
    ctx.fillText(($("runner").value||"YOUR NAME").toUpperCase(),pad,bottomY);
    ctx.globalAlpha=.7;ctx.textAlign="right";ctx.fillText("RUN YOUR STORY ↗",w-pad,bottomY);ctx.textAlign="left";ctx.globalAlpha=1;
  };
  if (photoData && !$("posterPhoto").complete) {
    $("posterPhoto").addEventListener("load", drawPoster, {once:true});
  } else drawPoster();
  canvas.toBlob(blob=>{
    if(!blob){showToast("PNG export failed. Try another browser.");return;}
    const url=URL.createObjectURL(blob), link=document.createElement("a");
    link.href=url;link.download=`runstats-${$("canvasSize").value}.png`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    showToast("Poster exported as PNG");
  },"image/png");
}
function getSaved() {
  try { return JSON.parse(localStorage.getItem("runstats-designs") || "[]"); } catch { return []; }
}
function renderSaved() {
  const host = $("savedDesigns");
  host.replaceChildren();
  const items = getSaved();
  if (!items.length) {
    const p=document.createElement("p");p.className="empty-saves";p.textContent="Your saved designs will appear here.";host.append(p);return;
  }
  items.forEach(item=>{
    const row=document.createElement("div");row.className="saved-item";
    const load=document.createElement("button");load.className="saved-load";load.textContent=item.name;load.title="Load "+item.name;
    load.addEventListener("click",()=>applyState(item.state,true));
    const del=document.createElement("button");del.className="saved-delete";del.textContent="×";del.setAttribute("aria-label","Delete "+item.name);
    del.addEventListener("click",()=>{localStorage.setItem("runstats-designs",JSON.stringify(getSaved().filter(x=>x.id!==item.id)));renderSaved();showToast("Saved design deleted");});
    row.append(load,del);host.append(row);
  });
}
function saveDesign() {
  const name = $("designName").value.trim() || `${$("distance").value || "Run"} ${$("unit").value} · ${new Date().toLocaleDateString()}`;
  const state = getState();
  try {
    const items = getSaved();
    items.unshift({id:Date.now(),name,state});
    localStorage.setItem("runstats-designs",JSON.stringify(items.slice(0,20)));
    renderSaved();showToast("Design saved in this browser");
  } catch (e) {
    showToast("Browser storage is full. Try removing the photo or old designs.");
  }
}
inputs.forEach(id=>$(id).addEventListener("input",render));
["canvasSize","fontChoice","headlineSize","texture"].forEach(id=>$(id).addEventListener("input",render));
document.querySelectorAll("[data-toggle]").forEach(el=>el.addEventListener("change",render));
document.querySelectorAll("[data-theme]").forEach(el=>el.addEventListener("click",()=>{currentTheme=el.dataset.theme;render();}));
document.querySelectorAll("[data-layout]").forEach(el=>el.addEventListener("click",()=>{currentLayout=el.dataset.layout;render();}));
$("photoInput").addEventListener("change",e=>{
  const file=e.target.files?.[0]; if(!file)return;
  if(file.size>12*1024*1024){showToast("Choose an image under 12 MB");e.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{photoData=reader.result;$("posterPhoto").src=photoData;$("removePhoto").disabled=false;render();showToast("Photo added locally");};
  reader.readAsDataURL(file);
});
$("removePhoto").addEventListener("click",()=>{photoData=null;$("posterPhoto").removeAttribute("src");$("photoInput").value="";$("removePhoto").disabled=true;render();showToast("Photo removed");});
["exportTop","exportBottom","mobileExport"].forEach(id=>$(id).addEventListener("click",exportPNG));
["saveDesign","saveDesignDesktop"].forEach(id=>$(id).addEventListener("click",saveDesign));
$("resetAll").addEventListener("click",()=>{
  photoData=null;$("photoInput").value="";
  applyState({...defaults,photoData:null});
  $("designName").value="";
  showToast("Editor reset");
});
render();renderSaved();
