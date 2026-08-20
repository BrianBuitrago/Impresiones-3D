# Modelos 3D del hero de inicio

Poné acá los archivos `.glb` que querés que roten en el modelo 3D de la página
de inicio. En cada carga de página se elige uno al azar entre los que estén
configurados en `frontend/src/components/Hero3D.tsx` (lista `AVAILABLE_MODELS`).

## Nombres esperados

Por defecto el código busca:

```
model-1.glb
model-2.glb
model-3.glb
model-4.glb
model-5.glb
```

Si un archivo no existe todavía, o falla al cargar, el sitio no se rompe:
automáticamente muestra la figura de respaldo (el "torus knot" cian/azul
que ya existía) en su lugar.

## Requisitos del archivo

- Formato `.glb` (glTF binario) — es el formato estándar que exportan Blender
  y la mayoría de programas de modelado 3D, y el que se descarga de
  marketplaces como Sketchfab.
- No hace falta preocuparse por la escala ni el centrado exacto: el código
  normaliza automáticamente el tamaño y centra cualquier modelo que cargue,
  sin importar en qué unidades se exportó.
- Verificá que tengas licencia para usar el modelo en un sitio comercial
  antes de subirlo (muchos modelos gratuitos de marketplaces son solo para
  uso personal/no comercial).

## Agregar más de 5, o cambiar los nombres

Si querés usar nombres distintos o agregar más modelos, editá el array
`AVAILABLE_MODELS` en `frontend/src/components/Hero3D.tsx` con las rutas
que corresponda (siempre empezando con `/models/...`).
