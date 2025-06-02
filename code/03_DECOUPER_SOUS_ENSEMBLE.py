import os
import rasterio
from rasterio.windows import Window

# Chemin de l'image source
image_path = r"/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/IMAGE_9_BANDES/image_9_bandes_reordonne2.tif"

# Nouveau dossier de sortie
output_dir = r"/home/vertex_wsl/MEMOIRE_w/TEST_AVI3_w/data/inference/IMAGE_INFERENCE"
os.makedirs(output_dir, exist_ok=True)

overlap = 32  # chevauchement en pixels

print("Ouverture de l'image source...")
with rasterio.open(image_path) as src:
    width, height = src.width, src.height
    bands = src.count
    transform = src.transform
    pixel_size_x = transform.a
    pixel_size_y = -transform.e  # généralement négatif

    print(f"Dimensions de l'image : largeur={width}, hauteur={height}")
    print(f"Nombre de bandes : {bands}")
    print(f"Taille d'un pixel : {pixel_size_x}m x {pixel_size_y}m")

    # Assurer que la résolution est bien de 1 mètre
    if not (abs(pixel_size_x - 1) < 1e-6 and abs(pixel_size_y - 1) < 1e-6):
        raise ValueError("La taille d'un pixel n'est pas de 1 mètre.")

    # Ajuster la hauteur pour qu'elle soit divisible par 128
    adjusted_height = (height // 128) * 128
    print(f"Hauteur ajustée à {adjusted_height} (divisible par 128)")

    # Largeur de chaque bande (avec chevauchement)
    target_band_width = (width - overlap * 6) // 7  # 7 bandes avec 6 chevauchements
    adjusted_band_width = (target_band_width // 128) * 128
    print(f"Largeur cible par bande (sans chevauchement) : {target_band_width}")
    print(f"Largeur ajustée (divisible par 128) : {adjusted_band_width}")

    for i in range(7):
        x_offset = i * (adjusted_band_width - overlap)

        # Éviter de dépasser les bords
        if x_offset + adjusted_band_width > width:
            x_offset = width - adjusted_band_width
            print(f"  - Ajustement de l'offset final pour éviter dépassement : {x_offset}")

        print(f"\nDécoupe de la bande {i + 1}")
        print(f"  - Offset horizontal : {x_offset}")
        print(f"  - Dimensions : {adjusted_band_width}x{adjusted_height}")

        window = Window(x_offset, 0, adjusted_band_width, adjusted_height)
        data = src.read(window=window)

        # Préparer les métadonnées
        profile = src.profile.copy()
        profile.update({
            'height': adjusted_height,
            'width': adjusted_band_width,
            'transform': rasterio.windows.transform(window, src.transform)
        })

        output_path = os.path.join(output_dir, f"IMAGE_9_BANDES_PART{i+1}.tif")
        print(f"  - Sauvegarde : {output_path}")

        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(data)

print("\nDécoupage terminé avec succès.")
