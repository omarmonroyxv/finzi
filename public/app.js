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

function renderizarOpciones() {
    const grid = document.getElementById('opcionesGrid');
    document.getElementById('loadingOpciones').classList.add('hidden');
    
    console.log('Renderizando', opcionesInversion.length, 'opciones');
    
    grid.innerHTML = opcionesInversion.map(opcion => `
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
                    <span class="font-semibold capitalize">${opcion.nivel_riesgo.replace('_', ' ')}</span>
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
    
    // Agregar event listeners a los botones de invertir
    document.querySelectorAll('.btn-invertir').forEach(btn => {
        btn.addEventListener('click', function() {
            const opcionId = this.getAttribute('data-opcion-id');
            abrirEnlaceInversion(opcionId);
        });
    });
}

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
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Finzi cargado');
    
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
    
    // Cargar opciones al inicio
    cargarOpciones();
});