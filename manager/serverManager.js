
var http = require("http");
var async = require("async");

var _server = require("../model/server.js")._server;


exports._serverManager = _serverManager;


function _serverManager(application) {

	this.application = application;

	this.servers = {}; //list of servers accessible by server name
	this.serverArr = []; //array of servers stored to use with async.foreach

	var config = application.config;

	for (var serverName in config.servers) {

		this.servers[serverName] = this.discoverServer(serverName, config.servers[serverName]);
	}
}


_serverManager.prototype.pollAll = function (callback){

	var manager = this;

	async.forEach(this.serverArr, function (server, callback){

		manager.poll(server, callback);
	}, callback);
}


//get the status of processes on other servers
_serverManager.prototype.poll = function (server, callback){

	var manager = this;	

	
	this.request(server, "/status", function (err, response) {

		//assunme the server is down or mongit is not running on it if an error is returned
		if (err != null) {
			server.update(false);
			return callback();
		}

		var data;

		//parsing json will throw an exception if data is not in proper json format
		//assume the server is down or mongit is not running on that server
		try {
			data = JSON.parse(response);
		} 
		catch (e){
			server.update(false);
			return callback();
		}

		server.update(true, data);
		
		callback();
	});	
}


_serverManager.prototype.getData = function () {

	var data = {};

	for (var serverName in this.servers) {
		var server = this.servers[serverName];
		

		for (var processName in server.processData) {

			var process = server.processData[processName];
			
			//get link to application
			process.href = "http://" + server.host + ".gennum.com:" + this.application.peoConfig.getPort(processName, server.mode);

			//get link to view log file of process
			process.logHref = "http://" + server.host + ".gennum.com:" + this.application.port + "/log?process=" + process.name;
		}

		data[serverName] = {
			name: server.name,
			alive: server.alive,
			processData: server.processData
		};
	}

	return data;
}


_serverManager.prototype.request = function (server, path, callback){

	var logManager = this.application.logManager;

	var requestOptions = {
		host: server.host,
		port: this.application.peoConfig.getPort("mongit", server.mode),
		path: path,
		method: "GET"
	};

	var request = http.request (requestOptions, function (response) {

		response.setEncoding("UTF8");

		var dataString = "";

		response.on("data", function (s) {
			dataString += s;
		});

		response.on("end", function() {
		
			callback(null, dataString);
		});
	});

	request.on("error", function (err) {

		logManager.print("Server Http Request Error", {
			requestOptions: requestOptions,
			Error: err
		});

		server.alive = false;
		callback(err);
	});

	request.end();
}



_serverManager.prototype.discoverServer = function (name, settings) {

	var server = this.servers[name];

	if (!server){
		server = this.newServer(name, settings);
	}

	return server;
}


_serverManager.prototype.newServer = function (name, settings) {
	var server = new _server(this, name, settings);
	this.servers[name] = server;
	this.serverArr.push (server);
	return server;
}
