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
3. La cámara **permanece abierta**: sigue apuntando al siguiente producto sin volver a tocar el botón. Aparece un aviso tipo **"Crema dental +1"** y un contador de productos escaneados.
4. Si el código no existe, el aviso muestra **Registrar**: se abre **Nuevo producto** con el código ya cargado y el carrito se conserva.
5. Cuando termines, toca **Terminar escaneo** y después **Confirmar cobro**.
6. En **Nuevo producto** también puedes tocar **Escanear código de barras** para llenar el SKU sin escribirlo. Esa lectura es única: la cámara se cierra al leer.

Al terminar el escaneo se limpia el buscador y los productos escaneados aparecen **primero en la lista**, con una insignia **Escaneado**, para que no tengas que buscarlos uno por uno.

El escaneo agrega **una sola unidad por producto**. Si vuelves a escanear un producto que ya está en el carrito, aparece el aviso **“Ya está en el carrito”** y no se suma otra unidad. Para llevar dos o más del mismo producto, usa el botón **+** del contador en la lista manual. El modo manual (buscador y botones + / −) sigue disponible como respaldo.

Además, se ignora el mismo código durante 1,5 segundos mientras lo mantienes enfrente, para evitar lecturas repetidas del mismo instante.

Se pueden leer EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF-14 y QR. Los productos importados de DummyJSON no traen código de barras: asígnale un SKU al crearlos para poder escanearlos después. En web, abre la app desde `localhost` o HTTPS y permite el acceso a la cámara del navegador.

## Cómo crear un producto con su categoría

1. En **Categorías**, toca **Nueva** y registra las categorías que uses en tu negocio.
2. En **Productos**, toca **Nuevo**.
3. Toca **Selecciona una categoría** y elige una de la lista. Si todavía no tienes ninguna, usa **Crear nueva categoría**.
4. Completa nombre, descripción (opcional), precio, existencia y mínimo para alerta, y toca **Registrar producto**.

El producto queda asociado a la categoría elegida: aparece en ese filtro y se suma al conteo de la categoría. El mínimo para alerta es configurable por producto (por defecto 5): cuando la existencia sea menor o igual a ese número, el producto se marca como crítico.

## Cómo entregar el comprobante al cliente

1. Con la caja abierta, registra la venta y toca **Confirmar cobro**.
2. En el aviso de **¡Venta completada!**, toca **Generar QR**.
3. Muestra el QR al cliente. Al escanearlo se abre la página del comprobante y **el PDF se descarga automáticamente**. Si el navegador bloquea la descarga automática, aparece el botón **Descargar PDF** para que lo toque.
4. El PDF incluye el código QR y todos los datos en **texto plano** (producto, cantidad, precio, subtotal y total), para que no haga falta escanearlo con otra aplicación.
5. En la app, **Descargar copia local** guarda un ejemplar para el vendedor (en el celular se abre compartir/guardar; en web, el diálogo de impresión). **Ver detalle** consulta la venta dentro de NexCash.

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
