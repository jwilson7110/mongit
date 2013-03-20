


function _process(elem) {

	var process = this;

	this.elem = elem;
	this.name = elem.attr("processName");

	this.queueElem = elem.find(".queue");//html element containing the queued commands
	this.resultElem = elem.find(".result");//html element containing messaged from actions
	

	this.commandQueue = []; //the commands that have been queued

	this.scrollLock = false; //stops users from scrolling to quickly for client to update
	this.scrollIndex = 0; //the position of the tags scroller


	elem.find(".btnDown").click(function () {
		process.scroll(1);
	});

	elem.find(".btnUp").click(function () {
		process.scroll(-1);
	});

	elem.find(".btnFetch").click(function () {

		var button = $(this);

		//hides the button until the tags have been refreshed
		//prevents too many requests to fetch
		button.hide();


		socketFunction("action", "fetch", {process:process.name}, function (err) {

			//run an iteration in order to retieve all the latest tag data
			socketFunction("application", "iterate", {}, function (err, data) {

				//get the html to display the tags
				$.ajax({
					url: "/index/tags?process=" + process.name,
					method: "GET",
					async: false,
					dataType: "html",
					success: function (response) {
						
						process.tagsBodyElem.html(response);//insert the resulting html into the tags element
						process.initTags();//dispay the active tag
						updateData(data);
						button.show(); //show the fetch tags button again
						process.scroll(0); //return the scroller to the first tag
					}
				});
			});
		});
	});

	this.initServers();
	this.initTags();

	this.scroll(0);

}


_process.prototype.initServers = function () {

	var process = this;

	this.servers = {};

	this.elem.find(".server").each(function() {
		var serverElem = $(this);

		process.newServer(serverElem);
	});
}


_process.prototype.initTags = function () {
	var process = this;

	this.tags = {};

	this.tagsElem = this.elem.find(".tags");
	this.tagsBodyElem = this.tagsElem.find("tbody");
	this.tagElems = this.tagsElem.find(".tag");
	
	this.tagElems.each(function () {
		
		var tagElem = $(this);

		process.newTag(tagElem);
	});
	

	for(var serverKey in process.servers) {
		var server = process.servers[serverKey];

		server.tagSelectors = {};

		for (var tagKey in process.tags) {
			var tag = process.tags[tagKey];

			process.newTagSelector(server, tag, tag.elem.find(".tagSelector[serverName=" + server.name + "]"));
		}
	}
}


_process.prototype.newServer = function(elem) {
	var server = new _server(this, elem);
	this.servers[server.name] = server;
};


_process.prototype.newTag = function (elem) {
	var tag = new _tag(this, elem);
	this.tags[tag.name] = tag;
};


_process.prototype.newTagSelector = function (server, tag, elem) {
	
	var tagSelector = new _tagSelector(server, tag, elem);

	server.tagSelectors[tag.name] = tagSelector;
	tag.selectors[server.name] = tagSelector;
};


//update what being displayed with what exists in the data
_process.prototype.refresh = function () {
	
	for (var serverKey in this.servers) {

		var server = this.servers[serverKey];

		if (server) {
			server.refresh();
		}
	}


	for (var tagKey in this.tags) {
	
		var tag = this.tags[tagKey];
		if (tag) {
			tag.refresh();
		}
	}
};



_process.prototype.queueCommand = function(command, server, tag) {

	var process = this;
	
	server.ready = false; //indecates that the server in not available to accept new commands
	server.command = command; //store the command the server should run on the process once the user has confirmed
	server.refreshAll();

	this.commandQueue.push(server);

	//display a confirm box for the action
	var itemString = "<div class=\"queue-item\" serverName=\"" + server.name + "\" command=\"" + command + "\"></div>";
	this.queueElem.append(itemString);


	var item = this.queueElem.find(".queue-item[serverName=" + server.name + "]");	

	item.append("<div class=\"queue-item-command\">" + command + " " + server.process.name + " on " + server.name + "</div>");
	item.append("<img class=\"queue-item-confirm\" src=\"/images/confirm.png\" />");
	item.append("<img class=\"queue-item-cancel\" src=\"/images/cancel.png\" />");

	item.find(".queue-item-confirm").click(function(){
		server.execute(command, tag);
		process.removeFromQueue(server);

	});

	item.find(".queue-item-cancel").click(function(){
		process.removeFromQueue(server);
		server.ready = true;//the server is again ready to accepts commands
		server.command = null;
		server.refreshAll();
	});

	//if the confirm box is not already being displayed then display it
	if (!this.queueElem.is(":visible")) {
		this.queueElem.slideDown(1000);
	}
	else {
		item.hide();
		item.slideDown(1000);
	}
};


_process.prototype.removeFromQueue = function(server){
	
	for (var i = 0; i < this.commandQueue.length; ++i) {
		
		if (server == this.commandQueue[i]) {

			this.commandQueue.splice(i, 1);
			break;
		}
	}

	this.queueElem.find(".queue-item[serverName=" + server.name + "]").slideUp(1000, null, function(){
		$(this).remove();
	});
	
	//if there are no commands in the queue to run then remove the whole confirm box
	if (this.commandQueue.length == 0) {
		this.queueElem.slideUp(1000);
	}
};

_process.prototype.showActionResult = function(action, server, success){

	var elem = $("<div></div>");

	if (success) {

		elem.addClass("successBox");
		elem.html(action + " of " + this.name + " on " + server.name + " was successful");
	}
	else {

		elem.addClass("errorBox");
		elem.html(action + " of " + this.name + " on " + server.name + " failed");
	}

	this.resultElem.append(elem);

	elem.slideDown(1000, function() {

		//show the message for a small amount of time and then remove it
		setTimeout(function() {
			elem.slideUp(1000, function() {
				elem.remove();
			});
		}, 8000);
	})
};


_process.prototype.scroll = function (indexChange) {

	var process = this;
	
	if (this.scrollLock) {
		return;
	}


	this.scrollLock = true;

	//if the scroller is all the wayat the top or all the way at the bottom then dont scroll
	if (this.scrollIndex + indexChange < 0 || this.scrollIndex + 5 + indexChange >= this.tagElems.length) {

		this.scrollLock = false;
		return;
	}

	this.scrollIndex += indexChange;
	

	this.tagElems.each(function (i) {

		var elem = $(this);

		if (i >= process.scrollIndex && i <= process.scrollIndex + 5) {
			elem.show();
		}
		else {
			elem.hide();
		}
	});

	this.scrollLock = false;
}

