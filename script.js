const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const thresholds = {};
const $ = (id) => document.getElementById(id);

function initTable() {
  const tbody = $("thresholdRows");
  tbody.innerHTML = "";
  FREQUENCIES.forEach((hz) => {
    thresholds[hz] = { right: { air: "", bone: "" }, left: { air: "", bone: "" } };
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${hz >= 1000 ? (hz / 1000) + " kHz" : hz + " Hz"}</td>
      ${makeInput(hz, "right", "air")}
      ${makeInput(hz, "right", "bone")}
      ${makeInput(hz, "left", "air")}
      ${makeInput(hz, "left", "bone")}`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", (event) => {
      const { hz, ear, kind } = event.target.dataset;
      thresholds[hz][ear][kind] = event.target.value;
      renderResults();
    });
  });
}
function makeInput(hz, ear, kind) {
  const sideClass = ear === "right" ? "right-input" : "left-input";
  return `<td><input class="threshold ${sideClass}" type="number" min="-10" max="120" step="5"
    aria-label="${hz} Hz, ${ear === "right" ? "derecho" : "izquierdo"}, ${kind === "air" ? "vía aérea" : "vía ósea"}"
    data-hz="${hz}" data-ear="${ear}" data-kind="${kind}" placeholder="—"></td>`;
}
function val(hz, ear, kind) {
  const raw = thresholds[hz]?.[ear]?.[kind];
  return raw === "" || raw === undefined ? null : Number(raw);
}
function fmt(n) { return n === null || !Number.isFinite(n) ? "—" : `${n} dB HL`; }
function opposite(ear) { return ear === "right" ? "left" : "right"; }
function earName(ear) { return ear === "right" ? "OD" : "OI"; }
function oeValue(hz) {
  if (!["normal", "sn"].includes($("nteType").value)) return 0;
  return ({250: 20, 500: 15, 1000: 5})[hz] || 0;
}
function interauralAttenuation() {
  return 40;
}
function calculate(hz) {
  const te = $("testEar").value;
  const nte = opposite(te);
  const path = $("pathway").value;
  const ia = interauralAttenuation();
  const teAir = val(hz, te, "air");
  const teBone = val(hz, te, "bone");
  const nteAir = val(hz, nte, "air");
  const nteBone = val(hz, nte, "bone");
  const nteReference = nteBone ?? nteAir;
  const usedProxy = nteBone === null && nteAir !== null;
  let needed = false;
  let reason = "Ingresa los umbrales relevantes de ambos oídos para evaluar esta frecuencia.";
  let complete = false;
  let oe = 0;

  if (path === "air") {
    complete = teAir !== null && nteReference !== null;
    if (complete) {
      const difference = teAir - nteReference;
      needed = difference >= ia;
      reason = `VA del ${earName(te)} (${teAir}) − ${nteBone !== null ? "VO" : "VA aproximada"} del ${earName(nte)} (${nteReference}) = ${difference} dB. Criterio de referencia: ${ia} dB o más.`
        + (usedProxy ? " No se ingresó VO del oído no estudiado; se utilizó su VA como aproximación conservadora." : "");
    }
  } else {
    const abg = teAir !== null && teBone !== null ? teAir - teBone : null;
    oe = oeValue(hz);
    complete = (teAir !== null && teBone !== null) || (teBone !== null && nteAir !== null);
    if (abg !== null && abg > 10) {
      needed = true;
      reason = `La brecha aéreo-ósea del oído estudiado es ${abg} dB, mayor de 10 dB; se recomienda evaluar enmascaramiento por VO.`;
    } else if (teBone !== null && nteAir !== null && (nteBone === null || nteBone <= teBone)) {
      // Conservative flag: BC crosses to both cochleae; confirm against the local protocol.
      needed = true;
      reason = `La VO puede ser percibida por ambas cócleas (IA ósea ≈ 0 dB). Con los datos ingresados, el oído no estudiado podría responder; confirma el criterio con el protocolo de tu curso.`;
    } else if (abg !== null) {
      needed = false;
      reason = `Brecha aéreo-ósea del oído estudiado: ${abg} dB. No se activa el criterio de brecha > 10 dB y los datos disponibles no activan el criterio conservador de posible respuesta contralateral.`;
    }
  }

  const minLevel = nteAir === null ? null : nteAir + 15 + (path === "bone" ? oe : 0);
  const maxLevel = teBone === null ? null : teBone + ia;
  const dilemma = needed && minLevel !== null && maxLevel !== null && minLevel >= maxLevel;
  return { hz, te, nte, path, ia, needed, reason, complete, oe, minLevel, maxLevel, dilemma, nteAir };
}
function renderResults() {
  const pathLabel = $("pathway").value === "air" ? "Vía aérea" : "Vía ósea";
  $("results").innerHTML = FREQUENCIES.map(hz => {
    const r = calculate(hz);
    const statusClass = !r.complete ? "wait" : r.needed ? "yes" : "no";
    const statusText = !r.complete ? "Faltan datos" : r.needed ? "Evaluar enmascaramiento" : "No indicado por esta regla";
    let levelText = "";
    if (r.needed) {
      levelText = `<p><strong>Nivel inicial orientativo:</strong> ${fmt(r.minLevel)}</p>
        <p><strong>Máximo orientativo:</strong> ${fmt(r.maxLevel)}</p>`;
      if (r.path === "bone") {
        levelText += `<p><strong>Efecto de oclusión aplicado:</strong> ${r.oe} dB</p>`;
      }
      if (r.dilemma) {
        levelText += `<p class="warning"><strong>Atención:</strong> el nivel inicial alcanza/supera el máximo estimado; posible dilema de enmascaramiento.</p>`;
      }
    }
    const oeAlert = r.path === "bone" && [250,500,1000].includes(hz) &&
      ["normal","sn"].includes($("nteType").value);
    return `<article class="result-card">
      <h3>${hz >= 1000 ? hz/1000 + " kHz" : hz + " Hz"} · ${pathLabel}</h3>
      <span class="status ${statusClass}">${statusText}</span>
      <p><strong>Oído estudiado:</strong> ${earName(r.te)} · <strong>No estudiado:</strong> ${earName(r.nte)}</p>
      <p>${r.reason}</p>
      ${levelText}
      ${oeAlert ? `<p><strong>Posible efecto de oclusión:</strong> se considera en VO a esta frecuencia porque el tipo de audición seleccionado para el oído no estudiado es normoacusia/HSN.</p>` : ""}
      ${r.needed ? `<details open>
        <summary>¿Por qué se enmascara?</summary>
        <p>${r.path === "air"
          ? "En vía aérea, el sonido puede cruzar al oído contrario. Se compara el umbral de VA del oído estudiado con la VO del oído no estudiado (o con su VA si la VO no está disponible). La regla exacta depende del transductor y del protocolo."
          : "En vía ósea, la vibración llega a ambas cócleas con poca atenuación interaural. El enmascaramiento ayuda a identificar qué oído responde. La brecha aéreo-ósea >10 dB es un criterio clásico, pero la indicación final depende de todos los umbrales."}
          ${r.path === "bone" ? " El efecto de oclusión solo se suma al cálculo inicial si corresponde al oído no estudiado y al tipo de transductor." : ""}</p>
      </details>` : ""}
    </article>`;
  }).join("");
}
function clearAll() {
  FREQUENCIES.forEach(hz => {
    ["right", "left"].forEach(ear => ["air", "bone"].forEach(kind => {
      thresholds[hz][ear][kind] = "";
    }));
  });
  document.querySelectorAll("input.threshold").forEach(input => input.value = "");
  renderResults();
}
["pathway", "testEar", "nteType"].forEach(id => $(id).addEventListener("change", renderResults));
$("clearBtn").addEventListener("click", clearAll);
initTable();
renderResults();
