
exports.process = _process;

function _process(){}


_process.prototype.action = function (args, session, callback) {

	var application = this.router.application;
	if (!application.authentucationManager.loggedIn(session)){
	
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
	serverManager.request(server, "/action/" + action + "?process=" + args.process + "&password=" + application.config.password, function (err, response) {

		if (err != null) {
			return callback(err);
		}

		var data = JSON.parse(response);

		callback(null, {
			action: action, 
			process: processName,
			server: serverName,
			success: data.success,
			result: data
		});
	});	
};