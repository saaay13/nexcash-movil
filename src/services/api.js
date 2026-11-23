const URL_CATALOGO =
  'https://dummyjson.com/products?limit=10&select=id,title,price,category,thumbnail';

export async function obtenerCatalogo() {
  const respuesta = await fetch(URL_CATALOGO);

  if (!respuesta.ok) {
    throw new Error(`La API respondio con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();

  return datos.products.map((producto) => ({
    id: producto.id,
    nombre: producto.title,
    categoria: producto.category,
    precio: producto.price,
    imagen: producto.thumbnail,
  }));
}
