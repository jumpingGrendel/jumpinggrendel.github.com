YUI().use("node", function (Y) {
    var timer = false;
    Y.on("domready", startMeUp);
    
    function checkValue(e) {
	var txt = window.getSelection().toString();
	if(txt && txt.match(/.*\s.*/)) {
	    try {
	        Y.get('#message').remove();
	    } catch (e) {
		
	    }
	    var message = Y.Node.create('<div id="message">about to do something asychronous with "' + txt + '"</div>');
	    if(timer) {
		timer.cancel();
	    }
	    timer = Y.later(2500,Y,timerTrigger);
	    Y.get('body').append(message);
	}
	return true;
    }
    
    function timerTrigger() {
	Y.get('#message').remove();
    }

    function startMeUp() {
	var paraList = mui.getAll('.para');
	for(u in paraList) {
	    mui.on(paraList[u],"touchend",checkValue);    
	}
    }

});


