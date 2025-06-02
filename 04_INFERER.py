#!/usr/bin/env python3
import os
import json
import glob

# Bibliothèques de manipulation de données
import pandas as pd
import numpy as np

# Bibliothèques de visualisation (utilisées pour la colormap)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import ListedColormap
from PIL import ImageColor

# Bibliothèques de machine learning
import tensorflow as tf
from tensorflow.keras.models import load_model

# Bibliothèques pour le traitement d'images et de données géospatiales
import rasterio
from rasterio.enums import Resampling
from skimage.exposure import rescale_intensity

# --- Cellule 2 : Chargement des paramètres de Land Cover et création de la colormap ---
lc_dir = '/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/lc.json'

# Load Land Cover Parameter
lc = json.load(open(lc_dir))
lc_df = pd.DataFrame(lc)
lc_df["values_normalize"] = lc_df.index + 1
lc_df["palette"] = "#" + lc_df["palette"]

# Mapping from old to new values
values = lc_df["values"].to_list()
values_norm = lc_df["values_normalize"].to_list()
palette = lc_df["palette"].to_list()
labels = lc_df["label"].to_list()
dict_values = {}
dict_label = {}
dict_palette = {}
dict_palette_hex = {}
for x in range(len(values)):
    dict_values[values[x]] = values_norm[x]
    dict_label[values_norm[x]] = labels[x]
    dict_palette[values_norm[x]] = ImageColor.getrgb(palette[x])
    dict_palette_hex[values_norm[x]] = palette[x]

# Create colormap from values and palette
cmap = ListedColormap(palette)

# --- Chargement du modèle ---
model_path = "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/MODEL_UNET_test_13_05_bis.keras"
model = load_model(model_path)

# --- Création des dossiers de sortie ---
predicted_output_dir = "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/SORTIE"
if not os.path.exists(predicted_output_dir):
    os.makedirs(predicted_output_dir)

patch_output_dir = "/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/patch_proba"
if not os.path.exists(patch_output_dir):
    os.makedirs(patch_output_dir)

# --- Définition de fonctions communes ---

overlap = 64
def extract_patches_with_overlap(image, patch_size=(128, 128), overlap=overlap):
    patches = []
    positions = []
    step = patch_size[0] - overlap
    for i in range(0, image.shape[0] - patch_size[0] + 1, step):
        for j in range(0, image.shape[1] - patch_size[1] + 1, step):
            patch = image[i:i + patch_size[0], j:j + patch_size[1], :]
            patches.append(patch)
            positions.append((i, j))
    return np.array(patches), positions


def create_weight_mask(patch_size):
    y = np.hanning(patch_size[0])
    x = np.hanning(patch_size[1])
    return np.outer(y, x)

# --- Boucle d'inférence ---
input_folder = '/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/IMAGE_INFERENCE'
tif_files = sorted(glob.glob(os.path.join(input_folder, "*.tif")))

n_classes = model.output_shape[-1]
patch_size = (128, 128)
weight_mask = create_weight_mask(patch_size)

for idx, tif_path in enumerate(tif_files, start=1):
    print(f"\nTraitement de l'image {idx}: {tif_path}")
    with rasterio.open(tif_path) as source:
        landsat_image = source.read().astype(np.float32)
        print("Vérification de NaN:", np.isnan(landsat_image).any())

        # Rescale bands
        min_values = [np.nanmin(b) for b in landsat_image]
        max_values = [np.nanmax(b) for b in landsat_image]
        rescaled = [rescale_intensity(b, in_range=(mn, mx), out_range=(0, 1))
                    for b, mn, mx in zip(landsat_image, min_values, max_values)]
        input_image = np.stack(rescaled, axis=0).transpose(1, 2, 0)

        # Extract patches
        patches, positions = extract_patches_with_overlap(input_image, patch_size=patch_size, overlap=overlap)
        print(f"Nombre de patches extraits: {len(patches)}")

        weights_acc = np.zeros((source.height, source.width, n_classes), dtype=np.float32)
        prediction_image = np.zeros((source.height, source.width, n_classes), dtype=np.float32)

        for patch, (i, j) in zip(patches, positions):
            if np.isnan(patch).any():
                continue
            patch_input = np.expand_dims(patch, 0)
            pred = model.predict(patch_input, verbose=0)[0]

            # Enregistrement de la carte de probabilité pour le patch au format TIFF avec géoréférencement
            patch_filename = f"patch_proba_img{idx}_i{i}_j{j}.tif"
            patch_filepath = os.path.join(patch_output_dir, patch_filename)
            transform = source.transform * rasterio.Affine.translation(j, i)
            patch_meta = {
                'driver': 'GTiff',
                'height': patch_size[0],
                'width': patch_size[1],
                'count': n_classes,
                'dtype': 'float32',
                'crs': source.crs,
                'transform': transform
            }
            with rasterio.open(patch_filepath, 'w', **patch_meta) as dst:
                for b in range(n_classes):
                    dst.write(pred[..., b], b + 1)

            if pred.shape[-1] != n_classes:
                raise ValueError(f"Le modèle retourne {pred.shape[-1]} classes au lieu de {n_classes}.")

            prediction_image[i:i + patch_size[0], j:j + patch_size[1], :] += pred * weight_mask[..., np.newaxis]
            weights_acc[i:i + patch_size[0], j:j + patch_size[1], :] += weight_mask[..., np.newaxis]

        # Fusion et écriture de l'image entière
        valid = weights_acc.sum(axis=-1) > 0
        prediction_image[valid] /= weights_acc.sum(axis=-1, keepdims=True)[valid]
        final_pred = np.argmax(prediction_image, axis=-1).astype(np.uint8)

        out_name = f"SORTIE_IMAGE_POUR_INF_{idx}.tif"
        out_path = os.path.join(predicted_output_dir, out_name)
        with rasterio.open(
            out_path, 'w', driver='COG', width=source.width,
            height=source.height, count=1, crs=source.crs,
            transform=source.transform, nodata=0,
            dtype='uint8', compress='lzw', resampling=Resampling.nearest
        ) as dst:
            dst.write(final_pred, 1)
            dst.write_colormap(1, dict_palette)

        print(f"Image prédite enregistrée sous: {out_path}")

print("\nTraitement terminé pour l'ensemble des images.")
