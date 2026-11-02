let dinosaurs=[];
const $=id=>document.getElementById(id);
const fmt=n=>Number.isFinite(n)?n.toLocaleString("ja-JP",{maximumFractionDigits:2}):"—";
async function init(){
  const response=await fetch("dinosaurs.json");
  dinosaurs=await response.json();
  ["A","B"].forEach((side,i)=>{
    const select=$("dino"+side);
    dinosaurs.forEach((d,index)=>{
      const option=document.createElement("option");
      option.value=index;option.textContent=d.name+"（"+d.english+"）";select.appendChild(option);
    });
    select.value=side==="A"?dinosaurs.findIndex(d=>d.name==="サルコスクス"):dinosaurs.findIndex(d=>d.name==="ティラノサウルス");
    select.addEventListener("change",()=>loadDino(side,true));
    ["attack","armor","custom"].forEach(k=>$(k+side).addEventListener("input",calculate));
    document.querySelectorAll(`input[name="part${side}"]`).forEach(el=>el.addEventListener("change",()=>{toggleCustom(side);calculate()}));
    loadDino(side,false);
  });
  $("reset").addEventListener("click",resetAll);
  calculate();
}
function selected(side){return dinosaurs[Number($("dino"+side).value)]}
function loadDino(side,resetAttack){
  const d=selected(side);
  $("hp"+side).textContent=fmt(d.hp);
  $("weight"+side).textContent=fmt(d.weight);
  $("wikiArmor"+side).textContent=fmt(d.wikiArmor);
  if(resetAttack || !$("attack"+side).value)$("attack"+side).value=d.attack;
  toggleCustom(side);calculate();
}
function toggleCustom(side){
  const val=document.querySelector(`input[name="part${side}"]:checked`).value;
  $("customWrap"+side).classList.toggle("hidden",val!=="custom");
}
function partMultiplier(side){
  const part=document.querySelector(`input[name="part${side}"]:checked`).value;
  if(part==="head")return 1.2;
  if(part==="body"||part==="limb")return 1;
  if(part==="tail")return .25;
  return Math.max(0,Number($("custom"+side).value)||0);
}
function compute(attacker,defender,defSide,attSide){
  const attack=Math.max(0,Number($("attack"+attSide).value)||0);
  const body=partMultiplier(defSide);
  const armor=Math.min(100,Math.max(0,Number($("armor"+defSide).value)||0));
  const weightRatio=attacker.weight/defender.weight;
  const raw=attack*weightRatio;
  const afterPart=raw*body;
  const final=afterPart*(1-armor/100);
  const hits=final>0?Math.ceil(defender.hp/final):null;
  return {attack,weightRatio,body,armor,raw,afterPart,final,hits};
}
function render(key,attacker,defender,r){
  $("name"+key).textContent=attacker.name+" → "+defender.name;
  $("damage"+key).textContent=fmt(r.final);
  $("detail"+key).innerHTML=`体重補正：${fmt(r.weightRatio)}倍<br>部位補正：${fmt(r.body)}倍<br>装甲軽減：${fmt(r.armor)}%<br>補正前：${fmt(r.raw)} → 部位適用後：${fmt(r.afterPart)}`;
  $("hits"+key).textContent=r.hits===null?"撃破できません（ダメージ0）":`撃破まで ${fmt(r.hits)} 発（対象HP：${fmt(defender.hp)}）`;
}
function calculate(){
  if(!dinosaurs.length)return;
  const A=selected("A"),B=selected("B");
  const ab=compute(A,B,"B","A"),ba=compute(B,A,"A","B");
  render("AB",A,B,ab);render("BA",B,A,ba);
}
function resetAll(){
  ["A","B"].forEach(side=>{
    const d=selected(side);
    $("attack"+side).value=d.attack;
    $("armor"+side).value=0;
    $("custom"+side).value=1;
    document.querySelector(`input[name="part${side}"][value="body"]`).checked=true;
    toggleCustom(side);
  });
  calculate();
}
init().catch(err=>{document.querySelector("main").insertAdjacentHTML("afterbegin",`<p class="notice">恐竜データを読み込めませんでした。index.html と dinosaurs.json を同じフォルダに置いてください。</p>`);console.error(err)});
