/*! Copyright (c) 2013 Oleg Smith (http://olegsmith.com)
 *  Licensed under the MIT License.
 *
 *  L.GeoManager uses jQuery for JSONP requests (http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js)
 */

/*
 * L.GeoManager
 */

L.GeoManager = L.Class.extend({
    options: {
        baselayer: 'osm'
        , overlay: 'none'
        // interactivelayer can be featurelayer or identifier
        , interactivelayer: 'none'
        , geocoder: 'osm-geocode'
        , providers: {
        }
        , apikeys : {
        }
        , attributions: {
            'osm': 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
            , 'cloudmade': 'Imagery © <a href="http://cloudmade.com">CloudMade</a>'
            , 'wikimapia': '<a href="http://wikimapia.org" target="_blank">Wikimapia.org</a>'
            , 'opencyclemap': '<a href="http://www.opencyclemap.org">OpenCycleMap</a>'
            , 'mapquest': 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a>'
        }
        , i18n: {
        }
    }

    , initialize: function (options) {

        var providers= {
            'none': this._none

            // baselayers
            , 'osm' : this._osm
            , 'osmbw' : this._osmbw
            , 'opencyclemap': this._opencyclemap
            , 'opencyclemap-transport': this._opencyclemapTransport
            , 'opencyclemap-landscape': this._opencyclemapLandscape
            , 'mapquest': this._mapquest
            , 'mapquest-aerial': this._mapquestAerial
            , 'stamen-toner': this._stamenToner
            , 'stamen-terrain': this._stamenTerrain
            , 'stamen-watercolor': this._stamenWatercolor
            , 'esri': this._esri
            , 'esri-topo': this._esriTopo
            , 'esri-imagery': this._esriImagery
            , 'google': this._google
            , 'google-satellite': this._googleSatellite
            , 'google-hybrid': this._googleHybrid
            , 'google-terrain': this._googleTerrain
            , 'bing': this._bing
            , 'bing-aerial': this._bingAerial
            , 'bing-hybrid': this._bingHybrid
            , 'wikimapia': this._wikimapia

            // overlays
            , 'wikimapia-hybrid': this._wikimapiaHybrid

            // interactivelayers
            , 'osm-identify': this._osmIdentify
            , 'google-identify': this._googleIdentify
            , 'bing-identify': this._bingIdentify
            , 'wikimapia-api': this._wikimapiaApi

            // geocoders
            , 'osm-geocode' : this._osmGeocode
            , 'google-geocode' : this._googleGeocode
            , 'bing-geocode' : this._bingGeocode
            , 'esri-geocode' : this._esriGeocode
            , 'geonames-geocode' : this._geonamesGeocode
            , 'mapquest-geocode' : this._mapquestGeocode
            , 'nokia-geocode' : this._nokiaGeocode
        }

        options.providers = L.extend(options.providers, providers);

        this.setOptions(options);

    }

    , onAdd: function (map) {
        var that = this;
        that._map = map;

        that._initLayers();
    }

    , onRemove: function (map) {
    }

    , addTo: function (map) {
        map.addLayer(this);
        return this;
    }

    , _initLayers: function() {
        var that = this;

        if (that._map) {
            if (that.options.baselayer ) {
                that.setLayer(that.options.baselayer, 'baselayer')
            }

            if (that.options.overlay) {
                that.setLayer(that.options.overlay, 'overlay')
            }

            if (that.options.interactivelayer) {
                that.setLayer(that.options.interactivelayer, 'interactivelayer')
            }
        }
    }

    , setOptions:function (in_options) {
        var that = this;

        var options = L.extend({}, in_options);

        if (options) {
            if (options.providers) {
                this.options.providers = L.extend(this.options.providers, options.providers);
                delete options.providers;
            }
            if (options.apikeys) {
                this.options.apikeys = L.extend(this.options.apikeys, options.apikeys);
                delete options.apikeys;
            }

            L.setOptions(this, options);

            that._initLayers();

        }

        return this;
    }

    , setLayer: function(name, type) {
        var that=this
        , layerFn = that.options.providers[name]
        , layerFnProxy = $.proxy(layerFn, that)
        , currentlayer = that['_'+type]
        , cbFn = function (layer) {
                if (that['_'+type]) {
                    that._map.removeLayer(that['_'+type]);
                }
                if (layer != null) {
                    that['_'+type] = layer;
                    that._map.addLayer(layer);
                    if (type == 'baselayer' && layer.bringToBack) {
                        layer.bringToBack();
                    } else if (type == 'overlay' && layer.bringToFront) {
                        layer.bringToFront();
                    }
                } else {
                    that['_'+type] = null;
                }
        };

        layerFnProxy({
            cb : $.proxy(cbFn, that)
        });
    }

    , geocode:function(query) {
        var that=this
            , geocoder=this.options.geocoder
            , geoFn = this.options.providers[geocoder]
            , geoFnProxy=$.proxy(geoFn, that);

            geoFnProxy({
                query : query
                , bounds : that._map.getBounds()
                , zoom : that._map.getZoom()
                , cb : $.proxy(that._zoomto, that)
            });
    }

    , _zoomto: function(georesult) {
        var map = this._map
            , popup=new L.Popup();

        map.fitBounds(georesult.bounds);
        //L.rectangle(georesult.bounds, {color: "#ff7800", weight: 1}).addTo(map);
        popup.setLatLng(georesult.latlng).setContent(georesult.content).addTo(map);
        map.openPopup(popup);
    }

    , _none: function (arg) {
        arg.cb(null);
    }

    , _tile_proto: function(url, options, cb) {
        cb(new L.TileLayer(url, options))
    }

    , _osm: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                , {
                    attribution: attrs.osm
                }
            )
        )
    }

    , _osmbw: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png'
                , {
                    attribution: attrs.osm
                }
            )
        )
    }

    , _cloudmade: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile.cloudmade.com/{key}/997/256/{z}/{x}/{y}.png'
                , {
                    attribution: attrs.osm + ', ' + attrs.cloudmade
                    , key: that.options.apikeys.cloudmade
                }
            )
        )
    }

    , _opencyclemap: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                , {
                    attribution: attrs.opencyclemap + ', ' + attrs.osm
                }
            )
        )
    }

    , _opencyclemapTransport: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png'
                , {
                    attribution: attrs.opencyclemap + ', ' + attrs.osm
                }
            )
        )
    }

    , _opencyclemapLandscape: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png'
                , {
                    attribution: attrs.opencyclemap + ', ' + attrs.osm
                }
            )
        )
    }

    , _mapquest: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg'
                , {
                    attribution: attrs.mapquest + ', ' + attrs.osm
                    , subdomains: '1234'
                }
            )
        )
    }

    , _mapquestAerial: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg'
                , {
                    attribution: attrs.mapquest + ', ' + 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
                    , subdomains: '1234'
                }
            )
        )
    }

    , _stamenToner: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png'
                , {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>'
                    , maxZoom: 20
                }
            )
        )
    }

    , _stamenTerrain: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg'
                , {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>'
                    , minZoom: 4
                    , maxZoom: 18
                }
            )
        )
    }

    , _stamenWatercolor: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg'
                , {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>'
                    , minZoom: 3
                    , maxZoom: 16
                }
            )
        )
    }

    , _esri: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
                , {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                }
            )
        )
    }

    , _esriTopo: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
                , {
                    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                }
            )
        )
    }

    , _esriImagery: function(arg) {
        var attrs = this.options.attributions;
        arg.cb(
            new L.TileLayer(
                'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                , {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                }
            )
        )
    }

    , _loadGoogleApi: function(onLoadFn) {
        if ((typeof google === 'undefined') || (typeof google.maps==='undefined')) {
            $.getScript('https://www.google.com/jsapi', function() {
                google.load('maps', '3', {
                    other_params: 'sensor=false'
                    , callback: function() {
                        onLoadFn();
                    }
                });
            });
        } else onLoadFn();
    }

    , _google: function(arg) {
        this._loadGoogleApi(function () {
            arg.cb(new L.Google('ROADMAP'));
        });
    }

    , _googleSatellite: function(arg) {
        this._loadGoogleApi(function () {
            arg.cb(new L.Google('SATELLITE'));
        });
    }

    , _googleHybrid: function(arg) {
        this._loadGoogleApi(function () {
            arg.cb(new L.Google('HYBRID'));
        });
    }

    , _googleTerrain: function(arg) {
        this._loadGoogleApi(function () {
            arg.cb(new L.Google('TERRAIN'));
        });
    }

    , _bing: function(arg) {
        arg.cb(new L.BingLayer(this.options.apikeys.bing, {type:'Road'}));
    }

    , _bingAerial: function(arg) {
        arg.cb(new L.BingLayer(this.options.apikeys.bing, {type:'Aerial'}));
    }

    , _bingHybrid: function(arg) {
        arg.cb(new L.BingLayer(this.options.apikeys.bing, {type:'AerialWithLabels'}));
    }

    ,_wikimapia: function(arg) {
        arg.cb(
            new L.tileLayer('http://{s}{hash}.wikimapia.org/?x={x}&y={y}&zoom={z}&r=7071412&type=&lng=1',
                {
                    // Fix L.Util.template to use this https://github.com/Leaflet/Leaflet/pull/1554
                    hash: function (data) {
                      return data.x % 4 + (data.y % 4) *4;
                    }
                    , subdomains : 'i'
                    , maxZoom: 18
                    , attribution: '<a href="http://wikimapia.org" target="_blank">Wikimapia.org</a>'
                }
            )
        )
    }

    ,_wikimapiaHybrid: function(arg) {
        arg.cb(
            new L.tileLayer('http://{s}{hash}.wikimapia.org/?x={x}&y={y}&zoom={z}&r=7071412&type=hybrid&lng=1',
                {
                    // Fix L.Util.template to use this https://github.com/Leaflet/Leaflet/pull/1554
                    hash: function (data) {
                      return data.x % 4 + (data.y % 4) *4;
                    }
                    , subdomains : 'i'
                    , maxZoom: 18
                    , attribution: '<a href="http://wikimapia.org" target="_blank">Wikimapia.org</a>'
                }
            )
        )
    }

    , _wikimapiaApi: function (arg) {
        arg.cb(
            new L.WikimapiaAPI({
                key : this.options.apikeys.wikimapia
                , onActiveFeature: function (feature, layer) {
                    if (feature.name && feature.url) {
                      layer
                        .bindLabel(feature.name)
                        .bindPopup('<a target="_blank" href="'+feature.url+'">'+ feature.name + '</a>');
                    }
                }
                , style: function(feature) {
                    switch (feature.name) {
                      case 'Kitai-gorod': return {color: "#ff0000"};
                    }
                }
            })
        );
    }

    , createIndentifyLayer: function(clickCallback) {
        return L.Class.extend({

            initialize: function () {
                this._identifyProxy = $.proxy(this._identify, this)
            }

            , onAdd: function (map) {
                this._map = map;
                map.on('click', this._click, this);
            }

            , onRemove: function (map) {
                map.off('click', this._click, this);
            }

            , _click: function (e) {
                clickCallback(e.latlng, this._identifyProxy);
            }

            , _identify: function (georesult) {
                (new L.Popup())
                    .setLatLng(georesult.latlng)
                    .setContent(georesult.content)
                    .openOn(this._map);
            }
        });
    }

    , _osmIdentify: function(arg) {
        var that = this;

            var identify = function (latlng, cb) {

                $.ajax({
                    url : 'http://nominatim.openstreetmap.org/reverse'
                    , dataType : 'jsonp'
                    , jsonp : 'json_callback'
                    , data : {
                        'lat' : latlng.lat
                        , 'lon': latlng.lng
                        , 'format' : 'json'
                    }
                })
                .done(function(data){
                    if (data) {
                        var res=data;
                        cb({
                            content : res.display_name
                            , latlng : new L.LatLng(res.lat, res.lon)
                        });
                    }
                });

            }

            arg.cb(
                new (that.createIndentifyLayer(identify))()
            );

    }

    , _googleIdentify: function(arg) {
        var that = this;

        this._loadGoogleApi(function () {

            var identify = function (latlng, cb) {

                var geocoder = new google.maps.Geocoder();
                geocoder.geocode( { 'latLng': new google.maps.LatLng(latlng.lat, latlng.lng)}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var res=results[0];
                        cb({
                            content : res.formatted_address
                            , latlng : new L.LatLng(res.geometry.location.lat(), res.geometry.location.lng())
                            , bounds : new L.LatLngBounds([
                                res.geometry.viewport.getSouthWest().lat(), res.geometry.viewport.getSouthWest().lng()
                                ], [
                                res.geometry.viewport.getNorthEast().lat(), res.geometry.viewport.getNorthEast().lng()
                            ])
                        });
                    }
                });
            }

            arg.cb(
                new (that.createIndentifyLayer(identify))()
            );
        });
    }

    , _bingIdentify: function(arg) {
        var that = this;

            var identify = function (latlng, cb) {

            $.ajax({
                url : 'http://dev.virtualearth.net/REST/v1/Locations/'+latlng.lat+','+latlng.lng
                , dataType : 'jsonp'
                , jsonp : 'jsonp'
                , data : {
                    'key' : that.options.apikeys['bing']
                }
            })
            .done(function(data){
                if ((data.resourceSets.length>0) && (data.resourceSets[0].resources.length>0)) {
                    var res=data.resourceSets[0].resources[0];
                    cb({
                        content : res.name
                        , latlng : new L.LatLng(res.point.coordinates[0], res.point.coordinates[1])
                        , bounds : new L.LatLngBounds([res.bbox[0], res.bbox[1]], [res.bbox[2], res.bbox[3]])
                    });
                }
            });

            }

            arg.cb(
                new (that.createIndentifyLayer(identify))()
            );

    }


/*
 * Geocoders
 *
 * Geocoder function must call callback arg.cb and pass object
 *   arg.cb({
 *       content : string
 *       , latlng : L.LatLng
 *       , bounds : L.LatLngBounds
 *
 *   })
 *
 *   arg: {
 *       query : query
 *       , bounds : that._map.getBounds()
 *       , zoom : that._map.getZoom()
 *       , cb : function
 *   }
 *
 */

    , _osmGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        $.ajax({
            url : 'http://nominatim.openstreetmap.org/search'
            , dataType : 'jsonp'
            , jsonp : 'json_callback'
            , data : {
                'q' : query
                , 'format' : 'json'
            }
        })
        .done(function(data){
            if (data.length>0) {
                var res=data[0];
                cb({
                    content : res.display_name
                    , latlng : new L.LatLng(res.lat, res.lon)
                    , bounds : new L.LatLngBounds([res.boundingbox[0], res.boundingbox[2]], [res.boundingbox[1], res.boundingbox[3]])
                });
            }
        });
    }

    , _googleGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        this._loadGoogleApi(function () {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode( { 'address': query}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var res = results[0]
                        , bounds = res.geometry.bounds ? res.geometry.bounds : res.geometry.viewport;
                        cb({
                            content : res.formatted_address
                            , latlng : new L.LatLng(res.geometry.location.lat(), res.geometry.location.lng())
                            , bounds : new L.LatLngBounds([
                                bounds.getSouthWest().lat(), bounds.getSouthWest().lng()
                                ], [
                                bounds.getNorthEast().lat(), bounds.getNorthEast().lng()
                            ])
                        });
                    }
                });
            });
    }

    , _bingGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        $.ajax({
            url : 'http://dev.virtualearth.net/REST/v1/Locations'
            , dataType : 'jsonp'
            , jsonp : 'jsonp'
            , data : {
                'q' : query
                , 'key' : that.options.apikeys['bing']
            }
        })
        .done(function(data){
            if ((data.resourceSets.length>0) && (data.resourceSets[0].resources.length>0)) {
                var res=data.resourceSets[0].resources[0];
                cb({
                    content : res.name
                    , latlng : new L.LatLng(res.point.coordinates[0], res.point.coordinates[1])
                    , bounds : new L.LatLngBounds([res.bbox[0], res.bbox[1]], [res.bbox[2], res.bbox[3]])
                });
            }
        });
    }

    , _esriGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        $.ajax({
            url : 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find'
            , dataType : 'jsonp'
            , data : {
                'text' : query
                , 'f' : 'pjson'
            }
        })
        .done(function(data){
            if (data.locations.length>0) {
                var res=data.locations[0];
                cb({
                    content : res.name
                    , latlng : new L.LatLng(res.feature.geometry.y, res.feature.geometry.x)
                    , bounds : new L.LatLngBounds([res.extent.ymin, res.extent.xmin], [res.extent.ymax, res.extent.xmax])
                });
            }
        });
    }

    //TODO: implement cloudmade http://developers.cloudmade.com/wiki/geocoding-http-api/Documentation
    //TODO: implement yahoo http://where.yahooapis.com/geocode?location=moscow,RU&flags=J&callback=qwe&count=1

    , _geonamesGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        $.ajax({
            url : 'http://ws.geonames.org/searchJSON'
            , dataType : 'jsonp'
            , data : {
                'q' : query
                , 'style' : 'full'
                , 'maxRows' : '1'
            }
        })
        .done(function(data){
            if (data.geonames.length > 0) {
                var res=data.geonames[0];
                cb({
                    content : res.name
                    , latlng : new L.LatLng(res.lat, res.lng)
                    , bounds : new L.LatLngBounds([res.bbox.south, res.bbox.west], [res.bbox.north, res.bbox.east])
                });
            }
        });
    }

    , _mapquestGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        $.ajax({
            url : 'http://www.mapquestapi.com/geocoding/v1/address'
            , dataType : 'jsonp'
            , data : {
                'location' : query
                , 'key' : that.options.apikeys['mapquest']
                , 'outFormat' : 'json'
                , 'maxResults' : '1'
            }
        })
        .done(function(data){
            if (data.results.length > 0 && data.results[0].locations.length > 0) {
                var res=data.results[0]
                    , location = res.locations[0].latLng;
                cb({
                    content : res.providedLocation.location
                    , latlng : new L.LatLng(location.lat, location.lng)
                    , bounds : new L.LatLngBounds([location.lat-1, location.lng-1], [location.lat+1, location.lng+1])
                });
            }
        });
    }

    , _nokiaGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;

        $.ajax({
            url : 'http://geo.nlp.nokia.com/search/6.2/geocode.json'
            , dataType : 'jsonp'
            , jsonp : 'jsoncallback'
            , data : {
                'searchtext' : query
                , 'app_id' : that.options.apikeys['nokia']
            }
        })
        .done(function(data){
            if (data.Response.View.length > 0 && data.Response.View[0].Result.length > 0) {
                var res=data.Response.View[0].Result[0];
                cb({
                    content : res.name
                    , latlng : new L.LatLng(res.Location.DisplayPosition.Latitude, res.Location.DisplayPosition.Longitude)
                    , bounds : new L.LatLngBounds([res.extent.ymin, res.extent.xmin], [res.extent.ymax, res.extent.xmax])
                });
            }
        });
    }

});

// Support functions in L.Util.template https://github.com/Leaflet/Leaflet/pull/1554
if (L.version == '0.5.1') {

  L.Util.template = function (str, data) {
    return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
      var value = data[key];
      if (!data.hasOwnProperty(key)) {
        throw new Error('No value provided for variable ' + str);
      } else if (typeof value === 'function') {
        value = value(data);
      }

      return value;
    });
  }

}
