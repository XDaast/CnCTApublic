// ==UserScript==
// @name        PTE_CheatScript
// @version     2019.05.02
// @author      leo7044 (https://github.com/leo7044)
// @description PTE_CheatScript
// @downloadURL https://github.com/leo7044/CnC_TA/raw/master/PTE_CheatScript.user.js
// @updateURL   https://github.com/leo7044/CnC_TA/raw/master/PTE_CheatScript.user.js
// @include     http*://prodgame*.alliances.commandandconquer.com/320/index.aspx*
// @include     http*://cncapp*.alliances.commandandconquer.com/320/index.aspx*
// @grant       none
// ==/UserScript==

(function () {
    var PTECheatMain = function ()
    {
        function PTECheatCreate()
        {
            try
            {
                function makeCheat()
                {
                    var bases = ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d;
                    // var wishLevel = 65;
                    var i = 0;
                    if (ClientLib.Data.MainData.GetInstance().get_Player().GetCommandPointCount() < 9999)
                    {
                        qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat setcommandpoints 9999");
                    }
                    for (var key in bases)
                    {
                        // RepTime (Base)
                        /*if (!bases[key].get_IsGhostMode() && bases[key].GetFullConditionInPercent() < 100)
                        {
                            qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat repairallpte " + i);
                        }*/
                        // RepTime (Off)
                        if (!bases[key].get_IsGhostMode() && bases[key].GetOffenseConditionInPercent() < 100)
                        {
                            qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat repairoff " + key);
                        }
                        // Standard
                        if (bases[key].get_hasCooldown() === true)
                        {
                            qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat resetmovecooldownpte");
                        }
                        if (bases[key].get_CityBuildingsData().get_HasCollectableBuildings())
                        {
                            bases[key].CollectAllResources();
                        }
                        // Ressources
                        /*if (bases[key].get_LvlBase() < wishLevel && bases[key].GetBuildingSlotCount() == 40)
                            {
                                qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat setlevelbasepte " + i + " " + wishLevel);
                            }
                            if (bases[key].get_LvlOffense() < wishLevel && bases[key].get_TotalOffenseHeadCount() == 200)
                            {
                                qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat setleveloffensepte " + i + " " + wishLevel);
                            }
                            if (bases[key].get_LvlDefense() < wishLevel  && bases[key].get_TotalDefenseHeadCount() == 300)
                            {
                                qx.core.Init.getApplication().getChat().getChatWidget().send("/cheat setleveldefensepte " + i + " " + wishLevel);
                            }*/
                        i++;
                    }
                }
				window.setInterval(makeCheat, 1000);
            }
            catch(e)
            {
                console.log(e);
				window.setTimeout(PTECheatCreate, 1000);
            }
        }
        function LoadExtension()
        {
            try
            {
                if (typeof(qx)!='undefined')
                {
                    if (!!qx.core.Init.getApplication().getMenuBar())
                    {
                        PTECheatCreate();
                        return;
                    }
                }
            }
            catch (e)
            {
                if (console !== undefined) console.log(e);
                else if (window.opera) opera.postError(e);
                else GM_log(e);
            }
            window.setTimeout(LoadExtension, 1000);
        }
        LoadExtension();
    };
    function Inject()
    {
        if (window.location.pathname != ("/login/auth"))
        {
            var Script = document.createElement("script");
            Script.innerHTML = "(" + PTECheatMain.toString() + ")();";
            Script.type = "text/javascript";
            document.getElementsByTagName("head")[0].appendChild(Script);
        }
    }
    Inject();
})();
