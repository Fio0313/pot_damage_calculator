let dinosaurs=[];
const $=id=>document.getElementById(id);
const fmt=n=>Number.isFinite(n)?n.toLocaleString("ja-JP",{maximumFractionDigits:2}):"—";
const val=(id,fallback=0)=>{const raw=$(id).value;const n=Number(raw);return Number.isFinite(n)&&raw.trim()!==""?n:fallback;};

async function init(){
  const response=await fetch("dinosaurs.json");
  dinosaurs=await response.json();
  ["A","B"].forEach(side=>{
    const select=$("dino"+side);
    dinosaurs.forEach((d,index)=>{
      const option=document.createElement("option");
      option.value=index;option.textContent=d.name+"（"+d.english+"）";select.appendChild(option);
    });
    select.value=side==="A"?dinosaurs.findIndex(d=>d.name==="サルコスクス"):dinosaurs.findIndex(d=>d.name==="ティラノサウルス");
    select.addEventListener("change",()=>loadDino(side));
    ["hp","weight","wikiArmor","attack","armor","custom","armorDebuff"].forEach(k=>$(k+side).addEventListener("input",calculate));
    ["attackBuff1","attackBuff2","attackBuff3"].forEach(k=>$(k+side).addEventListener("input",calculate));
    document.querySelectorAll(`input[name="part${side}"]`).forEach(el=>el.addEventListener("change",()=>{toggleCustom(side);calculate()}));
    loadDino(side);
  });
  $("reset").addEventListener("click",resetAll);
  calculate();
}
function selected(side){return dinosaurs[Number($("dino"+side).value)]}
function loadDino(side){
  const d=selected(side);
  $("hp"+side).value=d.hp;
  $("weight"+side).value=d.weight;
  $("wikiArmor"+side).value=d.wikiArmor;
  $("attack"+side).value=d.attack;
  toggleCustom(side);
  calculate();
}
function toggleCustom(side){
  const part=document.querySelector(`input[name="part${side}"]:checked`).value;
  $("customWrap"+side).classList.toggle("hidden",part!=="custom");
}
function partMultiplier(side){
  const part=document.querySelector(`input[name="part${side}"]:checked`).value;
  if(part==="head")return 1.2;
  if(part==="body"||part==="limb")return 1;
  if(part==="tail")return .25;
  return Math.max(0,val("custom"+side,0));
}
function attackBuffMultiplier(side){
  const buffs=[1,2,3].map(index=>1+Math.max(0,val(`attackBuff${index}${side}`,0))/100);
  return buffs.reduce((total, multiplier)=>total*multiplier, 1);
}
function armorDebuffMultiplier(side){
  const debuff=Math.max(0,val("armorDebuff"+side,0));
  return 1-debuff/100;
}
function compute(attSide,defSide){
  const attackBase=Math.max(0,val("attack"+attSide,0));
  const attackBuff=attackBuffMultiplier(attSide);
  const attack=attackBase*attackBuff;
  const hp=Math.max(0,val("hp"+defSide,0));
  const attackerWeight=Math.max(0,val("weight"+attSide,0));
  const defenderWeight=Math.max(.000001,val("weight"+defSide,0));
  const body=partMultiplier(defSide);
  const armorBase=Math.max(0,val("armor"+defSide,1));
  const armorDebuff=armorDebuffMultiplier(attSide);
  const armor=Math.max(0,armorBase*armorDebuff);
  const weightRatio=attackerWeight/defenderWeight;
  const raw=attack*weightRatio;
  const afterPart=raw*body;
  const final=afterPart*armor;
  const hits=final>0?Math.ceil(hp/final):null;
  return {weightRatio,body,armor,attackBuff,armorDebuff,raw,afterPart,final,hits,hp};
}
function render(key,attacker,defender,r){
  $("name"+key).textContent=attacker+" → "+defender;
  $("damage"+key).textContent=fmt(r.final);
  $("detail"+key).innerHTML=`体重補正：${fmt(r.weightRatio)}倍<br>部位補正：${fmt(r.body)}倍<br>装甲軽減倍率：${fmt(r.armor)}倍<br>攻撃力バフ：${fmt(r.attackBuff)}倍<br>装甲デバフ補正：${fmt(r.armorDebuff)}倍<br>補正前：${fmt(r.raw)} → 部位適用後：${fmt(r.afterPart)}`;
  $("hits"+key).textContent=r.hits===null?"撃破できません（ダメージ0）":`撃破まで ${fmt(r.hits)} 発（対象HP：${fmt(r.hp)}）`;
}
function calculate(){
  if(!dinosaurs.length)return;
  const A=selected("A"),B=selected("B");
  render("AB",A.name,B.name,compute("A","B"));
  render("BA",B.name,A.name,compute("B","A"));
}
function resetAll(){
  ["A","B"].forEach(side=>{
    loadDino(side);
    $("armor"+side).value="1.00";
    $("custom"+side).value="0.00";
    $("armorDebuff"+side).value="0";
    ["attackBuff1","attackBuff2","attackBuff3"].forEach(key=>{$(key+side).value="0";});
    document.querySelector(`input[name="part${side}"][value="body"]`).checked=true;
    toggleCustom(side);
  });
  calculate();
}
init().catch(err=>{document.querySelector("main").insertAdjacentHTML("afterbegin",`<p class="notice">恐竜データを読み込めませんでした。index.html と dinosaurs.json を同じフォルダに配置してください。</p>`);console.error(err);});

