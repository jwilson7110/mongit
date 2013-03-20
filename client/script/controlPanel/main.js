


var processes = null;

$(document).ready(function() {
	
	processes = {};
	
	$(".process").each(function() {
		var processElem = $(this);

		var process = new _process(processElem);
		processes[process.name] = process;


		var label = processElem.find(".processLabel");

		label.click(function (){

			var state = processElem.attr("state");

			processElem.attr("state", "transition");

			var body = processElem.find(".processBody");

			if (state == "collapsed") {
				

				body.slideDown(function (){

					processElem.attr("state", "expanded");
				});

				return;
			}

			if (state == "expanded"){

				body.slideUp(function (){

					processElem.attr("state", "collapsed");
				});

				return;
			}
		});

		label.mouseover(function(){
			label.css("text-decoration", "underline");
		})


		label.mouseout(function(){
			label.css("text-decoration", "none");
		})
	});
});


//server will call this function every iteration (5 seconds)
socket.on("update", function (data){
	updateData(data);
	refresh();
});


//takes the parameter data and sets it to the objects stored on the client
function updateData(data) {

	if (!processes) {
		return;
	}


	for (var processKey in processes) {

		var process = processes[processKey];
		if (!process){
			continue;
		}
		
		for (var serverKey in process.servers) {

			var server = process.servers[serverKey];
			if (!server){
				continue;
			}

			var serverData = data[serverKey];
			if (!serverData){
				continue;
			}

			server.alive = serverData.alive;

			var processData = serverData.processData[processKey];
			if (!processData){
				continue;
			}
			
			server.processData = processData;


			for (var tagSelectorKey in server.tagSelectors) {

				var tagSelector = server.tagSelectors[tagSelectorKey];
				if (!tagSelector){
					continue;
				}

				tagSelector.active = tagSelector.tag.name == processData.activeTag;
			}
		}
	}
}


//display the current data
function refresh() {
	
	for (var processKey in processes) {
		
		var process = processes[processKey];
		if (process){
			process.refresh();
		}
	}
}

