# MEMOIRE_MASSOT

## Application de Cartographie de l'Occupation du Sol

Cette application décrit l'occupation du sol des communes du Grand Avignon à **un mètre de résolution et avec six classes**. Elle a été réalisée en mobilisant la technologie de **réseaux de neurones convolutifs** et le modèle **U-Net** dans le cadre de mon mémoire intitulé :

**"Apport de l'apprentissage profond à la cartographie de l'occupation du sol : cas d'usage sur le Grand Avignon."**

### Approche

L'approche mise en œuvre s'appuie sur des images orthophotographiques haute résolution (R,V,IR), combinées à des indices spectraux tels que le NDVI, le NDWI ou le NDGI. De plus, le MNH (MNS-MNT), un indice de texture (Inverse different moment) et un indice de forme (patch shape index) ont été utilisés. La combinaison de ces neuf facteurs explicatifs, ainsi que le masque d'entraînement, permettent une distinction précise des classes d'occupation du sol.

L'entraînement du modèle U-Net a été optimisé pour maximiser la précision des prédictions sur les différentes typologies présentes dans le territoire. Le score-F1 de la segmentation est de **0.91**, et l'overall accuracy est de **92.2%**.

### Objectif

L'application est pensée pour être un outil d'aide à la décision pour les élus locaux du Grand Avignon, pour faciliter l'analyse spatiale, le suivi des dynamiques territoriales et l'aménagement urbain.
