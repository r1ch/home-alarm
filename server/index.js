const watcher = require("../system").getWatcher();
var express = require('express');
var app = express();

var router = express.Router();

router.get('/components', function (req, res) {
  res.send(JSON.stringify(watcher.getComponents()))
})

router.get('/components/:component', function (req, res) {
  res.send(JSON.stringify(watcher.getComponent(req.params.component)))
})

router.get('/components/:component/events', function (req, res) {
  res.send(JSON.stringify(watcher.getEventsForComponent(req.params.component)))
})

router.get('/components/:component/test',function(req,res){
  res.send(JSON.stringify(watcher.test(req.params.component)))
})

router.get('/armed',function(req,res){
  res.send(watcher.getArmed());
})

router.get('/state',function(req,res){
  res.send(watcher.getState());
})

router.get('/arm',function(req,res){
  res.send(watcher.arm());
})

router.get('/disarm',function(req,res){
  res.send(watcher.disarm());
})

router.get('/events', function (req, res) {
  res.send(JSON.stringify(watcher.getEvents()))
})

app.use(express.static(__dirname+'/public'))
app.use('/api',router)
app.listen(80, function () {
})

app.get('/disarm',function(req,res){
	watcher.disarm()
	res.redirect("/")
})
app.get('/arm',function(req,res){
	watcher.arm()
	res.redirect("/")
})

module.exports = app
