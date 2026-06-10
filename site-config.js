/* ═══════════════════════════════════════════════════════
   SITE CONFIG — archivo intermedio editado desde Extranet
   index.html lee este objeto y aplica los valores.
   La extranet escribe overrides en localStorage["ae_siteconfig"].
   ═══════════════════════════════════════════════════════ */
var SITE_CONFIG = {
  version: "1.1",

  colores: {
    primario:   "#0033CC",
    secundario: "#FFD700",
    acento:     "#1A6BFF",
    fondo:      "#FFFFFF",
    fondo2:     "#F4F6FA",
    texto:      "#1A1A2E",
    textoMuted: "#6B7280",
    tarjeta:    "#FFFFFF",
  },

  hero: {
    titulo1:    "TRANSFORMA",
    titulo2:    "TU ESPACIO",
    subtitulo:  "Especialistas en Ventanas · Puertas · Drywall · Melamine · Acero · Fachadas",
    subtitulo2: "Lambayeque, Perú",
    cta:        "SOLICITAR COTIZACIÓN",
    ctaSecund:  "Ver Trabajos",
    badge:      "✓ +10 años de experiencia",
  },

  empresa: {
    nombre:    "Vidriería A&E Cajusol H",
    slogan:    "Calidad, Precisión y Garantía en cada proyecto",
    tel1:      "945 496 351",
    tel2:      "943 240 404",
    fijo:      "074 - 282 280",
    email:     "aecajusolh@gmail.com",
    ubicacion: "Jr. Pedro Vilchez Buendía #298, Lambayeque",
    whatsapp:  "51945496351",
    facebook:  "",
  },

  stats: [
    { icono:"🏠", valor:500, sufijo:"+", prefijo:"", label:"Proyectos Completados" },
    { icono:"⭐", valor:200, sufijo:"+", prefijo:"", label:"Clientes Satisfechos"  },
    { icono:"📅", valor:10,  sufijo:"+", prefijo:"", label:"Años de Experiencia"   },
    { icono:"🏆", valor:1,   sufijo:"",  prefijo:"#",label:"En Lambayeque"         },
  ],

  porqueElegirnos: [
    { icono:"🏆", titulo:"Calidad Garantizada",  desc:"Materiales certificados y control de calidad en cada proyecto que ejecutamos." },
    { icono:"💰", titulo:"Precios Justos",        desc:"Cotizaciones transparentes sin costos ocultos. El mejor precio del mercado lambayecano." },
    { icono:"⏱️", titulo:"Puntualidad",          desc:"Cumplimos los plazos acordados. Tu proyecto termina a tiempo, siempre." },
    { icono:"🛡️", titulo:"Garantía Post-Venta", desc:"Soporte y garantía post-instalación en todos nuestros trabajos realizados." },
  ],

  servicios: [
    { icono:"🪟", nombre:"Ventanas de Aluminio",  imagen:"Imagenes/472748140_1821357831934713_8425465647133358525_n.jpg",  desc:"Sistemas corredizos, proyectantes y fijos con perfiles de alta resistencia y vidrio de calidad.",  detalle:["Sistemas corredizos","Ventanas proyectantes","Ventanas fijas","Doble vidrio","Instalación garantizada"] },
    { icono:"🚪", nombre:"Puertas de Aluminio",   imagen:"Imagenes/473053307_1821357771934719_722483940730749556_n.jpg",   desc:"Puertas de entrada, interiores y de seguridad. Elegancia y durabilidad en cada acceso.",             detalle:["Puertas de entrada","Puertas interiores","Sistemas de seguridad","Vidrio templado","Diseños personalizados"] },
    { icono:"🏗️", nombre:"Drywall",              imagen:"Imagenes/472942800_1821357828601380_7155854349723130592_n.jpg",   desc:"Tabiques divisorios, cielos rasos y acabados interiores. Soluciones rápidas y económicas.",            detalle:["Tabiques divisorios","Cielos rasos","Acabados premium","Aislamiento acústico","Rápida instalación"] },
    { icono:"🪵", nombre:"Melamine",              imagen:"Imagenes/472923510_1821357751934721_7398983886552986719_n.jpg",   desc:"Closets a medida, cocinas integrales y muebles de oficina con acabado premium.",                        detalle:["Closets a medida","Cocinas integrales","Muebles de oficina","Revestimientos","Acabado premium"] },
    { icono:"⚙️", nombre:"Estructuras de Acero", imagen:"Imagenes/472787093_1821357775268052_5554283172652544226_n.jpg",   desc:"Barandas decorativas, escaleras metálicas y cercos con acabado industrial de calidad.",                 detalle:["Barandas decorativas","Escaleras metálicas","Cercos y rejas","Estructuras industriales","Soldadura certificada"] },
    { icono:"🏢", nombre:"Fachadas Comerciales", imagen:"Imagenes/473191417_1821357661934730_2818929810585636859_n.jpg",   desc:"Curtain wall, vidrio templado y sistemas corporativos para imagen profesional de tu empresa.",            detalle:["Curtain wall","Vidrio templado","Sistemas Spider","Letreros y marquesinas","Diseño corporativo"] },
  ],

  proceso: [
    { num:"01", icono:"💬", titulo:"Consulta Gratuita",  desc:"Nos contactas y conversamos sobre tu proyecto sin compromiso" },
    { num:"02", icono:"📐", titulo:"Diseño y Medidas",   desc:"Visitamos el lugar, tomamos medidas y diseñamos la solución ideal" },
    { num:"03", icono:"⚙️", titulo:"Producción",        desc:"Fabricamos con materiales de primera calidad en nuestro taller" },
    { num:"04", icono:"🔧", titulo:"Instalación",        desc:"Equipo especializado instala con precisión y cuidado máximo" },
    { num:"05", icono:"✅", titulo:"Garantía",           desc:"Entregamos con garantía y soporte post-instalación permanente" },
  ],

  galeria: [
    { src:"Imagenes/472748140_1821357831934713_8425465647133358525_n.jpg",  categoria:"ventanas", titulo:"Sistema Corredizo" },
    { src:"Imagenes/472752834_1821357731934723_1718024304710712217_n.jpg",  categoria:"puertas",  titulo:"Puerta de Entrada" },
    { src:"Imagenes/472787093_1821357775268052_5554283172652544226_n.jpg",  categoria:"acero",    titulo:"Estructura Metálica" },
    { src:"Imagenes/472841212_1821357655268064_8107989062009591687_n.jpg",  categoria:"ventanas", titulo:"Ventana Proyectante" },
    { src:"Imagenes/472917850_1821357651934731_7260308980137871313_n.jpg",  categoria:"puertas",  titulo:"Puerta Interior" },
    { src:"Imagenes/472923510_1821357751934721_7398983886552986719_n.jpg",  categoria:"melamine", titulo:"Closet a Medida" },
    { src:"Imagenes/472942800_1821357828601380_7155854349723130592_n.jpg",  categoria:"drywall",  titulo:"Tabique Interior" },
    { src:"Imagenes/472954248_1821357665268063_2566844481835171926_n.jpg",  categoria:"ventanas", titulo:"Ventana Fija" },
    { src:"Imagenes/472988974_1821357681934728_5639056991656457923_n.jpg",  categoria:"acero",    titulo:"Baranda Decorativa" },
    { src:"Imagenes/473053307_1821357771934719_722483940730749556_n.jpg",   categoria:"puertas",  titulo:"Puerta Principal" },
    { src:"Imagenes/473067416_1821357711934725_7317758331654928560_n.jpg",  categoria:"melamine", titulo:"Cocina Integral" },
    { src:"Imagenes/473105324_1821357801934716_1538191572890933757_n.jpg",  categoria:"ventanas", titulo:"Sistema Integral" },
    { src:"Imagenes/473117727_1821357808601382_3147672836757758821_n.jpg",  categoria:"drywall",  titulo:"Cielo Raso" },
    { src:"Imagenes/473153469_1821357715268058_82527517305630960_n.jpg",    categoria:"acero",    titulo:"Escalera Metálica" },
    { src:"Imagenes/473191417_1821357661934730_2818929810585636859_n.jpg",  categoria:"puertas",  titulo:"Fachada Comercial" },
  ]
};
