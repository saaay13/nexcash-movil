# NexCash

Aplicación móvil y web de punto de venta multiempresa, construida con Expo SDK 58, React Native y SQLite local.

## Estado del proyecto

Este repositorio se publica únicamente para revisión, presentación y evaluación académica. No se concede autorización para copiar, modificar, distribuir, publicar ni reutilizar el proyecto, total o parcialmente, sin autorización expresa y por escrito de sus autores. Consulta el archivo [LICENSE](LICENSE) y los [avisos de terceros](THIRD-PARTY-NOTICES.md).

## Características

- Registro e inicio de sesión con usuarios reales almacenados en SQLite.
- Gestión de empresas, vinculación por código y selección de negocio activo.
- Administración de categorías, productos, existencias y movimientos de inventario.
- Importación opcional de productos desde el catálogo público de DummyJSON.
- Apertura y cierre de turnos de caja, con ingresos, egresos y arqueo.
- Registro de ventas con control de existencias y caja abierta obligatoria.
- Historial de ventas, detalle de comprobantes y compartir ticket.
- Lectura de códigos de barras con la cámara para asignar SKU y agregar productos al carrito.
- Generación de un código QR por venta para consultar el comprobante y descargarlo en PDF.
- Interfaz completamente en español y compatible con Android, iOS y web.

No hay usuarios, empresas ni productos precargados. Para comenzar, registra una cuenta, crea una empresa y entra al negocio.

## Requisitos

- Node.js 22.13 o superior.
- npm.
- Expo CLI incluida en el proyecto (`npx expo`).
- Una cuenta de Expo para generar el APK con EAS Build.

## Instalación y ejecución

```bash
npm install
npx expo start
```

Para abrir la versión web:

```bash
npx expo start --web
```

También está disponible el script `npm run web`.

## Cómo escanear un código de barras

1. En la pantalla **Vender**, toca **Escanear código de barras**. También puedes tocar el ícono de código de barras a la derecha del buscador cuando el campo esté vacío.
2. Acepta el permiso de cámara y apunta al código hasta que se lea automáticamente.
3. Si el producto existe, se agrega al carrito. Si no existe, toca **Registrar** y se abrirá **Nuevo producto** con el código ya cargado en **Código o SKU**.
4. En **Nuevo producto** también puedes tocar **Escanear código de barras** para llenar el SKU sin escribirlo.

Se pueden leer EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF-14 y QR. Los productos importados de DummyJSON no traen código de barras: asígnale un SKU al crearlos para poder escanearlos después. En web, abre la app desde `localhost` o HTTPS y permite el acceso a la cámara del navegador.

## Cómo crear un producto con su categoría

1. En **Categorías**, toca **Nueva** y registra las categorías que uses en tu negocio.
2. En **Productos**, toca **Nuevo**.
3. Toca **Selecciona una categoría** y elige una de la lista. Si todavía no tienes ninguna, usa **Crear nueva categoría**.
4. Completa nombre, precio y existencia, y toca **Registrar producto**.

El producto queda asociado a la categoría elegida: aparece en ese filtro y se suma al conteo de la categoría.

## Cómo generar el QR y descargar el PDF del ticket

1. Con la caja abierta, registra la venta y toca **Confirmar cobro**.
2. En el aviso de **¡Venta completada!**, toca **Generar QR**.
3. Muestra el código QR al cliente. Al escanearlo se abre el comprobante de su compra.
4. En esa página, toca **Descargar PDF**. El archivo se guarda como `Ticket-001.pdf`.
5. Si necesitas consultar la venta dentro de la app, toca **Ver detalle** en el modal del QR.

El QR lleva los datos del ticket comprimidos dentro de la propia URL; no se envía información a ningún servidor. La página del comprobante se sirve desde la carpeta `ticket/` de este repositorio mediante GitHub Pages:

`https://saaay13.github.io/nexcash-movil/ticket/`

### Activar GitHub Pages

Si el enlace todavía no abre, activa Pages en el repositorio:

1. Entra a **Settings → Pages** de `https://github.com/saaay13/nexcash-movil`.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`, y guarda.
4. Espera unos instantes y vuelve a probar la URL.

Si el sitio queda publicado en otra ruta, actualiza `URL_BASE_TICKET` en `src/services/ticket.js` con la URL real. El enlace funciona con conexión a internet; las librerías del visor y del PDF se cargan desde CDN.

## Verificación

Antes de entregar cualquier cambio se recomienda ejecutar:

```bash
npx eslint .
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Generación del APK

El archivo `eas.json` incluye un perfil `apk` preparado para distribución interna.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile apk
```

Cuando el proceso termine, descarga el APK desde el enlace que muestra EAS o desde el panel de compilaciones de tu cuenta de Expo. El paquete Android configurado es `com.saaay13.nexcash`. En esta entrega no se incluye un APK compilado; genéralo con estas instrucciones cuando tengas una cuenta de Expo.

## Estructura principal

- `App.js`: punto de entrada y navegación.
- `src/components/`: componentes atómicos, moleculares, organismos y plantillas.
- `src/screens/`: pantallas de la aplicación.
- `src/database/`: esquema, conexión y operaciones SQLite.
- `src/context/`: estado global de sesión.
- `src/services/`: consumo de la API pública de DummyJSON.
- `src/theme/`: colores y estilos compartidos.
- `assets/`: iconos e imagen de marca referenciados por `app.json`.
