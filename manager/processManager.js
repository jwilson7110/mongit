
var exec = require("child_process").exec;
var joinPath = require("path").join;

var async = require("async");


var _process = require("../model/process.js")._process;


exports._processManager = _processManager;

function _processManager(application) {	

	this.application = application;
	
	this.processes = {}; //the processes accessable by the process name
	this.processArr = []; //array of the processes, used for async.forEach


	var config = application.config;

	for (var processName in config.processes) {

		this.processes[processName] = this.discoverProcess(processName, config.processes[processName]);
	}
}




_processManager.prototype.getAppControlCommand = function (process) {

	//{repopath}/appctrl.sh
	return joinPath(process.repoPath, "appctrl.sh ");
}


_processManager.prototype.getPidCommand = function (process) {

	//{repopath}/appctrl.sh pid
	return this.getAppControlCommand(process) + "pid ";
}


_processManager.prototype.getStatusCommand = function (process) {

	return "ps h -o ppid,s,etime,rss,pmem,pcpu -p " + process.pid;
}


_processManager.prototype.getPid = function(process, callback) {

	//{repopath}/appctrl.sh pid
	exec(this.getPidCommand(process), function (err, response) {

		if (err != null) {			
			return callback(err);
		}

		var pid = parseInt(response.replace(/\s+/g, ""));
		if (pid == NaN) {

			return (Error("could not find pid for process: " + process.name + " (" + response + ")"));
		}

		return callback(null, pid);
	});
};


_processManager.prototype.getStatus = function (process, callback) {


	exec(this.getStatusCommand(process), function (err, response) {

		if (err != null) {

			return callback(err);
		}
		
		var values = response.match(/[^\s]+/g);

		if (values.length != 6) {

			return callback(Error("there was a problem with reading the status of process: " + process.name));
		}

		return callback (null, {
			ppid: values[0],
			status: values[1],
			upTime: values[2],
			memoryKb: values[3],
			memoryPercent: values[4],
			cpuPercent: values[5]
		});
	});
};


_processManager.prototype.executeAction = function (process, action, beforeState, afterState, callback) {

	var manager = this;

	process.state = beforeState;


	var command = this.getAppControlCommand(process) + action;
	
	//{repopath}/appctrl.sh {action}
	exec(command, function (err, response) {

		manager.application.logManager.print("Execute Command", {
			Command: command,
			Response: response,
			Error: err
		})

		process.state = afterState;

		//manager.application.logManager.log({command: command, err: err, response: response})

		if (typeof callback == "function") {

			callback(err, response);
		}
	});
};


_processManager.prototype.start = function (process, callback) {

	this.executeAction(process, "start", "starting", "started", callback);
}


_processManager.prototype.stop = function (process, callback) {

	this.executeAction(process, "stop", "stopping", "stopped", callback);
}


_processManager.prototype.restart = function (process, callback) {

	this.executeAction(process, "restart", "restarting", "restarted", callback);
}


_processManager.prototype.refresh = function(process, alive, status) {

	var manager = this;

	process.alive = alive;
	process.status = status;


	if (process.alive) {
		process.restartAttempts = 0;

		//if the process alive value is true and its state is something indicating that its waiting to be started
		//then the state should be "active"
		switch(process.state) {
			case "initializing":
			case "restarted":
			case "started":
			case "stopped":
			case "updated":
				process.state = "active";
				break;
		}
	}
	else {

		//if the process alive value is false and its state is something indicating that its waiting to be started
		//then the process should attempt a restart
		switch(process.state) {
			case "initializing":
			case "active":
			case "started":
			case "restarted":
			case "updated":
			
				var restartAttempts = process.restartAttempts;
				if (restartAttempts < 5) {

					//set the state to pending so that the next iteration doesnt come in this block
					process.state = "pending";

					setTimeout(function () {
					
						//make sure the process has not been started while waiting to attempt another restart
						if ((!process.alive || process.restartAttempts == 0) && process.state == "pending") {
							manager.start(process);
						}

					}, process.restartAttempts * 10000); //wait longer for each restart attempt

					++process.restartAttempts;

				}
				else { //if there have been 5 attempts the stop the process
					process.restartAttempts = 0;
					process.state = "stopped";
				}

				break;
		}
	}
};


_processManager.prototype.updateAll = function(callback){

	var manager = this;

	async.forEach(this.processArr, function (process, callback){
		manager.update(process, callback);


	}, callback);
};


_processManager.prototype.update = function(process, callback){
	var manager = this;

	manager.getPid(process, function (err, response) {
		
		if (err != null) {

			process.errors.pid = err;
			manager.refresh(process, false, {});
			return callback();
		}
		

		process.setPid(response);

		manager.getStatus(process, function (err, response) {

			if (err != null) {

				process.errors.status = err;
				manager.refresh(process, false, {});
				return callback();
			}

			
			manager.refresh(process, (response != "X" && response != "Z"), response);

			callback();
		});
	});
};


_processManager.prototype.discoverProcess = function (name, settings) {

	var process = this.processes[name];

	if (!process){
		process = this.newProcess(name, settings);
	}

	return process;
}


_processManager.prototype.newProcess = function (name, settings) {

	var process = new _process(this, name, settings);
	this.processes[name] = process;
	this.processArr.push (process);
	return process;
}


_processManager.prototype.getData = function () {

	var data = {};

	for (var processName in this.processes) {

		var process = this.processes[processName];

		var tags = [];

		if (process.tags) {

			for (var i = 0; i < process.tags.length; ++i) {

				var tag = process.tags[i];
				tags.push({
					name: tag.name,
					subject: tag.subject,
					date: tag.date.toDateString()
				});
			}
		}

		var activeTag = "";
		if (process.activeTag){
			activeTag = process.activeTag.name;
		}

		data[processName] = {
			name: process.name,
			alive: process.alive,
			pid: process.pid,
			status: process.status,
			state: process.state,
			tags: tags,
			activeTag: activeTag,
		};
	}

	return data;
};

