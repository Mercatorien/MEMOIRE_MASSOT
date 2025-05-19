// Configuration de la carte
const map = L.map('map', {
    center: [43.9493, 4.8059],
    zoom: 12,
    zoomControl: false,
    scrollWheelZoom: true,
    zoomSnap: 0.5,
    zoomDelta: 0.5
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
    attribution: 'N. Massot, 2025',
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
    attribution: 'Corn field',
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

// --- Ajout de la couche GeoJSON des communes ---
fetch('https://raw.githubusercontent.com/Mercatorien/MEMOIRE_MASSOT/73865c743217759a58666037f605f0c0d9117db6/communes.geojson')
  .then(function(response) { return response.json(); })
  .then(function(data) {
    const communesLayer = L.geoJSON(data, {
      style: function() {
        return {
          color: '#111', // contours noirs
          weight: 2,
          fillOpacity: 0,
          fill: false
        };
      },
      onEachFeature: function(feature, layer) {
        // Ajout des labels NOM
        if (feature.properties && feature.properties.NOM) {
          const center = layer.getBounds().getCenter();
          // Ajoute une divIcon centrée sur chaque polygone
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
      }
    });
    communesLayer.addTo(map);
    communesLayer.bringToFront();
  });

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
    legendConfig.labels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = legendConfig.colors[index];
        const labelElement = document.createElement('span');
        labelElement.className = 'legend-label';
        labelElement.textContent = label;
        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelElement);
        legendContainer.appendChild(legendItem);
    });

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
        <label class="toggle-container">
            <input type="checkbox" id="corn-toggle">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Carte des probabilités</span>
        </label>
    `;
    legendContainer.appendChild(cornToggleDiv);

    // 6. Slider pour la transparence de la carte des probabilités
    const cornOpacityDiv = document.createElement('div');
    cornOpacityDiv.className = 'opacity-control';
    cornOpacityDiv.innerHTML = `
        <label for="corn-opacity">Opacité: <span id="corn-opacity-value">100</span>%</label>
        <input type="range" id="corn-opacity" min="0" max="100" value="100">
    `;
    legendContainer.appendChild(cornOpacityDiv);

    // 7. Légende de la carte des probabilités
    const cornLegendDiv = document.createElement('div');
    cornLegendDiv.className = 'corn-legend';
    cornLegendDiv.innerHTML = `
        <span style="display:inline-block;width:18px;height:18px;background:#fa3308;margin-right:8px;"></span>
        <span>22 %</span>
        <span style="display:inline-block;width:18px;height:18px;background:#00f51c;margin:0 8px 0 18px;"></span>
        <span>100 %</span>
    `;
    legendContainer.appendChild(cornLegendDiv);


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


// Gestion de la modale
function setupModal() {
    const modal = document.getElementById('memoire-modal');
    const btn = document.getElementById('memoire-btn');
    const span = document.querySelector('.close-modal');

    // Ouverture de la modale
    btn.onclick = function() {
        modal.classList.add('show');
    }

    // Fermeture avec le bouton
    span.onclick = function() {
        modal.classList.remove('show');
    }

    // Fermeture en cliquant en dehors
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    }
}

// Initialisation de la modale au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    setupModal();
});

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
attribution.addAttribution('N. Massot, 2025 | <a href="https://nicolasmassot.fr" target="_blank">nicolasmassot.fr</a>');
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
