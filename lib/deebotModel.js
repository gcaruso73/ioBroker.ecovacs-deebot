/* eslint-disable quotes */

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

// Features that are enabled by default (unless explicitly disabled in SUPPORTED_STATES)
const DEFAULT_STATES = [
    "control.pause",
    "control.resume",
    "control.playSound",
    "control.cleanSpeed",
    "cleaninglog.channel",
    "info.network"
];

// Map attributes that are implicitly 'true' when 'map: true' is set for a device class.
// Exceptions must be declared explicitly (e.g. with 'false') in SUPPORTED_STATES.
const MAP_DEFAULT_STATES = [
    "map.chargePosition",
    "map.deebotPosition",
    "map.deebotPositionCurrentSpotAreaID",
    "map.deebotPositionIsInvalid",
    "map.lastUsedAreaValues",
    "map.spotAreas"
];

// Lookup table for supported features that are enabled by default
const SUPPORTED_STATES = {
    "yna5xi": {
        "name": "DEEBOT OZMO 950 Series",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.mapImage": true,
        "map.relocationState": true
    },
    "h18jkh": {
        "name": "DEEBOT OZMO T8",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanCount": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.mapImage": true,
        "map.relocationState": true,
        "technology.trueDetect": true
    },
    "55aiho": {
        "name": "DEEBOT OZMO T8 AIVI",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanCount": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.relocationState": true,
        "technology.trueDetect": true
    },
    "vi829v": {
        "name": "DEEBOT OZMO 920",
        "deviceClassLink": "yna5xi" // DEEBOT OZMO 950 Series
    },
    "jffnlf": {
        "name": "DEEBOT N3 MAX",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "r5zxjr": {
        "name": "DEEBOT N7",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "n6cwdb": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "r5y7re": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "ty84oi": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "36xnxf": {
        "name": "DEEBOT N8",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "snxbvc": {
        "name": "DEEBOT N8 PRO",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "yu362x": {
        "name": "DEEBOT N8 PRO",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "7bryc5": {
        "name": "DEEBOT N8+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "b2jqs4": {
        "name": "DEEBOT N8+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "ifbw08": {
        "name": "DEEBOT N8 PRO+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "85as7h": {
        "name": "DEEBOT N8 PRO+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "s1f8g7": {
        "name": "DEEBOT N8 PRO CARE",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "c2of2s": {
        "name": "DEEBOT N9+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "m1wkuw": {
        "name": "DEEBOT N10",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "umwv6z": {
        "name": "DEEBOT N10 PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "clojes": {
        "name": "DEEBOT N10 MAX+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "yinacl": {
        "name": "DEEBOT N20e PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "qhe2o2": {
        "name": "DEEBOT N20 PRO PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "p0l0af": {
        "name": "DEEBOT N20 PRO PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "aavvfb": {
        "name": "DEEBOT N20 PRO",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "buom7k": {
        "name": "DEEBOT N20 PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "kr0277": {
        "name": "DEEBOT N20",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "edoodo": {
        "name": "DEEBOT N20",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "zgsvkq": {
        "name": "DEEBOT N20e",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "ruhc0q": {
        "name": "DEEBOT N20e",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "i35yb6": {
        "name": "DEEBOT N20 PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "9kpees": {
        "name": "DEEBOT N20 PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "gwtll7": {
        "name": "DEEBOT N20 PRO PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "c8gerr": {
        "name": "DEEBOT N20 PRO",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "7piq03": {
        "name": "DEEBOT N20e PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "zwkcqc": {
        "name": "DEEBOT N30 OMNI",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "dlrbzq": {
        "name": "DEEBOT N30 PRO OMNI",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "87swps": {
        "name": "DEEBOT N30 PRO OMNI",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "9rft3c": {
        "name": "DEEBOT OZMO T5",
        "deviceClassLink": "yna5xi" // DEEBOT OZMO 950 Series
    },
    "x5d34r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "bs40nz": {
        "name": "DEEBOT T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "5089oy": {
        "name": "DEEBOT T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "55uoqe": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "7n95dm": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "dqcneu": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "sa4tf7": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "uzel1r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "z0gd1j": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "tpnwyu": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "34vhpm": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "w16crm": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "vdehg6": {
        "name": "DEEBOT T8 AIVI +",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "b742vd": {
        "name": "DEEBOT OZMO T8",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "0bdtzz": {
        "name": "DEEBOT OZMO T8 PURE",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "fqxoiu": {
        "name": "DEEBOT OZMO T8+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "wgxm70": {
        "name": "DEEBOT T8",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "a1nNMoAGAsH": {
        "name": "DEEBOT T8 MAX",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "no61kx": {
        "name": "DEEBOT T8 POWER",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "ucn2xe": {
        "name": "DEEBOT T9",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "ipohi5": {
        "name": "DEEBOT T9",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "lhbd50": {
        "name": "DEEBOT T9+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "um2ywg": {
        "name": "DEEBOT T9+",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "8kwdb4": {
        "name": "DEEBOT T9 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "659yh8": {
        "name": "DEEBOT T9 AIVI",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "kw9ayx": {
        "name": "DEEBOT T9 AIVI Plus",
        "deviceClassLink": "55aiho" // DEEBOT OZMO T8 AIVI
    },
    "jtmf04": {
        "name": "DEEBOT T10",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "rss8xk": {
        "name": "DEEBOT T10 PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "p95mgv": {
        "name": "DEEBOT T10 PLUS",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "9s1s80": {
        "name": "DEEBOT T10 TURBO",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "yaj7uz": {
        "name": "DEEBOT T10 TURBO",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "lx3j7m": {
        "name": "DEEBOT T10 OMNI",
        "deviceClassLink": "h18jkh" // DEEBOT OZMO T8
    },
    "p1jij8": {
        "name": "DEEBOT T20 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "m4xnd8": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "ohjbzz": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "paeygf": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "poke1m": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "qdajz8": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "r0321c": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "ulzked": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "viq3mw": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "x9ugz3": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "yi396x": {
        "name": "DEEBOT T20 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "9ku8nu": {
        "name": "DEEBOT T20e OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "py3qif": {
        "name": "DEEBOT T20e OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "z4lvk7": {
        "name": "DEEBOT T30 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "4vhygi": {
        "name": "DEEBOT T30 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "3w7j5e": {
        "name": "DEEBOT T30 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "tlthqk": {
        "name": "DEEBOT T30 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "822x8d": {
        "name": "DEEBOT T30 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "4bdkrs": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "ue8kcc": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "8tyt2y": {
        "name": "DEEBOT T30S",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "eqmf84": {
        "name": "DEEBOT T30S",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "9gqyaq": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "kr9c86": {
        "name": "DEEBOT T30S COMBO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "ee23uv": {
        "name": "DEEBOT T30S COMBO COMPLETE",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "xco2fc": {
        "name": "DEEBOT T30S PRO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "cb69w5": {
        "name": "DEEBOT T30S PRO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "63cum9": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "7c26ui": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "8o3xke": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "bheggm": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "c8rj4y": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "cuoipb": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "czjwet": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "elrxgb": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "k1lgm7": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "qnkybo": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "xztz07": {
        "name": "DEEBOT T30S Pro Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "9eamof": {
        "name": "DEEBOT T80 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "k8qkc7": {
        "name": "DEEBOT T80 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "02qwum": {
        "name": "DEEBOT T80 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "3yqsch": {
        "name": "DEEBOT X1",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.cleanCount": true,
        "control.continuousCleaning": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.relocationState": true,
        "technology.trueDetect": true
    },
    "8bja83": {
        "name": "DEEBOT X1 Omni",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "1b23du": {
        "name": "DEEBOT X1 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "1vxt52": {
        "name": "DEEBOT X1 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "2o4lnm": {
        "name": "DEEBOT X1 TURBO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "n4gstt": {
        "name": "DEEBOT X1 PLUS",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "bro5wu": {
        "name": "DEEBOT X1e OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "8onkgl": {
        "name": "DEEBOT X1 Turbo",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "s523z1": {
        "name": "DEEBOT X1 Turbo",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "e6ofmn": {
        "name": "DEEBOT X2",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "lf3bn4": {
        "name": "DEEBOT X2",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "e6rcnf": {
        "name": "DEEBOT X2 COMBO",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "ip3mmy": {
        "name": "DEEBOT X2 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "p7l7iu": {
        "name": "DEEBOT X2 OMNI Height",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "lr4qcs": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "o0a4ju": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "e6yxdm": {
        "name": "DEEBOT X5 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "4jd37g": {
        "name": "DEEBOT X5 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "rvflzn": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "w7k3yc": {
        "name": "DEEBOT X5 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "4bx3w9": {
        "name": "DEEBOT X8 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "co3fyu": {
        "name": "DEEBOT X8 OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "n0vyif": {
        "name": "DEEBOT X8 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "ilt3k8": {
        "name": "DEEBOT X9 PRO OMNI",
        "deviceClassLink": "3yqsch" // DEEBOT X1
    },
    "p5nx9u": {
        "name": "yeedi 2 hybrid",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.relocate": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.relocationState": true
    },
    "aaxesz": {
        "name": "yeedi vac 2 pro",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "control.continuousCleaning": true,
        "control.doNotDisturb": true,
        "control.relocate": true,
        "control.volume": true,
        "info.dustbox": true,
        "info.sleepStatus": true,
        "map": true,
        "map.relocationState": true
    },
    "mnx7f4": {
        "name": "yeedi vac station",
        "deviceClassLink": "p5nx9u" // yeedi 2 hybrid
    },
    "9t30w8": {
        "name": "yeedi vac 2",
        "deviceClassLink": "p5nx9u" // yeedi 2 hybrid
    },
    "h041es": {
        "name": "yeedi vac hybrid",
        "deviceClassLink": "p5nx9u" // yeedi 2 hybrid
    },
    "04z443": {
        "name": "yeedi vac max",
        "deviceClassLink": "p5nx9u" // yeedi 2 hybrid
    },
    "vthpeg": {
        "name": "yeedi mop station",
        "cleaninglog.lastCleaningMap": true,
        "consumable.reset": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true
    },
    "zwvyi2": {
        "name": "yeedi mop station pro",
        "deviceClassLink": "vthpeg" // yeedi mop station
    },
    "t5e5o6": {
        "name": "yeedi Floor 3 Station",
        "deviceClassLink": "vthpeg" // yeedi mop station
    },
    "kd0una": {
        "name": "yeedi Floor 3 Station",
        "deviceClassLink": "vthpeg" // yeedi mop station
    },
    "6r6dbt": {
        "name": "yeedi cube",
        "map": true
    },
    "sdp1y1": {
        "name": "AIRBOT Z1",
        "control.cleanSpeed": false,
        "control.pause": false,
        "control.playSound": false,
        "control.resume": false,
        "control.volume": true,
        "info.dustbox": false,
        "info.sleepStatus": true,
        "map": true,
        "map.deebotPositionIsInvalid": false,
        "map.lastUsedAreaValues": false,
        "map.relocationState": false
    },
    "0b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "1b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "2b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "3b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "4b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "5b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "6b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "7b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "8b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "9b5f6y": {
        "name": "Airbot Z1",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "1a2b3c": {
        "name": "Airbot AVA",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "2a3b4c": {
        "name": "Airbot ANDY",
        "deviceClassLink": "sdp1y1" // AIRBOT Z1
    },
    "20anby": {
        "name": "Z1 Air Quality Monitor",
        "control.pause": false,
        "control.resume": false,
        "control.playSound": false,
        "cleaninglog.channel": false,
        "control.cleanSpeed": false,
        "control.volume": false,
        "info.dustbox": false
    },
    "5xu9h3": {
        "name": "GOAT",
        "control.cleanSpeed": false,
        "control.playSound": false,
        "consumable.reset": false,
        "info.dustbox": false,
        "info.sleepStatus": true
    },
    "2ap5uq": {
        "name": "GOAT GX-600",
        "deviceClassLink": "5xu9h3" // GOAT
    },
    "ao7fpw": {
        "name": "GOAT GX-600",
        "deviceClassLink": "5xu9h3" // GOAT
    },
    "xmp9ds": {
        "name": "GOAT A1600 RTK",
        "deviceClassLink": "5xu9h3", // GOAT
        "map": false
    }
};

class Model {
    constructor(vacbot, config) {
        this.vacbot = vacbot;
        this.config = config;
    }

    getDeviceClass() {
        return this.vacbot.deviceClass;
    }

    /**
     * Returns the canonical device class, resolving a `deviceClassLink` alias if present.
     * Use this when you need the authoritative class for feature lookups.
     * For the raw value from the protocol, use {@link getDeviceClass}.
     * @returns {string}
     */
    getCanonicalDeviceClass() {
        if (SUPPORTED_STATES[this.getDeviceClass()]) {
            if (Object.prototype.hasOwnProperty.call(SUPPORTED_STATES[this.getDeviceClass()], 'deviceClassLink')) {
                return SUPPORTED_STATES[this.getDeviceClass()].deviceClassLink;
            }
        }
        return this.getDeviceClass();
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

    /**
     * Returns the technical platform/architecture type (e.g. '950', 'T8', 'T20', 'airbot').
     * Checks for an explicit override in SUPPORTED_STATES first, then delegates to the library.
     * @returns {string}
     */
    getPlatformType() {
        // Check for explicit model type override per device class
        const deviceClass = this.getDeviceClass();
        if (SUPPORTED_STATES[deviceClass] && SUPPORTED_STATES[deviceClass].modelType) {
            return SUPPORTED_STATES[deviceClass].modelType;
        }
        return this.vacbot.getPlatformType
            ? this.vacbot.getPlatformType()
            : this.vacbot.getModelType();
    }

    /**
     * @deprecated Use getPlatformType() instead.
     * @returns {string}
     */
    getModelType() {
        return this.getPlatformType();
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

    isSupportedFeature(state) {
        // Guard clause: without a known device class or config, only global defaults apply
        if (!this.getCanonicalDeviceClass() || !this.config) {
            return DEFAULT_STATES.includes(state);
        }
        const configOverride = this.getConfigOverride(state);
        if (configOverride !== null) {
            return parseInt(configOverride) === 1;
        }
        const featureValue = this.lookupInSupportedStates(state);
        if (featureValue !== undefined) {
            return featureValue;
        }
        // Implicit map defaults: attributes in MAP_DEFAULT_STATES are true
        // when 'map: true' is set, unless explicitly overridden above
        if (MAP_DEFAULT_STATES.includes(state) && this.isSupportedFeature('map')) {
            return true;
        }
        return DEFAULT_STATES.includes(state);
    }

    /**
     * Returns the raw config override value for a state if the user has configured it,
     * or `null` if no override is set.
     * @param {string} state
     * @returns {string|null}
     */
    getConfigOverride(state) {
        if (Object.hasOwn(CONFIG_FEATURE_STATES, state)) {
            const configOptionName = 'feature.' + CONFIG_FEATURE_STATES[state];
            if (this.config[configOptionName]) {
                return this.config[configOptionName];
            }
        }
        return null;
    }

    /**
     * Looks up `state` in `SUPPORTED_STATES` for the raw and canonical device class.
     * Returns the feature value if found, or `undefined` if the state is not declared.
     * @param {string} state
     * @returns {boolean|undefined}
     */
    lookupInSupportedStates(state) {
        // Using a Set avoids a redundant iteration when raw and canonical class are equal.
        const classes = [...new Set([this.getDeviceClass(), this.getCanonicalDeviceClass()])];
        for (const cls of classes) {
            if (Object.hasOwn(SUPPORTED_STATES, cls)) {
                const features = SUPPORTED_STATES[cls];
                if (Object.hasOwn(features, state)) {
                    return features[state];
                }
            }
        }
        return undefined;
    }

    hasMappingCapabilities() {
        return this.vacbot.hasMappingCapabilities() || this.isModelTypeAirbot();
    }

    /**
     * Get user-friendly device category classification.
     * Delegates to the library's `deviceCategory` property (defined in `modelTypes.js`).
     * @returns {string} User-friendly device category (e.g. 'Vacuum Cleaner', 'Air Purifier')
     */
    getDeviceCategory() {
        return this.vacbot.getDeviceCategory
            ? this.vacbot.getDeviceCategory()
            : this.vacbot.getDeviceProperty('deviceCategory', 'Unknown Device');
    }

    /**
     * @deprecated Use getDeviceCategory() instead.
     * @returns {string}
     */
    getDeviceType() {
        return this.getDeviceCategory();
    }

    /**
     * Get device capabilities for enhanced device information
     * @returns {object} Device capabilities object
     */
    getDeviceCapabilities() {
        return {
            type: this.getDeviceCategory(),
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