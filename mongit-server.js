
var _application = require("./application.js")._application;

var configPath = null;
if (process.argv[2]){
	configPath = process.argv[2]
}


var application = new _application(configPath);

