



socket.on("update", function (data){

	for (var serverName in data){
		var server = data[serverName];

		var serverElem = $(".server[serverName=" + server.name + "]");

		for (var processName in server.processData){
			var process = server.processData[processName];

			var processElem = serverElem.find(".process[processName=" + process.name + "]");

			processElem.find(".state").html(process.state);
			processElem.find(".processId").html(process.pid);
			processElem.find(".upTime").html(process.status.upTime);
			processElem.find(".memoryKb").html(process.status.memoryKb);
			processElem.find(".memoryPercent").html(process.status.memoryPercent);
			processElem.find(".cpuPercent").html(process.status.cpuPercent);
		}
	}
});