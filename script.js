
const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];

const thresholds = {};
const $ = (id) => document.getElementById(id);

function initTable() {
  const tbody = $("thresholdRows");
  tbody.innerHTML = "";

  FREQUENCIES.forEach((hz) => {
    thresholds[hz] = {
      right: { air: "", bone: "" },
      left: { air: "", bone: "" }
    };

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${hz >= 1000 ? hz / 1000 + " kHz" : hz + " Hz"}</td>
      ${makeInput(hz, "right", "air")}
      ${makeInput(hz, "right", "bone")}
      ${makeInput(hz, "left", "air")}
      ${makeInput(hz, "left", "bone")}
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      const { hz, ear, kind } = event.target.dataset;
      thresholds[Number(hz)][ear][kind] = event.target.value;
      renderResults();
    });
  });
}

function makeInput(hz, ear, kind) {
  const sideClass = ear === "right" ? "right-input" : "left-input";
  const earLabel = ear === "right" ? "derecho" : "izquierdo";
  const kindLabel = kind === "air" ? "vía aérea" : "vía ósea";

  return `
    <td>
      <input
        class="threshold ${sideClass}"
        type="number"
        min="-10"
        max="120"
        step="5"
        aria-label="${hz} Hz, ${earLabel}, ${kindLabel}"
        data-hz="${hz}"
        data-ear="${ear}"
        data-kind="${kind}"
        placeholder="—"
      >
    </td>
  `;
}

function val(hz, ear, kind) {
  const raw = thresholds[hz]?.[ear]?.[kind];

  if (raw === "" || raw === undefined) {
    return null;
  }

  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

function fmt(n) {
  return n === null || !Number.isFinite(n)
    ? "No calculable con los datos ingresados"
    : `${n} dB HL`;
}

function opposite(ear) {
  return ear === "right" ? "left" : "right";
}

function earName(ear) {
  return ear === "right" ? "OD" : "OI";
}

// Referencia para fonos supraaurales según el material de estudio.
function interauralAttenuation() {
  return 40;
}

// Efecto de oclusión según la frecuencia y el tipo de audición del ONE.
function oeValue(hz) {
  const type = $("nteType").value;

  if (!["normal", "sn"].includes(type)) {
    return 0;
  }

  return {
    250: 15,
    500: 15,
    1000: 10
  }[hz] || 0;
}

function calculate(hz) {
  const te = $("testEar").value;
  const nte = opposite(te);
  const path = $("pathway").value;

  const ia = path === "air" ? interauralAttenuation() : 0;

  const teAir = val(hz, te, "air");
  const teBone = val(hz, te, "bone");
  const nteAir = val(hz, nte, "air");
  const nteBone = val(hz, nte, "bone");

  let needed = false;
  let complete = false;
  let reason = "Ingresa los umbrales necesarios para evaluar esta frecuencia.";
  let minLevel = null;
  let maxLevel = null;
  let oe = 0;
  let dilemma = false;
  let nteGap = null;

  if (nteAir !== null && nteBone !== null) {
    nteGap = nteAir - nteBone;
  }

  if (path === "air") {
    // Vía aérea:
    // comparar VA del OE con VO del ONE.
    complete = teAir !== null && nteBone !== null;

    if (!complete) {
      const missing = [];

      if (teAir === null) {
        missing.push(`VA del ${earName(te)}`);
      }

      if (nteBone === null) {
        missing.push(`VO del ${earName(nte)}`);
      }

      reason =
        `Faltan datos: ${missing.join(" y ")}. ` +
        "No se puede comprobar el criterio de vía aérea.";
    } else {
      const difference = teAir - nteBone;

      needed = difference >= ia;

      if (needed) {
        reason =
          `VA del ${earName(te)} (${teAir}) − VO del ${earName(nte)} ` +
          `(${nteBone}) = ${difference} dB. ` +
          `La diferencia alcanza la atenuación interaural de referencia ` +
          `de ${ia} dB.`;
      } else {
        reason =
          `VA del ${earName(te)} (${teAir}) − VO del ${earName(nte)} ` +
          `(${nteBone}) = ${difference} dB. ` +
          `No alcanza la atenuación interaural de referencia de ${ia} dB.`;
      }

      if (needed) {
        // Fórmula del material:
        // mínimo = VA(ONE) - IA + GAP(ONE)
        minLevel =
          nteAir !== null && nteGap !== null
            ? nteAir - ia + nteGap
            : null;

        // Máximo = VO(OE) + IA
        maxLevel = teBone !== null ? teBone + 40 : null;
            ? teBone + ia
            : null;
      }
    }
  } else {
    // Vía ósea:
    // brecha aéreo-ósea >= 10 dB Y posibilidad de respuesta del ONE.
    const abg =
      teAir !== null && teBone !== null
        ? teAir - teBone
        : null;

    oe = oeValue(hz);

    // Comprobación orientativa de posible respuesta contralateral.
    // Se necesita la VO de ambos oídos para evaluar este criterio.
    const canHearContralateral =
      teBone !== null &&
      nteBone !== null &&
      nteBone <= teBone;

    complete =
      teAir !== null &&
      teBone !== null &&
      nteBone !== null;

    if (!complete) {
      const missing = [];

      if (teAir === null) {
        missing.push(`VA del ${earName(te)}`);
      }

      if (teBone === null) {
        missing.push(`VO del ${earName(te)}`);
      }

      if (nteBone === null) {
        missing.push(`VO del ${earName(nte)}`);
      }

      reason =
        `Faltan datos: ${missing.join(", ")}. ` +
        "Se necesitan para comprobar la brecha y la posible respuesta del ONE.";
    } else if (abg < 10) {
      needed = false;

      reason =
        `Brecha aéreo-ósea del ${earName(te)}: ${abg} dB. ` +
        "Es menor de 10 dB, por lo que no cumple el criterio de brecha del material.";
    } else if (!canHearContralateral) {
      needed = false;

      reason =
        `Brecha aéreo-ósea del ${earName(te)}: ${abg} dB. ` +
        `Aunque alcanza 10 dB o más, la VO ingresada del ${earName(nte)} ` +
        "no activa la comprobación orientativa de posible respuesta contralateral. " +
        "La brecha por sí sola no indica enmascaramiento.";
    } else {
      needed = true;

      reason =
        `Brecha aéreo-ósea del ${earName(te)}: ${abg} dB. ` +
        `Alcanza 10 dB o más y la VO del ${earName(nte)} ` +
        `(${nteBone} dB HL) activa la comprobación orientativa de posible respuesta.`;
    }

    if (needed) {
      // Fórmula del material:
      // mínimo = VO(OE) + efecto de oclusión + GAP(ONE)
      minLevel =
        nteGap !== null
          ? teBone + oe + nteGap
          : null;

      // Máximo = VO(OE) + IA ósea (0 dB).
      maxLevel = teBone !== null ? teBone + ia : null;
    }
  }

  dilemma =
    needed &&
    minLevel !== null &&
    maxLevel !== null &&
    minLevel >= maxLevel;

  return {
    hz,
    te,
    nte,
    path,
    ia,
    needed,
    reason,
    complete,
    oe,
    minLevel,
    maxLevel,
    dilemma
  };
}

function renderResults() {
  const pathLabel =
    $("pathway").value === "air" ? "Vía aérea" : "Vía ósea";

  $("results").innerHTML = FREQUENCIES.map((hz) => {
    const r = calculate(hz);

    const statusClass = !r.complete
      ? "wait"
      : r.needed
        ? "yes"
        : "no";

    const statusText = !r.complete
      ? "Faltan datos"
      : r.needed
        ? "Evaluar enmascaramiento"
        : "No indicado por esta regla";

    // Aviso de oclusión:
    // solo si se está evaluando VO, se indica enmascaramiento
    // y corresponde aplicar un efecto mayor que 0 dB.
    const showOeNotice =
      r.path === "bone" &&
      r.needed &&
      r.oe > 0;

    let levelText = "";

    if (r.needed) {
      levelText = `
        <p>
          <strong>Nivel mínimo orientativo:</strong>
          ${fmt(r.minLevel)}
        </p>
        <p>
          <strong>Nivel máximo orientativo:</strong>
          ${fmt(r.maxLevel)}
        </p>
      `;

      if (r.dilemma) {
        levelText += `
          <p class="warning">
            <strong>Atención:</strong>
            el mínimo alcanza o supera el máximo estimado.
            Revisa este caso con tu docente o protocolo de la asignatura.
          </p>
        `;
      }

      if (r.minLevel === null) {
        levelText += `
          <p class="warning">
            No se puede calcular el nivel mínimo porque faltan
            umbrales necesarios.
          </p>
        `;
      }
    }

    const explanation = r.path === "air"
      ? "Se compara la VA del oído estudiado con la VO del oído no estudiado. Si la diferencia alcanza la atenuación interaural de referencia, se evalúa el enmascaramiento para evitar que la respuesta provenga del oído contrario."
      : "La vía ósea puede estimular ambas cócleas con atenuación interaural despreciable. Según el material de estudio, se considera una brecha aéreo-ósea de 10 dB o más y la posibilidad de respuesta del oído no estudiado.";

    return `
      <article class="result-card">
        <h3>
          ${hz >= 1000 ? hz / 1000 + " kHz" : hz + " Hz"}
          · ${pathLabel}
        </h3>

        ${showOeNotice ? `
          <div class="oe-notice">
            <span class="oe-notice-icon" aria-hidden="true">♡</span>
            <span>
              <strong>Efecto de oclusión: +${r.oe} dB.</strong>
              Se considera en el nivel mínimo orientativo para esta frecuencia.
            </span>
          </div>
        ` : ""}

        <span class="status ${statusClass}">${statusText}</span>

        <p>
          <strong>Oído estudiado:</strong> ${earName(r.te)}
          · <strong>Oído no estudiado:</strong> ${earName(r.nte)}
        </p>

        <p>${r.reason}</p>

        ${levelText}

        ${r.needed ? `
          <details>
            <summary>¿Por qué se enmascara?</summary>
            <p>${explanation}</p>
          </details>
        ` : ""}
      </article>
    `;
  }).join("");
}

function clearAll() {
  FREQUENCIES.forEach((hz) => {
    ["right", "left"].forEach((ear) => {
      ["air", "bone"].forEach((kind) => {
        thresholds[hz][ear][kind] = "";
      });
    });
  });

  document.querySelectorAll("input.threshold").forEach((input) => {
    input.value = "";
  });

  renderResults();
}

["pathway", "testEar", "nteType"].forEach((id) => {
  $(id).addEventListener("change", renderResults);
});

$("clearBtn").addEventListener("click", clearAll);

initTable();
renderResults();
