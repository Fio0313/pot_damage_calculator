let dinosaurs=[];
const $=id=>document.getElementById(id);
const fmt=n=>Number.isFinite(n)?n.toLocaleString("ja-JP",{maximumFractionDigits:2}):"—";
const val=(id,fallback=0)=>{const raw=$(id).value;const n=Number(raw);return Number.isFinite(n)&&raw.trim()!==""?n:fallback;};

// ============================
// 関数名 : init
// 引数 : なし
// 戻り値: Promise<void>
// 説明 : 外部の dinosaurs.json からデータを非同期で読み込み、セレクトボックスの初期化・イベントリスナーの登録・初期計算を行う
// ============================
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
    ["hp","weight","initialArmor","attack","armor","custom"].forEach(k=>$(k+side).addEventListener("input",calculate));
    document.querySelectorAll(`input[name="part${side}"]`).forEach(el=>el.addEventListener("change",()=>{toggleCustom(side);calculate()}));
    loadDino(side);
  });
  $("reset").addEventListener("click",resetAll);
  calculate();
}

// ============================
// 関数名 : selected
// 引数 : side (文字列: "A" または "B")
// 戻り値: Object (選択されている恐竜のデータオブジェクト)
// 説明 : 指定されたサイドのセレクトボックスで現在選択されている恐竜のデータを返す
// ============================
function selected(side){
  return dinosaurs[Number($("dino"+side).value)]
}

// ============================
// 関数名 : loadDino
// 引数 : side (文字列: "A" または "B")
// 戻り値: なし
// 説明 : 選択された恐竜のステータス（HP・体重・初期鎧値・攻撃力）をフォームの入力欄に反映させ、再計算を行う
// ============================
function loadDino(side){
  const d=selected(side);
  $("hp"+side).value=d.hp;
  $("weight"+side).value=d.weight;
  $("initialArmor"+side).value=d.initialArmor;
  $("attack"+side).value=d.attack;
  toggleCustom(side);
  calculate();
}

// ============================
// 関数名 : toggleCustom
// 引数 : side (文字列: "A" または "B")
// 戻り値: なし
// 説明 : 被弾部位で「その他（カスタム）」が選択されている場合のみ、個別倍率の入力欄を表示する
// ============================
function toggleCustom(side){
  const part=document.querySelector(`input[name="part${side}"]:checked`).value;
  $("customWrap"+side).classList.toggle("hidden",part!=="custom");
}

// ============================
// 関数名 : partMultiplier
// 引数 : side (文字列: "A" または "B")
// 戻り値: number (部位倍率)
// 説明 : 選択されている被弾部位に応じたダメージ倍率（頭1.2、胴体/足手1.0、尻尾0.25、カスタム手入力）を返す
// ============================
function partMultiplier(side){
  const part=document.querySelector(`input[name="part${side}"]:checked`).value;
  if(part==="head")return 1.2;
  if(part==="body"||part==="limb")return 1;
  if(part==="tail")return .25;
  return Math.max(0,val("custom"+side,0));
}

// ============================
// 関数名 : compute
// 引数 : attSide (攻撃側 "A" または "B"), defSide (防御側 "A" または "B")
// 戻り値: Object (体重比、部位倍率、装甲倍率、補正前ダメ、部位後ダメ、最終ダメ、撃破発数、HPなど)
// 説明 : 攻撃側から防御側への最終ダメージおよび撃破必要回数を計算する
// ============================
function compute(attSide,defSide){
  const attack=Math.max(0,val("attack"+attSide,0));
  const hp=Math.max(0,val("hp"+defSide,0));
  const attackerWeight=Math.max(0,val("weight"+attSide,0));
  const defenderWeight=Math.max(.000001,val("weight"+defSide,0));
  const body=partMultiplier(defSide);
  const armor=Math.max(0,val("armor"+defSide,1));
  const weightRatio=attackerWeight/defenderWeight;
  const raw=attack*weightRatio;
  const afterPart=raw*body;
  const final=afterPart*armor;
  const hits=final>0?Math.ceil(hp/final):null;
  return {weightRatio,body,armor,raw,afterPart,final,hits,hp};
}

// ============================
// 関数名 : render
// 引数 : key (文字列: "AB" または "BA"), attacker (文字列: 攻撃側恐竜名), defender (文字列: 防御側恐竜名), r (Object: computeの計算結果)
// 戻り値: なし
// 説明 : 計算されたダメージや詳細な内訳、撃破までの発数を画面の指定カードに描画する
// ============================
function render(key,attacker,defender,r){
  $("name"+key).textContent=attacker+" → "+defender;
  $("damage"+key).textContent=fmt(r.final);
  $("detail"+key).innerHTML=`体重補正：${fmt(r.weightRatio)}倍<br>部位補正：${fmt(r.body)}倍<br>装甲軽減倍率：${fmt(r.armor)}倍<br>補正前：${fmt(r.raw)} → 部位適用後：${fmt(r.afterPart)}`;
  $("hits"+key).textContent=r.hits===null?"撃破できません（ダメージ0）":`撃破まで ${fmt(r.hits)} 発（対象HP：${fmt(r.hp)}）`;
}

// ============================
// 関数名 : calculate
// 引数 : なし
// 戻り値: なし
// 説明 : A→BおよびB→Aの相互ダメージ計算を実行し、それぞれ画面に描画させる
// ============================
function calculate(){
  if(!dinosaurs.length)return;
  const A=selected("A"),B=selected("B");
  render("AB",A.name,B.name,compute("A","B"));
  render("BA",B.name,A.name,compute("B","A"));
}

// ============================
// 関数名 : resetAll
// 引数 : なし
// 戻り値: なし
// 説明 : すべての入力値や選択状態を初期設定（デフォルト）に戻し、再計算を行う
// ============================
function resetAll(){
  ["A","B"].forEach(side=>{
    loadDino(side);
    $("armor"+side).value="1.00";
    $("custom"+side).value="0.00";
    document.querySelector(`input[name="part${side}"][value="body"]`).checked=true;
    toggleCustom(side);
  });
  calculate();
}

init().catch(err=>{document.querySelector("main").insertAdjacentHTML("afterbegin",`<p class="notice">恐竜データを読み込めませんでした。index.html と dinosaurs.json を同じフォルダに置いてください。</p>`);console.error(err)});
