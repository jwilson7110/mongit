	




$(document).ready(function(){
	
	$('.tooltip').each(function(){
		var container = $(this);
		createToolTip(container, $(container.attr('target')));
	});
});



function createToolTip(container, target){

	container.hide();
	container.css('position', 'absolute');

	target.mouseover(function(){
		container.show();
	});

	target.mouseleave(function(){
		container.hide();
	});

	target.mousemove(function(e){
		container.css('left', e.pageX + 10);
		container.css('top', e.pageY + 10);
	});

}

