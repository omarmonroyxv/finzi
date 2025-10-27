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
// GESTIÓN DE METAS
// ============================================

async function cargarMetas() {
    // Por ahora simularemos, pero deberías agregar un endpoint en el backend
    const metas = []; // Aquí irían las metas desde la API
    
    const listaMetas = document.getElementById('listaMetas');
    
    if (metas.length === 0) {
        listaMetas.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p class="text-lg mb-2">No tienes metas aún</p>
                <p class="text-sm">Crea tu primera meta de ahorro para empezar</p>
            </div>
        `;
    } else {
        listaMetas.innerHTML = metas.map(meta => `
            <div class="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-lg font-bold text-gray-800">${meta.nombre}</h4>
                        <p class="text-sm text-gray-600">Meta: ${formatearMoneda(meta.monto_objetivo)}</p>
                    </div>
                    <span class="text-2xl">${meta.completada ? '✅' : '🎯'}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div class="bg-purple-600 h-3 rounded-full" style="width: ${(meta.monto_actual / meta.monto_objetivo) * 100}%"></div>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                    <span>${formatearMoneda(meta.monto_actual)} ahorrado</span>
                    <span>${meta.fecha_objetivo}</span>
                </div>
            </div>
        `).join('');
    }
}

function abrirModalNuevaMeta() {
    document.getElementById('modalNuevaMeta').classList.remove('hidden');
}

function cerrarModalNuevaMeta() {
    document.getElementById('modalNuevaMeta').classList.add('hidden');
}

async function crearMeta(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('metaNombre').value;
    const monto = parseFloat(document.getElementById('metaMonto').value);
    const fecha = document.getElementById('metaFecha').value;
    const aporte = parseFloat(document.getElementById('metaAporteMensual').value) || 0;
    
    // Aquí harías la llamada a la API para crear la meta
    mostrarNotificacion('Meta creada exitosamente! 🎉');
    cerrarModalNuevaMeta();
    cargarMetas();
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