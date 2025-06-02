import os
import json
import numpy as np
import pandas as pd
import rasterio as rio
from rasterio.enums import Resampling
from skimage import exposure
from PIL import ImageColor

# Configuration des paramètres
lc_dir = '/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/lc.json'
lc_image_dir =               "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/MASQUE_GAUCHE.tif"
landsat_dir =  "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/IMAGE_9_BANDES/IMAGE_GAUCHE2.tif"
output_images_dir = '/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/images/'
output_lcs_dir = '/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/lcs/'
image_per_lc = 0  #Paramètre du nombre de patchs  
suffixe_compte = 1200 #Paramètre du suffixe du nom du fichier   mettre 0 ou image_per_lc
patch_size = 128

# Création des répertoires de sortie
os.makedirs(output_images_dir, exist_ok=True)
os.makedirs(output_lcs_dir, exist_ok=True)

print("Import de la légende")

# Chargement et préparation des données LC
with open(lc_dir) as f:
    lc = json.load(f)
lc_df = pd.DataFrame(lc)
lc_df["values_normalize"] = lc_df.index + 1
lc_df["palette"] = "#" + lc_df["palette"]  # Correction du format des couleurs

    
# Création des dictionnaires de mappage
dict_values = {v: k+1 for k, v in enumerate(lc_df["values"])}
dict_palette = {k+1: ImageColor.getrgb(v) for k, v in enumerate(lc_df["palette"])}  

print("Chargement et prétraitement du masque")

# Chargement et prétraitement du masque
with rio.open(lc_image_dir) as src:
    lc_image = src.read(1)
    # Utilisation d'une fonction vectorisée plus efficace
    lc_image = np.vectorize(lambda x: dict_values.get(x, 0), otypes=[np.int32])(lc_image)


# Calcul des classes présentes (en excluant 0)
uniques = np.unique(lc_image[lc_image != 0])

print(f"Classes uniques : {uniques}")

print("Création du composite")

# Chargement et prétraitement de l'image satellite
with rio.open(landsat_dir) as landsat:
    landsat_image = landsat.read()
    
    # Vérification des valeurs NaN et infinies dans l'image
    landsat_image = np.nan_to_num(landsat_image, nan=0, posinf=0, neginf=0)

    # Calcul des min et max pour chaque bande (en ignorant les NaN)
    min_vals = np.nanmin(landsat_image, axis=(1, 2))
    max_vals = np.nanmax(landsat_image, axis=(1, 2))

    # Normalisation des bandes avec les min et max calculés
    composite = np.dstack([
        exposure.rescale_intensity(landsat_image[0], in_range=(min_vals[0], max_vals[0]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[1], in_range=(min_vals[1], max_vals[1]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[2], in_range=(min_vals[2], max_vals[2]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[3], in_range=(min_vals[3], max_vals[3]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[4], in_range=(min_vals[4], max_vals[4]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[5], in_range=(min_vals[5], max_vals[5]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[6], in_range=(min_vals[6], max_vals[6]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[7], in_range=(min_vals[7], max_vals[7]), out_range=(0, 1)),
        exposure.rescale_intensity(landsat_image[8], in_range=(min_vals[8], max_vals[8]), out_range=(0, 1))    
    ])


print("Génération des coordonées des patchs")
# Génération des coordonnées des patches
coords_dict = {}
for lc_val in uniques:
    coords = np.argwhere(lc_image == lc_val)
    valid_coords = [
        c for c in coords 
        if (c[0] >= patch_size//2 
            and c[1] >= patch_size//2 
            and c[0] < lc_image.shape[0] - patch_size//2 
            and c[1] < lc_image.shape[1] - patch_size//2)
    ]
    
    if len(valid_coords) >= image_per_lc:
        # Conversion explicite en liste d'indices
        selected = np.random.choice(len(valid_coords), image_per_lc, replace=False).tolist()
        coords_dict[lc_val] = [
            (c[0]-patch_size//2, c[0]+patch_size//2, 
             c[1]-patch_size//2, c[1]+patch_size//2)
            for c in np.array(valid_coords)[selected]  # Conversion en array numpy pour l'indexation
        ]
    else:
        print(f"Classe {lc_val} : seulement {len(valid_coords)} patches disponibles")


print("Sauvegarde des patches d'image")
with rio.open(landsat_dir) as landsat:
    for lc_val, coords_list in coords_dict.items():
        for i, (min_y, max_y, min_x, max_x) in enumerate(coords_list, 1):
            image_patch = composite[min_y:max_y, min_x:max_x].transpose(2, 0, 1)
            
            with rio.open(
                os.path.join(output_images_dir, f'{lc_val}_{i+suffixe_compte}.tif'),
                'w',
                driver='COG',
                height=patch_size,
                width=patch_size,
                count=9,    #A modifier si nombre de bandes change
                dtype='float32',
                compress='LZW',
                crs=landsat.crs,
                transform=rio.windows.transform(
                    rio.windows.Window.from_slices((min_y, max_y), (min_x, max_x)),
                    landsat.transform
                )
            ) as dst:
                dst.write(image_patch)

print("Sauvegarde des patches de masque")
with rio.open(lc_image_dir) as src:
    for lc_val, coords_list in coords_dict.items():
        for i, (min_y, max_y, min_x, max_x) in enumerate(coords_list, 1):
            mask_patch = lc_image[min_y:max_y, min_x:max_x].astype(np.uint8)
            
            with rio.open(
                os.path.join(output_lcs_dir, f'{lc_val}_{i+suffixe_compte}.tif'),
                'w',
                driver='COG',
                height=patch_size,
                width=patch_size,
                count=1,
                dtype='uint8',
                compress='LZW',
                crs=src.crs,
                transform=rio.windows.transform(
                    rio.windows.Window.from_slices((min_y, max_y), (min_x, max_x)),
                    src.transform
                )
            ) as dst:
                dst.write(mask_patch, 1)
                dst.write_colormap(1, {k: tuple(v) for k, v in dict_palette.items()})
