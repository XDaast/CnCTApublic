// ==UserScript==
// @name        PlayerTag Script
// @namespace   http*://cncapp*.alliances.commandandconquer.com/*/index.aspx*
// @description Allow to set tags for players
// @include     http*://cncapp*.alliances.commandandconquer.com/*/index.aspx*
// @version     2.16
// @contributer XDaast 22.2 fix?
// @author      Alkalyne
// ==/UserScript==
/*global PerforceChangelist,window,localStorage, console, ClientLib, MaelstromTools*/
//
// NOTE : Prototype
//
(function () {
    window.navigator.pointerEnabled = "PointerEvent" in window;
    function PlayerTag_Main() {

        var worldId;

        var re = /.*\/([0-9]*)\//;
        var str = window.location.href ;
        var m;

        if ((m = re.exec(str)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            worldId = m[1];
        } else {
            return;
        }



        var localStorageKey = "CCTA_MaelstromTools_CC_PlayerTag_"+worldId;
        var localStorageKeyVersion = "CCTA_MaelstromTools_CC_PlayerTag_Version_"+worldId;
        localStorage.removeItem(localStorageKeyVersion);

        var tagArray = {};
        var oldTagArray = {};
        var tagJsonData = localStorage.getItem(localStorageKey);
        if (tagJsonData !== null && tagJsonData !== undefined) {
            tagArray = JSON.parse(tagJsonData);
        } else {
            localStorage.setItem(localStorageKey, JSON.stringify(tagArray));
        }


        var button;
        var selectedObjectMemberName;
        var worldSectorObjectsMemberName;
        var updateData$ctorMethodName;
        var worldSectorVersionMemberName;
        var regionUpdateMethodName;
        var visObjectTypeNameMap = {};


        function CityPlayerTagInclude() {
            visObjectTypeNameMap[ClientLib.Vis.VisObject.EObjectType.RegionCityType] = ClientLib.Vis.Region.RegionCity.prototype.get_ConditionDefense.toString().match(/&&\(this\.([A-Z]{6})\.[A-Z]{6}>=0\)/)[1];
            visObjectTypeNameMap[ClientLib.Vis.VisObject.EObjectType.RegionNPCBase] = ClientLib.Vis.Region.RegionNPCBase.prototype.get_BaseLevel.toString().match(/return this\.([A-Z]{6})\.[A-Z]{6};/)[1];
            worldSectorObjectsMemberName = ClientLib.Data.WorldSector.prototype.SetDetails.toString().match(/case \$I\.[A-Z]{6}\.City:.+?this\.([A-Z]{6})\.[A-Z]{6}\(\(\(e<<(?:16|0x10)\)\|d\),g\);.+?var h=this\.([A-Z]{6})\.d\[g\.[A-Z]{6}\];if\(h==null\){return false;}var i=\(\(h\.([A-Z]{6})!=0\)\s?\?\s?this\.([A-Z]{6})\.d\[h\.\3\]\s?:\s?null\);/)[1];
            updateData$ctorMethodName = ClientLib.Vis.MouseTool.CreateUnitTool.prototype.Activate.toString()
						.match(/\$I\.[A-Z]{6}\.[A-Z]{6}\(\)\.[A-Z]{6}\(\)\.[A-Z]{6}\(\)\.[A-Z]{6}\(\(new \$I\.[A-Z]{6}\)\.([A-Z]{6})\(this,this\.[A-Z]{6}\)\);/)[0];

            regionUpdateMethodName = ClientLib.Vis.Region.Region.prototype.SetPosition.toString()
						.match(/this\.([A-Z]{6})\(\);/)[1];
            var matchList = webfrontend.gui.region.RegionCityMenu.prototype.onTick.toString()
						.match(/if\(this\.([A-Za-z0-9_]+)!==null\){this\.[A-Za-z0-9_]+\(\);}/);

			// attackButtonPatch script Fix
			/*if (matchList == undefined ) {
				matchList = webfrontend.gui.region.RegionCityMenu.prototype.onTickAttPatch.toString()
					.match(/if\(this\.([A-Za-z0-9_]+)!==null\){this\.[A-Za-z0-9_]+\(\);}/);
			}
			selectedObjectMemberName = matchList[1];
            worldSectorVersionMemberName = ClientLib.Data.WorldSector.prototype.get_Version.toString()
            .match(/return this\.([A-Z]{6});/)[1];*/

            var tagButton = {
              selectedBase: null,
              lastBaseName: null,
              changeTag: function(){
                var defaultPrompt;
                if(tagArray[tagButton.selectedBase.get_PlayerName()]!==undefined) {
                    defaultPrompt = tagArray[tagButton.selectedBase.get_PlayerName()];
                } else {
                    defaultPrompt = "A";
                }
                var tag = prompt("Please enter a Tag", defaultPrompt);
                if (tag !== null) {
                    tagArray[tagButton.selectedBase.get_PlayerName()]=tag;
                    localStorage.setItem(localStorageKey, JSON.stringify(tagArray));
                    tagButton.selectedBase.UpdateColor();
                }
              },
              changeName: function(){
                var baseCoordX = tagButton.selectedBase.get_RawX();
                var baseCoordY = tagButton.selectedBase.get_RawY();
                var defaultPrompt;
                if(tagArray[baseCoordX+':'+baseCoordY]!==undefined) {
                    defaultPrompt = tagArray[baseCoordX+':'+baseCoordY];
                } else {
                    defaultPrompt = "Base";
                }
                var tag = prompt("Please enter a Name", defaultPrompt);
                if (tag !== null) {
                    tagButton.lastBaseName=tag;
                    tagArray[baseCoordX+':'+baseCoordY]=tag;
                    localStorage.setItem(localStorageKey, JSON.stringify(tagArray));
                    tagButton.selectedBase.VisUpdate(20,0,false);
                }
                refreshWorldObject(tagButton.selectedBase.get_RawX(),tagButton.selectedBase.get_RawY());

              },
              changeNameAgain: function(){
                if (tagButton.lastBaseName !== null) {
                    var baseCoordX = tagButton.selectedBase.get_RawX();
                    var baseCoordY = tagButton.selectedBase.get_RawY();


                        tagArray[baseCoordX+':'+baseCoordY]=tagButton.lastBaseName;
                        localStorage.setItem(localStorageKey, JSON.stringify(tagArray));
                        tagButton.selectedBase.VisUpdate(20,0,false);

                    refreshWorldObject(tagButton.selectedBase.get_RawX(),tagButton.selectedBase.get_RawY());
                }

              }



            };

            var scriptsButton = qx.core.Init.getApplication().getMenuBar().getScriptsButton();

            scriptsButton.Add('Update Tags/Name from Server', '');
            children = scriptsButton.getMenu().getChildren();
            lastChild = children[children.length - 1];
            lastChild.addListener('execute', updateFromServer, PlayerTag_Main);


            ClientLib.Vis.Region.RegionNPCBase.prototype.BaseColor = function (baseColor) {
                try {
                    var baseCoordX = this.get_RawX();
                    var baseCoordY = this.get_RawY();
                    if (tagArray[baseCoordX+':'+baseCoordY] !== undefined && tagArray[baseCoordX+':'+baseCoordY] !== "") {
                        return "#ffffff";//ff5a00
                    }
                } catch (ex) {
                    console.log("MaelstromTools_PlayerTag error: ", ex);
                }
                return baseColor;
            };

            ClientLib.Vis.Region.RegionNPCBase.prototype.BaseName = function (baseName) {
                try {
                    var baseCoordX = this.get_RawX();
                    var baseCoordY = this.get_RawY();
                    if (tagArray[baseCoordX+':'+baseCoordY] !== undefined && tagArray[baseCoordX+':'+baseCoordY] !== "") {
                        return tagArray[baseCoordX+':'+baseCoordY];
                    }
                } catch (ex) {
                    console.log("MaelstromTools_PlayerTag error: ", ex);
                }
                return baseName;
            };
            createBasePlateFunction(ClientLib.Vis.Region.RegionNPCBase);


            var regionCityPrototype = ClientLib.Vis.Region.RegionCity.prototype;
            regionCityPrototype.BaseNameTag = function (baseName) { //ff5a00
                try {
                    var playerName = this.get_PlayerName();
                    if (tagArray[playerName] !== undefined && tagArray[playerName] !== "") {
                        return "[" + tagArray[playerName] + "] " + baseName;
                    }
                } catch (ex) {
                    console.log("MaelstromTools_PlayerTag error: ", ex);
                }
                return baseName;
            };


            var updateColorParts = g(regionCityPrototype.UpdateColor, /createHelper;this\.([A-Z]{6})\(/, "ClientLib.Vis.Region.RegionCity UpdateColor", 1);
            var setCanvasValue_Name = updateColorParts[1];
            if (updateColorParts === null || setCanvasValue_Name.length !== 6) {
                console.error("Error - ClientLib.Vis.Region.RegionCity.SetCanvasValue undefined");
                return;
            }

            regionCityPrototype.SetCanvasValueTag_ORG = regionCityPrototype[setCanvasValue_Name];
            var setCanvasValueFunctionBody = getFunctionBody(regionCityPrototype.SetCanvasValueTag_ORG);
            regionCityPrototype.SetCanvasValueTag_BODY = setCanvasValueFunctionBody;

            var setCanvasValueFunctionBodyFixed = setCanvasValueFunctionBody.replace(
                /if\(\(this\.([A-Z]{6})\.Text\!=i\)\|\|\(this\.([A-Z]{6})\.Color\!=g\)\)\{f=true;this\.([A-Z]{6})\.Text=i;this\.([A-Z]{6})\.Color=g;/im,
                "if((this.$1.Text!=this.BaseNameTag(i))||(this.$2.Color!=g)){f=true;this.$3.Text=this.BaseNameTag(i);this.$4.Color=g;");
            regionCityPrototype[setCanvasValue_Name] = new Function("a", "b", setCanvasValueFunctionBodyFixed);
            regionCityPrototype.SetCanvasValueTag_FIXED = new Function("a", "b", setCanvasValueFunctionBodyFixed);

            var regionNPCBasePrototype = ClientLib.Vis.Region.RegionNPCBase.prototype;

            var url = PT.util.urlGet(worldId,ClientLib.Data.MainData.GetInstance().get_Alliance().get_Id());
            PT.util.ajax('GET', url, null, function(xhr){
                            if (xhr.responseText !=null && xhr.responseText != ""){
                                tagArray = JSON.parse(xhr.responseText);
                                localStorage.setItem(localStorageKey, JSON.stringify(tagArray));
                            }
             });

            // Mise à jour automatique
            window.setInterval(function(){
                updateFromServer();
            }, 300000);

        }

        function refreshWorldObject(x, y) {
            var sector = ClientLib.Data.MainData.GetInstance().get_World().GetWorldSectorByCoords(x, y);
            if(sector != null){
               var encodedSectorCoords = ((y % 0x20) << 0x10) | (x % 0x20);
               var worldObject=sector[worldSectorObjectsMemberName].d[encodedSectorCoords];
			   if (worldObject == undefined) {
				   return;
			   }
               delete sector[worldSectorObjectsMemberName].d[encodedSectorCoords];
            }

            ClientLib.Vis.VisMain.GetInstance().get_Region()[regionUpdateMethodName]();
            setTimeout(function() {
                insertWorldObject(x, y, worldObject);
                ClientLib.Vis.VisMain.GetInstance().get_Region()[regionUpdateMethodName]();;
            }, 50);
            ClientLib.Net.CommunicationManager.GetInstance().RegisterDataReceiver('WORLD', (new ClientLib.Net.UpdateData)[updateData$ctorMethodName](this, updateWorldDetour));
        }

        function insertWorldObject(x, y, worldObject){
            var sector = ClientLib.Data.MainData.GetInstance().get_World().GetWorldSectorByCoords(x, y);
            if(sector != null){
                var encodedSectorCoords = ((y % 0x20) << 0x10) | (x % 0x20);
                sector[worldSectorObjectsMemberName].d[encodedSectorCoords] = worldObject;
                sector[worldSectorVersionMemberName] = 0;
            }
        }

        function getWorldObject(regionObject) {

            var visObjectType = regionObject.get_VisObjectType();

            if (visObjectType in visObjectTypeNameMap) {
                return regionObject[visObjectTypeNameMap[visObjectType]];
            }

            return ClientLib.Data.MainData.GetInstance().get_World().GetObjectFromPosition(regionObject.get_RawX(), regionObject.get_RawY());
        }


        function updateWorldDetour(type, data) {
            var world = ClientLib.Data.MainData.GetInstance().get_World();
            world.Update(type, data);

            if (type === 'WORLD') {
                ClientLib.Vis.VisMain.GetInstance().get_Region()[regionUpdateMethodName]();
                ClientLib.Net.CommunicationManager.GetInstance().RegisterDataReceiver('WORLD', (new ClientLib.Net.UpdateData)[updateData$ctorMethodName](world, world.Update));
            }
        }


        function createBasePlateFunction(r) {
            try {
                var regionObject = r.prototype;
                for (var key in regionObject) {
                    /**
                    $I.ZEBCTS.prototype.GNVUCY = function () {
                    var $createHelper;
                    return this.WXGXKC.Text;
                    };*/
                    if (typeof regionObject[key] === 'function') {
                        var strFunction = regionObject[key].toString();
                        if (strFunction.indexOf("tnf:mutants base") > -1) {
                            if (r == ClientLib.Vis.Region.RegionNPCBase) {
                                var initBaseFunction = getFunctionBody(regionObject[key]);
                                //var f=$I.FFGAJK.OSOBAM("tnf:mutants base");
                                var initBaseFunctionFixed = initBaseFunction.replace(
                                    /var f=([^;]*);/im,
                                    "var f=this.BaseName($1);");
                                 initBaseFunctionFixed = initBaseFunctionFixed.replace(
                                    /var g=([^;]*);/im,
                                    "var g=this.BaseColor($1);");
                                regionObject[key] = new Function("a", "b", "c", "d", "e", initBaseFunctionFixed);

                                break;
                            }
                        }
                    }
                }
            } catch (q) {
                console.log(q)
            }
        }
        function IsJsonString(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }
        function refreshTags(refreshTagArray){
           ClientLib.Data.MainData.GetInstance().get_Alliance().RefreshMemberData();
           for (var attr in refreshTagArray) {
                if(attr.indexOf(":") != -1){
                    refreshWorldObject(attr.split(":")[0],attr.split(":")[1]);
                }
           }

        }


         function updateFromServer(){
            var url = PT.util.urlGet(worldId,ClientLib.Data.MainData.GetInstance().get_Alliance().get_Id());
            PT.util.ajax('GET', url, null, function(xhr){
                            if (xhr.responseText !=null && xhr.responseText != ""){
                                var jsonResult = JSON.parse(xhr.responseText);
                                if (jsonResult["version"] != localStorage.getItem(localStorageKeyVersion)) {
                                    oldTagArray = tagArray;
                                    tagArray = jsonResult;
                                    localStorage.setItem(localStorageKey, JSON.stringify(tagArray));

                                    var selectedObject = webfrontend.gui.region.RegionCityMenu.getInstance()[selectedObjectMemberName];
                                    if (selectedObject != null){
                                        //"Correction" Bug menu contextuel
                                        var selectedBase = {};
                                        selectedBase[selectedObject.get_RawX()+":"+selectedObject.get_RawY()] = "";
                                        refreshTags(selectedBase);
                                    }
                                    localStorage.setItem(localStorageKeyVersion, jsonResult["version"]);

                                    refreshTags(difference(oldTagArray,tagArray));
                                    refreshTags(tagArray);
                                }
                            }
             });
        }

        function difference(array1, array2) {
            var result = {};

            for (var k in array1){
                if (!array2.hasOwnProperty(k)) {
                     result[k] = array2[k];
                }
            }

            return result;
        }

        function g(functionObject, regEx, m, p) {
            var functionBody = functionObject.toString();
            var shrinkedText = functionBody.replace(/\s/gim, "");
            var matches = shrinkedText.match(regEx);
            for (var i = 1; i < (p + 1) ; i++) {
                if (matches !== null && matches[i].length === 6) {
                    //console.log(m, i, matches[i]);
                } else {
                    console.error("Error - ", m, i, "not found");
                    console.warn(m, shrinkedText);
                }
            }
            return matches;
        }


        function getFunctionBody(functionObject) {
            var string = functionObject.toString();
            var singleLine = string.replace(/(\n\r|\n|\r|\t)/gm, " ");
            var spacesShrinked = singleLine.replace(/\s+/gm, " ");
            var headerRemoved = spacesShrinked.replace(/function.*?\{/, "");
            var result = headerRemoved.substring(0, headerRemoved.length - 1); // remove last "}"
            return result;
        }

        function MaelstromTools_CityPlayerTagInclude_checkIfLoaded() {
            try {
                if (typeof ClientLib !== "undefined" && ClientLib.Vis !== undefined && ClientLib.Vis.Region !== undefined && ClientLib.Vis.Region.RegionCity !== undefined && typeof qx !== 'undefined' && qx.core.Init.getApplication() && qx.core.Init.getApplication().initDone && ClientLib.Data.MainData.GetInstance().get_Alliance().get_Id() != 0) {

                    window.setTimeout(CityPlayerTagInclude, 1000);

                } else {
                    window.setTimeout(MaelstromTools_CityPlayerTagInclude_checkIfLoaded, 1000);
                }
            } catch (ex) {
                console.log("MaelstromTools_CityPlayerTagInclude_checkIfLoaded: ", ex);
            }
        }

        function MaelstromTools_CityPlayerTagTool_checkIfLoaded() {
            try {
                if (typeof ClientLib === "undefined" || typeof MaelstromTools === "undefined") {
                    window.setTimeout(MaelstromTools_CityPlayerTagTool_checkIfLoaded, 1000);
                }
            } catch (ex) {
                console.log("MaelstromTools_CityPlayerTagTool_checkIfLoaded: ", ex);
            }
        }

        if (/commandandconquer\.com/i.test(document.domain)) {
            window.setTimeout(MaelstromTools_CityPlayerTagInclude_checkIfLoaded, 1000);
            window.setTimeout(MaelstromTools_CityPlayerTagTool_checkIfLoaded, 30000);
        }

        var PT = window.PT || {};
        PT.util = {
            URLGET: 'https://ccta.hodor.ninja/getPlayersTagsVersion.php',
            urlGet: function(world, alliance) {
                return PT.util.URLGET + "?world=" + world + "&alliance="+alliance + "&version=" + localStorage.getItem(localStorageKeyVersion) + "&t="+Math.floor(Date.now() / 1000);
            },
            ajax: function(method, url, data, callback) {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                if (callback !== undefined) {
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState !== 4) {
                            return;
                        }
                        callback(xhr);
                    };
                }

                if (data !== undefined && data !== null) {
                    xhr.send(data);
                } else {
                    xhr.send();
                }
            },

        };

        window.PT = PT;


    }



    try {
        if (/commandandconquer\.com/i.test(document.domain)) {
            var scriptTag = document.createElement("script");
            scriptTag.id = "xxx";
            scriptTag.innerHTML = "(" + PlayerTag_Main.toString() + ")();";
            scriptTag.type = "text/javascript";
            document.getElementsByTagName("head")[0].appendChild(scriptTag);
        }
    } catch (c) {
        console.log("MaelstromTools_CityPlayerTag: init error: ", c);
    }


})();
