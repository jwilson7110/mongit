
var fs = require("fs");
var path = require("path");
var joinPath = path.join;
var pathExists = path.existsSync;


exports.index = _main;


function _main(){}


_main.prototype.getTagsData = function (processName){

	var tags = [];
	var servers = this.router.application.serverManager.getData();


	for (var serverName in servers) {

		var server = servers[serverName];
		var process = server.processData[processName];

		if (!process){
			continue;
		}

		if (process.tags.length > tags.length) {
			tags = process.tags;
		}
	}	

	return {
		tags: tags,
		servers: servers
	};
}


_main.prototype.index = function (data, callback){
	this.summary(data, callback);
}


_main.prototype.login = function (data, callback) {

	var redirect = data.routeInfo.url.query.redirect;
	if (!redirect) {

		//get the path the user was trying to get to in order to return them there after they have logged in
		redirect = data.request.url.path;
	}


	this.view({redirect: redirect}, callback);
};


_main.prototype.summary = function (data, callback) {
	this.view({servers: this.router.application.serverManager.getData()}, callback);	
};



_main.prototype.tags = function (data, callback) {

	if (!this.router.application.authenticationManager.loggedIn(data.request.session)){
		return this.login(data, callback);
	}
		
	this.view(this.getTagsData(data.routeInfo.url.query["process"]), callback);
}



_main.prototype.controlPanel = function (data, callback) {

	if (!this.router.application.authenticationManager.loggedIn(data.request.session)){
		return this.login(data, callback);
	}
	
	var tagsHtml = {};

	var processes = this.router.application.processManager.getData();

	for (var processName in processes) {

		tagsHtml[processName] = this.router.renderSync({
			controller: this,
			viewName: "tags",
			model: this.getTagsData(processName)
		});
	}

	this.view({
		servers: this.router.application.serverManager.getData(),
		processes: processes,
		tagsHtml: tagsHtml
	}, callback);
	
};


_main.prototype.log = function (data, callback){

	var session = data.request.session;
	if (!session){
		return this.login(data, callback);
	}

	if (!session.userName){
		return this.login(data, callback);
	}	

	var params = data.routeInfo.params;
	var process = params[0];
	
	if (!process){
		process = data.routeInfo.url.query["process"];
	}
	
	if (!process) {
		return callback();
	}

	var length = 10000; //the number of characters to show
	var full = false; //if true, show full log file
	var lengthString = params[1]; 


	//if there are 3 path values, then the last is the length value, if not then check the query for a length value
	if (!lengthString){

		lengthString = data.routeInfo.url.query["length"];
	}

	if (lengthString) {

		if (/^full$/i.test(lengthString)) {

			full = true;
		}

		else if (!isNaN(lengthString)) {

			length = parseInt(lengthString);
		}
	}	

		
	var path = joinPath("/var/log/peo/" + process) + ".log";
	if (!pathExists(path)) {

		return callback();
	}

	var text = fs.readFileSync(path, "UTF8");

	if (!full) {

		if (text.length > length) {
			text = text.substring(text.length - length - 1, text.length - 1);		
		}
	}	

	this.view({text: text}, callback);
}


