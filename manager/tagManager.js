
var exec = require("child_process").exec;
var joinPath = require("path").join;
var async = require("async");

var _tag = require("../model/tag.js")._tag;


exports._tagManager = _tagManager;

function _tagManager(application){

	this.application = application;
}

_tagManager.prototype.getGitCommand = function (process) {

	return "git --git-dir=" + joinPath(process.repoPath, ".git") + " ";
}


_tagManager.prototype.fetchTagsCommand = function (process) {

	//git --git-dir={process.repopath}/.git fetch -tags {process.remote}
	return this.getGitCommand(process) + "fetch --tags " + process.remote;
}


//create command to list all annotated tags in the format with values seperated by | and sorted by creation date
_tagManager.prototype.getTagsCommand = function (process) {
	
	return this.getGitCommand(process) + "for-each-ref --sort *authordate --format '%(objecttype)|%(refname)|%(*authordate)|%(subject)' refs/tags/ | grep ^tag | grep '|refs/tags/v[0-9]\\(\\.[0-9]\\+\\)*|'";
}


//create command to determine if passed in tag has a file named "appctrl.sh"
_tagManager.prototype.getTagContainsAppControlCommand = function (process, tag) {

	return this.getGitCommand(process) + "ls-tree --name-only refs/tags/" + tag.name + " | grep -c ^appctrl.sh$";
}


//create the command to determined the current checked out tag
_tagManager.prototype.getActiveTagCommand = function (process){
	return this.getGitCommand(process)	+ "describe --tag";
}


_tagManager.prototype.checkout = function (process, tag, callback){
	this.application.processManager.executeAction(process, "checkout " + tag, "updating", "updated", callback);
};



_tagManager.prototype.fetchTags = function (process, callback){
	var manager = this;

	var command = this.fetchTagsCommand(process);

	exec(command, function (err, response){

		manager.application.logManager.print("Fetch", {
			Command: command, 
			Response: response,
			Error: err
		});
		
		callback(err, response);
	});
};



_tagManager.prototype.getTags = function (process, callback){
	var manager = this;	

	exec(this.getTagsCommand(process), function (err, response) {

		if (err != null) {
			return callback(err);
		}
		
		//create an array of all the lines
		var lines = response.match(/[^\n]+/g);
		
		if (lines == null) {
			return callback();
		}

		var tags = [];

		async.forEachSeries(lines, function (line, callback) {

			//array of the tag values
			//[0] = object type
			//[1] = tagname
			//[2] = date
			//[3] = comment
			var values = line.split('|');

			if (values.length < 4){
				return callback();
			}

			var tag = new _tag(values[1].replace(/^refs\/tags\//, ""), new Date(values[2]), values[3]);

			//ensure the tag has the appctrl script
			manager.tagContainsAppControl(process, tag, function (err, response) {
				if (err != null) {
					return callback (err);
				}

				if (response) {
					tags.push(tag);
				}

				callback();
			});
		}, function (err) {
			callback (err, tags);
		});
	});
};


_tagManager.prototype.tagContainsAppControl = function (process, tag, callback) {

	exec(this.getTagContainsAppControlCommand(process, tag), function (err, response) {

		if (err != null && isNaN(response)) {
			return callback(err);
		}

		var count = parseInt(response);
		callback(null, response != NaN && response > 0);
	});
};	


_tagManager.prototype.getActiveTag = function (process, callback){

	exec(this.getActiveTagCommand(process), callback);
};




_tagManager.prototype.updateActiveTags = function (callback){

	var manager = this;

	async.forEach(this.application.processManager.processArr, function (process, callback) {

		manager.updateActiveTag(process, callback);
	}, callback);
}


_tagManager.prototype.updateActiveTag = function (process, callback) {

	var manager = this;

	manager.getActiveTag(process, function (err, response) {

		if (err != null) {
			process.errors.updateActiveTag = err;
			return callback();
		}

		process.setActiveTag(response.replace(/^\s+/, "").replace(/\s+$/, ""));

		callback();
	});
}


_tagManager.prototype.updateAll = function(callback) {

	var manager = this;

	async.forEach(this.application.processManager.processArr, function (process, callback) {
		manager.update(process, callback);

	}, callback);
};



_tagManager.prototype.update = function(process, callback) {

	var manager = this;
	
	process.tags = [];

	manager.getTags(process, function (err, response) {
		
		if (err != null) {
			process.errors.updateTags = err;
			return callback();
		}

		process.tags = response;
		process.errors.updateTags = null;

		manager.updateActiveTag(process, callback);
	});
};


_tagManager.prototype.fetchAll = function(callback) {

	var manager = this;

	async.forEach(this.application.processManager.processArr, function (process, callback) {
		manager.fetch(process, callback);

	}, callback);
};


_tagManager.prototype.fetch = function(process, callback) {

	var manager = this;

	this.fetchTags(process, function (err, response) {

		if (err != null) {
			process.errors.fetch = err;
			return callback();
		}
		
		process.errors.fetch = null;
		manager.update(process, callback);
		
	});
};


_tagManager.prototype.requestCheckout = function (session, serverName, processName, tagName, callback) {

	var manager = this;

	this.application.authenticationManager.validateUser(session.username, session.password, function (err, response) {
		if (err != null) {
			return callback(err);
		}

		if (!response.valid) {
			return callback(null, {success:false, reason:"authentication", response: response});
		}	
		
		
		var server = manager.application.serverManager.servers[serverName];
		if (!server) {
			return callback(null, {success: false, reason: "server"});
		}
		

		var process = server.processData[processName];
		if (!process) {
			return callback(null, {success: false, reason: "process"});
		}


		//find the tag object represented by the tag name passed in
		var tag = null;
		for (var i = 0; i < process.tags.length; ++i) {
			var t = process.tags[i];

			if (t.name == tagName) {

				tag = t;
				break;
			}
		}	
		
		if (!tag) {
			return callback(null, {success: false, reason: "tag"});
		}


		manager.application.serverManager.request(server, "/action/checkout" + "?process=" + processName + "&tag=" + tagName + "&password=" + manager.application.config.password, function (err, response){

			if (err != null) {
				return callback(err);
			}


			var data = JSON.parse(response);

			callback(null, {
				process: processName,
				server: serverName,
				tag: tagName,
				success: data.success,
				result: data
			});
		});
	});
}



_tagManager.prototype.requestFetch = function (session, serverName, processName, callback){
	var manager = this;

	this.application.authenticationManager.validateUser(session.username, session.password, function (err, response) {

		if (err != null) {
			return callback(err);
		}

		if (!response.valid) {
			return callback(null, {success:false, reason:"authentication", response: response});
		}


		var server = null;
		if (serverName) {

			server = manager.application.serverManager.servers[serverName];
		
			if (!server) {
				return callback(null, {success: false, reason: "server"});
			}
		}

		var process = null;
		if (processName) {
		
			process = manager.application.processManager.processes[processName];
			if (!process) {
				return callback(null, {success: false, reason: "process"});
			}
		}

		//if a process is specified, then the fetch will only execute on that process, otherwise it will be done on all processes
		var path = "/action/fetch?password=" + manager.application.config.password;

		if (process) {//if there is only one process to fetch for
			path += "&process=" + processName;
		}

		//the callback function for the case of fetching for all processes or just one
		function cb(err) {
			if (err != null){
				return callback(err);
			}

			callback (null, {
				process: processName,
				server: serverName
			});
		}	


		//if a server is specified, then the fetch will only execute on that server, 
		//otherwise it will be done on all servers
		if (server) {
			return manager.application.serverManager.request(server, path, cb);
		}

		async.forEach(manager.application.serverManager.serverArr, function (server, callback) {
			
			manager.application.serverManager.request(server, path, callback);
		}, cb);
	});
}
