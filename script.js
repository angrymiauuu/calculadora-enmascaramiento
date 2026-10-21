
"use strict";

const IMAGENES = {
  "VA-izquierdo": "img/va-izquierdo.png",
  "VA-derecho": "img/va-derecho.png",
  "VO-izquierdo": "img/vo-izquierdo.png",
  "VO-derecho": "img/vo-derecho.png"
};

const FRECUENCIAS_VO = [250, 500, 1000, 2000, 3000, 4000];
const FRECUENCIAS_EFECTO_OCLUSION = [250, 500, 1000];

// ======================================================
// ELEMENTOS DE LA PÁGINA
// ======================================================

const $ = (id) => document.getElementById(id);

const frecuencia = $("frecuencia");
const via = $("via");
const oido = $("oido");
const imagenOido = $("imagenOido");

const vaIzquierda = $("vaIzquierda");
const vaDerecha = $("vaDerecha");
const voIzquierda = $("voIzquierda");
const voDerecha = $("voDerecha");

const labelVaIzquierda = $("labelVaIzquierda");
const labelVaDerecha = $("labelVaDerecha");
const labelVoIzquierda = $("labelVoIzquierda");
const labelVoDerecha = $("labelVoDerecha");

const tituloLadoIzquierdo = $("tituloLadoIzquierdo");
const tituloLadoDerecho = $("tituloLadoDerecho");

const contenedorVaIzquierda = $("contenedorVaIzquierda");
const contenedorVaDerecha = $("contenedorVaDerecha");

const avisoFrecuencia = $("avisoFrecuencia");
const opcionesOclusion = $("opcionesOclusion");
const neurosensorial = $("neurosensorial");

const resultados = $("resultados");
const estadoEnmascaramiento = $("estadoEnmascaramiento");
const detalleResultado = $("detalleResultado");
const datosResultado = $("datosResultado");
const resultadoMinimo = $("resultadoMinimo");
const resultadoMaximo = $("resultadoMaximo");
const resultadoEE = $("resultadoEE");
const notaResultado = $("notaResultado");
const mensajeError = $("mensajeError");

// ======================================================
// IDENTIFICACIÓN DE LOS OÍDOS
//
// En la imagen de una cabeza de frente, el oído derecho
// de la persona aparece a la izquierda de la pantalla.
//
// OE  = oído estudiado
// ONE = oído no estudiado
// ======================================================

function ladoVisualDelOido(ear) {
  return ear === "derecho" ? "izquierda" : "derecha";
}

function inputVA(ear) {
  return ear === "derecho" ? vaIzquierda : vaDerecha;
}

function inputVO(ear) {
  return ear === "derecho" ? voIzquierda : voDerecha;
}

function obtenerDato(input) {
  const valor = input.value.trim();

  if (valor === "") {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < -10 || numero > 120) {
    return null;
  }

  return numero;
}

// ======================================================
// ACTUALIZAR INTERFAZ
// ======================================================

function actualizarInterfaz() {
  const tipoVia = via.value;
  const oidoEstudiado = oido.value;
  const oidoNoEstudiado =
    oidoEstudiado === "derecho" ? "izquierdo" : "derecho";

  const ladoOE = ladoVisualDelOido(oidoEstudiado);
  const ladoONE = ladoVisualDelOido(oidoNoEstudiado);

  const freq = Number(frecuencia.value);
  const esVO = tipoVia === "VO";
  const frecuenciaValidaVO = FRECUENCIAS_VO.includes(freq);

  // Cambiar la imagen central según vía y oído.
  const claveImagen = `${tipoVia}-${oidoEstudiado}`;
  imagenOido.src = IMAGENES[claveImagen];
  imagenOido.alt =
    `Esquema de ${esVO ? "vía ósea" : "vía aérea"}, ` +
    `oído estudiado ${oidoEstudiado}`;

  imagenOido.onerror = function () {
    this.onerror = null;
    this.alt =
      "No se encontró la imagen. Revisa el nombre del archivo en la carpeta img.";
  };

  $("etiquetaVia").textContent =
    esVO ? "VÍA ÓSEA" : "VÍA AÉREA";

  // Identificar los oídos a los lados de la imagen.
  tituloLadoIzquierdo.textContent =
    `${ladoONE === "izquierda" ? "ONE" : "OE"} · Oído ` +
    (ladoONE === "izquierda" ? "izquierdo" : "derecho");

  tituloLadoDerecho.textContent =
    `${ladoONE === "derecha" ? "ONE" : "OE"} · Oído ` +
    (ladoONE === "derecha" ? "izquierdo" : "derecho");

  // Las etiquetas de VO permanecen dentro del dibujo.
  labelVoIzquierda.textContent =
    ladoVisualDelOido("derecho") === "izquierda"
      ? (oidoEstudiado === "derecho" ? "VO · OE" : "VO · ONE")
      : "";

  labelVoDerecha.textContent =
    oidoEstudiado === "izquierdo" ? "VO · OE" : "VO · ONE";

  // Aclarar cuál es el oído representado por cada casilla.
  labelVoIzquierda.textContent =
    (ladoOE === "izquierda") ? "VO · OE" : "VO · ONE";

  labelVoDerecha.textContent =
    (ladoOE === "derecha") ? "VO · OE" : "VO · ONE";

  // Vía aérea: se necesitan VA del OE y del ONE.
  // Vía ósea: solo se necesita VA del ONE.
  contenedorVaIzquierda.hidden =
    esVO && ladoONE !== "izquierda";

  contenedorVaDerecha.hidden =
    esVO && ladoONE !== "derecha";

  labelVaIzquierda.textContent =
    ladoOE === "izquierda" ? "VA · OE" : "VA · ONE";

  labelVaDerecha.textContent =
    ladoOE === "derecha" ? "VA · OE" : "VA · ONE";

  // Para VO, el campo VA del oído estudiado no se usa.
  inputVA(oidoEstudiado).required = !esVO;
  inputVA(oidoNoEstudiado).required = true;

  // Restringir las frecuencias permitidas para VO.
  Array.from(frecuencia.options).forEach((option) => {
    const f = Number(option.value);

    option.disabled = esVO && !FRECUENCIAS_VO.includes(f);
  });

  avisoFrecuencia.hidden = !esVO || !frecuenciaValidaVO;

  // La corrección por efecto de oclusión solo se ofrece
  // en 250, 500 y 1000 Hz cuando se evalúa VO.
  opcionesOclusion.hidden =
    !esVO || !FRECUENCIAS_EFECTO_OCLUSION.includes(freq);

  if (opcionesOclusion.hidden) {
    neurosensorial.checked = false;
  }

  limpiarResultados();
}

// ======================================================
// LIMPIEZA Y VALIDACIÓN
// ======================================================

function limpiarResultados() {
  resultados.hidden = true;
  mensajeError.hidden = true;
  mensajeError.textContent = "";
}

function mostrarError(mensaje) {
  resultados.hidden = true;
  mensajeError.textContent = mensaje;
  mensajeError.hidden = false;
}

function validarDato(input, nombre) {
  const valor = obtenerDato(input);

  if (valor === null) {
    throw new Error(
      `Ingresa un valor válido para ${nombre} entre -10 y 120 dB HL.`
    );
  }

  return valor;
}

function leerDatos() {
  const OE = oido.value;
  const ONE = OE === "derecho" ? "izquierdo" : "derecho";

  const datos = {
    frecuencia: Number(frecuencia.value),
    via: via.value,
    OE,
    ONE,
    voOE: validarDato(inputVO(OE), `VO del OE (${OE})`),
    voONE: validarDato(inputVO(ONE), `VO del ONE (${ONE})`),
    vaONE: validarDato(inputVA(ONE), `VA del ONE (${ONE})`)
  };

  if (datos.via === "VA") {
    datos.vaOE = validarDato(inputVA(OE), `VA del OE (${OE})`);
  }

  return datos;
}

// ======================================================
// FÓRMULAS
//
// Se implementan las fórmulas indicadas en tu descripción.
// Confirma los criterios con el protocolo de tu asignatura
// antes de utilizar esta herramienta para decisiones clínicas.
// ======================================================

function calcularEnmascaramiento(datos) {
  const {
    frecuencia: freq,
    via: tipoVia,
    vaOE,
    vaONE,
    voOE,
    voONE
  } = datos;

  let estimuloVO = voOE;
  let correccionOclusion = 0;

  if (tipoVia === "VA") {
    // Criterio de VA con atenuación interaural de 40 dB.
    const nivelAtenuado = vaOE - 40;

    const enmascarar =
      vaOE >= 40 && nivelAtenuado >= voONE;

    if (!enmascarar) {
      return {
        enmascarar: false,
        motivo:
          "La VA del OE no cumple el criterio de enmascaramiento " +
          "respecto a la VO del ONE, usando 40 dB de atenuación interaural."
      };
    }

    const minimo = vaOE - 40 - voONE + vaONE;
    const maximo = voOE + 40;

    return crearResultadoEnmascarado(
      minimo,
      maximo,
      "VA",
      null
    );
  }

  // VÍA ÓSEA
  if (!FRECUENCIAS_VO.includes(freq)) {
    throw new Error(
      "Para evaluar vía ósea, selecciona 250, 500, 1000, " +
      "2000, 3000 o 4000 Hz."
    );
  }

  // Aplicar efecto de oclusión solo si se marcó la casilla.
  if (
    neurosensorial.checked &&
    FRECUENCIAS_EFECTO_OCLUSION.includes(freq)
  ) {
    if (freq === 250 || freq === 500) {
      correccionOclusion = 15;
    } else if (freq === 1000) {
      correccionOclusion = 10;
    }
  }

  estimuloVO = voOE + correccionOclusion;

  // Criterio indicado en la descripción: el estímulo de VO
  // supera la VO del oído no estudiado.
  const enmascarar = estimuloVO > voONE;

  if (!enmascarar) {
    return {
      enmascarar: false,
      motivo:
        "El estímulo de VO del OE no supera la VO del ONE. " +
        "Según el criterio seleccionado, no se enmascara.",
      estimuloVO,
      correccionOclusion
    };
  }

  // Mínimo basado en el estímulo de VO, incluyendo la
  // corrección por oclusión cuando corresponda.
  const minimo = estimuloVO - voONE + vaONE;

  // Máximo basado en la VO real del OE, sin corrección.
  const maximo = voOE + 40;

  return crearResultadoEnmascarado(
    minimo,
    maximo,
    "VO",
    {
      estimuloVO,
      correccionOclusion
    }
  );
}

// ======================================================
// CONSTRUIR RESULTADO
// ======================================================

function crearResultadoEnmascarado(minimo, maximo, tipoVia, extra) {
  // Según las fórmulas descritas:
  const inicioEE = minimo + 10;
  const finEE = maximo - 5;

  // El EE no está disponible si su límite inferior supera
  // el superior, aunque mínimo y máximo aún se solapen.
  const eeDisponible = inicioEE <= finEE;

  return {
    enmascarar: true,
    minimo,
    maximo,
    inicioEE,
    finEE,
    eeDisponible,
    tipoVia,
    ...(extra || {})
  };
}

// ======================================================
// MOSTRAR RESULTADOS
// ======================================================

function formatearNumero(numero) {
  return Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(1).replace(".", ",");
}

function mostrarResultados(resultado, datos) {
  resultados.hidden = false;
  datosResultado.hidden = true;
  notaResultado.textContent = "";
  detalleResultado.textContent = "";

  if (!resultado.enmascarar) {
    estadoEnmascaramiento.className = "estado no";
    estadoEnmascaramiento.textContent = "NO SE ENMASCARA";
    detalleResultado.textContent = resultado.motivo;

    // No mostrar mínimo, máximo ni EE cuando no se enmascara.
    datosResultado.hidden = true;

    if (resultado.correccionOclusion > 0) {
      notaResultado.textContent =
        `Estímulo VO calculado: ${formatearNumero(resultado.estimuloVO)} dB HL ` +
        `(incluye ${resultado.correccionOclusion} dB de corrección por oclusión).`;
    }

    return;
  }

  estadoEnmascaramiento.className = "estado si";
  estadoEnmascaramiento.textContent = "SÍ SE ENMASCARA";

  detalleResultado.textContent =
    `Vía ${resultado.tipoVia === "VA" ? "aérea" : "ósea"} · ` +
    `${datos.frecuencia} Hz · OE: ${datos.OE} · ONE: ${datos.ONE}.`;

  resultadoMinimo.textContent =
    formatearNumero(resultado.minimo);

  resultadoMaximo.textContent =
    formatearNumero(resultado.maximo);

  if (resultado.eeDisponible) {
    resultadoEE.textContent =
      `${formatearNumero(resultado.inicioEE)} – ` +
      `${formatearNumero(resultado.finEE)}`;

    notaResultado.textContent =
      "El EE disponible se calcula desde mínimo + 10 dB " +
      "hasta máximo − 5 dB, según las reglas indicadas.";
  } else {
    resultadoEE.textContent = "No disponible";

    notaResultado.textContent =
      "El EE no está disponible porque el límite inferior " +
      "(mínimo + 10 dB) supera al límite superior (máximo − 5 dB).";
  }

  if (resultado.correccionOclusion > 0) {
    notaResultado.textContent +=
      ` Se aplicó una corrección por efecto de oclusión de ` +
      `${resultado.correccionOclusion} dB al estímulo de VO.`;
  }

  datosResultado.hidden = false;
}

// ======================================================
// BOTONES Y EVENTOS
// ======================================================

$("calcular").addEventListener("click", () => {
  limpiarResultados();

  try {
    if (
      via.value === "VO" &&
      !FRECUENCIAS_VO.includes(Number(frecuencia.value))
    ) {
      throw new Error(
        "Selecciona una frecuencia válida para vía ósea."
      );
    }

    const datos = leerDatos();
    const resultado = calcularEnmascaramiento(datos);

    mostrarResultados(resultado, datos);
  } catch (error) {
    mostrarError(error.message);
  }
});

$("limpiar").addEventListener("click", () => {
  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.value = "";
  });

  neurosensorial.checked = false;
  limpiarResultados();
});

// Actualizar imagen, etiquetas y frecuencias al cambiar opciones.
[frecuencia, via, oido].forEach((elemento) => {
  elemento.addEventListener("change", actualizarInterfaz);
});

// Si se cambian datos después de calcular, borrar el resultado
// anterior para no dejar visible un cálculo desactualizado.
document.querySelectorAll('input[type="number"], input[type="checkbox"]')
  .forEach((input) => {
    input.addEventListener("input", limpiarResultados);
    input.addEventListener("change", limpiarResultados);
  });

// Estado inicial.
actualizarInterfaz();
