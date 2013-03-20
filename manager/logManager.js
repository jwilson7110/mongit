var util = require("util");


exports._logManager = _logManager;

spacing = "   ";

function _logManager(application){
	this.application = application;

	
}


_logManager.prototype.print = function(type, topitem, maxIterations){

	var buffer = "";
	buffer += "----------------------------------------------------------------------\n";
	buffer += type + "\n";
	buffer += new Date() + "\n\n";
	

	function iterate(item, iteration, stack){

		var type = typeof item;
		

		if (item == null){
			buffer += "null";
			return
		}

		var indent = "";
		for (var i = 0; i < iteration; ++i) {
			indent += spacing;
		}

		if (type == "string"){

			buffer += item.replace(/\n/g, "\n" + indent + spacing);
			return;
		}

		if (type == "number"){

			buffer += item;
			return;
		}
		
		

		for (var i = 0; i < stack.length; ++i){

			if (item == stack[i]){
				buffer += "[circular]";
				return;
			}
		}

		if (maxIterations){

			if (iteration >= maxIterations) {

				buffer += "[" + type + "]";
				return;
			}
		}

		

		if (type == "object"){

			if (util.isError(item)) {
				buffer += "{\n";
				buffer += indent + "   " + item.stack.replace(/\n/g, "\n" + indent + spacing) + "\n";
				buffer += indent + "}\n";

				return;
			}

			if (util.isArray(item)) {

				buffer += "[\n";

				for (var i = 0; i < item.length; ++i) {

					buffer += indent + spacing + i + ": ";
					iterate(item[i], iteration + 1, stack.concat([item]));
					buffer += "\n";
				}

				buffer += indent + "]\n";

				return;
			}
		
			buffer += "{\n";

			for (var key in item) {

				buffer += indent + spacing + key + ": ";
				iterate(item[key], iteration + 1, stack.concat([item]));
				buffer += "\n";
			}
		

			buffer += indent + "}\n";
		}
		else {
			buffer += "[" + type + "]";
		}
	}	

	iterate(topitem, 0, []);

	buffer += "\n----------------------------------------------------------------------\n";
	console.log(buffer);

}


_logManager.prototype.registerRequest = function (request){
	var self = this;

	request.repository.path.logCommand = true;
	request.repository.path.logStdout = true;
	request.repository.path.logStderr = true;
	request.repository.path.logUrl = true;

	
	request.repository.path.logSvn = function (command, stdout, stderr){

		self.print("Svn Command", {command: command, stdout: stdout, stderr: stderr});
	}

	request.repository.path.logHttpRequest = function (url){
		self.print("Http Request", url);
	}
};


_logManager.prototype.registerReleaseCandidateRequest = function (request){

	this.registerRequest(request);

}

_logManager.prototype.registerReleaseCandidateTagRequest = function (request){

	this.registerRequest(request);

}