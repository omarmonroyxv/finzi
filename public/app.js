// public/app.js
// JavaScript principal de Finzi

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';
let opcionesInversion = [];
let token = localStorage.getItem('finzi_token');

// ============================================
// FUNCIONES UTILITARIAS
// ============================================

function formatearMoneda(numero) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(numero);
}

function scrollToComparador() {
    document.getElementById('comparador').scrollIntoView({ behavior: 'smooth' });
}

function abrirModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const icono = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : '⚠️';
    alert(`${icono} ${mensaje}`);
}

// ============================================
// CARGAR OPCIONES DE INVERSIÓN
// ============================================

async function cargarOpciones() {
    try {
        console.log('Cargando opciones de inversión...');
        const response = await fetch(`${API_URL}/opciones`);
        const data = await response.json();
        
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            opcionesInversion = data.data;
            renderizarOpciones();
        }
    } catch (error) {
        console.error('Error cargando opciones:', error);
        document.getElementById('loadingOpciones').innerHTML = 
            '<p class="text-red-600">Error al cargar opciones. Verifica que el servidor esté corriendo.</p>';
    }
}

// ============================================
// VARIABLES GLOBALES
// ============================================
let opcionesFiltradas = [];

// ============================================
// RENDERIZAR TABLA COMPARATIVA
// ============================================

function renderizarOpciones() {
    opcionesFiltradas = [...opcionesInversion];
    aplicarFiltros();
    
    document.getElementById('loadingOpciones').classList.add('hidden');
    
    // Detectar si es móvil
    const esMobile = window.innerWidth < 768;
    
    if (esMobile) {
        renderizarCards();
    } else {
        renderizarTabla();
    }
}

function renderizarTabla() {
    const tbody = document.getElementById('bodyTablaComparativa');
    const tabla = document.getElementById('tablaComparativa');
    const grid = document.getElementById('opcionesGrid');
    const sinResultados = document.getElementById('sinResultados');
    
    // Mostrar tabla, ocultar grid
    tabla.classList.remove('hidden');
    grid.classList.add('hidden');
    
    if (opcionesFiltradas.length === 0) {
        tabla.classList.add('hidden');
        sinResultados.classList.remove('hidden');
        actualizarContador(0);
        return;
    }
    
    sinResultados.classList.add('hidden');
    actualizarContador(opcionesFiltradas.length);
    
    tbody.innerHTML = opcionesFiltradas.map((opcion, index) => `
        <tr class="border-b hover:bg-purple-50 transition ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
            <!-- PRODUCTO -->
            <td class="px-6 py-4">
                <div class="flex items-center">
                    ${opcion.destacado ? '<span class="text-2xl mr-2">⭐</span>' : ''}
                    <div>
                        <p class="font-bold text-gray-800">${opcion.nombre}</p>
                        <p class="text-sm text-gray-600">${opcion.institucion}</p>
                        <p class="text-xs text-gray-500 mt-1">${opcion.tipo}</p>
                    </div>
                </div>
            </td>
            
            <!-- RENDIMIENTO -->
            <td class="px-6 py-4 text-center">
                <div class="inline-block bg-gradient-to-br from-purple-500 to-purple-700 text-white px-4 py-2 rounded-lg">
                    <p class="text-2xl font-bold">${opcion.tasa_anual}%</p>
                    <p class="text-xs opacity-80">anual</p>
                </div>
            </td>
            
            <!-- INVERSIÓN MÍNIMA -->
            <td class="px-6 py-4 text-center">
                <p class="text-lg font-semibold text-gray-800">${formatearMoneda(opcion.monto_minimo)}</p>
                ${opcion.plazo_minimo_dias > 0 ? 
                    `<p class="text-xs text-gray-500 mt-1">${opcion.plazo_minimo_dias} días mínimo</p>` : 
                    '<p class="text-xs text-green-600 mt-1">Sin plazo mínimo</p>'
                }
            </td>
            
            <!-- RIESGO -->
            <td class="px-6 py-4 text-center">
                <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiesgoColor(opcion.nivel_riesgo)}">
                    ${getRiesgoTexto(opcion.nivel_riesgo)}
                </span>
            </td>
            
            <!-- LIQUIDEZ -->
            <td class="px-6 py-4 text-center">
                <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLiquidezColor(opcion.liquidez)}">
                    ${opcion.liquidez.charAt(0).toUpperCase() + opcion.liquidez.slice(1)}
                </span>
            </td>
            
            <!-- ACCIÓN -->
            <td class="px-6 py-4 text-center">
                <button 
                    data-opcion-id="${opcion.id}"
                    class="btn-invertir gradient-bg text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition whitespace-nowrap"
                >
                    Invertir →
                </button>
                <button 
                    onclick="verDetalles(${opcion.id})"
                    class="block w-full mt-2 text-purple-600 text-sm hover:text-purple-800 font-semibold"
                >
                    Ver detalles
                </button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners
    document.querySelectorAll('.btn-invertir').forEach(btn => {
        btn.addEventListener('click', function() {
            const opcionId = this.getAttribute('data-opcion-id');
            abrirEnlaceInversion(opcionId);
        });
    });
}

function renderizarCards() {
    const grid = document.getElementById('opcionesGrid');
    const tabla = document.getElementById('tablaComparativa');
    const sinResultados = document.getElementById('sinResultados');
    
    // Mostrar grid, ocultar tabla
    grid.classList.remove('hidden');
    tabla.classList.add('hidden');
    
    if (opcionesFiltradas.length === 0) {
        grid.classList.add('hidden');
        sinResultados.classList.remove('hidden');
        actualizarContador(0);
        return;
    }
    
    sinResultados.classList.add('hidden');
    actualizarContador(opcionesFiltradas.length);
    
    grid.innerHTML = opcionesFiltradas.map(opcion => `
        <div class="option-card bg-white rounded-xl p-6 shadow-lg">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-xl font-bold text-gray-800">${opcion.nombre}</h4>
                    <p class="text-sm text-gray-600">${opcion.institucion}</p>
                </div>
                ${opcion.destacado ? '<span class="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">⭐ Popular</span>' : ''}
            </div>
            
            <div class="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg p-4 mb-4">
                <p class="text-sm opacity-80">Rendimiento anual</p>
                <p class="text-3xl font-bold">${opcion.tasa_anual}%</p>
            </div>
            
            <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Inversión mínima:</span>
                    <span class="font-semibold">${formatearMoneda(opcion.monto_minimo)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Riesgo:</span>
                    <span class="font-semibold">${getRiesgoTexto(opcion.nivel_riesgo)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Liquidez:</span>
                    <span class="font-semibold capitalize">${opcion.liquidez}</span>
                </div>
            </div>
            
            <p class="text-sm text-gray-600 mb-4">${opcion.descripcion}</p>
            
            <button 
                data-opcion-id="${opcion.id}"
                class="btn-invertir w-full gradient-bg text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
                Invertir Ahora →
            </button>
        </div>
    `).join('');
    
    // Agregar event listeners
    document.querySelectorAll('.btn-invertir').forEach(btn => {
        btn.addEventListener('click', function() {
            const opcionId = this.getAttribute('data-opcion-id');
            abrirEnlaceInversion(opcionId);
        });
    });
}

// ============================================
// SISTEMA DE FILTROS
// ============================================

function aplicarFiltros() {
    const nombre = document.getElementById('filtroNombre')?.value.toLowerCase() || '';
    const montoMin = parseFloat(document.getElementById('filtroMonto')?.value) || 0;
    const riesgo = document.getElementById('filtroRiesgo')?.value || '';
    const ordenar = document.getElementById('ordenarPor')?.value || 'tasa';
    
    // Filtrar
    opcionesFiltradas = opcionesInversion.filter(opcion => {
        const cumpleNombre = !nombre || 
            opcion.nombre.toLowerCase().includes(nombre) || 
            opcion.institucion.toLowerCase().includes(nombre) ||
            opcion.tipo.toLowerCase().includes(nombre);
        
        const cumpleMonto = montoMin === 0 || opcion.monto_minimo <= montoMin;
        const cumpleRiesgo = !riesgo || opcion.nivel_riesgo === riesgo;
        
        return cumpleNombre && cumpleMonto && cumpleRiesgo;
    });
    
    // Ordenar
    if (ordenar === 'tasa') {
        opcionesFiltradas.sort((a, b) => b.tasa_anual - a.tasa_anual);
    } else if (ordenar === 'minimo') {
        opcionesFiltradas.sort((a, b) => a.monto_minimo - b.monto_minimo);
    } else if (ordenar === 'nombre') {
        opcionesFiltradas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    
    // Re-renderizar
    const esMobile = window.innerWidth < 768;
    if (esMobile) {
        renderizarCards();
    } else {
        renderizarTabla();
    }
}

function limpiarFiltros() {
    document.getElementById('filtroNombre').value = '';
    document.getElementById('filtroMonto').value = '';
    document.getElementById('filtroRiesgo').value = '';
    document.getElementById('ordenarPor').value = 'tasa';
    aplicarFiltros();
}

function actualizarContador(cantidad) {
    const span = document.querySelector('#resultadosCount span');
    if (span) {
        span.textContent = cantidad;
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getRiesgoColor(riesgo) {
    const colores = {
        'muy_bajo': 'bg-green-100 text-green-800',
        'bajo': 'bg-blue-100 text-blue-800',
        'medio': 'bg-yellow-100 text-yellow-800',
        'alto': 'bg-red-100 text-red-800'
    };
    return colores[riesgo] || 'bg-gray-100 text-gray-800';
}

function getRiesgoTexto(riesgo) {
    const textos = {
        'muy_bajo': 'Muy Bajo',
        'bajo': 'Bajo',
        'medio': 'Medio',
        'alto': 'Alto'
    };
    return textos[riesgo] || riesgo;
}

function getLiquidezColor(liquidez) {
    const colores = {
        'inmediata': 'bg-green-100 text-green-800',
        'alta': 'bg-blue-100 text-blue-800',
        'media': 'bg-yellow-100 text-yellow-800',
        'baja': 'bg-red-100 text-red-800'
    };
    return colores[liquidez] || 'bg-gray-100 text-gray-800';
}

function verDetalles(opcionId) {
    const opcion = opcionesInversion.find(o => o.id == opcionId);
    if (!opcion) return;
    
    alert(`
📊 ${opcion.nombre}
🏦 ${opcion.institucion}

💰 Rendimiento: ${opcion.tasa_anual}% anual
💵 Mínimo: ${formatearMoneda(opcion.monto_minimo)}
📊 Riesgo: ${getRiesgoTexto(opcion.nivel_riesgo)}
⚡ Liquidez: ${opcion.liquidez}

${opcion.descripcion}

💳 Comisión apertura: ${opcion.comision_apertura}%    ✅ SIN TILDE
💳 Comisión manejo: ${opcion.comision_manejo}%        ✅ SIN TILDE
    `);
}

// ============================================
// TESTIMONIOS
// ============================================

let testimoniosVisibles = 3;

function cargarTestimonios() {
    console.log('🔄 Intentando cargar testimonios...');
    
    // Verificar si testimonios-data.js está cargado
    if (typeof testimonios === 'undefined') {
        console.error('❌ testimonios-data.js NO está cargado');
        
        // Mostrar mensaje de error
        const container = document.getElementById('testimoniosContainer');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-gray-600">Error al cargar testimonios</p>
                    <p class="text-sm text-gray-500">Recarga la página</p>
                </div>
            `;
        }
        return;
    }

    console.log(`✅ testimonios-data.js cargado. Total: ${testimonios.length} testimonios`);

    const container = document.getElementById('testimoniosContainer');
    if (!container) {
        console.error('❌ No se encontró #testimoniosContainer');
        return;
    }

    // Mostrar solo los primeros 'testimoniosVisibles'
    const testimoniosAMostrar = testimonios.slice(0, testimoniosVisibles);
    console.log(`📊 Mostrando ${testimoniosAMostrar.length} testimonios`);

    if (testimoniosAMostrar.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">🔍</div>
                <p class="text-gray-600">No hay testimonios disponibles</p>
            </div>
        `;
        return;
    }

    container.innerHTML = testimoniosAMostrar.map(t => `
        <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
            <!-- Header con foto y nombre -->
            <div class="flex items-center mb-4">
                <img src="${t.foto}" 
                     alt="${t.nombre}" 
                     class="w-14 h-14 rounded-full mr-3 object-cover border-2 border-purple-200"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(t.nombre)}&background=667eea&color=fff&size=56'">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 flex items-center">
                        ${t.nombre}
                        ${t.verificado ? '<span class="ml-2 text-blue-500 text-sm" title="Usuario verificado">✓</span>' : ''}
                    </h4>
                    <p class="text-xs text-gray-500">${t.ciudad} • ${t.edad} años</p>
                </div>
            </div>

            <!-- Rating -->
            <div class="flex items-center mb-3">
                <div class="text-yellow-400">
                    ${'⭐'.repeat(t.rating)}
                </div>
                <span class="text-xs text-gray-500 ml-2">${t.fecha}</span>
            </div>

            <!-- Testimonio -->
            <p class="text-gray-700 text-sm leading-relaxed mb-4">
                "${t.testimonio}"
            </p>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <div class="bg-purple-50 p-3 rounded-lg">
                    <p class="text-xs text-gray-600 mb-1">💰 Invirtió</p>
                    <p class="font-bold text-purple-600">${formatearMoneda(t.monto_invertido)}</p>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                    <p class="text-xs text-gray-600 mb-1">📈 Ganará</p>
                    <p class="font-bold text-green-600">${formatearMoneda(t.ganancia_estimada)}</p>
                </div>
            </div>

            <!-- Opción elegida -->
            <div class="mt-3 pt-3 border-t border-gray-100">
                <p class="text-xs text-gray-600">
                    <span class="font-semibold text-purple-600">${t.opcion_elegida}</span>
                    ${t.plan_meses ? ` • Plan de ${t.plan_meses} meses` : ''}
                </p>
            </div>
        </div>
    `).join('');

    // Mostrar/ocultar botón "Ver más"
    const btnVerMas = document.getElementById('btnVerMasTestimonios');
    if (btnVerMas) {
        if (testimoniosVisibles >= testimonios.length) {
            btnVerMas.style.display = 'none';
        } else {
            btnVerMas.style.display = 'inline-block';
            btnVerMas.textContent = `Ver más testimonios (${testimonios.length - testimoniosVisibles} restantes)`;
        }
    }

    console.log('✅ Testimonios cargados correctamente');
}

function verMasTestimonios() {
    console.log('🔄 Cargando más testimonios...');
    testimoniosVisibles += 3;
    cargarTestimonios();
}

// ============================================
// EVENT LISTENERS PARA FILTROS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Finzi cargado');
    
    // Event listeners para filtros
    document.getElementById('filtroNombre')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtroMonto')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroRiesgo')?.addEventListener('change', aplicarFiltros);
    document.getElementById('ordenarPor')?.addEventListener('change', aplicarFiltros);
    
    // Responsive: cambiar vista según tamaño
    window.addEventListener('resize', () => {
        if (opcionesInversion.length > 0) {
            renderizarOpciones();
        }
    });
    
    // Cargar opciones de inversión
    cargarOpciones();
    
    // Cargar testimonios
    console.log('📋 Iniciando carga de testimonios...');
    cargarTestimonios();
    
    // Event listener para botón "Ver más testimonios"
    const btnVerMas = document.getElementById('btnVerMasTestimonios');
    if (btnVerMas) {
        btnVerMas.addEventListener('click', verMasTestimonios);
        console.log('✅ Event listener agregado al botón "Ver más"');
    } else {
        console.warn('⚠️ No se encontró #btnVerMasTestimonios');
    }
    
    // Animar contadores de estadísticas
    animarContadores();
    
    // Botón scroll al comparador
    const btnScroll = document.getElementById('btnScrollComparador');
    if (btnScroll) {
        btnScroll.addEventListener('click', scrollToComparador);
    }
    
    // Botón de REGISTRO
    const btnRegistro = document.getElementById('btnRegistro');
    if (btnRegistro) {
        btnRegistro.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!token) {
                abrirModal('modalRegistro');
            } else {
                window.location.href = '/dashboard.html';
            }
        });
    }
    
    // Botón de LOGIN
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', function() {
            abrirModal('modalLogin');
        });
    }
    
    // Botón calcular
    const btnCalcular = document.getElementById('btnCalcular');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularProyeccion);
    }
    
    // Formularios
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', registrarUsuario);
    }
    
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', iniciarSesion);
    }
    
    // Botones cerrar modales
    const btnCerrarRegistro = document.getElementById('btnCerrarRegistro');
    if (btnCerrarRegistro) {
        btnCerrarRegistro.addEventListener('click', function() {
            cerrarModal('modalRegistro');
        });
    }
    
    const btnCerrarLogin = document.getElementById('btnCerrarLogin');
    if (btnCerrarLogin) {
        btnCerrarLogin.addEventListener('click', function() {
            cerrarModal('modalLogin');
        });
    }
});

async function abrirEnlaceInversion(opcionId) {
    if (!token) {
        mostrarNotificacion('Debes iniciar sesión para invertir', 'warning');
        abrirModal('modalLogin');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tracking/click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ opcionId: parseInt(opcionId) })
        });

        const data = await response.json();
        
        if (data.success) {
            window.open(data.data.urlAfiliado, '_blank');
            mostrarNotificacion('¡Serás redirigido a la plataforma de inversión!');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al abrir el enlace', 'error');
    }
}

// ============================================
// CALCULADORA CON GRÁFICAS
// ============================================

let chartCrecimiento = null;
let chartComparacion = null;

async function calcularProyeccion() {
    console.log('Calculando proyección con gráficas...');
    
    const montoInicial = parseFloat(document.getElementById('inputMontoInicial').value);
    const aportesMensuales = parseFloat(document.getElementById('inputAportesMensuales').value) || 0;
    const tasaAnual = parseFloat(document.getElementById('inputTasa').value);
    const meses = parseInt(document.getElementById('inputMeses').value);

    if (!montoInicial || !tasaAnual || !meses) {
        mostrarNotificacion('Por favor completa todos los campos', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/calcular/proyeccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                montoInicial, 
                aportesMensuales, 
                tasaAnual, 
                meses 
            })
        });

        const data = await response.json();
        console.log('Resultado cálculo:', data);
        
        if (data.success) {
            const resultado = data.data;
            
            // Actualizar tarjetas de resumen
            document.getElementById('resultTotalAportado').textContent = 
                formatearMoneda(resultado.totalAportado);
            document.getElementById('resultGanancias').textContent = 
                formatearMoneda(resultado.totalIntereses);
            document.getElementById('resultMontoFinal').textContent = 
                formatearMoneda(resultado.montoFinal);
            
            // Mostrar sección de resultados
            document.getElementById('resultadosProyeccion').classList.remove('hidden');
            
            // Crear gráficas
            crearGraficaCrecimiento(resultado.proyeccionMensual, montoInicial);
            crearGraficaComparacion(montoInicial, aportesMensuales, meses, tasaAnual);
            
            // Scroll suave a resultados
            setTimeout(() => {
                document.getElementById('resultadosProyeccion').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 100);
            
            mostrarNotificacion('¡Proyección calculada con éxito!', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al calcular. Verifica que el servidor esté corriendo.', 'error');
    }
}

// ============================================
// FUNCIÓN: CREAR GRÁFICA DE CRECIMIENTO
// ============================================

function crearGraficaCrecimiento(proyeccionMensual, montoInicial) {
    const ctx = document.getElementById('graficarCrecimiento');
    
    // Destruir gráfica anterior si existe
    if (chartCrecimiento) {
        chartCrecimiento.destroy();
    }
    
    // Preparar datos
    const labels = proyeccionMensual.map(p => `Mes ${p.mes}`);
    const saldos = proyeccionMensual.map(p => p.saldo);
    const aportes = [montoInicial];
    let acumuladoAportes = montoInicial;
    
    proyeccionMensual.forEach(p => {
        acumuladoAportes += p.aporteMes;
        aportes.push(acumuladoAportes);
    });
    aportes.pop(); // Quitar el último porque ya está en el array
    
    // Crear gráfica
    chartCrecimiento = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Saldo Total',
                    data: saldos,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Solo Aportes (sin intereses)',
                    data: aportes,
                    borderColor: 'rgb(156, 163, 175)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        family: 'Inter'
                    },
                    bodyFont: {
                        size: 13,
                        family: 'Inter'
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatearMoneda(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-MX');
                        },
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// FUNCIÓN: COMPARAR ESCENARIOS
// ============================================

function crearGraficaComparacion(montoInicial, aportesMensuales, meses, tasaBase) {
    const ctx = document.getElementById('graficaComparacion');
    
    // Destruir gráfica anterior si existe
    if (chartComparacion) {
        chartComparacion.destroy();
    }
    
    // Calcular escenarios: conservador, base, optimista
    const escenarios = [
        { nombre: 'Conservador', tasa: tasaBase - 5, color: 'rgb(239, 68, 68)' },
        { nombre: 'Esperado', tasa: tasaBase, color: 'rgb(102, 126, 234)' },
        { nombre: 'Optimista', tasa: tasaBase + 5, color: 'rgb(34, 197, 94)' }
    ];
    
    const labels = [];
    for (let i = 0; i <= meses; i++) {
        labels.push(`Mes ${i}`);
    }
    
    const datasets = escenarios.map(escenario => {
        const tasaMensual = escenario.tasa / 100 / 12;
        const datos = [montoInicial];
        let saldo = montoInicial;
        
        for (let mes = 1; mes <= meses; mes++) {
            const interesesMes = saldo * tasaMensual;
            saldo += interesesMes + aportesMensuales;
            datos.push(saldo);
        }
        
        return {
            label: `${escenario.nombre} (${escenario.tasa}%)`,
            data: datos,
            borderColor: escenario.color,
            backgroundColor: escenario.color + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6
        };
    });
    
    // Crear gráfica
    chartComparacion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        family: 'Inter'
                    },
                    bodyFont: {
                        size: 13,
                        family: 'Inter'
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatearMoneda(context.parsed.y);
                            return label;
                        },
                        afterBody: function(context) {
                            if (context[0].dataIndex === meses) {
                                const valorFinal = context[0].parsed.y;
                                const totalAportado = montoInicial + (aportesMensuales * meses);
                                const ganancia = valorFinal - totalAportado;
                                return [
                                    '',
                                    `Total aportado: ${formatearMoneda(totalAportado)}`,
                                    `Ganancia: ${formatearMoneda(ganancia)}`
                                ];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-MX');
                        },
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 13,
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// AUTENTICACIÓN
// ============================================

async function registrarUsuario(event) {
    event.preventDefault();
    console.log('Registrando usuario...');
    
    const nombre = document.getElementById('regNombre').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();
        console.log('Respuesta registro:', data);
        
        if (data.success) {
            token = data.data.token;
            localStorage.setItem('finzi_token', token);
            mostrarNotificacion('¡Registro exitoso! Bienvenido a Finzi 🎉');
            cerrarModal('modalRegistro');
            actualizarNavbar(data.data.nombre);
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al registrarse', 'error');
    }
}

async function iniciarSesion(event) {
    event.preventDefault();
    console.log('Iniciando sesión...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Respuesta login:', data);
        
        if (data.success) {
            token = data.data.token;
            localStorage.setItem('finzi_token', token);
            mostrarNotificacion('¡Bienvenido de nuevo!');
            cerrarModal('modalLogin');
            actualizarNavbar(data.data.nombre);
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al iniciar sesión', 'error');
    }
}

function actualizarNavbar(nombre) {
    // Redirigir al dashboard
    window.location.href = '/dashboard.html';
}

// ============================================
// ANIMACIÓN DE CONTADORES
// ============================================

function animarContadores() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseFloat(element.getAttribute('data-target'));
                animateCounter(element, target);
                observer.unobserve(element);
            }
        });
    });

    document.querySelectorAll('[data-target]').forEach(el => {
        observer.observe(el);
    });
}

function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.floor(target).toLocaleString('es-MX');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString('es-MX');
        }
    }, 16);
}