# PresuSoft Frontend - Documento de Especificacion Tecnica e Integracion

Este documento define la arquitectura, estructura de interfaces y el mapa de integracion con el backend para el desarrollo del Frontend de PresuSoft. No contiene elementos informales y sirve como plano estricto para la construccion de la interfaz de usuario.

---

# 1. Tecnologias y Herramientas Frontend

* Framework: React .
* Estilos: Tailwind CSS .
* Iconografia: Iconify (para carga eficiente y acceso a multiples colecciones como Material Design o Lucide).
* Peticiones HTTP: Axios o Fetch nativo.
* Tiempo Real: Socket.io-client.
* Manejo de Estado: Zustand o React Context (para la sesion y datos globales).

---

# 2. Estructura de Interfaces (Pantallas)

## 2.1 Landing Page (Home Page)

La pagina publica de presentacion del SaaS. Disenada para atraer clientes.

Secciones obligatorias:
* Hero Section: Titulo principal, propuesta de valor y boton de "Comenzar Gratis".
* Caracteristicas: Bloques destacando la generacion rapida de presupuestos, exportacion a PDF y tiempo real.
* Precios (Pricing): Tablas comparativas de los planes Free, Pro y Business (obtenidos de la base de datos).
* Footer: Enlaces legales y de contacto.

Rutas de navegacion:
* Boton "Iniciar Sesion" -> Redirige a /login
* Boton "Comenzar Gratis" -> Redirige a /register

## 2.2 Autenticacion

* Pantalla Login (/login): Formulario con email y password.
* Pantalla Registro (/register): Formulario con nombre, email, telefono y password.

## 2.3 Pagina Principal (Dashboard Privado)

El punto de entrada una vez que el usuario inicia sesion.

Estructura del Layout:
* Sidebar (Barra lateral): Menu principal con iconos (Iconify) para navegar entre modulos.
* Topbar (Barra superior): Buscador global, notificaciones en tiempo real y perfil del usuario.
* Main Content (Contenido): El area dinamica.

Widgets del Dashboard:
* Tarjetas de resumen: Total de presupuestos en estado "draft", "sent", "accepted".
* Grafico de ingresos o presupuestos aceptados.
* Lista de ultimos 5 presupuestos modificados.

## 2.4 Modulos Internos

* Clientes (/clients): Tabla de clientes, boton para agregar nuevo cliente.
* Presupuestos (/budgets): Tabla principal con filtros por estado.
* Editor de Presupuestos (/budgets/edit/:id): Interfaz compleja para agregar modulos, tareas, costos y ver calculos en tiempo real.
* Plantillas (/templates): Gestor de plantillas reutilizables.
* Configuracion (/settings): Datos de la empresa, logo y subscripciones.

---

# 3. Directrices de Diseno e Iconify

El uso de Iconify garantiza que los iconos no impacten el peso de la aplicacion inicial.

Convenciones de Iconos:
* Dashboard: iconify-icon icon="mdi:view-dashboard-outline"
* Clientes: iconify-icon icon="mdi:account-group-outline"
* Presupuestos: iconify-icon icon="mdi:file-document-outline"
* Plantillas: iconify-icon icon="mdi:text-box-multiple-outline"
* Notificaciones: iconify-icon icon="mdi:bell-outline"
* Configuracion: iconify-icon icon="mdi:cog-outline"

---

# 4. Mapa de Integracion con el Backend

El backend se ejecuta en "http://localhost:4000/api". Todas las peticiones protegidas deben incluir en los Headers: "Authorization: Bearer <token_jwt>".

## 4.1 Autenticacion
* POST /api/auth/register -> Enviar {name, email, password, phone}. Devuelve Token y datos de usuario.
* POST /api/auth/login -> Enviar {email, password}. Devuelve Token.
* GET /api/auth/profile -> Obtiene datos del usuario actual (requiere token).

## 4.2 Dashboard y Metricas (Derivados)
* GET /api/budgets -> Obtener todos los presupuestos para calcular metricas del dashboard.
* GET /api/notifications -> Listar alertas recientes en el Topbar.

## 4.3 Gestion de Clientes
* POST /api/clients -> Crea un nuevo cliente.
* GET /api/clients -> Lista los clientes para llenar selects en el formulario de presupuestos.
* PATCH /api/clients/:id -> Actualiza datos de cliente.

## 4.4 Flujo de Presupuestos (El Editor)
El flujo en el frontend requiere encadenar estos endpoints para construir el documento:

1. Crear contenedor: POST /api/budgets
2. Agregar un modulo: POST /api/budget-modules { budgetId, name, description }
3. Agregar tarea al modulo: POST /api/budget-tasks { budgetId, moduleId, name, hours, hourlyRate... }
4. Agregar costo extra: POST /api/budget-costs { budgetId, name, type, amount }
5. Calcular totales (Boton "Recalcular"): POST /api/budgets/:id/calculate -> El backend suma todo y devuelve el total con impuestos.
6. Cambiar estado: PATCH /api/budgets/:id/status { status: "sent" }

## 4.5 Exportacion de Documentos
* POST /api/exports/budget/:id/pdf -> Genera la version en PDF.
* POST /api/exports/budget/:id/excel -> Genera la version en hoja de calculo.

---

# 5. Integracion de Tiempo Real (Socket.IO)

El frontend debe conectarse al backend apenas el usuario inicie sesion.

Implementacion basica en el cliente:

const socket = io("http://localhost:4000");

// Unirse a la sala del usuario autenticado
socket.emit("join:user", userId);

// Si entra al editor de un presupuesto, unirse a la sala de ese documento
socket.emit("join:budget", budgetId);

Eventos que el Frontend debe escuchar para actualizar la UI automaticamente:
* "budget:calculated" -> Refresca la tabla de totales del editor sin recargar la pagina.
* "budget:status-changed" -> Muestra una notificacion toast si un cliente aprueba un presupuesto.
* "notification:new" -> Incrementa el contador rojo en el icono de la campana en el Topbar.
