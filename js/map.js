const segniLatLon = [13.0073387, 41.6906772];

const pins = [
    //[13.0073387, 41.6906772]
    [2355643, 4617999]
];
/*
const raster = new ol.RasterSource({
  sources: [
    new ol.source.Stamen({
      layer: 'watercolor',
    }),
  ]
});
*/

let welcomeText = ()=>{
    let txt = "Benvenuti a Segni, città a sud di Roma, posizionata sul versante occidentale dei Monti Lepini, in posizione dominante rispetto alla valle del Sacco e con una lunga e incredibile storia. Grazie alle nuove tecnologie, vi racconteremo i principali monumenti di Segni facendovi fare un viaggio nel tempo a portata di un click.<br>Il primo grande monumento dell’antica “Signia”, così era chiamata da Tarquinio il Superbo,  è la città stessa: disegnata e pensata da un ignoto urbanista, il centro storico di Segni sorge sulla struttura dell’antica città. Ancora oggi le strade e le piazze del centro storico ricalcano quelle dell’antica città, organizzata su ampie terrazze scalari, realizzate in opera poligonale di calcare.<br>Le prime tracce di un abitato, circoscritto unicamente nella parte alta della città, sulla sommità del monte, risalgono all’XI secolo a.C., ma è soltanto verso la fine del VI inizi del V secolo a.C. che la città si struttura nella forma e nell’aspetto che noi ancora oggi possiamo vedere.";

    $("#idWelcomeText").html(txt);

};

window.onload = ()=>{
    welcomeText();

    let map = new ol.Map({
        target: 'map',

        layers: [
/*
            new ol.layer.Tile({
                className: "multiply",
                source: new ol.source.Stamen({
                    layer: 'watercolor'
                }), //new ol.source.OSM()
            }),
*/
            new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: 'toner-lite',
                }), //new ol.source.OSM()
            })
        ],
/*
        layers: [
            new ImageLayer({
                //source: raster,
            }),
        ],
*/
        view: new ol.View({
            center: ol.proj.fromLonLat( segniLatLon ),
            zoom: 14
        })
    });

    // Markers
    let markers = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.5], //0.5,1.0
                src: 'content/maps/loc.png'
            })
        })
    });
    
    map.addLayer(markers);

    for (let p in pins){
        let C = pins[p];

        //let P = ol.proj.fromLonLat(C);
        let P = ol.proj.transform(C, 'EPSG:3004', 'EPSG:3857');

        let marker = new ol.Feature(new ol.geom.Point( P ));
        markers.getSource().addFeature(marker);
    }

    map.on('singleclick', function(event){
        if (map.hasFeatureAtPixel(event.pixel) === true){
            let coord = event.coordinate;
            console.log(coord)

            ATON.Utils.goToURL("explore.html?c=01-it");
        }
    });
};