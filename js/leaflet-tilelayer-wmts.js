// Leaflet TileLayer.WMTS
// https://github.com/mylen/leaflet.TileLayer.WMTS

L.TileLayer.WMTS = L.TileLayer.extend({
    defaultWmtsParams: {
        service: 'WMTS',
        request: 'GetTile',
        version: '1.0.0',
        layer: '',
        style: 'default',
        tiled: true,
        tilematrixSet: '',
        format: 'image/jpeg',
        tilematrix: '{z}',
        tilecol: '{x}',
        tilerow: '{y}'
    },

    initialize: function (url, options) { // (String, Object)
        this._url = url;
        var wmtsParams = L.extend({}, this.defaultWmtsParams);
        // all options that are not TileLayer options go to WMTS params
        for (var key in options) {
            // all keys that are in all caps are WMTS parameters
            if (key.toUpperCase() === key) {
                wmtsParams[key] = options[key];
            }
        }
        this.wmtsParams = wmtsParams;
        L.Util.setOptions(this, options);
    },

    onAdd: function (map) {
        L.TileLayer.prototype.onAdd.call(this, map);
    },

    getTileUrl: function (tilePoint) { // (Point, Number) -> String
        var map = this._map,
            tileSize = this.options.tileSize,
            nwPoint = tilePoint.multiplyBy(tileSize),
            // get the NW geographical coordinates of the tile
            nw = map.unproject(nwPoint, this._zoom),
            se = map.unproject(nwPoint.add([tileSize, tileSize]), this._zoom),
            bbox = [nw.lng, se.lat, se.lng, nw.lat].join(','),
            url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});

        // Add WMS parameters
        var wmtsParams = L.extend({}, this.wmtsParams, {
            tilematrix: this._getZoomForUrl(),
            tilecol: tilePoint.x,
            tilerow: tilePoint.y
        });

        return url + L.Util.getParamString(wmtsParams, url);
    },

    // @method setParams(params: Object, noRedraw?: Boolean): this
    // Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
    setParams: function (params, noRedraw) {
        L.extend(this.wmtsParams, params);
        if (!noRedraw) {
            this.redraw();
        }
        return this;
    }
});

// Factory
// @function tileLayer.wmts(baseUrl: String, options: TileLayer.WMTS options)
// Instantiates a WMTS tile layer object given a base URL and WMS parameters.
L.tileLayer.wmts = function (url, options) {
    return new L.TileLayer.WMTS(url, options);
};
