const EventBus = require("../event-bus");
const Alarm = require("../system/alarm");
const Message = require("../event-bus/message");
var express = require('express');
var app = express();

var router = express.Router();


router.get('/state', function (req, res) {
  res.send(Alarm.currentState.name);
})

router.get('/arm', function (req, res) {
  EventBus.inbound({name:"arm"})
  res.send(true);
})

router.get('/disarm', function (req, res) {
  EventBus.inbound({name:"disarm"})
  res.send(true);
})


app.use(express.static(__dirname + '/public'))
app.use('/api', router)
app.listen(80, function () {
})

module.exports = app
