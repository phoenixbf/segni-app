//const segniLatLon = [13.0073387, 41.6906772];

let params = new URLSearchParams(window.location.search);

let lang = "it";
if (params.get('lan')) lang = params.get('lan');

console.log(lang)

let map = undefined;
let markers = undefined;

let extents = {
    min: undefined,
    max: undefined
};

const configList = [
    "01","02","03","04","05","06"
];

let onConfLoaded = (data)=>{
    let cx = extents.max[0]-extents.min[0];
    let cy = extents.max[1]-extents.min[1];

    cx = (cx * 0.5) + extents.min[0];
    cy = (cy * 0.5) + extents.min[1];

    map.getView().setCenter( [cx,cy] );
};

let loadConfig = (conf)=>{
    $.getJSON( "config/"+conf+"-"+lang+".json", ( data )=>{
        let shift = data.shift;
        let list = [];

        let C = [0.0,0.0];

        let idmain = data.main;
        if (idmain === undefined) return;

        let P = data.network[idmain];

        C[0] = shift[0] + P.pos[0];
        C[1] = shift[1] - P.pos[2];

        if (extents.min === undefined){
            extents.min = [];
            extents.min.push(C[0]);
            extents.min.push(C[1]);
        }
        else {
            if (C[0]<extents.min[0]) extents.min[0] = C[0];
            if (C[1]<extents.min[1]) extents.min[1] = C[1];
        }

        if (extents.max === undefined){
            extents.max = [];
            extents.max.push(C[0]);
            extents.max.push(C[1]);
        }
        else {
            if (C[0]>extents.max[0]) extents.max[0] = C[0];
            if (C[1]>extents.max[1]) extents.max[1] = C[1];
        }

        let marker = new ol.Feature({
            name: P.name,
            url: "c="+conf+"-"+lang + "&p="+idmain,
            geometry: new ol.geom.Point( C ),
            label: data.title
        });

        let iconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.5],
                src: "content/ui/loc.png",
                //anchor: [0.1, 0.5],
                //src: "content/ui/"+data.icon,
                //color: places[i][3],
            }),

            text: new ol.style.Text({
                //font: '20px Calibri',
                font: 'bold 20px Calibri',
                text: marker.get('label'),
                placement: 'line',
                fill: new ol.style.Fill({ color: '#000' }),
                stroke: new ol.style.Stroke({
                    color: '#fff', // '#fce4cf',
                    width: 2
                }),
                offsetY: -35
            })
        });

        marker.setStyle(iconStyle);
        markers.getSource().addFeature(marker);

        onConfLoaded(data);
        
/*
        for (let p in data.network){
            let P = data.network[p];
            let C = [0.0,0.0];

            C[0] = shift[0] + P.pos[0];
            C[1] = shift[1] - P.pos[2];

            let marker = new ol.Feature({
                name: P.name,
                url: "c="+conf+"-"+lang + "&p="+p,
                geometry: new ol.geom.Point( C )
            });

            //list.push(P.pos);
            list.push(C);

            markers.getSource().addFeature(marker);
        }

        if (list.length < 1) return;

        let avg = [0.0,0.0]
        for (let m in list){
            avg[0] += list[m][0];
            avg[1] += list[m][1];
        }

        avg[0] = parseFloat(avg[0] / list.length);
        avg[1] = parseFloat(avg[1] / list.length);

        map.getView().setCenter( avg );
*/
    });
};

let loadConfigs = ()=>{
    for (let c in configList){
        let conf = configList[c];

        loadConfig(conf);
    }
};



let welcomeText = ()=>{
    let wtext = {};
    wtext.it = "<b>Benvenuti a Segni</b>, città a sud di Roma, posizionata sul versante occidentale dei Monti Lepini, in posizione dominante rispetto alla valle del Sacco e con una lunga e incredibile storia. Grazie alle nuove tecnologie, vi racconteremo i principali monumenti di Segni facendovi fare un viaggio nel tempo a portata di un click.<br>Il primo grande monumento dell’antica “Signia”, così era chiamata da Tarquinio il Superbo,  è la città stessa: disegnata e pensata da un ignoto urbanista, il centro storico di Segni sorge sulla struttura dell’antica città. Ancora oggi le strade e le piazze del centro storico ricalcano quelle dell’antica città, organizzata su ampie terrazze scalari, realizzate in opera poligonale di calcare.<br>Le prime tracce di un abitato, circoscritto unicamente nella parte alta della città, sulla sommità del monte, risalgono all’XI secolo a.C., ma è soltanto verso la fine del VI inizi del V secolo a.C. che la città si struttura nella forma e nell’aspetto che noi ancora oggi possiamo vedere.";

    wtext.en = "<b>Welcome to Segni</b>, a city in the south of Rome, located on the western side of the Lepini Mountains, in a dominant position with respect to the Sacco valley and with a long and incredible history. Thanks to new technologies, we will tell you about the main monuments of Segni allowing you to take a journey through time just a click away.<br>The first great monument of the ancient 'Signia', as it was called by Tarquinio il Superbo, it is the city itself: designed and conceived by an unknown urban planner, the historic center of Segni stands on the structure of the ancient city. Even today, the streets and squares of the historic center follow those of the ancient city, organized on large scaled terraces, made of polygonal limestone.<br>The first traces of an inhabited area, limited only to the upper part of the city, on the top of the mountain, date back to the 11th century BC, but it is only at the end of the 6th century, beginning of the 5th century BC. that the city is structured in the form and appearance that we can still see today.";

    $("#idWelcomeText").html( wtext[lang] );

};

window.onload = ()=>{
    welcomeText();

    loadConfigs();

    proj4.defs('EPSG:3004', '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.999600 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs');
    //console.log(ol.proj)
    ol.proj.proj4.register(proj4);

    map = new ol.Map({
        target: 'map',

        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
                /*source: new ol.source.Stamen({
                    layer: 'toner-lite', // watercolor
                }),*/
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
            projection: 'EPSG:3004', //cproj,
            center: [0,0],
            //center: pins[0], //ol.proj.fromLonLat( segniLatLon ),
            zoom: 16,
            //extent: [-572513.341856, 5211017.966314, 916327.095083, 6636950.728974],
        })
    });

    // Markers
    markers = new ol.layer.Vector({
        source: new ol.source.Vector(),
/*
        style: new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.5], //0.5,1.0
                src: 'content/ui/loc.png'
            })
        })
*/
    });
    
    map.addLayer(markers);

    // tap handling
    map.on('click', function(evt){ // 'pointermove'
        map.forEachFeatureAtPixel(evt.pixel, (feature)=>{
            let name = feature.A.name;
            let eurl = feature.A.url;
            
            ATON.Utils.goToURL("explore.html?"+eurl);
            return name;
        });
    });

/*
    map.on('singleclick', function(event){
        if (map.hasFeatureAtPixel(event.pixel) === true){
            let coord = event.coordinate;
            console.log(coord)

            //ATON.Utils.goToURL("explore.html?c=01-it");
        }
    });
*/
};