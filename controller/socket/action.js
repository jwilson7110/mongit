
var async = require("async");


exports.action = _action;


function _action() {}


_action.prototype.execute = function (args, session, callback){

	var application = this.router.application;
	

	if (!application.authenticationManager.loggedIn(session)){
	
		return callback(null, {sucess: false, reason: "authentication"});
	}

	var serverManager = application.serverManager;
	
	var server = serverManager.servers[args.server];
	if (!server) {

		return callback(null, {success: false, reason: "server"});
	}

	var process = server.processData[args.process];
	if (!process) {

		return callback(null, {success: false, reason: "process"});
	}
	
	//action/{action}?process={processName}&password={config.password}
	serverManager.request(server, "/action/" + args.action + "?process=" + args.process + "&password=" + application.config.password, function (err, response) {

		if (err != null) {
			return callback(err);
		}

		
		var data = JSON.parse(response);

		callback(null, {
			action: args.action,
			process: args.process,
			server: args.server,
			success: data.success,
			result: data
		});
	});
}

_action.prototype.start = function (args, session, callback){

	args.action = "start";
	this.execute(args, session, callback);
}

_action.prototype.stop = function (args, session, callback){

	args.action = "stop";
	this.execute(args, session, callback);
}

_action.prototype.restart = function (args, session, callback) {

	args.action = "restart";
	this.execute(args, session, callback);
}


_action.prototype.checkout = function(args, session, callback) {
	
	var application = this.router.application;
	if (!application.authenticationManager.loggedIn(session)){
	
		return callback(null, {sucess: false, reason: "authentication"});
	}
	
	
	var server = application.serverManager.servers[args.server];
	if (!server) {
		return callback(null, {success: false, reason: "server"});
	}
	
	
	var process = server.processData[args.process];
	if (!process) {
		return callback(null, {success: false, reason: "process"});
	}

	
	//find the tag object represented by the tag name passed in
	var tag = null;
	for (var i = 0; i < process.tags.length; ++i) {
		var t = process.tags[i];

		if (t.name == args.tag) {

			tag = t;
			break;
		}
	}	
		
	if (!tag) {
		return callback(null, {success: false, reason: "tag"});
	}

	application.serverManager.request(server, "/action/checkout?process=" + args.process + "&tag=" + args.tag + "&password=" + application.config.password, function (err, response){
		if (err != null) {
			return callback(err);
		}

		var data = JSON.parse(response);

		callback(null, {
			process: args.process,
			server: args.server,
			tag: args.tag,
			success: data.success,
			result: data
		});
	});	
};



_action.prototype.fetch = function(args, session, callback){	

	var application = this.router.application;
	if (!application.authenticationManager.loggedIn(session)){
	
		return callback(null, {sucess: false, reason: "authentication"});
	}

	var server = null;
	if (args.server) {

		server = application.serverManager.servers[args.server];
	
		if (!server) {
			return callback(null, {success: false, reason: "server"});
		}
	}

	var process = null;
	if (args.process) {
	
		process = application.processManager.processes[args.process];
		if (!process) {
			return callback(null, {success: false, reason: "process"});
		}
	}

	//if a process is specified, then the fetch will only execute on that process, otherwise it will be done on all processes
	var path = "/action/fetch?password=" + application.config.password;
	if (process) {//if there is only one process to fetch for
		path += "&process=" + args.process;
	}

	//the callback function for the case of fetching for all processes or just one
	function cb (err) {
		if (err != null){
			return callback(err);
		}

		callback (null, {
			process: args.process,
			server: args.server
		});
	}	


	//if a server is specified, then the fetch will only execute on that server, 
	//otherwise it will be done on all servers
	if (server) {
		return application.serverManager.request(server, path, cb);
	}

	async.forEach(application.serverManager.serverArr, function (server, callback) {
			
		application.serverManager.request(server, path, callback);
	}, cb);
};
