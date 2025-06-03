<h1 align="center">Apport des réseaux de neurones convolutifs à la cartographie de l’occupation du sol : <br> Cas d’usage sur le Grand Avignon</h1> 

Ce dépôt a été réalisé dans le cadre de mon **mémoire de Master Géomatique et Conduite de Projets Territoriaux**, soutenu en 2025. Il propose la création d'une chaîne de traitements qui a pour but de combler certains axes d'améliorations identifiés dans les données d'occupation du sol actuelles, tout en répondant autant que possible aux besoins métiers des collectivités territoriales dans le suivi de l'occupation du sol.

Sous la direction de M. Mounir Redjimi & M. Didier Josselin

---

## Contexte du projet 

Ce mémoire trouve son origine dans un double contexte. D’abord, il y a une pression à la production de données d’occupation du sol suite aux récentes actions législatives, avec l’objectif **Zéro Artificialisation Nette** en tête. Deuxièmement, les données en libre accès sur le marché sont **perfectibles** sur certains points de vue, qui sont éveloppés et justifiés, notamment en ce qui a trait à l’agilité, la précision et la résolution spatiale et temporelle.

---

## Objectif et méthode du projet

L’objectif est de produire une carte d’occupation du sol à **1 mètre de résolution** et à **six classes**, à l’aide d’un modèle **U-Net** entraîné sur des données raster enrichies : canaux visibles et infra-rouge, indices spectraux, éléments morphologiques : rouge, vert, infra-rouge, NDVI, NDWI, NDGI, MNH (MNT-MNS), Inverse Difference Moment (IDM), Patch Shape Index (PSI). 

<div align="center">
  <img src="https://github.com/user-attachments/assets/2a61d04d-a6ff-41f3-933e-c76e5e33b398" width="70%"/>
</div>


La chaîne de traitements originale concue dans le cadre de ce projet est décrite par ce diagramme d'activité :

<div align="center">
  <img src="https://github.com/user-attachments/assets/1b0c699e-8101-4a38-b78c-db67f01886f2" width="70%"/>
</div>

---

## Résultat 

L'entraînement du modèle U-Net a été optimisé pour maximiser la précision des prédictions sur les différentes typologies présentes dans le territoire. Le **score-F1 de la segmentation est de 0.91**, et l'**overall accuracy est de 92.2%**.

<div align="center">
  <img src="https://github.com/user-attachments/assets/429858f5-6356-4cb0-bc57-79861603f978" width="70%"/>
</div>

<br><br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/60973231-de09-4efc-b315-26cde251f841" width="70%"/>
</div>

---

## Visualisation

Le résultat de la chaîne de traitements est visible ici : 
→ <a href="https://mercatorien.github.io/MEMOIRE_MASSOT/">Carte interactive</a>

---

## Structure du dépôt

Tout le code Python et les notebooks sont regroupés dans le dossier `code/`, et le modèle FME pour la création du masque d'entraînement se trouve dans le dossier `masque_entrainement/` :
- `masque_entrainement/masque_entraînement.fmw` : Script FME pour générer le masque
- `code/lc.json` : Mapping des couleurs 
- `code/01_PREPROCESSER.py` : Prétraiter les images raster : normaliser les valeurs des images, créer des binômes image/masque de 128 × 128. Autant de binômes par classe
- `code/02_ENTRAINER.ipynb` : Entraîner, évaluer et enregistrer le modèle
- `code/03_DECOUPER_SOUS_ENSEMBLE.py` : Découper le raster d'inférence en sous-ensembles
- `code/04_INFERER.py` : Inférer le modèle sur chaque sous-ensemble
- `code/05_FUSIONNER_SOUS_ENSEMBLE.py` : Fusionner les sous-ensembles avec la fenêtre de Hann
- `code/06_CARTE_PROBA.py` : Créer la carte des probabilités en assignant pour chaque pixel la probabilité maximale d'appartenance à une classe

---

## Données

// À compléter
Les données volumineuses (Segmentation, images et masque d'entraînement, poids du modèle) seront hébergées sur **Nakala** et disponibles à cette adresse :  
→  [https://doi.org/10.34847/nkl.xxxxxx](https://doi.org/10.34847/nkl.xxxxxx)

---

## Licences

Les codes python et le modèle FME de ce dépôt sont publiés sous **licence GNU General Public License (GPL v3)**. Voir le fichier [`LICENSE.txt`](LICENSE.txt).

Seuls les deux fichiers suivants sont **adaptés** de projets sous licence MIT de Ramadhan, 2024 - https://github.com/ramiqcom
- `code/01_PREPROCESSER.py`
- `code/02_ENTRAINER.ipynb`

Ces deux fichiers respectent leur licence d’origine, consultable dans [`LICENSE-MIT.txt`](LICENSE-MIT.txt).

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
