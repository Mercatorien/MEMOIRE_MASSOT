<h1 align="center">Apport des réseaux de neurones convolutifs à la cartographie de l’occupation du sol : <br> Cas d’usage sur le Grand Avignon</h1> 

[![PDF](https://img.shields.io/badge/Download-PDF-red?style=flat&logo=adobeacrobatreader)](https://github.com/Mercatorien/MEMOIRE_MASSOT/raw/main/MEMOIRE_MASSOT.pdf)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=flat&logo=github)](https://github.com/Mercatorien/MEMOIRE_MASSOT/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=flat&logo=vercel)](https://mercatorien.github.io/MEMOIRE_MASSOT/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://github.com/Mercatorien/MEMOIRE_MASSOT/tree/main?tab=GPL-3.0-1-ov-file)

---

Ce dépôt a été réalisé dans le cadre de mon **mémoire de Master Géomatique et Conduite de Projets Territoriaux**, soutenu en 2025. Il propose la création d'une chaîne de traitements qui a pour but de combler certains axes d'améliorations identifiés dans les données d'occupation du sol actuelles, tout en répondant autant que possible aux besoins métiers des collectivités territoriales dans le suivi de l'occupation du sol.

Sous la direction de M. Mounir Redjimi & M. Didier Josselin

---

## Contexte du projet 

Ce mémoire trouve son origine dans un double contexte. D’abord, il y a une pression à la production de données d’occupation du sol suite aux récentes actions législatives, avec l’objectif **Zéro Artificialisation Nette** en tête. Deuxièmement, les données en libre accès sur le marché sont **perfectibles** sur certains points de vue, qui sont éveloppés et justifiés dans le mémoire, notamment en ce qui a trait à l’agilité, la précision et la résolution spatiale et temporelle.

---

## Objectif et méthode du projet

L’objectif est de produire une carte d’occupation du sol à **1 mètre de résolution** et à **six classes**, à l’aide d’un modèle **U-Net** entraîné sur des données raster enrichies : canaux visibles et infra-rouge, indices spectraux, éléments morphologiques : rouge, vert, infra-rouge, NDVI, NDWI, NDGI, MNH (MNT-MNS), Inverse Difference Moment (IDM), Patch Shape Index (PSI). 
<br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/2a61d04d-a6ff-41f3-933e-c76e5e33b398" width="70%"/>
</div>

<br> 
<br>

Le masque d'entraînement est automatiquement réalisé à partir du script FME disponible ici : `masque_entrainement/SCRIPT_MASQUE_ENTRAINEMENT.fmw`. 
Voici la composition des données agrègées à une grille d'un mètre :

<table>
  <thead>
    <tr>
      <th><strong>Classe</strong></th>
      <th><strong>Source</strong></th>
      <th><strong>Ordre de priorité</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Bâtiment</td>
      <td>LiDAR (classification = 6)</td>
      <td>2</td>
    </tr>
    <tr>
      <td>Arbre</td>
      <td>LiDAR (classification = 4 ou 5)</td>
      <td>1</td>
    </tr>
    <tr>
      <td>Bitume</td>
      <td>BD Topo (tronçon de routes), OSM (parking), Classification supervisée</td>
      <td>3</td>
    </tr>
    <tr>
      <td>Eau</td>
      <td>BD Topo (surface hydrographique), BD Ortho (seuil NDWI)</td>
      <td>4</td>
    </tr>
    <tr>
      <td>Herbe</td>
      <td>BD Ortho (seuil NDVI)</td>
      <td>5</td>
    </tr>
    <tr>
      <td>Sol nu</td>
      <td>Le reste</td>
      <td>6</td>
    </tr>
  </tbody>
</table>

<br> La chaîne de traitements du modèle `masque_entrainement/SCRIPT_MASQUE_ENTRAINEMENT.fmw` est décrite par ce diagramme d'activité : 


<div align="center">
  <img src="https://github.com/user-attachments/assets/42d15d00-05d4-4590-94fe-683a36a9db69" width="70%"/>
</div>


<br> <br> La chaîne de traitements originale concue dans le cadre de ce projet est décrite par ce diagramme d'activité :
<br>
<div align="center">
  <img src="https://github.com/user-attachments/assets/1b0c699e-8101-4a38-b78c-db67f01886f2" width="70%"/>
</div>

---


## Résultat 

L'entraînement du modèle U-Net a été optimisé pour maximiser la précision des prédictions sur les différentes typologies présentes dans le territoire. Le **score-F1 de la segmentation est de 0.91**, l'**overall accuracy est de 92.2%**, le **rappel moyen est de 92.1 %** et l'**IoU est de 0.77**.

<div align="center">
  <img src="https://github.com/user-attachments/assets/429858f5-6356-4cb0-bc57-79861603f978" width="70%"/>
</div>

<br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/60973231-de09-4efc-b315-26cde251f841" width="70%"/>
</div>

<br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/c4b8c0c7-853a-475c-b18c-fd2a13b45114" width="70%"/>
</div>

<br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/980bccd4-9038-484b-994f-f1e943d90a06" width="70%"/>
</div>

<br>


---

## Visualisation

Le résultat de la chaîne de traitements est visible ici : 
→ <a href="https://mercatorien.github.io/MEMOIRE_MASSOT/">Carte interactive</a>

---

## Structure du dépôt

Les codes et le notebook Python sont regroupés dans le dossier `code/`, et le modèle FME pour la création du masque d'entraînement se trouve dans le dossier `masque_entrainement/` :
- `masque_entrainement/SCRIPT_MASQUE_ENTRAINEMENT.fmw` : Script FME pour générer le masque d'entraînement
- `code/lc.json` : Mapping des couleurs 
- `code/01_PREPROCESSER.py` : Prétraiter les images raster : normaliser les valeurs des images, créer des binômes image/masque de 128 × 128. Autant de binômes par classe
- `code/02_ENTRAINER.ipynb` : Entraîner, évaluer et enregistrer le modèle
- `code/03_DECOUPER_SOUS_ENSEMBLE.py` : Découper le raster d'inférence en sous-ensembles
- `code/04_INFERER.py` : Inférer le modèle sur chaque sous-ensemble
- `code/05_FUSIONNER_SOUS_ENSEMBLE.py` : Fusionner les sous-ensembles avec la fenêtre de Hann
- `code/06_CARTE_PROBA.py` : Créer la carte des probabilités en assignant pour chaque pixel la probabilité maximale d'appartenance à une classe


---

## Dépôt Zenodo

Un dépôt Zenodo complémentaire à ce GitHub contient :
- `images.rar` : Patchs d'images d'entraînement découpés en 128 × 128 pixels
- `lcs.rar` : Patchs de masque d'entraînement découpés en 128 × 128 pixels
- `MODEL_UNET_MASSOT.keras` : Poids du modèle U-Net.
- `UNET_MASSOT.tif` : Segmentation du modèle U-Net
- `STYLE_SEGMENTATION.qml` : Style du fichier
- `CARTE_PROBA.tif` : Carte des probabilités maximale pour l'appartenance des classes
- `STYLE_PROBA.qml` : Style du fichier 

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.15591285.svg)](https://doi.org/10.5281/zenodo.15591285)


---

## Licences
Ces dépôts contienent à la fois du code source, des modèles, et des données. Plusieurs licences s'appliquent en fonction des fichiers.


### 1. Code
Les scripts Python et le modèle FME sont publiés sous **licence GNU General Public License v3 (GPL v3)**.
Voir le fichier [`LICENSE.txt`](LICENSE.txt) pour le texte complet.

Deux fichiers sont adaptés de projets existants publiés sous licence **MIT** (Ramadhan, 2024 – https://github.com/ramiqcom) :
- `code/01_PREPROCESSER.py`
- `code/02_ENTRAINER.ipynb`

Ces fichiers respectent leur licence d'origine, disponible dans [`LICENSE-MIT.txt`](LICENSE-MIT.txt).


### 2. Données
Les fichiers d’entraînement sont dérivés de données produites par l’IGN (RGE ALTI®, BD ORTHO® IRC), publiées sous **Licence Ouverte 2.0 / Open Licence 2.0** https://www.etalab.gouv.fr/licence-ouverte-open-licence.


### 3. Modèle, sortie, et style
Les fichiers résultant de l'entraînement et de la production cartographique sont publiés sous licence Creative Commons Attribution - Partage dans les mêmes conditions (CC BY-SA).
Cela concerne notamment les fichiers .keras, .qml, .tif.

<table>
  <thead>
    <tr>
      <th>Fichier</th>
      <th>Dépôt</th>
      <th>Licence</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>01_PREPROCESSER.py</td><td>Zenodo + GitHub</td><td>GPL v3 + MIT</td></tr>
    <tr><td>02_ENTRAINER.py</td><td>Zenodo + GitHub</td><td>GPL v3 + MIT</td></tr>
    <tr><td>03_DECOUPER_SOUS_ENSEMBLE.py</td><td>Zenodo + GitHub</td><td>GPL v3</td></tr>
    <tr><td>04_INFERER.py</td><td>Zenodo + GitHub</td><td>GPL v3</td></tr>
    <tr><td>05_FUSIONNER_SOUS_ENSEMBLE.py</td><td>Zenodo + GitHub</td><td>GPL v3</td></tr>
    <tr><td>06_CARTE_PROBA.py</td><td>Zenodo + GitHub</td><td>GPL v3</td></tr>
    <tr><td>SCRIPT_MASQUE_ENTRAINEMENT.fmw</td><td>Zenodo + GitHub</td><td>GPL v3</td></tr>
    <tr><td>lc.json</td><td>Zenodo + GitHub</td><td>GPL v3</td></tr>
    <tr><td>lcs.rar (masque d'entraînement)</td><td>Zenodo</td><td>LICENCE OUVERTE / OPEN LICENCE 2.0</td></tr>
    <tr><td>images.rar (image d'entraînement)</td><td>Zenodo</td><td>LICENCE OUVERTE / OPEN LICENCE 2.0</td></tr>
    <tr><td>UNET_MASSOT.tif</td><td>Zenodo</td><td>CC BY SA</td></tr>
    <tr><td>STYLE_SEGMENTATION.qml</td><td>Zenodo</td><td>CC BY SA</td></tr>
    <tr><td>MODEL_UNET_MASSOT.keras</td><td>Zenodo</td><td>CC BY SA</td></tr>
    <tr><td>CARTE_PROBA.tif</td><td>Zenodo</td><td>CC BY SA</td></tr>
  </tbody>
</table>
<br>

---


## Remerciements

<p align="right"><em>À mes parents qui m’ont permis de faire des études, <br>
À Monsieur Redjimi qui m’a tant appris,<br>
Merci.</em></p>

<br>

<hr>
<p align="center">
  © 2025 Nicolas Massot • Je pense donc je GIS • <a href="https://nicolasmassot.fr">Portfolio</a> • Licence GNU GPL v3
</p>
