/*
	Montebelluna Web-App
    based on ATON framework

    author: bruno.fanini@ispc.cnr.it

===============================================*/

ATON.PATH_RES        = "res/";
ATON.PATH_DRACO_LIB  = "dist/draco/";
ATON.PATH_COLLECTION = "content/";

let APP = {};
window.APP = APP;

APP.FOV_STD = 70.0;

//APP.P_MODERN = 0;
//APP.P_PAST   = 1;

APP.contentDir = "content/";
APP.audioDir   = "audio/";

APP.conf = undefined;

APP.argConf = undefined;
APP.argPano = undefined;

APP.currperiod = "m";

APP._bFirstPOV = false;
APP._rotOffset = new THREE.Vector3(0.0, -(Math.PI * 0.5), 0.0);
//APP._rotOffset = new THREE.Vector3(0.0, -(Math.PI*2.0), 0.0);

APP._bShowingPanel = false;
APP.auGen = undefined;
APP._bAudio = false;



APP.init = ()=>{
    // Realize the base front-end
    ATON.FE.realize();

    // Our events
    APP.setupEvents();

    ATON.setDefaultPixelDensity(2.0);
    
    //ATON.setTimedGazeDuration(2.0);

    ATON.FE.popupBlurBG = 0.0;

    //ATON.setMainPanoramaInfinite(false);

    //ATON.Nav.setHomePOV( new ATON.POV().setPosition(0,0,0).setTarget(0,0,-1).setFOV(APP.FOV_STD) );

    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
    
    $("#idTopToolbar").append( APP.buildSlider("idSlider") );
    //ATON.FE.uiAddButtonDeviceOrientation("idTopToolbar");

    ATON.Nav.setFirstPersonControl();
    ATON.Nav.setFOV(APP.FOV_STD);

    $("#idSlider").on("input change",()=>{
        let v = parseInt( $("#idSlider").val() );

        if (v === 0) APP.switchToPeriod("a");
        else APP.switchToPeriod("m");
    });

    //$("#idPanel").hide();

    APP.buildSUI();

    // Materials
    APP._matSem   = ATON.MatHub.materials.semanticShape;
    //APP._matSemHL = ATON.MatHub.materials.semanticShapeHL;
    APP._matSemHL = ATON.MatHub.materials.defUI.clone();
    APP._matSemHL.uniforms.color.value = new THREE.Color(0,1,0.5);
    APP._matSemHL.uniforms.opacity.value = 0.4;

    // Load config
    APP.argConf = ATON.FE.urlParams.get('c');
    if (APP.argConf) APP.loadConfig("config-"+ APP.argConf + ".json");

    if (ATON.FE.urlParams.get('p') !== null){
        APP.argPano = parseInt( ATON.FE.urlParams.get('p') );
        console.log("Initial pano: " + APP.argPano);
    }

    // update routine
    //ATON.addUpdateRoutine( APP.update );

    // XPF
    let rf = ATON.device.isMobile? "-4k-" : "-8k-";

    ATON.XPFNetwork.setPathModifier((path)=>{
        console.log(path)
        let p = path + rf + APP.currperiod + ".jpg";
        return p;
    });
};

APP.switchToPeriod = (pname)=>{
    if (pname === APP.currperiod) return;

    APP.currperiod = pname;
    ATON.XPFNetwork.updateCurrentXPFbaseLayer();

    APP.filterSemantics();
};

// Update
APP.update = ()=>{
/*
    if (ATON.XPFNetwork._iNext !== undefined){
        APP.suiLabel.orientToCamera();
    }
*/

    //if (ATON._queryDataSem) console.log(ATON._queryDataSem);
    //if (ATON._queryDataUI)  console.log(ATON._queryDataUI);
};

APP.filterSemantics = ()=>{
    let p = APP.conf.network[ ATON.XPFNetwork.getCurrentXPFindex() ];
    if (p === undefined) return;

    if (p.semlist === undefined){
        for (let j in APP._semlist) ATON.getSemanticNode(APP._semlist[j]).show();
        return;
    }

    // Clear all
    for (let j in APP._semlist) ATON.getSemanticNode(APP._semlist[j]).hide();

    let proxiesList = p.semlist[APP.currperiod];
    //console.log(proxiesList)

    if (proxiesList !== undefined){
        for (let j in proxiesList){
            let S = ATON.getSemanticNode(proxiesList[j]);
            if (S !== undefined) S.show();
            //console.log(S)
        }
    }
};

// Load config
APP.loadConfig = (path)=>{
    return $.getJSON( path, ( data )=>{
        //console.log(data);
        console.log("Loaded config: "+path);

        APP.conf = data;

        if (data.network){
            for (let i in data.network){
                let d = data.network[i];

                let xpf = new ATON.XPF();

                xpf.setBaseLayer(d.name);
                xpf.setLocation(d.pos[0],d.pos[1],d.pos[2]);

                let rx = APP._rotOffset.x;
                let ry = APP._rotOffset.y;
                let rz = APP._rotOffset.z;

                if (d.rot !== undefined){
                    rx += d.rot[0];
                    ry += d.rot[1];
                    rz += d.rot[2];
                }

                xpf.setRotation( rx,ry,rz );

                ATON.XPFNetwork.add( xpf );
            }
        }

        ATON.createSemanticNode("mainsem").attachToRoot();

        APP._semlist = [];

        if (data.sem){
            for (let a in data.sem){
                let A = ATON.createSemanticNode(a);
                
                APP._semlist.push(a);
                
                //A.load("proxies/"+a+".glb", ()=>{ A.enablePicking() }).attachTo("mainsem");
                A.load("proxies/"+a+".glb").attachTo("mainsem");

                A.setMaterial( APP._matSem );
                A.setDefaultAndHighlightMaterials( APP._matSem, APP._matSemHL );

                //A.setScale(20.0)
                
                //A.frustumCulled = false;
                //A.enablePicking();

                //A.onHover = ()=>{ console.log(a); };

                //A.onHover = ()=>{ console.log(a); };
                //console.log(A);
            }

            ATON._bqSem = true;
            //ATON._bQuerySemOcclusion = true;
            //ATON._bqScene = true;

            console.log(APP._semlist)
            
            //console.log(ATON._rootSem);
        }

        ATON.fireEvent("APP_ConfigLoaded");
    });
};

APP.getThumbImageURL = (covername)=>{
    return APP.contentDir + "images/thumbs/" + covername;
};

APP.stopCurrAudioIfPlaying = ()=>{
    if (APP.auGen){
        if (APP.auGen.isPlaying) APP.auGen.stop();
    }

    APP._bAudio = false;
    ATON._bPauseQuery = false;
};

APP.updatePanel = (semid)=>{
    if (APP.conf === undefined) return;
    if (APP.conf.sem === undefined) return;
    
    let S = APP.conf.sem[semid];
    if (S === undefined) return;

    $("#idPanel").show();
    APP._bShowingPanel = true;
    //ATON._bPauseQuery  = true;

    if (S.audio && S.audio.length>3){
        APP.stopCurrAudioIfPlaying();

        if (!APP._bAudio){
            APP.auGen = ATON.AudioHub.playOnceGlobally(APP.audioDir + S.audio);
            APP._bAudio = true;
            ATON._bPauseQuery = true;

            APP.auGen.onEnded = ()=>{
                APP._bAudio = false;
                ATON._bPauseQuery = false;  
            };
        }
    }

    let htmlcode = "";
    

    htmlcode += "<div class='atonPopupTitle'>"; // style='position:absolute; z-index:110; background-color:rgba(0,0,0, 0.8)'
    htmlcode += "<div id='idPanelClose' class='atonBTN atonBTN-rec' style='float:left; margin:0px'>X</div>";
    //htmlcode += "<div id='idPanelPlayStop' class='atonBTN' style='float:left;margin:0px'>P</div>";
    htmlcode += S.title+"</div>";

    htmlcode += "<div class='atonSidePanelContent' style='height: calc(100% - 50px);'>";
    if (S.cover && S.cover.length>3) htmlcode += "<img src='"+APP.getThumbImageURL(S.cover)+"'>";
    htmlcode += "<div class='descriptionText'>"+S.descr+"</div>";
    htmlcode += "</div>";

    //htmlcode += "<div id='idPanelClose' class='atonBTN atonBTN-red atonSidePanelCloseBTN' >X</div>";

    $("#idPanel").html(htmlcode);

    $("#idPanelClose").click(()=>{
        $("#idPanel").hide();
        APP._bShowingPanel = false;
        ATON._bPauseQuery  = false;

        APP.stopCurrAudioIfPlaying();
    });
};


// Our events
APP.setupEvents = ()=>{
    ATON.on("APP_ConfigLoaded",()=>{
        //ATON.Nav.requestHome();

        //APP.popupStart();

        if (APP.argPano !== undefined) ATON.XPFNetwork.requestTransitionByIndex(APP.argPano);
        else ATON.XPFNetwork.requestTransitionByIndex(0);
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{
        console.log("All nodes loaded");
        APP.filterSemantics();
    });

    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S) S.restoreDefaultMaterial();

        //$("#idPanel").hide();

        //console.log(semid);
    });
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S) S.highlight();

        //if (APP._bShowingPanel) return;
        //APP.updatePanel(semid);

        //console.log(semid);
    });

    ATON.on("Tap", (e)=>{
        if (ATON._bPauseQuery) return;

        APP.updatePanel(ATON._hoveredSemNode);
    });

    // XPF
    // We subscribe to next XPF detected
    ATON.on("NextXPF", i =>{
        // No next XPF detected, hide the indicator 
        if (i === undefined){
            APP.suiIndicator.hide();
            return;
        }
        // Next XPF detected, show indicator and update its location
        let xpf = ATON.XPFNetwork.getXPFbyIndex(i);

        //console.log( APP.conf.network[i].name )

        APP.suiIndicator.show();
        APP.suiIndicator.position.copy( xpf.getLocation() );

        if (APP.conf.network[i].name){
            let strlabel = APP.conf.network[i].title;

            let ds = ATON.Utils.getHumanReadableDistance( ATON.XPFNetwork.getDistanceToXPFindex(i) );

            if (APP.conf.distancetext){
                strlabel += "\n"+APP.conf.distancetext+" "+ds;
            }

            APP.suiLabel.setText( strlabel );
            APP.suiLabel.lookAt( ATON.Nav.getCurrentEyeLocation() );
        }
    });

    ATON.on("CurrentXPF", i => {
        //console.log(i)
        APP.filterSemantics();

        if (APP.conf === undefined) return;

        $("#idTitle").html( APP.conf.network[i].title );
        $("#idSubTitle").html( APP.conf.network[i].name );
    });

    // When we request a locomotion node transition, hide indicator
    ATON.on("LocomotionNodeRequested", locnode => {
        APP.suiIndicator.hide();
    });

/*
    ATON.on("UINodeLeave", (uiid)=>{
        console.log(uiid);
    });
    ATON.on("UINodeHover", (uiid)=>{
        console.log(uiid);
    });
*/

/*
    ATON.on("DoubleTap", (e)=>{
        if (APP.nextpano < 0) return;

        APP.moveTo(APP.nextpano);
    });
*/
    ATON.on("KeyPress", (k)=>{
        if (k==='p'){
            APP.switchToPeriod("a");
        }
        if (k==='m'){
            APP.switchToPeriod("m");
        }

        if (k==='e'){
            console.log(ATON.Nav.getCurrentEyeLocation());
        }
        if (k==='v'){
            console.log(ATON.Nav.getCurrentDirection());
        }
/*
        if (k==='x'){
            console.log(ATON._screenPointerCoords);
        }
*/
    });
};

// Switch / Slider
APP.buildSlider = (id)=>{
    let ht = "<div class='appSlider'>";
    ht += "Passato&nbsp;";
    ht += "<input id='"+id+"' type='range' min='0' max='1' value='1' style='width:100px'>";
    ht += "&nbsp;Attuale";
    ht += "</div>";

    return ht;
};


APP.buildSUI = ()=>{
    let iconsize = 1.0;

    APP.matTelep = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( APP.contentDir+"ui/teleport.png" ), 
        transparent: true,
        opacity: 1.0,
        //depthWrite: false, 
        depthTest: false
    });

    //APP.matTelep.sizeAttenuation = false;

    APP.suiTelep = new THREE.Sprite( APP.matTelep );

    APP.suiIndicator = ATON.createUINode();
    APP.suiIndicator.scale.set(iconsize,iconsize,iconsize);
    APP.suiIndicator.add( APP.suiTelep );

    APP.suiLabel = new ATON.SUI.Label(undefined, 0.5,0.1);
    APP.suiLabel.setScale(iconsize*8.0).setPosition(0.0,0.9,0.0);

    APP.suiIndicator.add( APP.suiLabel );

    ATON.getRootUI().add( APP.suiIndicator );

/*
    ATON.SUI.bShowInfo = false;

    let telSize = 0.1; //1.5;

    APP.matTelep = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( APP.contentDir+"ui/teleport.png" ),
        transparent: true,
        opacity: 1.0,
        depthWrite: false, 
        depthTest: false
    });

    APP.matTelep.sizeAttenuation = false;

    APP.suiTelep = new THREE.Sprite( APP.matTelep );
    APP.suiTelep.scale.set(telSize,telSize,1);
    ATON.getRootUI().add(APP.suiTelep);
*/
};


window.addEventListener( 'load', ()=>{
    APP.init();
});
