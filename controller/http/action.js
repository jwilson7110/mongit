

exports.action = _action;

//this controls the requests coming from other servers
function _action (application){}


_action.prototype.getProcess = function (data, callback){

	var params = data.routeInfo.params;
	var process;

	if (params.length >= 1){

		process = this.router.application.processManager.processes[params[0]];
	}

	if (process){
		return process;
	}

	process = this.router.application.processManager.processes[data.routeInfo.url.query["process"]];

	if (process){
		return process;
	}

	callback (null, JSON.stringify({success: false, reason: "process"}));
	
}


_action.prototype.start = function (data, callback) {
	var self = this;
	var application = this.router.application;

	var process = this.getProcess(data);
	if (!process){
		return;
	}

	application.processManager.start(process, function (err, response) {
		if (err){
			application.logManager.print("Action Error", {
				Action: "Start",
				Process: process.name,
				Error: err
			});
		}

		self.write(JSON.stringify({success: err == null, err: err}), callback);
	});
};

_action.prototype.stop = function (data, callback) {
	var self = this;
	var application = this.router.application;

	var process = this.getProcess(data);
	if (!process){
		return;
	}

	this.router.application.processManager.stop(process, function (err, response) {
		if (err){
			application.logManager.print("Action Error", {
				Action: "Stop",
				Process: process.name,
				Error: err
			});
		}

		self.write(JSON.stringify({success: err == null, err: err}), callback);
	});
}

_action.prototype.restart = function (data, callback) {
	var self = this;
	var application = this.router.application;

	var process = this.getProcess(data);
	if (!process){
		return;
	}

	this.router.application.processManager.restart(process, function (err) {

		if (err){
			application.logManager.print("Action Error", {
				Action: "Restart",
				Process: process.name,
				Error: err
			});
		}

		self.write(JSON.stringify({success: err == null, err: err}), callback);
	});
}

_action.prototype.checkout = function (data, callback) {
	var self = this;
	var application = this.router.application;

	var process = this.getProcess(data);
	if (!process) {

		return;
	}

	var tagName = data.routeInfo.url.query["tag"];
	var tag = null;

	for (var i = 0; i < process.tags.length; ++i) {

		var t = process.tags[i];
		if (t.name == tagName) {

			tag = t;
			break;
		}
	}
	
	if (!tag) {

		application.logManager.print("Action Error", {
			Action: "Checkout",
			Process: process.name,
			Tag: tagName,
			Error: "Tag Does not exist"
		});

		return callback(null, JSON.stringify({success: false, reason: "tag"}));
	}


	application.tagManager.checkout(process, tagName, function (err) {

		if (err){
			application.logManager.print("Action Error", {
				Action: "Checkout",
				Process: process.name,
				Tag: tagName,
				Error: err
			});
		}

		self.write(JSON.stringify({success: err == null, err: err}), callback);
	});
}


_action.prototype.fetch = function (data, callback) {

	var self = this;
	var application = this.router.application;

	var process = this.getProcess(data);
	if (process) {
		
		application.tagManager.fetch(process, function (err) {

			if (err){
				application.logManager.print("Action Error", {
					Action: "Fetch",
					Process: process.name,
					Error: err
				});
			}


			self.write(JSON.stringify({success: err == null, err: err}), callback);
		});

		return;
	}

	this.router.application.tagManager.fetchAll(function (err) {

		if (err){
			application.logManager.print("Action Error", {
				Action: "Fetch All",
				Error: err
			});
		}

		
		self.write(JSON.stringify({success: err == null, err: err}), callback);
	});
}

