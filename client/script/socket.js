


var socket = io.connect();

var unload = false;

$(document).unload(function(){
	unload = true;
})


socket.on("disconnect", function (){
	if (typeof disconnect == "function"){
		disconnect();
	}
});


var socketCallbacks = {};

socket.on("return", function (err, response, data){
	

	var callback = socketCallbacks[data.callbackId];
	
	if (!callback){
		return;
	}

	callback(err, response, data);
	delete socketCallbacks[data.callbackId];
	
});


function socketFunction(controllerName, functionName, args, callback){
	
	if (!args){
		args = {};
	}

	var callbackId = uuid();

	if (callback){
	
		socketCallbacks[callbackId] = callback;
	}
	
	
	socket.emit("execute", {
		controllerName: controllerName, 
		functionName: functionName, 
		args: args, 
		callbackId: callbackId
	});
}

