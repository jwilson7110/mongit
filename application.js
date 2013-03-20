
var path = require("path");
var joinPath = path.join;


var async = require("async");

var express = require("express");

var socketIO = require("socket.io");

var newRouter = require("node-mvc").newRouter;

var _processManager = require("./manager/processManager.js")._processManager;
var _serverManager = require("./manager/serverManager.js")._serverManager;
var _tagManager = require("./manager/tagManager.js")._tagManager;
var _authenticationManager = require("./manager/authenticationManager.js")._authenticationManager;
var _logManager = require("./manager/logManager.js")._logManager;

var peoConfig = require("/etc/peo/config");


exports._application = _application;


function _application(configPath) {

	var self = this;

	this.name = "mongit";

	this.configPath = configPath;
	if (!this.configPath){
		this.configPath = "./config.js";
	}

	this.config = require(this.configPath);	

	this.peoConfig = peoConfig;
	
	this.port = peoConfig.getPort(this.name, peoConfig.getAppMode());


	if (typeof this.port != "number"){
		this.port = 3000;
	}

	this.path = __dirname;
	
	
	this.interval = this.config.interval;
	if (!this.interval){
		this.interval = 5000;
	}

	var peoSessionConfig = self.peoConfig.getSessionConfig(this.name, this.mode);
	var sessionStore;

	if (!process.env.NODE_MEMORY_STORE) {

		var gennumSessionStore = require('gennum-session-store')(express);
		sessionStore = new gennumSessionStore(peoSessionConfig.dbConf);
	}
	else {
		
		if (process.env.NODE_ENV === 'production') {
    		throw Error('You can not use MemoryStore in production mode');
  		}
  	
  		var MemoryStore = express.session.MemoryStore;
		sessionStore = new MemoryStore();
	}

	var sessionConfig = {
		store: sessionStore,
		key: this.name + "." + peoSessionConfig.key,
		secret: peoSessionConfig.secret,
		cookie: {
			path: peoSessionConfig.path,
			maxAge: peoSessionConfig.maxAge,
			httpOnly: peoSessionConfig.httpOnly
		}
	}	

	this.sessionConfig = sessionConfig;


	this.router = newRouter({
		application: this,
		sessionConfig: sessionConfig,
		baseViewPath: joinPath(this.path, "client/views")
	});


	this.router.registerHttpControllers(joinPath(this.path, "controller/http"));
	this.router.registerSocketControllers(joinPath(this.path, "controller/socket"));


	this.expressApp = express.createServer();

	this.socketIO = socketIO.listen(this.expressApp);
	this.socketIO.set("log level", 1);

	this.router.registerSocketIO(this.socketIO);

	this.expressApp.use(express.bodyParser());
	this.expressApp.use(express.cookieParser());


	this.expressApp.use(express.session(sessionConfig));


	this.expressApp.use(function (request, response, next){
		self.router.route(request, response, next);
	});

	this.expressApp.use(express.static(joinPath (this.path, "client")));

	this.processManager = new _processManager(this);
	this.serverManager = new _serverManager(this);
	this.tagManager = new _tagManager(this);
	this.authenticationManager = new _authenticationManager(this);
	this.logManager = new _logManager(this);


	this.tagManager.fetchAll(function (err){
		self.startIterating();

		self.expressApp.listen(self.port);
	});

}


_application.prototype.startIterating = function (){

	var self = this;
	this.stopIterating();

	this.iterate(true);
	this.timeout = setInterval(function (){
		self.iterate(true);
	}, this.interval);
};


_application.prototype.stopIterating = function (){
	if (this.timeout){
		clearTimeout(this.timeout);
	}
};

_application.prototype.iterate = function (update, callback){
	var self = this;


	async.series([
		function (callback){
			self.processManager.updateAll(callback);
		},
		function (callback){
			self.serverManager.pollAll(callback);
		},
		function (callback){
			self.tagManager.updateActiveTags(callback);
		}
	], function (){

		var data = self.serverManager.getData();		
		
		if (update){
			
			var sockets = self.socketIO.sockets.sockets;

			for (var socketId in sockets){

				var socket = sockets[socketId];
				if (!socket.disconnected){
					sockets[socketId].emit("update", data);	
				}				
			}
		}

		if (callback){
			callback(null, data);
		}
	});
}
