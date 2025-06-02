import os
import glob
import numpy as np
import rasterio
from rasterio.transform import Affine

# Configuration
patch_dir = r"/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/patch_proba"
output_path = r"/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/CARTE_PROBA.tif"

# Collect all patch files
patch_files = sorted(glob.glob(os.path.join(patch_dir, "*.tif")))
if not patch_files:
    raise FileNotFoundError(f"No .tif files found in {patch_dir}")

# Read metadata from first patch to infer size and geotransform
with rasterio.open(patch_files[0]) as src0:
    meta = src0.meta.copy()
    patch_height = src0.height
    patch_width = src0.width
    res_x = src0.transform.a
    res_y = -src0.transform.e
    orig_transform = src0.transform

# Build 2D Hann window for blending
y = np.hanning(patch_height)
x = np.hanning(patch_width)
hann_window = np.outer(y, x)

# Determine mosaic bounds across all patches
bounds = []
for f in patch_files:
    with rasterio.open(f) as src:
        bounds.append(src.bounds)

min_x = min(b.left for b in bounds)
max_x = max(b.right for b in bounds)
min_y = min(b.bottom for b in bounds)
max_y = max(b.top for b in bounds)

# Compute mosaic dimensions
total_width = int(np.ceil((max_x - min_x) / res_x))
total_height = int(np.ceil((max_y - min_y) / res_y))

# Prepare accumulation arrays
accumulator = np.zeros((total_height, total_width), dtype=np.float32)
weight_sum  = np.zeros((total_height, total_width), dtype=np.float32)

# Process each patch
for f in patch_files:
    with rasterio.open(f) as src:
        # Read all 7 bands and compute pixel-wise max
        data = src.read()  # shape: (7, H, W)
        max_prob = np.max(data, axis=0)  # shape: (H, W)

        # Determine pixel offset in mosaic
        b = src.bounds
        col_off = int(round((b.left - min_x) / res_x))
        row_off = int(round((max_y - b.top) / res_y))

        # Blend into mosaic using Hann window
        accumulator[row_off:row_off + patch_height,
                    col_off:col_off + patch_width] += max_prob * hann_window
        weight_sum[row_off:row_off + patch_height,
                   col_off:col_off + patch_width] += hann_window

# Avoid division by zero
mask = weight_sum == 0
weight_sum[mask] = 1.0

# Final merge
dst_array = accumulator / weight_sum

# Update metadata for output
dst_meta = meta.copy()
dst_meta.update({
    "driver": "GTiff",
    "height": total_height,
    "width": total_width,
    "count": 1,
    "dtype": "float32",
    "transform": Affine(res_x, 0, min_x,
                          0, -res_y, max_y)
})

# Write to disk
with rasterio.open(output_path, 'w', **dst_meta) as dst:
    dst.write(dst_array, 1)

print(f"Mosaic saved to {output_path}")
