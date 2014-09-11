L.GeoManager.UACadastreGeocode = function (options) {

    var that=this
    , cadnum = options.query
    , cadparts = cadnum.split(':')
    , cadjoin = cadparts.join('')
    //, bounds = arg.bounds
    , unproject = function (x, y) {
        var earthRadius = 6378137;
        return L.CRS.EPSG900913.projection.unproject((new L.Point(x, y)).divideBy(earthRadius));
    }
    , ajaxopt
    , ajaxtype
    , zoom;

    var dfd = new jQuery.Deferred();

    var ajaxopt = {       
        url : 'http://212.26.144.110/kadastrova-karta/find-Parcel'
        , type: 'GET'
        , dataType : 'json'
        , data : {
            'cadnum' : cadnum
        }
    };

    $.ajax(ajaxopt)
    .done(function(data){
        if (data.data && data.data.length>0) {
            var epsg900913 = '+proj=merc+a=6378137+b=6378137+lat_ts=0.0+lon_0=0.0+x_0=0.0+y_0=0+k=1.0+units=m+nadgrids=@null+wktext+over+no_defs';
            var res=data.data[0]
                , epsg4284  = '+proj=longlat+ellps=kras+towgs84=23.92,-141.27,-80.9,-0,0.35,0.82,-0.12+no_defs'
                , epsg4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
                , point1 = proj4(epsg4284, epsg4326, [res.st_xmin,res.st_ymin])
                , point2 = proj4(epsg4284, epsg4326, [res.st_xmax,res.st_ymax])
                , bounds = new L.LatLngBounds([point1[1],point1[0]], [point2[1],point2[0]])
                , cadnumparts = cadnum.split(':') 
                , koatuu = cadnumparts[0]
                , zone = cadnumparts[1]
                , quartal = cadnumparts[2]
                , parcel = cadnumparts[3]
                , ajaxopt2 = {       
                    url : 'http://212.26.144.110/kadastrova-karta/get-parcel-Info'
                    , type: 'GET'
                    , dataType : 'json'
                    , data : {
                        'koatuu' : koatuu,
                        'zone':zone,
                        'quartal':quartal,
                        'parcel':parcel
                    }
                };
                
                $.ajax(ajaxopt2)
                .done(function(data2){
                  if (data2.data && data2.data.length>0) {
                    var res2 = data2.data[0];

                    var content = ''
                      + 'Кадастровый номер: ' + res2.cadnum + '<br/>' 
                      + 'Использование: ' +  res2.use + '<br/>' 
                      + 'Площадь: ' + res2.area + ' ' + res2.unit_area + '<br/>' 
                      + 'Целевое назначение: ' + res2.purpose;
 
                    dfd.resolve({
                        content : content 
                        , latlng : bounds.getCenter()
                        , bounds : bounds
                        , layer: new L.Rectangle(bounds)
                    });
                  }

                });

        }
    });




    return dfd.promise();
}