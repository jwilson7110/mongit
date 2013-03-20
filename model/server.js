

exports._server = _server;


function _server(manager, name, settings) {
	this.manager = manager;
	this.name = name;	

	if (settings){
		for (var key in settings){
			this[key] = settings[key];
		}
	}


	this.status = {};
}


_server.prototype.update = function (alive, processData){

	this.alive = alive;

	if (this.alive){
		this.processData = processData;
	}
	else {
		this.processData = {};
	}
}