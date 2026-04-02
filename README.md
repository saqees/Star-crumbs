# 🍪 Star Crumbs - Tienda de Galletas Artesanales

Aplicación web completa con Angular (frontend) + Node.js/Express (backend), base de datos PostgreSQL en **Neon** e imágenes en **Cloudinary**, desplegable en **Render**.

---

## 🗂️ Estructura del proyecto

```
star-crumbs/
├── backend/          ← API REST + Socket.io
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   ├── middleware/
│   └── .env.example
├── frontend/         ← Angular 17 standalone
│   └── src/app/
│       ├── core/     ← Services, guards, models
│       └── features/ ← Pages & components
├── database.sql      ← Script para Neon
└── render.yaml       ← Config para Render
```

---

## 🚀 Pasos de despliegue

### 1. Base de datos en Neon
1. Ve a [console.neon.tech](https://console.neon.tech)
2. Crea un nuevo proyecto → "star-crumbs"
3. Abre el **SQL Editor**
4. Copia y pega el contenido de `database.sql` y ejecútalo
5. Copia tu `DATABASE_URL` de la sección "Connection string"

### 2. Imágenes en Cloudinary
1. Regístrate en [cloudinary.com](https://cloudinary.com) (cuenta gratis)
2. Ve a **Dashboard** y copia:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

### 3. Subir a GitHub
```bash
git init
git add .
git commit -m "Initial commit - Star Crumbs"
git remote add origin https://github.com/TU_USUARIO/star-crumbs.git
git push -u origin main
```

### 4. Desplegar en Render
1. Ve a [render.com](https://render.com)
2. **New → Web Service** → conecta tu repo de GitHub
3. Configuración:
   - **Root Directory**: `backend`
   - **Build Command**:
     ```
     npm install && cd ../frontend && npm install && npm run build -- --configuration=production && mkdir -p ../backend/public && cp -r dist/star-crumbs/* ../backend/public/
     ```
   - **Start Command**: `node server.js`
   - **Environment**: `Node`
4. Agrega las **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu string de Neon |
| `JWT_SECRET` | Un string aleatorio largo |
| `JWT_EXPIRES_IN` | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Tu cloud name |
| `CLOUDINARY_API_KEY` | Tu API key |
| `CLOUDINARY_API_SECRET` | Tu API secret |
| `CORS_ORIGIN` | URL de tu app en Render |
| `NODE_ENV` | `production` |

5. Click **Create Web Service** → ¡listo!

---

## 🔑 Credenciales de admin por defecto

```
Email:    admin@starcrumbs.com
Password: Admin123!
```

> ⚠️ Cambia la contraseña en producción usando el endpoint `/api/auth/login` y actualizando en la base de datos.

---

## 💻 Desarrollo local

### Backend
```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales
npm install
node server.js
# Corre en http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
# Verifica src/environments/environment.ts tiene apiUrl: 'http://localhost:3000/api'
npx ng serve
# Corre en http://localhost:4200
```

---

## ✨ Funcionalidades

### Para usuarios
- 🛍️ Carrito de compras (agregar, aumentar, disminuir, eliminar)
- 💳 Checkout con múltiples métodos de pago (Tarjeta, Nequi, Contra entrega)
- 🔍 Búsqueda y filtros de productos por categoría
- ⭐ Reseñas y calificaciones de productos
- 🔔 Campana de novedades (notificaciones del admin)
- 💬 Chat en tiempo real con el admin (estilo Messenger)
- 👤 Perfil editable con foto de perfil (Cloudinary)
- 📱 WhatsApp directo para pedidos por encargo

### Para admin
- 📦 CRUD completo de productos (con imágenes en Cloudinary)
- 🏷️ Gestión de categorías
- 📋 Gestión de pedidos con cambio de estado
- 👥 Lista de usuarios registrados
- 🔔 Publicar novedades (con imagen opcional)
- 💬 Chat con todos los usuarios en tiempo real

### Diseño
- 🎨 Paleta: Creamy Latte, Warm Capuchino, Caramel, Mocca Bean, Almond
- 🔄 Carrusel automático en hero
- 📱 Responsive para móvil y escritorio
- ✨ Animaciones suaves y transiciones
- 🍪 Border redondeados en tarjetas de productos

---

## 🔌 API Endpoints principales

```
POST /api/auth/register     → Registrar usuario
POST /api/auth/login        → Login
GET  /api/auth/me           → Perfil actual

GET  /api/products          → Listar productos (con filtros)
POST /api/products          → Crear producto (admin)
PUT  /api/products/:id      → Editar producto (admin)
DELETE /api/products/:id    → Eliminar producto (admin)

GET  /api/cart              → Ver carrito
POST /api/cart              → Agregar al carrito
PUT  /api/cart/:id          → Actualizar cantidad
DELETE /api/cart/:id        → Eliminar item

POST /api/orders            → Crear pedido
GET  /api/orders            → Ver pedidos

GET  /api/notifications     → Ver novedades
POST /api/notifications     → Crear novedad (admin)

GET  /api/chat/history/:id  → Historial chat
POST /api/chat              → Guardar mensaje
GET  /api/chat/admin-id     → ID del admin

POST /api/upload            → Subir imagen a Cloudinary
```
