import os
import glob
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from scipy.signal.windows import hann

# Paramètres
input_folder = "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/SORTIE"
output_path = "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/SORTIE/U_NET_MASSOT_test_13_05.tif"
overlap = 30

print("\n🔍 Recherche des fichiers à fusionner...")
tif_files = sorted(glob.glob(os.path.join(input_folder, "SORTIE_IMAGE_POUR_INF_*.tif")))
print(f"  - {len(tif_files)} fichiers trouvés")

# On ouvre chaque raster pour lire ses méta-infos (sans tout charger)
rasters_info = []

for path in tif_files:
    with rasterio.open(path) as src:
        bounds = src.bounds
        transform = src.transform
        crs = src.crs
        width = src.width
        height = src.height
        dtype = src.dtypes[0]
        res_x, res_y = src.res

        rasters_info.append({
            'path': path,
            'bounds': bounds,
            'transform': transform,
            'crs': crs,
            'width': width,
            'height': height,
            'dtype': dtype,
            'res_x': res_x,
            'res_y': res_y
        })

# Calcul de l'enveloppe globale
min_x = min(r['bounds'].left for r in rasters_info)
max_x = max(r['bounds'].right for r in rasters_info)
min_y = min(r['bounds'].bottom for r in rasters_info)
max_y = max(r['bounds'].top for r in rasters_info)

res_x = rasters_info[0]['res_x']
res_y = rasters_info[0]['res_y']

width = int(np.ceil((max_x - min_x) / res_x))
height = int(np.ceil((max_y - min_y) / res_y))

transform = rasterio.transform.from_origin(min_x, max_y, res_x, res_y)

print(f"\n🧩 Fusion des rasters ({width} x {height}) avec overlap de {overlap} pixels")

# On prépare le raster de sortie
profile = {
    'driver': 'GTiff',
    'height': height,
    'width': width,
    'count': 1,
    'dtype': 'uint8',
    'crs': rasters_info[0]['crs'],
    'transform': transform,
    'compress': 'lzw'
}

# Création du fichier de sortie vide
with rasterio.open(output_path, 'w', **profile) as dst:
    merged = np.zeros((height, width), dtype=np.float32)
    weight = np.zeros((height, width), dtype=np.float32)

    for info in rasters_info:
        with rasterio.open(info['path']) as src:
            data = src.read(1).astype(np.float32)

            # Création de la fenêtre Hann uniquement sur la bordure
            h, w = data.shape
            win_y = np.ones(h)
            win_x = np.ones(w)

            if overlap > 0:
                hann_y = hann(overlap * 2)
                hann_x = hann(overlap * 2)
                win_y[:overlap] = hann_y[:overlap]
                win_y[-overlap:] = hann_y[-overlap:]
                win_x[:overlap] = hann_x[:overlap]
                win_x[-overlap:] = hann_x[-overlap:]

            window = np.outer(win_y, win_x)

            # Position du patch dans l'image finale
            offset_x = int((info['transform'].c - min_x) / res_x)
            offset_y = int((max_y - info['transform'].f) / res_y)

            # On ajoute la contribution pondérée
            merged[offset_y:offset_y+h, offset_x:offset_x+w] += data * window
            weight[offset_y:offset_y+h, offset_x:offset_x+w] += window

    print("\n⚖️  Normalisation de la fusion...")
    with np.errstate(divide='ignore', invalid='ignore'):
        merged = np.divide(merged, weight, where=weight != 0)
        merged = np.nan_to_num(merged).astype(np.uint8)

    print("\n💾 Écriture de l'image finale...")
    dst.write(merged, 1)

print("\n✅ Fusion optimisée terminée !")
