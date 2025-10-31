// public/testimonials-data.js
// Base de datos de testimonios para Finzi

const testimonios = [
    {
        id: 1,
        nombre: "María González",
        ciudad: "Ciudad de México",
        edad: 29,
        foto: "https://i.pravatar.cc/150?img=5", // Genera avatar aleatorio
        rating: 5,
        fecha: "Hace 2 meses",
        testimonio: "Nunca había invertido y tenía miedo. Con Finzi comparé opciones en 5 minutos y ahora tengo $15,000 en CETES ganando 11%. ¡Mi dinero por fin trabaja para mí!",
        monto_invertido: 15000,
        opcion_elegida: "CETES 28 días",
        ganancia_estimada: 1687,
        verificado: true
    },
    {
        id: 2,
        nombre: "Carlos Ramírez",
        ciudad: "Monterrey, NL",
        edad: 35,
        foto: "https://i.pravatar.cc/150?img=12",
        rating: 5,
        fecha: "Hace 1 mes",
        testimonio: "Tenía mi dinero en una cuenta de ahorro tradicional ganando casi nada. Gracias a la calculadora de Finzi vi que en Hey Banco ganaría 5 veces más. Ya llevo $2,400 de rendimientos.",
        monto_invertido: 50000,
        opcion_elegida: "Hey Banco",
        ganancia_estimada: 7500,
        verificado: true
    },
    {
        id: 3,
        nombre: "Ana Martínez",
        ciudad: "Guadalajara, Jal",
        edad: 26,
        foto: "https://i.pravatar.cc/150?img=9",
        rating: 5,
        fecha: "Hace 3 semanas",
        testimonio: "Soy maestra y no sabía cómo empezar a ahorrar para mi casa. Con solo $1,000 pesos mensuales en Kuspit, en 3 años tendré el enganche. La calculadora de Finzi me cambió la vida.",
        monto_invertido: 1000,
        opcion_elegida: "Kuspit Diversificado",
        ganancia_estimada: 8640,
        verificado: true,
        plan_meses: 36
    },
    {
        id: 4,
        nombre: "Roberto Sánchez",
        ciudad: "Puebla, Pue",
        edad: 42,
        foto: "https://i.pravatar.cc/150?img=14",
        rating: 5,
        fecha: "Hace 1 semana",
        testimonio: "Como emprendedor necesito liquidez inmediata. Nu Cuenta me da 14.5% anual y puedo sacar mi dinero cuando quiero. Finzi me mostró que existía esta opción, ¡no tenía idea!",
        monto_invertido: 35000,
        opcion_elegida: "Nu Cuenta",
        ganancia_estimada: 5075,
        verificado: true
    },
    {
        id: 5,
        nombre: "Laura Flores",
        ciudad: "Querétaro, Qro",
        edad: 31,
        foto: "https://i.pravatar.cc/150?img=47",
        rating: 5,
        fecha: "Hace 5 días",
        testimonio: "Mi papá siempre me decía que guardara el dinero 'bajo el colchón'. Ahora le enseñé Finzi y él también invirtió en CETES. En 6 meses hemos ganado más que en 5 años en el banco.",
        monto_invertido: 25000,
        opcion_elegida: "CETES 91 días",
        ganancia_estimada: 1406,
        verificado: true
    },
    {
        id: 6,
        nombre: "Diego Torres",
        ciudad: "Mérida, Yuc",
        edad: 28,
        foto: "https://i.pravatar.cc/150?img=33",
        rating: 5,
        fecha: "Hace 2 semanas",
        testimonio: "Comparar opciones de inversión solía tomarme días. Con Finzi lo hice en minutos. La calculadora me mostró exactamente cuánto ganaría mes a mes. Súper transparente y fácil.",
        monto_invertido: 10000,
        opcion_elegida: "GBM+ Smart Cash",
        ganancia_estimada: 1280,
        verificado: true
    },
    {
        id: 7,
        nombre: "Patricia Herrera",
        ciudad: "Tijuana, BC",
        edad: 37,
        foto: "https://i.pravatar.cc/150?img=20",
        rating: 5,
        fecha: "Hace 4 días",
        testimonio: "Trabajo en USA y mando dinero a México. Finzi me ayudó a encontrar dónde invertir esos ahorros. En 8 meses ya generé $4,500 pesos extras sin hacer nada.",
        monto_invertido: 45000,
        opcion_elegida: "Hey Banco",
        ganancia_estimada: 6750,
        verificado: true
    },
    {
        id: 8,
        nombre: "Fernando López",
        ciudad: "León, Gto",
        edad: 45,
        foto: "https://i.pravatar.cc/150?img=51",
        rating: 5,
        fecha: "Hace 1 mes",
        testimonio: "Soy contador y recomiendo Finzi a TODOS mis clientes. La información es precisa y actualizada. Es la mejor herramienta para comparar inversiones en México.",
        monto_invertido: 80000,
        opcion_elegida: "CETES 364 días",
        ganancia_estimado: 9000,
        verificado: true,
        profesion: "Contador Público"
    },
    {
        id: 9,
        nombre: "Gabriela Ruiz",
        ciudad: "Cancún, QR",
        edad: 24,
        foto: "https://i.pravatar.cc/150?img=25",
        rating: 5,
        fecha: "Hace 3 días",
        testimonio: "Acabo de terminar la universidad y quería empezar bien con mis finanzas. Con solo $500 pesos al mes ya voy por los $6,200. Finzi hace todo súper sencillo de entender.",
        monto_invertido: 500,
        opcion_elegida: "Hey Banco",
        ganancia_estimada: 625,
        verificado: true,
        plan_meses: 12
    }
];

// Estadísticas dinámicas
const estadisticas = {
    usuarios_totales: 15247,
    monto_total_comparado: 87500000,
    promedio_ganancia_anual: 2840,
    calificacion_promedio: 4.9,
    instituciones_comparadas: 12,
    opiniones_totales: 892
};

// Instituciones que comparamos
const instituciones = [
    {
        nombre: "CetesDirecto",
        logo: "/images/logos/cetes.png",
        tipo: "Gubernamental",
        regulador: "Banxico"
    },
    {
        nombre: "Hey Banco",
        logo: "/images/logos/hey.png",
        tipo: "Banco Digital",
        regulador: "CNBV"
    },
    {
        nombre: "GBM+",
        logo: "/images/logos/gbm.png",
        tipo: "Casa de Bolsa",
        regulador: "CNBV"
    },
    {
        nombre: "Kuspit",
        logo: "/images/logos/kuspit.png",
        tipo: "SOFOM",
        regulador: "CNBV"
    },
    {
        nombre: "Nu México",
        logo: "/images/logos/nu.png",
        tipo: "Banco Digital",
        regulador: "CNBV"
    }
];

// Reguladores
const reguladores = [
    {
        nombre: "CNBV",
        nombre_completo: "Comisión Nacional Bancaria y de Valores",
        descripcion: "Supervisa y regula a instituciones financieras",
        logo_url: "https://www.cnbv.gob.mx/Style%20Library/CNBV/images/logo-cnbv.svg"
    },
    {
        nombre: "CONDUSEF",
        nombre_completo: "Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros",
        descripcion: "Protege tus derechos como usuario financiero",
        logo_url: "https://www.condusef.gob.mx/images/logo-condusef.svg"
    },
    {
        nombre: "Banxico",
        nombre_completo: "Banco de México",
        descripcion: "Institución central que regula el sistema financiero",
        logo_url: "https://www.banxico.org.mx/PublishingImages/logo-banxico.svg"
    },
    {
        nombre: "IPAB",
        nombre_completo: "Instituto para la Protección al Ahorro Bancario",
        descripcion: "Protege tu ahorro hasta $3.4 millones de pesos",
        logo_url: "https://www.ipab.org.mx/Style%20Library/ipab/images/logo-ipab.svg"
    }
];

// Exportar todo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testimonios, estadisticas, instituciones, reguladores };
}