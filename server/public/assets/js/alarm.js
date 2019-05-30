var alarmApp = angular.module('alarmApp', []);

alarmApp.controller('mainController', function($scope, $http, $interval) {
	window.scope = $scope
	//initialise scope holders
	$scope.state = null;
	
	$scope.arm = function(state){
		var call = (state == 'quiet'  ? "arm" : "disarm")
		$http.get('/api/'+call)
		.success((data)=>{
			$scope.getState()
		})
		.error((error)=>{console.log(error)})
	}

	$scope.getState = function(){
		$http.get('/api/state')
		.success((data)=>{
			$scope.state = data;
		})
		.error((error)=>{console.log(error)})
	}
	

	$scope.getState();


	var refreshAll = function(){
		$scope.getState();
	}

	var polling = $interval(refreshAll,2000)


});
