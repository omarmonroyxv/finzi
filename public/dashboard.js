// public/dashboard.js
// JavaScript del panel de usuario

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';
let token = localStorage.getItem('finzi_token');
let perfilUsuario = null;

// Verificar autenticación
if (!token) {
    window.location.href = '/';
}

// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================

async function cargarPerfil() {
    try {
        const response = await fetch(`${API_URL}/usuario/perfil`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            perfilUsuario = data.data;
            renderizarPerfil();
        } else {
            cerrarSesion();
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

function renderizarPerfil() {
    // Navbar
    document.getElementById('nombreUsuario').textContent = perfilUsuario.nombre;
    document.getElementById('nombreUsuarioBienvenida').textContent = perfilUsuario.nombre.split(' ')[0];
    
    // Estadísticas
    document.getElementById('ahorroActual').textContent = 
        formatearMoneda(perfilUsuario.ahorro_actual || 0);
    
    document.getElementById('metaAhorro').textContent = 
        formatearMoneda(perfilUsuario.meta_ahorro || 0);
    
    document.getElementById('tipoPlan').textContent = 
        perfilUsuario.tipo_plan === 'premium' ? 'Premium ⭐' : 'Gratuito';
    
    // Progreso de meta
    if (perfilUsuario.meta_ahorro > 0) {
        const progreso = (perfilUsuario.ahorro_actual / perfilUsuario.meta_ahorro) * 100;
        document.getElementById('barraProgreso').style.width = `${Math.min(progreso, 100)}%`;
        document.getElementById('textoProgreso').textContent = `${progreso.toFixed(1)}% alcanzado`;
    }
    
    // Total de inversiones (conversiones completadas)
    document.getElementById('totalInversiones').textContent = 
        perfilUsuario.estadisticas.total_conversiones || 0;
    
    // Formulario de perfil
    document.getElementById('perfilNombre').value = perfilUsuario.nombre;
    document.getElementById('perfilEmail').value = perfilUsuario.email;
    document.getElementById('perfilTelefono').value = perfilUsuario.telefono || '';
    document.getElementById('perfilFechaNacimiento').value = perfilUsuario.fecha_nacimiento || '';
    document.getElementById('perfilAhorroActual').value = perfilUsuario.ahorro_actual || 0;
    document.getElementById('perfilToleranciaRiesgo').value = perfilUsuario.tolerancia_riesgo || 'medio';
    document.getElementById('codigoReferido').value = perfilUsuario.codigo_referido || '';
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatearMoneda(numero) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(numero);
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const icono = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : '⚠️';
    alert(`${icono} ${mensaje}`);
}

function cerrarSesion() {
    localStorage.removeItem('finzi_token');
    window.location.href = '/';
}

// ============================================
// SISTEMA DE TABS
// ============================================

function cambiarTab(tabName) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Resetear estilos de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
        btn.classList.add('text-gray-600');
    });
    
    // Mostrar contenido seleccionado
    document.getElementById(`contenido${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.remove('hidden');
    
    // Activar botón seleccionado
    const btnActivo = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    btnActivo.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
    btnActivo.classList.remove('text-gray-600');
}

// ============================================
// GESTIÓN DE METAS (REEMPLAZA LA SECCIÓN COMPLETA)
// ============================================

async function cargarMetas() {
    try {
        const response = await fetch(`${API_URL}/usuario/metas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error cargando metas:', data.message);
            return;
        }
        
        const metas = data.data || [];
        const listaMetas = document.getElementById('listaMetas');
        
        if (metas.length === 0) {
            listaMetas.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <p class="text-lg mb-2">No tienes metas aún</p>
                    <p class="text-sm">Crea tu primera meta de ahorro para empezar</p>
                </div>
            `;
        } else {
            listaMetas.innerHTML = metas.map(meta => {
                const progreso = meta.monto_objetivo > 0 
                    ? (meta.monto_actual / meta.monto_objetivo) * 100 
                    : 0;
                
                const fechaFormateada = meta.fecha_objetivo 
                    ? new Date(meta.fecha_objetivo).toLocaleDateString('es-MX', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'Sin fecha límite';
                
                return `
                    <div class="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="text-lg font-bold text-gray-800">${meta.nombre}</h4>
                                <p class="text-sm text-gray-600">Meta: ${formatearMoneda(meta.monto_objetivo)}</p>
                                ${meta.descripcion ? `<p class="text-xs text-gray-500 mt-1">${meta.descripcion}</p>` : ''}
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-2xl">${meta.completada ? '✅' : '🎯'}</span>
                                <button onclick="eliminarMeta(${meta.id})" 
                                    class="text-red-500 hover:text-red-700 text-sm"
                                    title="Eliminar meta">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div class="bg-purple-600 h-3 rounded-full transition-all" 
                                 style="width: ${Math.min(progreso, 100)}%"></div>
                        </div>
                        <div class="flex justify-between text-sm text-gray-600 mb-3">
                            <span>${formatearMoneda(meta.monto_actual || 0)} ahorrado</span>
                            <span>${progreso.toFixed(1)}%</span>
                        </div>
                        <div class="flex justify-between items-center text-xs text-gray-500">
                            <span>📅 ${fechaFormateada}</span>
                            ${meta.aporte_mensual > 0 ? `<span>💰 ${formatearMoneda(meta.aporte_mensual)}/mes</span>` : ''}
                        </div>
                        ${!meta.completada ? `
                            <button onclick="abrirModalActualizarMeta(${meta.id}, ${meta.monto_actual || 0}, ${meta.monto_objetivo})" 
                                class="mt-3 w-full bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-semibold hover:bg-purple-200 transition">
                                Actualizar Progreso
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error cargando metas:', error);
        mostrarNotificacion('Error al cargar metas', 'error');
    }
}

function abrirModalNuevaMeta() {
    document.getElementById('modalNuevaMeta').classList.remove('hidden');
    // Limpiar formulario
    document.getElementById('formNuevaMeta').reset();
    // Establecer fecha mínima en hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('metaFecha').min = hoy;
}

function cerrarModalNuevaMeta() {
    document.getElementById('modalNuevaMeta').classList.add('hidden');
}

async function crearMeta(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('metaNombre').value.trim();
    const monto = parseFloat(document.getElementById('metaMonto').value);
    const fecha = document.getElementById('metaFecha').value;
    const aporte = parseFloat(document.getElementById('metaAporteMensual').value) || 0;
    
    // Validaciones
    if (!nombre || !monto || monto <= 0) {
        mostrarNotificacion('Por favor completa los campos requeridos correctamente', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuario/metas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre,
                monto_objetivo: monto,
                fecha_objetivo: fecha || null,
                aporte_mensual: aporte
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Meta creada exitosamente! 🎉');
            cerrarModalNuevaMeta();
            cargarMetas();
        } else {
            mostrarNotificacion(data.message || 'Error al crear meta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al crear meta', 'error');
    }
}

async function eliminarMeta(metaId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta meta?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuario/metas/${metaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Meta eliminada correctamente');
            cargarMetas();
        } else {
            mostrarNotificacion(data.message || 'Error al eliminar meta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar meta', 'error');
    }
}

function abrirModalActualizarMeta(metaId, montoActual, montoObjetivo) {
    const nuevoMonto = prompt(
        `Monto actual: ${formatearMoneda(montoActual)}\nMeta: ${formatearMoneda(montoObjetivo)}\n\n¿Cuánto has ahorrado hasta ahora?`,
        montoActual
    );
    
    if (nuevoMonto === null) return; // Usuario canceló
    
    const monto = parseFloat(nuevoMonto);
    
    if (isNaN(monto) || monto < 0) {
        mostrarNotificacion('Por favor ingresa un monto válido', 'warning');
        return;
    }
    
    actualizarMontoMeta(metaId, monto, montoObjetivo);
}

async function actualizarMontoMeta(metaId, nuevoMonto, montoObjetivo) {
    try {
        const completada = nuevoMonto >= montoObjetivo;
        
        const response = await fetch(`${API_URL}/usuario/metas/${metaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                monto_actual: nuevoMonto,
                completada: completada
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (completada) {
                mostrarNotificacion('¡Felicidades! 🎉 Has completado tu meta de ahorro');
            } else {
                mostrarNotificacion('Progreso actualizado correctamente');
            }
            cargarMetas();
            cargarPerfil(); // Actualizar estadísticas
        } else {
            mostrarNotificacion(data.message || 'Error al actualizar meta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar meta', 'error');
    }
}

// ============================================
// PERFIL
// ============================================

async function actualizarPerfil(event) {
    event.preventDefault();
    
    const datos = {
        nombre: document.getElementById('perfilNombre').value,
        telefono: document.getElementById('perfilTelefono').value,
        fecha_nacimiento: document.getElementById('perfilFechaNacimiento').value,
        ahorro_actual: parseFloat(document.getElementById('perfilAhorroActual').value),
        tolerancia_riesgo: document.getElementById('perfilToleranciaRiesgo').value
    };
    
    try {
        const response = await fetch(`${API_URL}/usuario/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Perfil actualizado correctamente');
            cargarPerfil();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar perfil', 'error');
    }
}

function copiarCodigo() {
    const codigo = document.getElementById('codigoReferido');
    codigo.select();
    document.execCommand('copy');
    mostrarNotificacion('Código copiado al portapapeles');
}

function mostrarPlanes() {
    alert('Próximamente: Planes Premium con más beneficios');
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    cargarPerfil();
    cargarMetas();
    
    document.getElementById('formNuevaMeta')?.addEventListener('submit', crearMeta);
    document.getElementById('formPerfil')?.addEventListener('submit', actualizarPerfil);
});