# Arquitectura del Sistema: Web de Impresiones 3D

Este documento detalla la arquitectura propuesta para la aplicación web de gestión de impresiones 3D. Se ha creado la carpeta principal del proyecto (`Impresiones 3D`) en la ruta especificada.

## ⚠️ User Review Required

Por favor, revisa la arquitectura propuesta, la estructura de carpetas y las 3 decisiones técnicas clave. Si estás de acuerdo con este enfoque, aprobaré el plan y procederemos a inicializar los proyectos (Next.js y FastAPI) dentro de la carpeta creada.

## ❓ Open Questions

> [!IMPORTANT]
> Mencionaste **"lgraphify para la estructura del proyecto"**. ¿Te referías a **Lerna** (para monorepos), **GraphQL** (para la API), o alguna otra herramienta específica? En este plan he asumido una estructura de monorepo estándar separando frontend y backend, pero me gustaría confirmar tu intención con esta herramienta antes de generar el código.

---

## 1. Separación de Responsabilidades (Frontend y Backend)

Dado el stack que has elegido, la mejor forma de abordar este proyecto es separar claramente las responsabilidades entre el frontend y el backend, utilizando **Firebase** de forma estratégica.

### Frontend (Next.js, TypeScript, Tailwind CSS, Three.js)
* **Responsabilidad:** Interfaz de usuario, renderizado de modelos 3D, gestión del estado del cliente, autenticación de usuarios y visualización de datos.
* **Interacción:** Consumirá la API de FastAPI para operaciones complejas (reportes, Google Sheets, cálculos pesados de costos) y se conectará directamente a Firebase (Firestore/Auth) para lecturas rápidas de catálogos y autenticación.
* **Three.js:** Se utilizará para visualizar los modelos 3D en el catálogo o cuando un cliente solicite una cotización y suba un archivo STL/OBJ.
* **PDFs en cliente:** Se añade `jspdf` para generar el PDF de cotización desde el panel administrativo y permitir su descarga inmediata.

### Backend (Python, FastAPI, Uvicorn)
* **Responsabilidad:** Lógica de negocio compleja, integración con APIs externas (Google Sheets API), generación de reportes quincenales, cálculos de costos precisos y control transaccional del inventario.
* **Por qué es necesario:** Aunque Firebase puede hacer mucho, generar respaldos automáticos en Google Sheets, procesar reportes quincenales y manejar lógica de cotizaciones segura (sin exponer márgenes de ganancia en el frontend) requiere un entorno backend controlado. FastApi es rápido, tipado y se integra perfectamente con las librerías de datos de Python.

### Base de Datos (Firebase Firestore & Storage)
* **Firestore:** Almacenará usuarios, catálogo de productos, inventario, registros de costos y cotizaciones.
* **Storage:** Almacenará las imágenes de los productos y los modelos 3D (.stl, .obj, .gltf) subidos por los clientes para cotizar.

---

## 2. Estructura de Carpetas (Type-Based Structure)

Has solicitado una estructura basada en tipos (*Type-based structure*), donde los archivos se agrupan por su rol funcional (componentes, servicios, modelos, rutas) en lugar de por dominio de negocio. Aquí tienes la propuesta para el monorepo dentro de tu carpeta `Impresiones 3D`:

```text
Impresiones 3D/
│
├── frontend/                     # Aplicación Next.js
│   ├── src/
│   │   ├── components/           # Componentes UI reutilizables (Botones, Tarjetas, Three.js Canvas)
│   │   ├── pages/                # (o `app/` si usas App Router) Rutas de la aplicación
│   │   ├── hooks/                # Custom React hooks (ej. useAuth, useInventory)
│   │   ├── services/             # Funciones para llamar a FastAPI y Firebase
│   │   ├── types/                # Interfaces y tipos globales de TypeScript
│   │   ├── utils/                # Funciones de ayuda (formateadores, validadores)
│   │   ├── context/              # Contextos globales de React (Estado del carrito, Auth)
│   │   └── styles/               # Archivos CSS globales (Tailwind)
│   │
│   ├── public/                   # Assets estáticos y modelos 3D predeterminados
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                      # Aplicación FastAPI
│   ├── app/
│   │   ├── api/                  # Controladores y rutas (endpoints)
│   │   ├── core/                 # Configuraciones, variables de entorno, seguridad
│   │   ├── models/               # Modelos de datos (Pydantic models)
│   │   ├── services/             # Lógica de negocio (Cálculo de costos, lógica de Google Sheets)
│   │   ├── utils/                # Funciones de utilidad (Generación de PDFs, parseo de fechas)
│   │   └── main.py               # Punto de entrada de FastAPI
│   │
│   ├── requirements.txt          # Dependencias de Python
│   └── .env                      # Credenciales y secrets
│
└── .gitignore                    # Ignorar node_modules, __pycache__, etc.
```

---

## 3. Decisiones Técnicas Clave (Top 3)

### Decisión 1: Estrategia de Acceso a Datos (Híbrida Firebase + FastAPI)
* **Decisión:** El Frontend accederá directamente a Firebase (Firestore) para lecturas públicas (Catálogo) y Autenticación, aprovechando la velocidad y el tiempo real de Firebase. Sin embargo, para **escrituras críticas** (crear cotizaciones, actualizar inventario, generar reportes de pago), el Frontend enviará las peticiones al **Backend de FastAPI**, y será FastAPI quien valide la información y escriba en Firebase y en Google Sheets simultáneamente.
* **Por qué:** Garantiza la seguridad de los datos, previene manipulación en el cliente y centraliza la lógica compleja (como calcular cuánto material gasta una pieza) en el servidor.

### Decisión 2: Patrón de Exportación a Google Sheets (Background Tasks)
* **Decisión:** Utilizar los `BackgroundTasks` de FastAPI (o Celery si escala mucho) para la generación de respaldos y reportes quincenales en Google Sheets.
* **Por qué:** Conectar y escribir en la API de Google Sheets puede ser lento (varios segundos). Si se hace de forma síncrona, el usuario experimentará lentitud en la web. Al delegarlo a una tarea en segundo plano, la web responde instantáneamente de que "la cotización fue guardada", mientras el servidor hace el respaldo asincrónicamente.

### Decisión 3: Renderizado 3D (React Three Fiber)
* **Decisión:** En lugar de usar Three.js vanilla directamente, usaremos **`@react-three/fiber`** y **`@react-three/drei`**.
* **Por qué:** Son envolturas declarativas de Three.js para React. Te permitirán renderizar los modelos `.stl` o `.gltf` de tus impresiones como si fueran componentes de React, manejando la cámara, las luces y los controles orbitales con mucha menos cantidad de código y mejor integración con el ciclo de vida de Next.js.

---

## Plan de Ejecución
1. Inicializar el entorno de desarrollo (Next.js en `/frontend` y FastAPI en `/backend`).
2. Configurar Firebase y conectar el Frontend.
3. Crear la estructura base y los componentes principales del UI usando Tailwind.
4. Desarrollar la visualización 3D para el catálogo.
5. Desarrollar los endpoints de FastAPI y la integración con Google Sheets.
6. Probar el flujo completo de cotización -> inventario -> reporte en Google Sheets.

---

## 4. Diseño de Autenticación, Roles y Flujo Git (Backend)

### Requerimientos de Usuario y Registro
*   **Roles Disponibles:**
    *   `administrador`: Control total del sistema, puede cambiar roles de otros usuarios.
    *   `colaborador`: Imprime piezas, registra horas/trabajos e inventario, genera reportes quincenales de pagos.
    *   `cliente`: Sube piezas, cotiza modelos y realiza pedidos.
*   **Autenticación Soportada:**
    *   Correo electrónico y contraseña.
    *   Google Authentication (Google Sign-In).
*   **Reglas de Registro:**
    *   Todo registro público por defecto asigna el rol de `cliente`.
    *   Únicamente las cuentas con rol `administrador` pueden modificar o asignar roles.
    *   Se inicializarán **2 cuentas fijas de administrador** preconfiguradas para poder gestionar los roles del sistema desde el principio.
*   **Datos de Registro Solicitados:**
    *   `nombre`: Nombre completo.
    *   `cedula`: Cédula de identidad nacional.
    *   `rol`: Rol asignado en el sistema (por defecto `cliente`).
    *   `edad`: Edad del usuario.
    *   `fecha_nacimiento`: Fecha de nacimiento.
    *   `telefono`: Número telefónico.
    *   `password`: Contraseña y validación de contraseña.

### Flujo de Git para el Desarrollo

Para mantener el proyecto organizado de manera estructurada:
1.  Todo el desarrollo del backend se realizará en la rama **`backend`** y luego se hará merge a **`main`**.
2.  Todo el desarrollo del frontend se realizará en la rama **`frontend`** y luego se hará merge a **`main`**.
3.  Los commits siempre deben seguir la siguiente estructura:
    `<palabra_reservada> (<rama_afectada>) <descripción_de_los_ajustes_o_implementaciones_mencionando_los_archivos_modificados>`
    *   *Palabras reservadas:* `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.
    *   *Ejemplo:* `feat (frontend) agregar campo de foto y visualizador de referencia en cotizar/page.tsx y admin/page.tsx`

#### Convención de Mensajes de Commit
Todos los commits del proyecto deberán seguir estrictamente la siguiente estructura:
```text
<palabra_reservada>(<rama_afectada>): <descripción_de_los_ajustes_o_implementaciones_mencionando_los_archivos_modificados>
```
* **Palabras reservadas:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
* **Rama afectada:** `backend`, `frontend` o `main`.
* **Ejemplos:**
  * `feat(backend): agregar endpoint /users en auth.py`
  * `fix(frontend): corregir alineación del layout en page.tsx`
  * `docs(backend): actualizar plan de implementacion con reglas de commits`


