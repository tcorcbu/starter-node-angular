angular.module('MainCtrl', []).controller('MainController', function($scope, $http, $q) {





	//Active or Pending Aquaculture

	function getMaineData(){

		var tom = document.getElementById('tom');
		var t_childs = tom.children;
		var ret_arr = [];

		//t_childs.length

		for(var i = 0; i < 89; i++){

			var table = t_childs[i].children[0].children[0].children;

			var data_obj = {
				'leaseholder': table[6].innerText,
				'contact': table[7].innerText,
				'location': table[8].innerText,
				'waterbody': table[9].innerText,
				'city': table[10].innerText,
				'county': table[11].innerText
			};

			ret_arr.push(data_obj);

		}

		console.log(JSON.stringify(ret_arr));

	}




	
	function htmlToElement(html) {
		var doc = document.implementation.createHTMLDocument("example");
		doc.documentElement.innerHTML = html;
		return doc;
	}

	$scope.business_info = {};

	$scope.getBusinessInfo = function (name){

		var encoded_name = encodeURIComponent(name);

		var url = "https://sccefile.scc.virginia.gov/Find/AjaxBusiness?searchTerm=" + encoded_name + "&searchPattern=C&sEcho=1&iColumns=5&sColumns=&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&mDataProp_4=4&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&bSortable_0=true&bSortable_1=true&bSortable_2=true&bSortable_3=true&bSortable_4=true&undefined=undefined&undefined=undefined";
		
		return $http.get(url).then(function(response) {
			
			console.log("business info", response.data);

			var data = response.data;

			if(data.iTotalRecords == 1){

				// send request to get details on business
				var endpoint = data.aaData[0][1].match(/'([^']+)'/)[1];;
				var detail_url = "https://sccefile.scc.virginia.gov" + endpoint;

				return $http.get(detail_url).then(function(res) {

					var doc = htmlToElement(res.data);

					var fieldsets = doc.getElementsByTagName('fieldset');

					// Get Address

					var child_arr = fieldsets[1].children;

					var address_str = "";

					for(var i = 1; i < child_arr.length; i++){
						if(child_arr[i].innerText.length > 0){
							address_str += child_arr[i].innerText.replace(/(\r\n\t|\n|\r\t)/gm," ") + " ";
						}
					}

					// Get Contact Person
					var contact_person = fieldsets[2].children[1].innerText;

					var temp = {
						'company_name': name,
						'contact_person': contact_person,
						'mailing_address': address_str.trim()
					};

					$scope.business_info = temp;

					return temp;


				});

			}else if(data.iTotalRecords == 0){

			}else{

			}

			return [];

	    });
		
	};
	
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
			arr = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'];
		}else{
			arr = ['04'];
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