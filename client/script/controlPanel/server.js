

function _server(process, elem){

	var server = this;

	this.process = process;
	
	this.elem = elem;

	this.stateElem = elem.find(".state");
	this.processIdElem = elem.find(".processId");
	this.upTimeElem = elem.find(".upTime");
	this.memoryKbElem = elem.find(".memoryKb");
	this.memoryPercentElem = elem.find(".memoryPercent");
	this.cpuPercentElem = elem.find(".cpuPercent");
	this.startElem = elem.find("td.start");
	this.stopElem = elem.find("td.stop");
	this.restartElem = elem.find("td.restart");
	
	this.valueElems = elem.find(".value");
	this.waitElems = elem.find(".wait");
	this.downElems = elem.find(".down");

	this.stateActiveElem = this.stateElem.find(".active");
	this.stateStoppedElem = this.stateElem.find(".stopped");
	this.statePendingElem = this.stateElem.find(".pending");
	this.stateStartElem = this.stateElem.find(".start");
	this.stateStopElem = this.stateElem.find(".stop");
	this.stateRestartElem = this.stateElem.find(".restart");


	this.processIdValueElem = this.processIdElem.find(".value");
	this.upTimeValueElem = this.upTimeElem.find(".value");
	this.memoryKbValueElem = this.memoryKbElem.find(".value");
	this.memoryPercentValueElem = this.memoryPercentElem.find(".value");
	this.cpuPercentValueElem = this.cpuPercentElem.find(".value");
	this.startValueElem = this.startElem.find(".value");
	this.stopValueElem = this.stopElem.find(".value");
	this.restartValueElem = this.restartElem.find(".value");
	this.updateValueElem = this.restartElem.find(".value");
	
	this.name = elem.attr("serverName");

	this.processData = {};
	
	this.alive = true;
	this.ready = true;

	this.command = null;

	
	this.showing = "value";
	this.showingState = "active";

	this.tagSelectors = {};

	this.elem.find(".btnStart").click(function(){
		server.process.queueCommand("start", server);
	});

	this.elem.find(".btnStop").click(function(){
		server.process.queueCommand("stop", server);
	});

	this.elem.find(".btnRestart").click(function(){
		server.process.queueCommand("restart", server);
	});
}


_server.prototype.refreshState = function(){
	var server = this;
	
	var should = this.shouldShowState(); //the state the server should be showing 
	var showing = this.showingState; //the state the server is currently showing 

	//if the server is not displaying what it should
	if (should != showing) {

		this.showingState = should;

		//hide the state icon that is being displayed and then show the one that should be displayed
		this.stateElem.find("." + showing).fadeOut(500, null, function() {

			if (should == server.shouldShowState()) {
				server.stateElem.find("." + should).fadeIn(500);
			}
		});
	}
	else {

		//display the status icon if it is not being shown
		var showElem = this.stateElem.find("." + showing);
		if (!showElem.is(":visible")) {
			showElem.fadeIn(500);
		}
	}
}


//determine the values other than state that should be shown 
_server.prototype.shouldShow = function () {

	//if the server is running mongit and its status can be retrieved by the server
	if (this.alive) {

		//if the server is ready to accept a command from the user
		if (this.ready) {
			return "value";
		}
		else {
			return "wait";
		}
	}
	else {
		return "down";
	}
};


//determine the state value that should be shown
_server.prototype.shouldShowState = function () {

	//if the server is running mongit and its status can be retrieved by the server
	if (this.alive) {

		//if the server is ready to accept a command from the user
		if (this.ready) {

			//if the process is running
			if (this.processData.alive) {
				return "active";
			}
			else {
				//display the process as starting restarting stopping stopped or pending
				return this.processData.state;
			}
		}
		else {
			return this.command;
		}
	}
	else {
		return "down";
	}
}


_server.prototype.refreshAll = function() {
	this.refresh();

	for (var tagSelectorKey in this.tagSelectors) {

		var tagSelector = this.tagSelectors[tagSelectorKey];
		if (tagSelector) {
			tagSelector.refresh();
		}
	}
};


_server.prototype.refresh = function() {
	
	var should = this.shouldShow();
	var showing = this.showing;

	this.refreshState(should, showing);
	this.refreshValue(this.processIdElem, should, showing, true, this.processData.pid);

	var upTime = "";
	var memoryKb = "";
	var memoryPercent = "";
	var cpuPercent = "";

	var status = this.processData.status;

	if (status) {
		upTime = status.upTime;
		memoryKb = status.memoryKb;
		memoryPercent = status.memoryPercent;
		cpuPercent = status.cpuPercent;
	}


	this.refreshValue(this.upTimeElem, should, showing, true, upTime);
	this.refreshValue(this.memoryKbElem, should, showing, true, memoryKb);
	this.refreshValue(this.memoryPercentElem, should, showing, true, memoryPercent);
	this.refreshValue(this.cpuPercentElem, should, showing, true, cpuPercent);

	this.refreshValue(this.startElem, should, showing, false);
	this.refreshValue(this.stopElem, should, showing, false);
	this.refreshValue(this.restartElem, should, showing, false);

	if (this.shouldShow() == should) {
		this.showing = should;
	}
}


_server.prototype.refreshValue = function(elem, should, showing, hasValue, value) {
	var server = this;

	//if the element should be displaying a value, not an icon
	if (should == "value") {

		//if the data has a value to display and that value is not null
		if (hasValue && !value) {
			value = "";
		}


		var valueElem = elem.find(".value");

		//if the element is currently displaying a value, but the value needs to be updated
		if (showing == "value" && hasValue && valueElem.html() != value) {

			//remove the current value and show the new one
			valueElem.fadeOut(500, null, function() {

				//make sure that in the time the previous value was being removed, the server should still be showing a value
				if (server.shouldShow() == "value") {
					valueElem.html(value);
					valueElem.fadeIn(500);
				}
			});
		}

		//if the process is showing the value value that is currently being displayed
		else if (showing == "value") {

			//if the element containing the value is currently hidden then show it
			if (!valueElem.is(":visible")){
				valueElem.fadeIn(500);
			}
		}
		else {//if the process is not currently showing a value
			if (hasValue) {
				valueElem.html(value);
			}

			//hide the icon that is being displayed and show the value element
			elem.find("." + showing).fadeOut(500, null, function() {
				if (server.shouldShow() == "value"){
					valueElem.fadeIn(500);
				}
			});
		}
	}

	//if an icon should be being displayed by the process and something else is being displayed
	else if (should != showing) {

		//hide what is being shown and show what is suppose to be shown
		elem.find("." + showing).fadeOut(500, null, function() {
			
			//ensure that the icon that is about to be displayed still represents the state of the server
			if (server.shouldShow() == should){
				elem.find("." + should).fadeIn(500);
			}
		});
	}
	else {//if what is being displayed does not need to change

		//show the icon if it is not being shown
		var showingElem = elem.find("." + should);
		if (!showingElem.is(":visible")){
			showingElem.fadeIn(500);
		}
	}
};


_server.prototype.refreshState = function() {
	var server = this;
	
	var should = this.shouldShowState();
	var showing = this.showingState;

	//if the state being displayed should not be displayed
	if (should != showing) {
		
		this.showingState = should;		

		//hide what is being displayed and show what should be displayed
		this.stateElem.find("." + showing).fadeOut(500, null, function() {

			//ensure that what is about to be displayed should stillbe displayed
			if (should == server.shouldShowState()) {
				server.stateElem.find("." + should).fadeIn(500);
			}
		});
	}
	else {

		var showElem = this.stateElem.find("." + showing);
		if (!showElem.is(":visible")) {
			showElem.fadeIn(500);
		}
	}
}


_server.prototype.execute = function (action, tag) {
	var server = this;	

	var tagName = null;
	if (tag) {
		tagName = tag.name;
	}


	socketFunction("action", action, {
		process: this.process.name,
		server: this.name,
		tag: tagName
	}, function (err, response) {

		var success;

		if (err != null) {
			success = false;
		}
		else {
			success = response.success;
		}

		server.process.showActionResult(action, server, success);

		socketFunction("application", "iterate", {update: false}, function (err, response) {

			updateData(response);
			
			server.ready = true;
			server.command = null;

			refresh();
		});
	});
};

