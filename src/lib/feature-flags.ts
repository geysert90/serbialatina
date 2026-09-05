// Controla si las secciones en desarrollo (Serbio, Tienda) se muestran.
// En producción por defecto NO se muestran. Para verlas en desarrollo,
// define NEXT_PUBLIC_SHOW_WIP_SECTIONS=true en el .env de desarrollo.
export const SHOW_WIP_SECTIONS =
  process.env.NEXT_PUBLIC_SHOW_WIP_SECTIONS === "true";
