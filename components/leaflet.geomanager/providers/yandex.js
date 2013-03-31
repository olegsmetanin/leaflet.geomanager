
L.GeoManager.include({

    _loadYandexApi: function(onLoadFn) {
        if (typeof ymaps === 'undefined') {
            $.getScript('http://api-maps.yandex.ru/2.0/?load=package.map&lang=' + (window.navigator.userLanguage || window.navigator.language), function() {
                onLoadFn();
            });
        } else onLoadFn();
    }

    , _yandex: function(arg) {
        this._loadYandexApi(function () {
            arg.cb(new L.Yandex('map'));
        });
    }

    , _yandexSatellite: function(arg) {
        this._loadYandexApi(function () {
            arg.cb(new L.Yandex('satellite'));
        });
    }

    , _yandexHybrid: function(arg) {
        this._loadYandexApi(function () {
            arg.cb(new L.Yandex('hybrid'));
        });
    }

    , _yandexPublicmap: function(arg) {
        this._loadYandexApi(function () {
            arg.cb(new L.Yandex('publicMap'));
        });
    }

    , _yandexPublicmapHybrid: function(arg) {
        this._loadYandexApi(function () {
            arg.cb(new L.Yandex('publicMapHybrid'));
        });
    }


    , _yandexIdentify: function(arg) {
        var that = this;

            var identify = function (latlng, cb) {

                $.ajax({
                    url : 'http://geocode-maps.yandex.ru/1.x/'
                    , dataType : 'jsonp'
                    , data : {
                        'geocode' : latlng.lng + ',' + latlng.lat
                        , 'format' : 'json'
                    }
                })
                .done(function(data){
                    if (data.response.GeoObjectCollection.featureMember.length>0) {
                        var res=data.response.GeoObjectCollection.featureMember[0].GeoObject
                            , points = res.Point.pos.split(' ')
                            , lowerCorner = res.boundedBy.Envelope.lowerCorner.split(' ')
                            , upperCorner = res.boundedBy.Envelope.upperCorner.split(' ')
                            , content = res.metaDataProperty.GeocoderMetaData.text;

                        cb({
                            content : content
                            , latlng : new L.LatLng(points[1], points[0])
                            , bounds : new L.LatLngBounds([lowerCorner[1], lowerCorner[0]], [upperCorner[1], upperCorner[0]])
                        });
                    }
                });

            }

            arg.cb(
                new (that.createIndentifyLayer(identify))()
            );
    }

    , _yandexGeocode: function(arg) {
        var that = this
            , query = arg.query
            , cb = arg.cb;
        // http://api.yandex.ru/maps/doc/geocoder/desc/concepts/input_params.xml
        $.ajax({
            url : 'http://geocode-maps.yandex.ru/1.x/'
            , dataType : 'jsonp'
            , data : {
                'geocode' : query
                , 'format' : 'json'
            }
        })
        .done(function(data){
            if (data.response.GeoObjectCollection.featureMember.length>0) {
                var res=data.response.GeoObjectCollection.featureMember[0].GeoObject
                    , points = res.Point.pos.split(' ')
                    , lowerCorner = res.boundedBy.Envelope.lowerCorner.split(' ')
                    , upperCorner = res.boundedBy.Envelope.upperCorner.split(' ')
                    , content = res.metaDataProperty.GeocoderMetaData.text;

                cb({
                    content : content
                    , latlng : new L.LatLng(points[1], points[0])
                    , bounds : new L.LatLngBounds([lowerCorner[1], lowerCorner[0]], [upperCorner[1], upperCorner[0]])
                });
            }
        });
    }

});

L.extend(L.GeoManager.prototype.options.providers, {
        //overlays
        'yandex': L.GeoManager.prototype._yandex
        , 'yandex-satellite': L.GeoManager.prototype._yandexSatellite
        , 'yandex-hybrid': L.GeoManager.prototype._yandexHybrid
        , 'yandex-publicmap': L.GeoManager.prototype._yandexPublicmap
        , 'yandex-publicmap-hybrid': L.GeoManager.prototype._yandexPublicmapHybrid
        //identifiers
        , 'yandex-identify' : L.GeoManager.prototype._yandexIdentify
        // geocoders
        , 'yandex-geocode' : L.GeoManager.prototype._yandexGeocode
});