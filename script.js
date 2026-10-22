
"use strict";

// =====================================================
// CONFIGURACIÓN DE IMÁGENES
// =====================================================

const IMAGENES = {
  "VA-izquierdo": "img/va-izquierdo.png",
  "VA-derecho": "img/va-derecho.png",
  "VO-izquierdo": "img/vo-izquierdo.png",
  "VO-derecho": "img/vo-derecho.png"
};

const FRECUENCIAS_VO = [250, 500, 1000, 2000, 3000, 4000];
const FRECUENCIAS_EFECTO_OCLUSION = [250, 500, 1000];

const $ = (id) => document.getElementById(id);

// =====================================================
// ELEMENTOS HTML
// =====================================================

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

// =====================================================
// ORIENTACIÓN ANATÓMICA FIJA
//
// NUESTRA IZQUIERDA:
// OÍDO DERECHO = ROJO
//
// NUESTRA DERECHA:
// OÍDO IZQUIERDO = AZUL
//
// OE y ONE modifican las etiquetas, nunca la posición.
// =====================================================

function obtenerInputVA(ear) {
  return ear === "derecho" ? vaIzquierda : vaDerecha;
}

function obtenerInputVO(ear) {
  return ear === "derecho" ? voIzquierda : voDerecha;
}

function aplicarColoresFijos() {
  // Oído derecho: siempre a nuestra izquierda y rojo.
  tituloLadoIzquierdo.style.color = "#ed5c69";
  contenedorVaIzquierda.style.borderTop = "3px solid #ed5c69";
  labelVaIzquierda.style.color = "#ed5c69";
  labelVoIzquierda.style.color = "#ed5c69";
  voIzquierda.style.borderColor = "#ed5c69";

  // Oído izquierdo: siempre a nuestra derecha y azul.
  tituloLadoDerecho.style.color = "#4f72f5";
  contenedorVaDerecha.style.borderTop = "3px solid #4f72f5";
  labelVaDerecha.style.color = "#4f72f5";
  labelVoDerecha.style.color = "#4f72f5";
  voDerecha.style.borderColor = "#4f72f5";
}

// =====================================================
// OBTENER Y VALIDAR DATOS
// =====================================================

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

function validarDato(input, nombre) {
  const valor = obtenerDato(input);

  if (valor === null) {
    throw new Error(
      `Ingresa un valor válido para ${nombre}, entre -10 y 120 dB HL.`
    );
  }

  return valor;
}

// =====================================================
// ACTUALIZAR INTERFAZ
// =====================================================

function actualizarInterfaz() {
  const tipoVia = via.value;
  const OE = oido.value;
  const ONE = OE === "derecho" ? "izquierdo" : "derecho";
  const freq = Number(frecuencia.value);
  const esVO = tipoVia === "VO";

  const frecuenciaValidaVO = FRECUENCIAS_VO.includes(freq);

  // Cambiar la imagen según vía y oído estudiado.
  const claveImagen = `${tipoVia}-${OE}`;

  imagenOido.onerror = null;
  imagenOido.src = IMAGENES[claveImagen];

  imagenOido.alt =
    `Esquema de ${esVO ? "vía ósea" : "vía aérea"}, ` +
    `oído estudiado ${OE}`;
  };

  $("etiquetaVia").textContent = esVO ? "VÍA ÓSEA" : "VÍA AÉREA";

  // IZQUIERDA DE PANTALLA = OÍDO DERECHO.
  tituloLadoIzquierdo.textContent =
    `Oído derecho · ${OE === "derecho" ? "OE" : "ONE"}`;

  // DERECHA DE PANTALLA = OÍDO IZQUIERDO.
  tituloLadoDerecho.textContent =
    `Oído izquierdo · ${OE === "izquierdo" ? "OE" : "ONE"}`;

  // Las casillas de VO mantienen la orientación anatómica.
  labelVoIzquierda.textContent =
    `VO · ${OE === "derecho" ? "OE" : "ONE"}`;

  labelVoDerecha.textContent =
    `VO · ${OE === "izquierdo" ? "OE" : "ONE"}`;

  // Las casillas de VA también mantienen la orientación.
  labelVaIzquierda.textContent =
    `VA · ${OE === "derecho" ? "OE" : "ONE"}`;

  labelVaDerecha.textContent =
    `VA · ${OE === "izquierdo" ? "OE" : "ONE"}`;

  // VÍA AÉREA: mostrar ambas casillas VA.
  // VÍA ÓSEA: mostrar solo VA del oído no estudiado.
  contenedorVaIzquierda.hidden =
    esVO && OE === "derecho";

  contenedorVaDerecha.hidden =
    esVO && OE === "izquierdo";

  obtenerInputVA(OE).required = !esVO;
  obtenerInputVA(ONE).required = true;

  // Frecuencias permitidas en vía ósea.
  Array.from(frecuencia.options).forEach((option) => {
    option.disabled =
      esVO && !FRECUENCIAS_VO.includes(Number(option.value));
  });

  avisoFrecuencia.hidden = !esVO || !frecuenciaValidaVO;

  // Mostrar opción de efecto de oclusión en 250, 500 y 1000 Hz.
  opcionesOclusion.hidden =
    !esVO || !FRECUENCIAS_EFECTO_OCLUSION.includes(freq);

  if (opcionesOclusion.hidden) {
    neurosensorial.checked = false;
  }

  // Reafirmar los colores independientemente del OE.
  aplicarColoresFijos();

  limpiarResultados();
}

// =====================================================
// RESULTADOS Y ERRORES
// =====================================================

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

// =====================================================
// LEER LOS VALORES DEL OE Y DEL ONE
// =====================================================

function leerDatos() {
  const OE = oido.value;
  const ONE = OE === "derecho" ? "izquierdo" : "derecho";

  const datos = {
    frecuencia: Number(frecuencia.value),
    via: via.value,
    OE,
    ONE,

    voOE: validarDato(
      obtenerInputVO(OE),
      `VO del OE (${OE})`
    ),

    voONE: validarDato(
      obtenerInputVO(ONE),
      `VO del ONE (${ONE})`
    ),

    vaONE: validarDato(
      obtenerInputVA(ONE),
      `VA del ONE (${ONE})`
    )
  };

  if (datos.via === "VA") {
    datos.vaOE = validarDato(
      obtenerInputVA(OE),
      `VA del OE (${OE})`
    );
  }

  return datos;
}

// =====================================================
// CÁLCULOS DE ENMASCARAMIENTO
// =====================================================

function calcularEnmascaramiento(datos) {
  const {
    frecuencia: freq,
    via: tipoVia,
    vaOE,
    vaONE,
    voOE,
    voONE
  } = datos;

  // -----------------------------------------------
  // VÍA AÉREA
  // -----------------------------------------------

  if (tipoVia === "VA") {
    const enmascarar =
      vaOE >= 40 &&
      vaOE - 40 >= voONE;

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

    return crearResultado(minimo, maximo, "VA");
  }

  // -----------------------------------------------
  // VÍA ÓSEA
  // -----------------------------------------------

  if (!FRECUENCIAS_VO.includes(freq)) {
    throw new Error(
      "Para vía ósea, selecciona 250, 500, 1000, 2000, 3000 o 4000 Hz."
    );
  }

  let correccionOclusion = 0;

  // Corrección por efecto de oclusión, según selección.
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

  const estimuloVO = voOE + correccionOclusion;

  // Criterio de VO de la versión anterior.
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

  const minimo = estimuloVO - voONE + vaONE;
  const maximo = voOE + 40;

  return crearResultado(minimo, maximo, "VO", {
    estimuloVO,
    correccionOclusion
  });
}

// =====================================================
// MÍNIMO, MÁXIMO Y ESPECTRO DE ENMASCARAMIENTO
// =====================================================

function crearResultado(minimo, maximo, tipoVia, extra = {}) {
  const inicioEE = minimo + 10;
  const finEE = maximo - 5;

  return {
    enmascarar: true,
    minimo,
    maximo,
    inicioEE,
    finEE,
    eeDisponible: inicioEE <= finEE,
    tipoVia,
    ...extra
  };
}

function formatearNumero(numero) {
  return Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(1).replace(".", ",");
}

// =====================================================
// MOSTRAR RESULTADOS
// =====================================================

function mostrarResultados(resultado, datos) {
  resultados.hidden = false;
  datosResultado.hidden = true;

  notaResultado.textContent = "";
  detalleResultado.textContent = "";

  if (!resultado.enmascarar) {
    estadoEnmascaramiento.className = "estado no";
    estadoEnmascaramiento.textContent = "NO SE ENMASCARA";

    detalleResultado.textContent = resultado.motivo;

    // No mostrar mínimo, máximo ni EE si no se enmascara.
    datosResultado.hidden = true;

    if (resultado.correccionOclusion > 0) {
      notaResultado.textContent =
        `Estímulo VO calculado: ${formatearNumero(resultado.estimuloVO)} dB HL. ` +
        `Corrección por oclusión: ${resultado.correccionOclusion} dB.`;
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
      "EE calculado desde mínimo + 10 dB hasta máximo − 5 dB.";
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

// =====================================================
// BOTÓN CALCULAR
// =====================================================

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

// =====================================================
// BOTÓN LIMPIAR
// =====================================================

$("limpiar").addEventListener("click", () => {
  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.value = "";
  });

  neurosensorial.checked = false;

  limpiarResultados();
});

// =====================================================
// EVENTOS
// =====================================================

[frecuencia, via, oido].forEach((elemento) => {
  elemento.addEventListener("change", actualizarInterfaz);
});

document
  .querySelectorAll('input[type="number"], input[type="checkbox"]')
  .forEach((input) => {
    input.addEventListener("input", limpiarResultados);
    input.addEventListener("change", limpiarResultados);
  });

// =====================================================
// INICIAR CALCULADORA
// =====================================================

actualizarInterfaz();
