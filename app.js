let dinoData = [];

// DOM Element
const attackerSelect = document.getElementById('attacker-select');
const attackerWeightInput = document.getElementById('attacker-weight');
const attackerAttackSelect = document.getElementById('attacker-attack-select');
const attackerDamageInput = document.getElementById('attacker-damage');

const defenderSelect = document.getElementById('defender-select');
const defenderHpInput = document.getElementById('defender-hp');
const defenderWeightInput = document.getElementById('defender-weight');
const defenderArmorInput = document.getElementById('defender-armor');
const hitLocationSelect = document.getElementById('hit-location');

const resDamage = document.getElementById('res-damage');
const resPercent = document.getElementById('res-percent');
const resHtk = document.getElementById('res-htk');

// dinosaurs.json の読み込み
async function loadDinosaurs() {
  try {
    const response = await fetch('dinosaurs.json');
    if (!response.ok) throw new Error('dinosaurs.json の読み込み失敗');
    dinoData = await response.json();
    populateSelects();
  } catch (err) {
    console.warn('JSONの読み込みに失敗したかローカルファイル直開きです。手動入力はそのまま利用可能です。', err);
  }
}

// セレクトボックスの生成
function populateSelects() {
  dinoData.forEach((dino, index) => {
    const optA = document.createElement('option');
    optA.value = index;
    optA.textContent = dino.name;
    attackerSelect.appendChild(optA);

    const optD = document.createElement('option');
    optD.value = index;
    optD.textContent = dino.name;
    defenderSelect.appendChild(optD);
  });
}

// 攻撃側恐竜の選択時処理
attackerSelect.addEventListener('change', (e) => {
  const index = e.target.value;
  if (index === '') return;

  const dino = dinoData[index];
  attackerWeightInput.value = dino.weight || 4000;

  // 攻撃方法リストの更新
  attackerAttackSelect.innerHTML = '<option value="custom">手動入力</option>';
  if (dino.attacks && dino.attacks.length > 0) {
    dino.attacks.forEach(atk => {
      const opt = document.createElement('option');
      opt.value = atk.damage;
      opt.textContent = `${atk.name} (${atk.damage} dmg)`;
      attackerAttackSelect.appendChild(opt);
    });
    // デフォルトで最初の攻撃を設定
    attackerAttackSelect.selectedIndex = 1;
    attackerDamageInput.value = dino.attacks[0].damage;
  }
  calculate();
});

// 攻撃方法変更時
attackerAttackSelect.addEventListener('change', (e) => {
  if (e.target.value !== 'custom') {
    attackerDamageInput.value = e.target.value;
    calculate();
  }
});

// 防御側恐竜の選択時処理
defenderSelect.addEventListener('change', (e) => {
  const index = e.target.value;
  if (index === '') return;

  const dino = dinoData[index];
  defenderHpInput.value = dino.hp || 600;
  defenderWeightInput.value = dino.weight || 4000;
  defenderArmorInput.value = dino.armor !== undefined ? dino.armor : 1.0;
  calculate();
});

// 計算ロジック
function calculate() {
  const attWeight = parseFloat(attackerWeightInput.value) || 0;
  const attDamage = parseFloat(attackerDamageInput.value) || 0;

  const defHp = parseFloat(defenderHpInput.value) || 0;
  const defWeight = parseFloat(defenderWeightInput.value) || 0;
  const defArmor = parseFloat(defenderArmorInput.value) || 1.0;
  const multiplier = parseFloat(hitLocationSelect.value) || 1.0;

  if (attWeight <= 0 || defWeight <= 0 || defArmor <= 0 || defHp <= 0) {
    resDamage.textContent = '0';
    resPercent.textContent = '0%';
    resHtk.textContent = '0';
    return;
  }

  // 公式：(攻撃側重量 ÷ 防御側重量) * 攻撃力 / 鎧値 * 部位倍率
  const baseDmg = (attWeight / defWeight) * attDamage;
  const finalDamage = (baseDmg / defArmor) * multiplier;

  const hpPercent = (finalDamage / defHp) * 100;
  const htk = Math.ceil(defHp / finalDamage);

  resDamage.textContent = finalDamage.toFixed(2);
  resPercent.textContent = hpPercent.toFixed(1) + '%';
  resHtk.textContent = isFinite(htk) && htk > 0 ? htk : '-';
}

// 各入力項目の手動変更時に自動再計算
[
  attackerWeightInput, attackerDamageInput,
  defenderHpInput, defenderWeightInput, defenderArmorInput,
  hitLocationSelect
].forEach(element => {
  element.addEventListener('input', calculate);
});

// 初期化実行
loadDinosaurs();
calculate();
