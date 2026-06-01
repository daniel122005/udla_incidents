# UDLA Incidents

Proyecto web para reportar incidentes dentro de la Universidad de la Amazonia.

La aplicación permite registrar usuarios, iniciar sesión, crear reportes de incidentes con descripción, imagen, ubicación y estado. También permite consultar los reportes, filtrarlos por estado, revisar estadísticas y gestionarlos desde un panel administrador.

## Cómo correr el proyecto

1. Instalar las dependencias:

```bash
npm install
```

2. Ejecutar el proyecto dentro de la carpeta udla-incidents:

```bash
npm run dev
```

3. Abrir en el navegador:

```bash
http://localhost:5173/
```

## Cómo probarlo

1. Registrarse con un correo y contraseña.
2. Iniciar sesión.
3. Crear un nuevo reporte de incidente.
4. Agregar tipo, descripción, imagen y ubicación.
5. Consultar el listado de incidentes.
6. Probar los filtros por estado.
7. Ingresar como administrador para cambiar estados y revisar estadísticas.

## Compilar para producción

```bash
npm run build
```

La carpeta generada será:

```bash
dist
```

## Nota

El proyecto ya se encuentra configurado para trabajar con Firebase y guardar los reportes de incidentes en la base de datos.
