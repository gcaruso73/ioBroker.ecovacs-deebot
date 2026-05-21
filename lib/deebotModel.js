/* eslint-disable quotes */

// Useful for features that are implemented in most models
// but should be disabled on some models
const DEFAULT_VALUES = {
    "control.pause": true,
    "control.resume": true,
    "control.playSound": true,
    "control.playIamHere": true,
    "cleaninglog.channel": true
};

// Lookup table for features that can be enabled or disabled in adapter config
// It is possible to group them
const CONFIG_FEATURE_STATES = {
    "control.autoBoostSuction": "control.autoBoostSuction",
    "control.autoEmptyStation": "control.autoEmptyStation",
    "control.goToPosition": "control.experimental",
    "control.pauseBeforeDockingChargingStation": "control.experimental",
    "control.pauseWhenEnteringSpotArea": "control.experimental",
    "control.pauseWhenLeavingSpotArea": "control.experimental",
    "control.resetCleanSpeedToStandardOnReturn": "control.experimental",
    "control.move": "control.move",
    "consumable.airFreshener": "consumable.airFreshener",
    "info.dustbox": "info.dustbox",
    "map.mapImage": "map.mapImage",
    "map.spotAreas.cleanSpeed": "map.spotAreas.cleanSpeed",
    "map.spotAreas.waterLevel": "map.spotAreas.waterLevel",
    "map.virtualBoundaries": "map.virtualBoundaries",
    "map.virtualBoundaries.delete": "map.virtualBoundaries.write",
    "map.virtualBoundaries.save": "map.virtualBoundaries.write"
};

// Lookup table for supported features that are enabled by default
const SUPPORTED_STATES = {
    "yna5xi": {
        "name": "DEEBOT OZMO 950 Series",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanSpeed": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.mapImage": true,
        "map.relocationState": true,
        "map.spotAreas": true
    },
    "h18jkh": {
        "name": "DEEBOT OZMO T8",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanCount": true,
        "control.cleanSpeed": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.relocationState": true,
        "map.spotAreas": true,
        "technology.trueDetect": true
    },
    "55aiho": {
        "name": "DEEBOT OZMO T8 AIVI",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanCount": true,
        "control.cleanSpeed": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.relocationState": true,
        "map.spotAreas": true,
        "technology.trueDetect": true
    },
    "vi829v": {
        "name": "DEEBOT OZMO 920",
        "deviceClassLink": "yna5xi"
    },
    "jffnlf": {
        "name": "DEEBOT N3 MAX",
        "deviceClassLink": "h18jkh"
    },
    "r5zxjr": {
        "name": "DEEBOT N7",
        "deviceClassLink": "h18jkh"
    },
    "n6cwdb": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh"
    },
    "r5y7re": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh"
    },
    "ty84oi": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh"
    },
    "36xnxf": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh"
    },
    "snxbvc": {
        "name": "DEEBOT N8 PRO",
        "deviceClassLink": "h18jkh"
    },
    "yu362x": {
        "name": "DEEBOT N8 PRO",
        "deviceClassLink": "h18jkh"
    },
    "7bryc5": {
        "name": "DEEBOT N8+",
        "deviceClassLink": "h18jkh"
    },
    "b2jqs4": {
        "name": "DEEBOT N8+",
        "deviceClassLink": "h18jkh"
    },
    "ifbw08": {
        "name": "DEEBOT N8 PRO+",
        "deviceClassLink": "h18jkh"
    },
    "85as7h": {
        "name": "DEEBOT N8 PRO+",
        "deviceClassLink": "h18jkh"
    },
    "s1f8g7": {
        "name": "DEEBOT N8 PRO CARE",
        "deviceClassLink": "h18jkh"
    },
    "c2of2s": {
        "name": "DEEBOT N9+",
        "deviceClassLink": "h18jkh"
    },
    "m1wkuw": {
        "name": "DEEBOT N10",
        "deviceClassLink": "h18jkh"
    },
    "umwv6z": {
        "name": "DEEBOT N10 PLUS",
        "deviceClassLink": "h18jkh"
    },
    "clojes": {
        "name": "DEEBOT N10 MAX+",
        "deviceClassLink": "h18jkh"
    },
    "yinacl": {
        "name": "DEEBOT N20e PLUS",
        "deviceClassLink": "h18jkh"
    },
    "qhe2o2": {
        "name": "DEEBOT N20 PRO PLUS",
        "deviceClassLink": "h18jkh"
    },
    "p0l0af": {
        "name": "DEEBOT N20 PRO PLUS",
        "deviceClassLink": "h18jkh"
    },
    "aavvfb": {
        "name": "DEEBOT N20 PRO",
        "deviceClassLink": "h18jkh"
    },
    "buom7k": {
        "name": "DEEBOT N20 PLUS",
        "deviceClassLink": "h18jkh"
    },
    "kr0277": {
        "name": "DEEBOT N20",
        "deviceClassLink": "h18jkh"
    },
    "edoodo": {
        "name": "DEEBOT N20",
        "deviceClassLink": "h18jkh"
    },
    "zgsvkq": {
        "name": "DEEBOT N20e",
        "deviceClassLink": "h18jkh"
    },
    "ruhc0q": {
        "name": "DEEBOT N20e",
        "deviceClassLink": "h18jkh"
    },
    "i35yb6": {
        "name": "DEEBOT N20 PLUS",
        "deviceClassLink": "h18jkh"
    },
    "9kpees": {
        "name": "DEEBOT N20 PLUS",
        "deviceClassLink": "h18jkh"
    },
    "gwtll7": {
        "name": "DEEBOT N20 PRO PLUS",
        "deviceClassLink": "h18jkh"
    },
    "c8gerr": {
        "name": "DEEBOT N20 PRO",
        "deviceClassLink": "h18jkh"
    },
    "7piq03": {
        "name": "DEEBOT N20e PLUS",
        "deviceClassLink": "h18jkh"
    },
    "zwkcqc": {
        "name": "DEEBOT N30 OMNI",
        "deviceClassLink": "h18jkh"
    },
    "dlrbzq": {
        "name": "DEEBOT N30 PRO OMNI",
        "deviceClassLink": "h18jkh"
    },
    "87swps": {
        "name": "DEEBOT N30 PRO OMNI",
        "deviceClassLink": "h18jkh"
    },
    "9rft3c": {
        "name": "DEEBOT OZMO T5",
        "deviceClassLink": "yna5xi"
    },
    "x5d34r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "bs40nz": {
        "name": "DEEBOT T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "5089oy": {
        "name": "DEEBOT T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "55uoqe": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "7n95dm": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "dqcneu": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "sa4tf7": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "uzel1r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "z0gd1j": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho"
    },
    "tpnwyu": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "55aiho"
    },
    "34vhpm": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "55aiho"
    },
    "w16crm": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "55aiho"
    },
    "vdehg6": {
        "name": "DEEBOT T8 AIVI +",
        "deviceClassLink": "55aiho"
    },
    "b742vd": {
        "name": "DEEBOT OZMO T8",
        "deviceClassLink": "h18jkh"
    },
    "0bdtzz": {
        "name": "DEEBOT OZMO T8 PURE",
        "deviceClassLink": "h18jkh"
    },
    "fqxoiu": {
        "name": "DEEBOT OZMO T8+",
        "deviceClassLink": "h18jkh"
    },
    "wgxm70": {
        "name": "DEEBOT T8",
        "deviceClassLink": "h18jkh"
    },
    "a1nNMoAGAsH": {
        "name": "DEEBOT T8 MAX",
        "deviceClassLink": "h18jkh"
    },
    "no61kx": {
        "name": "DEEBOT T8 POWER",
        "deviceClassLink": "h18jkh"
    },
    "ucn2xe": {
        "name": "DEEBOT T9",
        "deviceClassLink": "h18jkh"
    },
    "ipohi5": {
        "name": "DEEBOT T9",
        "deviceClassLink": "h18jkh"
    },
    "lhbd50": {
        "name": "DEEBOT T9+",
        "deviceClassLink": "h18jkh"
    },
    "um2ywg": {
        "name": "DEEBOT T9+",
        "deviceClassLink": "h18jkh"
    },
    "8kwdb4": {
        "name": "DEEBOT T9 AIVI",
        "deviceClassLink": "55aiho"
    },
    "659yh8": {
        "name": "DEEBOT T9 AIVI",
        "deviceClassLink": "55aiho"
    },
    "kw9ayx": {
        "name": "DEEBOT T9 AIVI Plus",
        "deviceClassLink": "55aiho"
    },
    "jtmf04": {
        "name": "DEEBOT T10",
        "deviceClassLink": "h18jkh"
    },
    "rss8xk": {
        "name": "DEEBOT T10 PLUS",
        "deviceClassLink": "h18jkh"
    },
    "p95mgv": {
        "name": "DEEBOT T10 PLUS",
        "deviceClassLink": "h18jkh"
    },
    "9s1s80": {
        "name": "DEEBOT T10 TURBO",
        "deviceClassLink": "h18jkh"
    },
    "yaj7uz": {
        "name": "DEEBOT T10 TURBO",
        "deviceClassLink": "h18jkh"
    },
    "lx3j7m": {
        "name": "DEEBOT T10 OMNI",
        "deviceClassLink": "h18jkh"
    },
    "p1jij8": {
        "name": "DEEBOT T20 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "m4xnd8": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "ohjbzz": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "paeygf": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "poke1m": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "qdajz8": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "r0321c": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "ulzked": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "viq3mw": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "x9ugz3": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "yi396x": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch"
    },
    "9ku8nu": {
        "name": "DEEBOT T20e OMNI",
        "deviceClassLink": "3yqsch"
    },
    "py3qif": {
        "name": "DEEBOT T20e OMNI",
        "deviceClassLink": "3yqsch"
    },
    "z4lvk7": {
        "name": "DEEBOT T30 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "4vhygi": {
        "name": "DEEBOT T30 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "3w7j5e": {
        "name": "DEEBOT T30 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "tlthqk": {
        "name": "DEEBOT T30 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "822x8d": {
        "name": "DEEBOT T30 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "4bdkrs": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch"
    },
    "ue8kcc": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch"
    },
    "8tyt2y": {
        "name": "DEEBOT T30S",
        "deviceClassLink": "3yqsch"
    },
    "eqmf84": {
        "name": "DEEBOT T30S",
        "deviceClassLink": "3yqsch"
    },
    "9gqyaq": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch"
    },
    "kr9c86": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch"
    },
    "ee23uv": {
        "name": "DEEBOT T30S COMBO COMPLETE",
        "deviceClassLink": "3yqsch"
    },
    "xco2fc": {
        "name": "DEEBOT T30S PRO",
        "deviceClassLink": "3yqsch"
    },
    "cb69w5": {
        "name": "DEEBOT T30S PRO",
        "deviceClassLink": "3yqsch"
    },
    "63cum9": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "7c26ui": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "8o3xke": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "bheggm": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "c8rj4y": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "cuoipb": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "czjwet": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "elrxgb": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "k1lgm7": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "qnkybo": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "xztz07": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch"
    },
    "9eamof": {
        "name": "DEEBOT T80 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "k8qkc7": {
        "name": "DEEBOT T80 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "02qwum": {
        "name": "DEEBOT T80 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "3yqsch": {
        "name": "DEEBOT X1",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanCount": true,
        "control.cleanSpeed": true,
        "control.continuousCleaning": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.relocationState": true,
        "map.spotAreas": true,
        "technology.trueDetect": true
    },
    "8bja83": {
        "name": "DEEBOT X1 Omni",
        "deviceClassLink": "3yqsch"
    },
    "1b23du": {
        "name": "DEEBOT X1 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "1vxt52": {
        "name": "DEEBOT X1 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "2o4lnm": {
        "name": "DEEBOT X1 TURBO",
        "deviceClassLink": "3yqsch"
    },
    "n4gstt": {
        "name": "DEEBOT X1 PLUS",
        "deviceClassLink": "3yqsch"
    },
    "bro5wu": {
        "name": "DEEBOT X1e OMNI",
        "deviceClassLink": "3yqsch"
    },
    "8onkgl": {
        "name": "DEEBOT X1 Turbo",
        "deviceClassLink": "3yqsch"
    },
    "s523z1": {
        "name": "DEEBOT X1 Turbo",
        "deviceClassLink": "3yqsch"
    },
    "e6ofmn": {
        "name": "DEEBOT X2",
        "deviceClassLink": "3yqsch"
    },
    "lf3bn4": {
        "name": "DEEBOT X2",
        "deviceClassLink": "3yqsch"
    },
    "e6rcnf": {
        "name": "DEEBOT X2 COMBO",
        "deviceClassLink": "3yqsch"
    },
    "ip3mmy": {
        "name": "DEEBOT X2 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "p7l7iu": {
        "name": "DEEBOT X2 OMNI Height",
        "deviceClassLink": "3yqsch"
    },
    "lr4qcs": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "o0a4ju": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "e6yxdm": {
        "name": "DEEBOT X5 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "4jd37g": {
        "name": "DEEBOT X5 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "rvflzn": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "w7k3yc": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "4bx3w9": {
        "name": "DEEBOT X8 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "co3fyu": {
        "name": "DEEBOT X8 OMNI",
        "deviceClassLink": "3yqsch"
    },
    "n0vyif": {
        "name": "DEEBOT X8 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "ilt3k8": {
        "name": "DEEBOT X9 PRO OMNI",
        "deviceClassLink": "3yqsch"
    },
    "p5nx9u": {
        "name": "yeedi 2 hybrid",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanSpeed": true,
        "control.relocate": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.mapImage": true,
        "map.relocationState": true,
        "map.spotAreas": true
    },
    "aaxesz": {
        "name": "yeedi vac 2 pro",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanSpeed": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": true,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.mapImage": true,
        "map.relocationState": true,
        "map.spotAreas": true
    },
    "mnx7f4": {
        "name": "yeedi vac station",
        "deviceClassLink": "p5nx9u"
    },
    "9t30w8": {
        "name": "yeedi vac 2",
        "deviceClassLink": "p5nx9u"
    },
    "h041es": {
        "name": "yeedi vac hybrid",
        "deviceClassLink": "p5nx9u"
    },
    "04z443": {
        "name": "yeedi vac max",
        "deviceClassLink": "p5nx9u"
    },
    "vthpeg": {
        "name": "yeedi mop station",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanSpeed": true,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.spotAreas": true
    },
    "zwvyi2": {
        "name": "yeedi mop station pro",
        "deviceClassLink": "vthpeg"
    },
    "t5e5o6": {
        "name": "yeedi Floor 3 Station",
        "deviceClassLink": "vthpeg"
    },
    "kd0una": {
        "name": "yeedi Floor 3 Station",
        "deviceClassLink": "vthpeg"
    },
    "6r6dbt": {
        "name": "yeedi cube",
        "control.cleanSpeed": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.deebotPositionIsInvalid": true,
        "map.lastUsedAreaValues": true,
        "map.spotAreas": true
    },
    "sdp1y1": {
        "name": "AIRBOT Z1",
        "cleaninglog.channel": true,
        "control.cleanSpeed": false,
        "control.pause": false,
        "control.playIamHere": false,
        "control.playSound": false,
        "control.resume": false,
        "control.volume": true,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSignal": true,
        "info.network.wifiSSID": true,
        "info.sleepStatus": true,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "map.deebotPositionCurrentSpotAreaID": true,
        "map.mapImage": true,
        "map.relocationState": false,
        "map.spotAreas": true,
        "map.virtualBoundaries": true,
        "map.virtualBoundaries.delete": true,
        "map.virtualBoundaries.save": true
    },
    "0b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "1b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "2b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "3b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "4b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "5b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "6b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "7b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "8b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "9b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1"
    },
    "1a2b3c": {
        "name": "Airbot AVA",
        "deviceClassLink": "sdp1y1"
    },
    "2a3b4c": {
        "name": "Airbot ANDY",
        "deviceClassLink": "sdp1y1"
    },
    "20anby": {
        "name": "Z1 Air Quality Monitor",
        "control.pause": false,
        "control.resume": false,
        "control.playSound": false,
        "control.playIamHere": false,
        "cleaninglog.channel": false,
        "control.cleanSpeed": false,
        "control.volume": false,
        "info.dustbox": false,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true
    },
    "5xu9h3": {
        "name": "GOAT",
        "control.cleanSpeed": false,
        "consumable.reset": false,
        "info.dustbox": false,
        "map": true,
        "map.chargePosition": true,
        "map.deebotPosition": true,
        "info.network.ip": true,
        "info.network.mac": true,
        "info.network.wifiSSID": true,
        "info.network.wifiSignal": true,
        "info.sleepStatus": true,
    },
    "2ap5uq": {
        "name": "GOAT GX-600",
        "deviceClassLink": "5xu9h3"
    },
    "ao7fpw": {
        "name": "GOAT GX-600",
        "deviceClassLink": "5xu9h3"
    },
    "xmp9ds": {
        "name": "GOAT A1600 RTK",
        "deviceClassLink": "5xu9h3",
        "map": false
    }
};

// Device type mapping for user-friendly classification
const DEVICE_TYPE_MAPPING = {
    'airbot': 'Air Purifier',
    'goat': 'Lawn Mower',
    'aqMonitor': 'Air Quality Monitor',
    'yeedi': 'Yeedi Vacuum',
    'legacy': 'Vacuum Cleaner',
    '950': 'Vacuum Cleaner',
    'T8': 'Vacuum Cleaner',
    'T9': 'Vacuum Cleaner',
    'T10': 'Vacuum Cleaner',
    'T20': 'Vacuum Cleaner',
    'T80': 'Vacuum Cleaner',
    'T30': 'Vacuum Cleaner',
    'N8': 'Vacuum Cleaner',
    'X1': 'Vacuum Cleaner',
    'X2': 'Vacuum Cleaner'
};

class Model {
    constructor(vacbot, config) {
        this.vacbot = vacbot;
        this.config = config;
    }

    getDeviceClass() {
        return this.vacbot.deviceClass;
    }

    getProductName() {
        if (SUPPORTED_STATES[this.getDeviceClass()]) {
            return SUPPORTED_STATES[this.getDeviceClass()].name;
        }
        return this.getDeviceClass();
    }

    getProductImageURL() {
        return this.vacbot.getProductImageURL();
    }

    getProtocol() {
        return this.vacbot.getProtocol();
    }

    is950type() {
        return this.vacbot.is950type();
    }

    is950type_V2() {
        return this.vacbot.is950type_V2();
    }

    isNot950type() {
        return !this.is950type();
    }

    isNot950type_V2() {
        return !this.is950type_V2();
    }

    usesXmpp() {
        return this.getProtocol() === 'XMPP';
    }

    usesMqtt() {
        return this.getProtocol() === 'MQTT';
    }

    isMappingSupported() {
        return this.vacbot.hasMappingCapabilities();
    }

    hasMainBrush() {
        return this.vacbot.hasMainBrush();
    }

    hasSideBrush() {
        return this.vacbot.hasSideBrush();
    }

    hasFilter() {
        return this.vacbot.hasFilter();
    }

    hasAirDrying() {
        return this.vacbot.hasAirDrying();
    }

    hasCleaningStation() {
        return this.hasAirDrying();
    }

    hasFloorWashing() {
        if (typeof this.vacbot.hasMoppingSystem === 'function') {
            return this.vacbot.hasMoppingSystem() && this.hasCleaningStation();
        }
        return false;
    }

    hasAdvancedMode() {
        if (typeof this.vacbot.hasAdvancedMode === 'function') {
            return this.vacbot.hasAdvancedMode();
        }
        return false;
    }

    hasCustomAreaCleaningMode() {
        if (typeof this.vacbot.hasCustomAreaCleaningMode === 'function') {
            return this.vacbot.hasCustomAreaCleaningMode();
        }
        return false;
    }

    getModelType() {
        // Check for explicit model type override per device class
        const deviceClass = this.getDeviceClass();
        if (SUPPORTED_STATES[deviceClass] && SUPPORTED_STATES[deviceClass].modelType) {
            return SUPPORTED_STATES[deviceClass].modelType;
        }
        return this.vacbot.getModelType();
    }

    isModelTypeT8Based() {
        return this.isModelTypeT8() || this.isModelTypeN8();
    }

    isModelTypeT9Based() {
        return this.isModelTypeT9() || this.isModelTypeT10() || this.isModelTypeT20() || this.isModelTypeX1() || this.isModelTypeX2();
    }

    isModelTypeN8() {
        return this.vacbot.isModelTypeN8();
    }

    isModelTypeT8() {
        return this.vacbot.isModelTypeT8();
    }

    isModelTypeT9() {
        return this.vacbot.isModelTypeT9();
    }

    isModelTypeT10() {
        return this.vacbot.isModelTypeT10();
    }

    isModelTypeT20() {
        return this.vacbot.isModelTypeT20();
    }

    isModelTypeX1() {
        return this.vacbot.isModelTypeX1();
    }

    isModelTypeX2() {
        return this.vacbot.isModelTypeX2();
    }

    isModelTypeAirbot() {
        return this.vacbot.isModelTypeAirbot();
    }

    /**
     * Check if the device supports OTA (Over The Air) firmware updates
     * OTA is supported by 950type devices (MQTT/JSON protocol)
     * @returns {boolean}
     */
    hasOtaSupport() {
        return this.is950type();
    }

    isModel900Series() {
        return this.getClass() === 'ls1ok3';
    }

    getClass() {
        if (SUPPORTED_STATES[this.getDeviceClass()]) {
            if (Object.prototype.hasOwnProperty.call(SUPPORTED_STATES[this.getDeviceClass()], 'deviceClassLink')) {
                return SUPPORTED_STATES[this.getDeviceClass()].deviceClassLink;
            }
        }
        return this.getDeviceClass();
    }

    isSupportedFeature(state) {
        if (this.getClass() && this.config) {
            let configOptionName = state;
            let configOptionVal = '';
            if (Object.prototype.hasOwnProperty.call(CONFIG_FEATURE_STATES, state)) {
                configOptionName = 'feature.' + CONFIG_FEATURE_STATES[state];
                if (this.config[configOptionName]) {
                    configOptionVal = this.config[configOptionName];
                }
            }
            if (configOptionVal === '') {
                const classes = [this.getDeviceClass(), this.getClass()];
                for (const cls of classes) {
                    if (Object.prototype.hasOwnProperty.call(SUPPORTED_STATES, cls)) {
                        const features = SUPPORTED_STATES[cls];
                        if (Object.prototype.hasOwnProperty.call(features, state)) {
                            return features[state];
                        }
                    }
                }
            } else if (parseInt(configOptionVal) === 1) {
                return true;
            }
        }
        if (Object.prototype.hasOwnProperty.call(DEFAULT_VALUES, state)) {
            return DEFAULT_VALUES[state];
        }
        return false;
    }

    hasMappingCapabilities() {
        return this.vacbot.hasMappingCapabilities() || this.isModelTypeAirbot();
    }

    getWaterLevel() {
        if (this.isModelTypeT20() || this.isModelTypeX2()) {
            return 6;
        } else if (this.isModelTypeX1()) {
            return 4;
        } else if (this.is950type()) {
            return 4;
        } else {
            return 3;
        }
    }

    getCleanSpeed() {
        if (this.isModelTypeT20() || this.isModelTypeX2()) {
            return 4;
        } else if (this.isModelTypeX1()) {
            return 4;
        } else if (this.is950type()) {
            return 4;
        } else {
            return 3;
        }
    }

    getVolume() {
        if (this.isModelTypeT20() || this.isModelTypeX2()) {
            return 10;
        } else if (this.isModelTypeX1()) {
            return 10;
        } else if (this.is950type()) {
            return 10;
        } else {
            return 4;
        }
    }

    getWashInterval() {
        if (this.isModelTypeT20() || this.isModelTypeX2()) {
            return 6;
        } else if (this.isModelTypeX1()) {
            return 10;
        } else {
            return 10;
        }
    }

    getDustBagReminder() {
        if (this.isModelTypeT20() || this.isModelTypeX2()) {
            return 350;
        } else if (this.isModelTypeX1()) {
            return 420;
        } else {
            return 420;
        }
    }

    getHoursUntilDustBagEmptyReminder() {
        if (this.isSupportedFeature('info.dustbox')) {
            return this.getDustBagReminder();
        }
        return 0;
    }

    getCleanCount() {
        if (this.isModelTypeT20() || this.isModelTypeX2()) {
            return 3;
        } else if (this.isModelTypeX1()) {
            return 3;
        } else if (this.is950type()) {
            return 3;
        } else {
            return 1;
        }
    }

    getRelocationState() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'standard';
        } else if (this.is950type()) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoToPosition() {
        if (this.isModelTypeAirbot()) {
            return 'native';
        } else if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'native';
        } else if (this.is950type()) {
            return 'native';
        } else {
            return 'none';
        }
    }

    getAreaCleaningMode() {
        if (this.isModelTypeAirbot()) {
            return 'custom';
        } else if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'custom';
        } else if (this.is950type()) {
            return 'custom';
        } else {
            return 'none';
        }
    }

    getSpotAreaCleaningMode() {
        if (this.isModelTypeAirbot()) {
            return 'none';
        } else if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'advanced';
        } else {
            return 'basic';
        }
    }

    getAutoEmptyStation() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getAirDryingLevel() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getTrueDetect() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getCleanPreference() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getAdvancedMode() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getWorkMode() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getCarpetPressure() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getCleanCountLevel() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getWashIntervalLevel() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getVolumeLevel() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getDoNotDisturb() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getContinuousCleaning() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getAutoEmpty() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getLifeSpan() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getNetworkInfo() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'basic';
        }
    }

    getSleepStatus() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getErrorCode() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'basic';
        }
    }

    getChargeState() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'basic';
        }
    }

    getCleanState() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'basic';
        }
    }

    getBatteryInfo() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'basic';
        }
    }

    getSoundControl() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'basic';
        }
    }

    getMovementControl() {
        if (this.isModelTypeT20() || this.isModelTypeX2() || this.isModelTypeX1()) {
            return 'advanced';
        } else if (this.is950type()) {
            return 'standard';
        } else {
            return 'none';
        }
    }

    getVoiceAssistant() {
        if (this.vacbot.getDeviceProperty('yiko')) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getHostedMode() {
        if (this.vacbot.getDeviceProperty('hosted_mode')) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getAirFreshener() {
        if (this.isSupportedFeature('consumable.airFreshener')) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getDustBox() {
        if (this.isSupportedFeature('info.dustbox')) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getThreeModuleStatus() {
        if (this.isModelTypeAirbot()) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getJCYAirQuality() {
        if (this.getModelType() === 'aqMonitor') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getAirQuality() {
        if (this.isModelTypeAirbot()) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getThreeModule() {
        if (this.isModelTypeAirbot()) {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatInfo() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatBlade() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMotor() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatBattery() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatChargeState() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatErrorCode() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatWorkMode() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatWorkState() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatPosition() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingInfo() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingState() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingPattern() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingArea() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingTime() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingDistance() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingHeight() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingWidth() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingLength() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingVolume() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingWeight() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingTemperature() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingHumidity() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingPressure() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingAltitude() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingLatitude() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingLongitude() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingAccuracy() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingSatellites() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingFix() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingHdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingVdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingPdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingGdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingTdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingXdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingYdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingZdop() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefX() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefY() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefZ() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefVX() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefVY() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefVZ() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefAX() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefAY() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingEcefAZ() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingGeoidHeight() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingSep() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingDgpsAge() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingDgpsId() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingUtc() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingCourse() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingSpeed() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingClimb() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingTrack() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingStatus() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    getGoatMowingMode() {
        if (this.getModelType() === 'goat') {
            return 'advanced';
        } else {
            return 'none';
        }
    }

    // NEW DEVICE TYPE CLASSIFICATION METHODS
    /**
     * Get user-friendly device type classification
     * @returns {string} User-friendly device type name
     */
    getDeviceType() {
        const modelType = this.getModelType();
        if (DEVICE_TYPE_MAPPING[modelType]) {
            return DEVICE_TYPE_MAPPING[modelType];
        }
        // Fallback: check the adapter's own SUPPORTED_STATES for name-based classification
        const resolvedType = this.getDeviceTypeFromClass(this.getDeviceClass());
        if (resolvedType && DEVICE_TYPE_MAPPING[resolvedType]) {
            return DEVICE_TYPE_MAPPING[resolvedType];
        }
        return 'Unknown Device';
    }

    /**
     * Get device type from device class for device discovery
     * @param {string} deviceClass - The device class from API
     * @returns {string} Device type classification
     */
    getDeviceTypeFromClass(deviceClass) {
        // First check if we have direct mapping for this class
        if (SUPPORTED_STATES[deviceClass]) {
            const deviceInfo = SUPPORTED_STATES[deviceClass];
            // Check for known device patterns in the name
            if (deviceInfo.name) {
                if (deviceInfo.name.includes('Airbot') || deviceInfo.name.includes('AVA') || deviceInfo.name.includes('ANDY')) {
                    return 'airbot';
                }
                if (deviceInfo.name.includes('GOAT') || deviceInfo.name.includes('Goat')) {
                    return 'goat';
                }
                if (deviceInfo.name.includes('WINBOT') || deviceInfo.name.includes('Winbot')) {
                    return 'winbot';
                }
            }
        }

        // Fallback to current model type detection
        return this.getModelType();
    }

    /**
     * Get device capabilities for enhanced device information
     * @returns {object} Device capabilities object
     */
    getDeviceCapabilities() {
        return {
            type: this.getDeviceType(),
            hasMapping: this.isMappingSupported(),
            hasWaterBox: this.isSupportedFeature('info.waterbox'),
            hasAirDrying: this.hasAirDrying(),
            hasAutoEmpty: this.isSupportedFeature('control.autoEmptyStation'),
            hasSpotAreas: this.isSupportedFeature('map.spotAreas'),
            hasVirtualBoundaries: this.isSupportedFeature('map.virtualBoundaries'),
            hasContinuousCleaning: this.isSupportedFeature('control.continuousCleaning'),
            hasDoNotDisturb: this.isSupportedFeature('control.doNotDisturb'),
            hasVoiceAssistant: this.vacbot.getDeviceProperty('yiko') || false,
            hasCleaningStation: this.hasCleaningStation(),
            hasFloorWashing: this.hasFloorWashing()
        };
    }
}

module.exports = Model;