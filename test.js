"use strict";
exports.__esModule = true;
var ts_morph_1 = require("ts-morph");
function test() {
    var project = new ts_morph_1.Project({
        tsConfigFilePath: "/home/depinfo/Bureau/JeuxDeMots/design-dico/src/tsconfig.app.json"
    });
    var modules = project.getAmbientModules();
    modules.forEach(function (modul) {
        return console.log(modul.getName);
    });
}
test();
