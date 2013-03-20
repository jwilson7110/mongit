
exports.status = _status;


function _status(application){}


_status.prototype.index = function (data, callback){
	this.processes(data, callback);
};
	

_status.prototype.processes = function (data, callback){
	
	this.write(JSON.stringify(this.router.application.processManager.getData()), callback);
}

_status.prototype.servers = function (data, callback){

	this.write(null, JSON.stringify(this.router.application.serverManager.getData()), callback);
}

