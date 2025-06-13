// Configuration de la carte
const map = L.map('map', {
    center: [46.603354, 1.888334], // centre France
    zoom: 5,
    zoomControl: false,
    scrollWheelZoom: true,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    attributionControl: false // Désactive l'attribution par défaut à droite
});

// Définir les limites de zoom de la carte
map.setMinZoom(0);
map.setMaxZoom(18);

// Configuration des couches de base
const baseLayers = {
    'Google Satellite': L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: 'Google Satellite',
        maxZoom: 25,
        minZoom: 0,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        updateWhenIdle: true,
        reuseTiles: true,
        updateInterval: 200,
        keepBuffer: 4
    })
};

// Configuration de la couche d'occupation du sol
const occupationSolLayer = L.tileLayer('https://tiles.arcgis.com/tiles/y9Ov7ybbaxLMONwL/arcgis/rest/services/UNET_MASSOT_upload/MapServer/tile/{z}/{y}/{x}', {
    minZoom: 0,
    maxZoom: 25,
    tileSize: 256,
    opacity: 0.6,
    attribution: '',
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    detectRetina: false,
    crossOrigin: true,
    bounds: [[-85.0511, -180], [85.0511, 180]]
});

// Nouvelle couche Corn field (masquée par défaut)
const cornFieldLayer = L.tileLayer(
  'https://tiles.arcgis.com/tiles/y9Ov7ybbaxLMONwL/arcgis/rest/services/Corn_field_online/MapServer/tile/{z}/{y}/{x}',
  {
    minZoom: 0,
    maxZoom: 25,
    tileSize: 256,
    opacity: 0.6,
    attribution: '',
    crossOrigin: true
  }
);

// Contrôles pour la couche Corn field
let cornToggle, cornOpacityControl, cornOpacityValue;

// Initialisation des contrôles
const rasterToggle = document.getElementById('raster-toggle');
const opacityControl = document.getElementById('opacity');
const opacityValue = document.getElementById('opacity-value');

// Initialisation de la carte avec les couches par défaut
baseLayers['Google Satellite'].addTo(map);
if (rasterToggle.checked) {
    occupationSolLayer.addTo(map);
    occupationSolLayer.bringToFront();
}

// Animation de zoom : centre France -> Avignon après 0,5s
setTimeout(() => {
    map.flyTo([43.96762, 4.80899], 12, {
        animate: true,
        duration: 2
    });
}, 500);

// --- Ajout de la couche GeoJSON des communes ---
setTimeout(() => {
  fetch('https://raw.githubusercontent.com/Mercatorien/MEMOIRE_MASSOT/73865c743217759a58666037f605f0c0d9117db6/communes.geojson')
    .then(function(response) { return response.json(); })
    .then(function(data) {
      const communesLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer) {
          // Ajout des labels NOM
          if (feature.properties && feature.properties.NOM) {
            const center = layer.getBounds().getCenter();
            // Toute autre logique JS existante...

// Animation d'apparition harmonique des boutons principaux
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.memoire-btn, .github-btn, .zenodo-btn').forEach((btn) => {
    btn.classList.add('animated-btn');
  });
});

            const label = L.marker(center, {
              icon: L.divIcon({
                className: 'commune-label',
                html: feature.properties.NOM,
                iconSize: null
              }),
              interactive: false
            });
            label.addTo(map);
          }
        },
        style: function() {
          return {
            color: '#111', // contours noirs
            weight: 2,
            fillOpacity: 0,
            fill: false
          };
        }
      });
      communesLayer.addTo(map);
      communesLayer.bringToFront();
    });
}, 2500);

// Gestion des erreurs de chargement de la couche
occupationSolLayer.on('loading', function() {
    console.log('Chargement de la couche d\'occupation du sol...');
});

occupationSolLayer.on('load', function() {
    console.log('Couche d\'occupation du sol chargée avec succès');
});

occupationSolLayer.on('tileerror', function(error, tile) {
    console.error('Erreur de chargement de la tuile:', error);
});

// Ajout de la couche d'occupation du sol
occupationSolLayer.addTo(map);

// Vérification de la visibilité de la couche
console.log('Visibilité de la couche d\'occupation du sol:', map.hasLayer(occupationSolLayer));

// Configuration de la légende
const legendConfig = {
    colors: ["#dc1010", "#79de13", "#464646", "#2db9ff", "#d5ffbf", "#fffa9b"],
    labels: ["Bâtiment", "Arbre", "Bitume", "Eau", "Herbe", "Sol nu"]
};

// Fonction pour générer la légende
function populateLegend() {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';


    // 3. Légende de l'occupation du sol
    // Création d'un conteneur grid pour la légende
    const legendGrid = document.createElement('div');
    legendGrid.className = 'legend-grid';

    // Deux colonnes de trois items chacune
    for (let col = 0; col < 2; col++) {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'legend-column';
        for (let row = 0; row < 3; row++) {
            const index = col * 3 + row;
            if (legendConfig.labels[index]) {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color';
                colorBox.style.backgroundColor = legendConfig.colors[index];
                const labelElement = document.createElement('span');
                labelElement.className = 'legend-label';
                labelElement.textContent = legendConfig.labels[index];
                legendItem.appendChild(colorBox);
                legendItem.appendChild(labelElement);
                columnDiv.appendChild(legendItem);
            }
        }
        legendGrid.appendChild(columnDiv);
    }
    legendContainer.appendChild(legendGrid);

    // 4. Trait horizontal gris
    const sep = document.createElement('hr');
    sep.style.border = 'none';
    sep.style.borderTop = '1px solid #444';
    sep.style.margin = '10px 0';
    legendContainer.appendChild(sep);

    // 5. Case pour afficher/masquer la carte des probabilités
    const cornToggleDiv = document.createElement('div');
    cornToggleDiv.className = 'layer-control';
    cornToggleDiv.innerHTML = `
        <label class="toggle-container" style="position: relative;">
            <input type="checkbox" id="corn-toggle">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Carte des probabilités</span>
            <span class="info-icon" tabindex="0">
                <i class="fas fa-info-circle"></i>
            </span>
        </label>
    `;
    legendContainer.appendChild(cornToggleDiv);

    // Gestion dynamique du pop-up info carte des probabilités hors de l'îlot
    setTimeout(() => {
        const infoIcon = document.querySelector('.info-icon');
        if (infoIcon) {
            let popup = null;
            const popupHtml = `
                <div class="info-popup" id="proba-info-popup">
                    <div class="info-popup-content">
                        La carte des probabilité montre la probabilité d'appartenance maximale parmi les six classes, indiquant le niveau de confiance à accorder à la prédiction.
                        <img src='https://github.com/Mercatorien/MEMOIRE_MASSOT/blob/main/css/FCC_PROBA.png?raw=true' style='max-width: 450px; margin-top: 18px; border-radius: 4px;'>
                    </div>
                </div>`;
            function showPopup() {
                if (!popup) {
                    popup = document.createElement('div');
                    popup.innerHTML = popupHtml;
                    document.body.appendChild(popup.firstElementChild);
                }
                const popupEl = document.getElementById('proba-info-popup');
                if (popupEl) {
                    // Positionner à droite de la légende
                    const infoRect = infoIcon.getBoundingClientRect();
                    const panel = document.querySelector('.control-panel');
                    const panelRect = panel.getBoundingClientRect();
                    popupEl.style.display = 'block';
                    popupEl.style.position = 'fixed';
                    popupEl.style.left = (panelRect.right + 16) + 'px';
                    popupEl.style.top = (infoRect.top - 90) + 'px';
                    popupEl.style.transform = 'none';
                    popupEl.style.zIndex = 9999;
                }
            }
            function hidePopup() {
                const popupEl = document.getElementById('proba-info-popup');
                if (popupEl) {
                    popupEl.remove();
                }
                popup = null;
            }
            infoIcon.addEventListener('mouseenter', showPopup);
            infoIcon.addEventListener('focus', showPopup);
            infoIcon.addEventListener('mouseleave', hidePopup);
            infoIcon.addEventListener('blur', hidePopup);
            // Optionnel : fermer au clic partout
            document.addEventListener('click', function(e) {
                if (!infoIcon.contains(e.target) && document.getElementById('proba-info-popup')) {
                    hidePopup();
                }
            });
        }
    }, 0);

    // 6. Slider pour la transparence de la carte des probabilités
    const cornOpacityDiv = document.createElement('div');
    cornOpacityDiv.className = 'opacity-control';
    cornOpacityDiv.innerHTML = `
        <div class="opacity-row">
            <label for="corn-opacity" class="opacity-label">Opacité : <span id="corn-opacity-value">60</span>%</label>
            <input type="range" id="corn-opacity" min="0" max="100" value="60">
        </div>
    `;
    legendContainer.appendChild(cornOpacityDiv);

    // 7. Légende de la carte des probabilités (style harmonisé)
    const cornLegendValues = [
        { color: "#fa3308", label: "22&nbsp;%" },
        { color: "#00f51c", label: "100&nbsp;%" }
    ];
    const cornLegendRow = document.createElement('div');
cornLegendRow.className = 'legend-row';
cornLegendValues.forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    const colorBox = document.createElement('span');
    colorBox.className = 'legend-color';
    colorBox.style.background = item.color;
    const label = document.createElement('span');
    label.className = 'legend-label';
    label.innerHTML = item.label;
    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    cornLegendRow.appendChild(legendItem);
});
legendContainer.appendChild(cornLegendRow);

    // Trait horizontal gris entre la légende corn field et le bouton "Mon mémoire"
    const separator = document.createElement('hr');
    separator.className = 'legend-separator';
    legendContainer.appendChild(separator);


    // Lier les nouveaux contrôles (après insertion dans le DOM)
    setTimeout(() => {
        cornToggle = document.getElementById('corn-toggle');
        cornOpacityControl = document.getElementById('corn-opacity');
        cornOpacityValue = document.getElementById('corn-opacity-value');
        if (cornToggle && cornOpacityControl && cornOpacityValue) {
            cornToggle.checked = false;
            cornToggle.addEventListener('change', function() {
                if (this.checked) {
                    cornFieldLayer.addTo(map);
                    cornFieldLayer.bringToFront();
                } else {
                    map.removeLayer(cornFieldLayer);
                }
            });
            cornOpacityControl.value = 60;
            cornOpacityValue.textContent = '60';
            cornOpacityControl.addEventListener('input', function() {
                const opacity = this.value / 100;
                cornFieldLayer.setOpacity(opacity);
                cornOpacityValue.textContent = this.value;
            });
        }
    }, 0);
}






// Gestionnaire d'événements pour le toggle de la couche
rasterToggle.addEventListener('change', function() {
    if (this.checked) {
        occupationSolLayer.addTo(map);
        occupationSolLayer.bringToFront();
    } else {
        map.removeLayer(occupationSolLayer);
    }
});

// Gestionnaire d'événements pour le contrôle d'opacité
opacityControl.value = 60;
opacityValue.textContent = '60';

opacityControl.addEventListener('input', function() {
    const opacity = this.value / 100;
    occupationSolLayer.setOpacity(opacity);
    opacityValue.textContent = this.value;
});

// S'assurer que la couche reste visible à tous les niveaux de zoom
map.on('zoomend', function() {
    if (rasterToggle.checked && !map.hasLayer(occupationSolLayer)) {
        occupationSolLayer.addTo(map);
        occupationSolLayer.bringToFront();
    }
});

// Mettre à jour l'ordre d'affichage lors du déplacement de la carte
function updateLayerOrder() {
    if (rasterToggle.checked) {
        occupationSolLayer.bringToFront();
    }
}

// Mettre à jour l'ordre d'affichage lors du déplacement de la carte
map.on('moveend', function() {
    if (rasterToggle.checked) {
        occupationSolLayer.bringToFront();
    }
});

// Ajout du contrôle d'échelle
L.control.scale({
    imperial: false,
    position: 'bottomright'
}).addTo(map);

// Ajout de l'attribution personnalisée
const attribution = L.control.attribution({
    position: 'bottomleft'
});
attribution.addAttribution('N. Massot, 2025 | <a href="https://nicolasmassot.fr" target="_blank"></a>');
attribution.addTo(map);

// Initialisation de la légende
document.addEventListener('DOMContentLoaded', function() {
    populateLegend();
});

// Ajustement de la hauteur de la carte
function resizeMap() {
    const headerHeight = document.querySelector('header').offsetHeight;
    document.getElementById('map').style.height = `calc(100vh - ${headerHeight}px)`;
    map.invalidateSize();
}

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', resizeMap);
resizeMap();

// Afficher le niveau de zoom actuel dans la console
map.on('zoomend', function() {
    console.log('Niveau de zoom actuel:', map.getZoom());
});

// Afficher le niveau de zoom initial
console.log('Niveau de zoom initial:', map.getZoom());
