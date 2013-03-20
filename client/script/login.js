


$(document).ready(function(){

	$("#btnLogin").click(login);

	$("#txtUsername, #txtPassword").keyup(function (event){

		if (event.keyCode == 13){
			login();
		}
	});
});



function login (){
	$("#authenticationFailed").hide();

	socketFunction("authorization", "login", {
		username: $("#txtUsername").val(), 
		password: $("#txtPassword").val()

	}, function (err, response){
		if (err){
			alert(err.message);
			return;
		}
		
		if (!response.valid){
			$("#authenticationFailed").show();
			return;
		}

		window.location = $("#txtRedirect").val();
	});
}