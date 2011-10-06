YUI().use("json", "node", function (Y) {
    
    MyNamespace = YUI.namespace('address.checker');
    var tIds = {},
        loading = false,
        current = null;
	
    Y.on("domready", startMeUp, Y);
    
    Y.one("#unstructured").on("focus", isFocus);
    Y.one("#unstructured").on("blur", isBlur);
    Y.one("#unstructured").on("keyup", checkValue);
    const URL = 'http://query.yahooapis.com/v1/public/yql?format=json&diagnostics=false&q=';
    
    function startMeUp() {
	var message = arguments[arguments.length - 1];
	Y.log(message);
	Y.one("#loader").setStyle("display", "none");
	Y.one("#unstructured").setStyle("display", "block");
    }
    
    function isFocus(e) {
	Y.one("#unstructured").set("value", Y.one("#unstructured").get("value").replace("Phone number(s)\nEmail address(es)\nMail address",''));
	Y.one("#unstructured").removeClass('intro');
	Y.one("#unstructured").setStyle('height', '66%');
	Y.one("#structured_data_container").setStyle('top','15%');
    }
    
    function isBlur(e) {
	Y.one("#unstructured").setStyle('height', '90%');
	if(Y.one("#unstructured").get("value") == '') {
	    Y.one("#unstructured").set("value", "Phone number(s)\nEmail address(es)\nMail address");
	    Y.one("#unstructured").addClass("intro");
	}
    }


    function getUserText() {
	//using a contenteditable div or textarea? choose between these
	//return Y.one("#unstructured").get("innerText");
	return Y.one("#unstructured").get("value");
    }
    
    function checkValue(e) {
	var text = getUserText();
	//email and phone regexen can be improved
	var email_regex = new RegExp("\\b([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4})\\b","ig");
	var phone_regex = new RegExp("\\b\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})\\b", "ig");
	
	var remainder = text.replace(email_regex,'');
	remainder = remainder.replace(phone_regex,'');
	remainder = remainder.replace(/(\n|\r|\s)+$/, '');
	remainder = remainder.replace(/^(\n|\r|\s)+/, '');
	if(remainder.length > 20) {
	    getAddressData(remainder);
	} else {
	    Y.one("#extracted_location").set("innerHTML", '');   
	}

	var email_match  = text.match(email_regex);
	var phone_match = text.match(phone_regex);
	if(email_match) {
	    var extracted_email_container = Y.one("#extracted_email");
	    extracted_email_container.all('li').remove();
	    for(i=0;i<email_match.length;i++) {
		email_addy = Y.Node.create('<li>' + email_match[i].toLowerCase() + '</li>');
		extracted_email_container.append(email_addy);
	    }
	} else {
	    Y.one("#extracted_email").set("innerHTML", "");
	}
	if(phone_match) {
	    var extracted_phone_container = Y.one("#extracted_phone");
	    extracted_phone_container.all('li').remove();
	    for(i=0;i<phone_match.length;i++) {
		p = phone_match[i].replace(/[()\-\s]/g,'');
		p = "(" + p.substring(0,3) + ") " + p.substring(3,6) + "-" + p.substring(6,10);
		phone_number = Y.Node.create('<li>' + p + '</li>');
		extracted_phone_container.append(phone_number);
	    }
	} else {
	    Y.one("#extracted_phone").set("innerHTML", "");
	}
    }
    
    var addressSuccess = function(o) {
        loading = false;
     };
     
    var addressFailure = function(o) {
	Y.log("The Get Utility failed.", "info", "Address Utility");
    };
 
    var addressTimeout = function(o) {
	Y.log("The Get Utility timed out.", "info", "Address Utility");
    };
    
    
    var getAddressData = function(remainder) {
        if (loading) {
            return;
        }
        loading = true;
        
	var query = encodeURIComponent('select * from geo.placefinder where text="' + remainder + '"');
	var sURL = URL +  query + "&callback=MyNamespace.callback";

        var transactionObj = Y.Get.script(sURL, {
            onSuccess: addressSuccess,
            onFailure: addressFailure,
            onTimeout: addressTimeout,
            timeout: 20000,
            context: Y
        });
        current = transactionObj.tId; 
    };
 
    MyNamespace.callback = function(results) {
	try {
	    var aObj = results.query.results.Result;
	    if(aObj.quality > 50) {
		var address = Y.Node.create("<li>" + aObj.house + " " + aObj.street + "<br>" + aObj.city + ", " + aObj.state + " " + aObj.postal + "</li>");
		var addressContainer = Y.one("#extracted_location");
		addressContainer.set("innerHTML", "");
		addressContainer.append(address);
	    }
	} catch (e) {
	    Y.log(e);
	}
        tIds[current] = true;
    };


});

