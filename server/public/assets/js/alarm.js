var alarmApp = angular.module('alarmApp', []);

alarmApp.controller('mainController', function($scope, $http, $interval) {
	window.scope = $scope
	//initialise scope holders
	$scope.components = [];
	$scope.events = [];
	$scope.armed = null;
	$scope.state = null;
	
	$scope.getComponents = function(){
		$http.get('/api/components')
		.success((data)=>{
			$scope.components = data
		})
		.error((error)=>{
			console.log('Error: '+ error)
		})
	}

	$scope.getComponent = function(component){
		$scope.components[component] = $scope.components[component] || [];
		$http.get('/api/components/'+component)
		.success((data)=>{
			$scope.components[component] = data
		})
		.error((error)=>{
			console.log(error)
		})
	}

	$scope.getEvents = function(){
		$http.get('/api/events/')
		.success((data)=>{
			$scope.events = data;

		})
		.error((error)=>{console.log(error)})
	}

	$scope.getEventsForComponent = function(component){
		$http.get('/api/components/'+component+'/events')
		.success((data)=>{
			$scope.components[component].events = data;
		})
		.error((error)=>{console.log(error)})
	}

	$scope.testComponent = function(component){
		$http.get('/api/components/'+component+'/test')
		.success((data)=>{
			$scope.getEventsForComponent(component)
			$scope.getState()
		})
		.error((error)=>{console.log(error)})
	}

	$scope.getArmed = function(){
		$http.get('/api/armed')
		.success((data)=>{
			$scope.armed = (data == 'true')
		})
		.error((error)=>{console.log(error)})
	}

	$scope.changeArmedFrom = function(arm){
		var call = (arm  ? "disarm" : "arm")
		$http.get('/api/'+call)
		.success((data)=>{
			$scope.armed = (data == 'true')
			$scope.getState()
			$scope.getEvents()
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
	

		$scope.getArmed();
		$scope.getState();
		$scope.getComponents();
		$scope.getEvents();


	var refreshAll = function(){
		$scope.getArmed();
		$scope.getState();
		$scope.getComponents();
		$scope.getEvents();
	}

	var polling = $interval(refreshAll,2000)


});
