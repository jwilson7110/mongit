

exports._process = _process;

function _process(manager, name, settings) {

	this.manager = manager;
	this.name = name;

	if (settings) {
		for (var key in settings){
			this[key] = settings[key];
		}
	}

	this.status = null; 

	this.errors = {};

	this.state = 'initializing';
	this.restartAttempts = 0;
}


_process.prototype.setPid = function(pid) {

	this.pid = pid;
	this.errors.pid = null;
}


_process.prototype.setTags = function(tags) {
	
	this.errors.getTags = null;
	this.tags = tags;	
};


_process.prototype.setActiveTag = function (activeTagName) {
	
	this.errors.getActiveTag = null;
	
	this.activeTag = null;

	for (var i = 0; i < this.tags.length; ++i){
		var tag = this.tags[i];

		if (activeTagName == tag.name){
			this.activeTag = tag;			
			break;
		}
	}
}


