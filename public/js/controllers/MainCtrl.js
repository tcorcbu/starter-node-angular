angular.module('MainCtrl', []).controller('MainController', function($scope, $http, $q) {	
	
	function htmlToElement(html) {
		var doc = document.implementation.createHTMLDocument("example");
		doc.documentElement.innerHTML = html;
		return doc;
	}
	
	function getIssList(){
		
		return $http.get("https://www.accessdata.fda.gov/scripts/shellfish/sh/shippers.cfm?country=US&state=VA").then(function(response) {
			
			var doc = htmlToElement(response.data);

			var table_rows = doc.getElementsByTagName('tr');
			
			var arr = [];
			
			for(var i = 2; i < table_rows.length; i++){
				
				arr.push({
					name: table_rows[i].children[0].innerText,
					city: table_rows[i].children[1].innerText,
					state: table_rows[i].children[2].innerText,
					cert_num: table_rows[i].children[3].innerText,
					symbol: table_rows[i].children[4].innerText,
				});
				
			}
			
			return arr;

	    });
		
	}
	
	function getLeaseNumber(data){
		
		var doc = htmlToElement(data);

		var table_rows = doc.getElementsByTagName('tr');
		
		var leases = [];
		
		for(var k = 1; k < table_rows.length; k++){
			
			leases.push(table_rows[k].children[0].innerText);
			
		}
		
		return leases;
		
	}
	
	function getAllLeaseNumbers(res){
		
		var arr = [];
		
		for(var i = 0; i < res.length; i++){
				
			arr = arr.concat(getLeaseNumber(res[i].data));
			
		}
		
		return arr;
		
	}
	
	function multiple(all_data){
		
		var arr;
		
		if(all_data){
			arr = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13']
		}else{
			arr = ['04']
		}
		
		var promises = [];
		for(var i = 0; i < arr.length; i++) {
			var promise = $http.get('https://webapps.mrc.virginia.gov/mobile/oystergrounds_process.php?LeaseNumber=&LastName=&company=&WaterbodyCode=&WaterSourceID=' + arr[i]);
			promises.push(promise);
		}
		$q.all(promises).then(function(response) { // lease names and numbers
		
			var lease_numbers = getAllLeaseNumbers(response);
		
			detail_promises = [];
			
			for(var x = 0; x < lease_numbers.length / 4; x++){
				
				var detail_promise = $http.get('https://webapps.mrc.virginia.gov/mobile/oyster_details.php?id=' + lease_numbers[x]);
				detail_promises.push(detail_promise);
				
			}
			
			$q.all(detail_promises).then(function(res) { // details
				
				var leases_with_details = [];
				
				for(var i = 0; i < res.length; i++) {
					
					var doc = htmlToElement(res[i].data);

					var unformatted = doc.getElementsByTagName('ul')[0].textContent;
					
					var take_out_newlines = unformatted.replace(/(\r\n\t|\n|\r\t)/gm,"");
					
					var add_signs = take_out_newlines.replace("Leaseholder", "$Leaseholder").replace("Additional Names", "$Additional Names").replace("Lease Type", "$Lease Type").replace("Acreage", "$Acreage").replace("Status", "$Status").replace("Waterbody", "$Waterbody").replace("Original Assign Date", "$Original Assign Date");
					
					var details = add_signs.split("$");
					
					var temp = {};
					
					for(var k = 0; k < details.length; k++){
						
						var split_obj = details[k].split(": ");
						
						if(split_obj[0] == "Leaseholder"){
							var with_space = split_obj[1];
							temp[split_obj[0]] = with_space.slice(0, -1);
						}else{
							temp[split_obj[0]] = split_obj[1];
						}
						
					}
					
					leases_with_details.push(temp);
					
				}
				
				console.log("leases_with_details", leases_with_details);
				
			});

	    });
		
	}
	
	$scope.getLeaseData = function(){
		console.log("getLeaseData called");
		//multiple(false);
	};
	
	$scope.getData = function(){
		
		$http.get("/get-data").then(function(data) {

			console.log('res from get', data);

	    });

	};
	
	$scope.postData = function(){
		
		var obj = {name: 'tom'};
		
		$http.post("/save-data", obj).then(function(data) {

			console.log('res from post', data);

	    });

	};
	
	

});