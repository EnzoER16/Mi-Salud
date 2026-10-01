🏥 MiSalud+ | Plataforma de Gestión Médica Integral
MiSalud+ es una plataforma web innovadora diseñada para agilizar la interacción entre profesionales de la salud y pacientes. Utilizando tecnología de escaneo de códigos QR, permite a los médicos acceder instantáneamente a historias clínicas, registrar nuevas consultas y recetar tratamientos, mientras que los pacientes pueden monitorear y hacer check-in de su medicación diaria en tiempo real.

🚀 Características Principales
Gestión de Roles: Perfiles diferenciados para Médicos y Pacientes.

Identidad Digital (QR): Generación automática de credencial en QR para los pacientes y escaneo por cámara para los médicos.

Historia Clínica Centralizada: Acceso rápido a grupo sanguíneo, alergias y antecedentes.

Registro de Consultas: Historial detallado de atención médica.

Gestión de Tratamientos: Recetas dinámicas que generan automáticamente tomas de pastillas según la dosis y frecuencia.

Monitoreo de Adherencia: Barra de progreso en vivo para que el paciente visualice el cumplimiento de su tratamiento.

Autenticación Segura: Login con JWT y opción de inicio de sesión con Google.

🛠️ Tecnologías Utilizadas
Frontend: React, Vite, Material UI (MUI), React Router.

Backend: Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy.

Base de Datos: MySQL.

Librerías Clave: qrcode.react (Generación), @yudiel/react-qr-scanner (Lectura).

⚙️ Requisitos Previos
Python 3.10+

Node.js v18+

Servidor MySQL ejecutándose localmente (ej: XAMPP, MySQL Workbench).

💻 Instalación y Ejecución
1. Preparar la Base de Datos
Abre tu cliente de MySQL y ejecuta este comando para crear la base de datos:
CREATE DATABASE misalud_db;

2. Configuración del Backend (API REST)
Abre una terminal en la carpeta raíz y entra a la carpeta del backend:
cd backend

Crea y activa un entorno virtual (En Windows: venv\Scripts\activate | En Mac/Linux: source venv/bin/activate). Luego, instala las dependencias:
pip install -r requirements.txt

Variables de Entorno:
Crea un archivo llamado .env dentro de la carpeta backend/ con lo siguiente:
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña_de_mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
DATABASE_NAME=misalud_db
JWT_SECRET_KEY=clave_secreta_123
CORS_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=tu_client_id_opcional

Poblar la Base de Datos (Seed):
Ejecuta el script para crear las tablas y cargar los datos de prueba:
python seed.py

Iniciar el Servidor:
python app.py
(El backend correrá en http://localhost:5000)

3. Configuración del Frontend (React)
Abre una nueva terminal, ve a la carpeta del frontend y descarga los paquetes de Node:
cd frontend
npm install

Variables de Entorno:
Crea un archivo .env en la carpeta frontend/ con lo siguiente:
VITE_GOOGLE_CLIENT_ID=tu_client_id_opcional

Iniciar la Aplicación:
npm run dev
(El frontend correrá en http://localhost:5173)

🧪 Cuentas de Prueba (Generadas por el Seed)
Médico: juan@gmail.com | Contraseña: juan

Paciente: maria@gmail.com | Contraseña: maria | DNI para escanear: 44555666

Paciente: esteban@gmail.com | Contraseña: esteban

👥 Equipo de Desarrollo
[Tu Nombre / Nombre de tu equipo]

Proyecto Académico - 2026