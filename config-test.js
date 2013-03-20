

exports.interval = 5000;
exports.requirePassword = false;
exports.password = "*****";
exports.processes = {
	"app1":{
		repoPath: "/home/jeff/node_modules/mongit-tests/server1/app1",
		remote: "origin"
	},
	"app2":{
		repoPath: "/home/jeff/node_modules/mongit-tests/server1/app2",
		remote: "origin"
	},
	"app3":{
		repoPath: "/home/jeff/node_modules/mongit-tests/server1/app3",
		remote: "origin"
	},
};
exports.servers = {
	"server1":{
		host: "localhost",
		mode: "development"
	},
	"server2":{
		host: "localhost",
		mode: "development"
	},
	"server3":{
		host: "localhost",
		mode: "development"
	},
};
exports.controllers = {
	index: {
		controllerPath: "mainController",
		constructor: "_mainController",
		viewPath: "index"
	},
	status: {
		controllerPath: "statusController",
		constructor: "_statusController"
	},
	action: {
		controllerPath: "actionController",
		constructor: "_actionController"
	}
}
