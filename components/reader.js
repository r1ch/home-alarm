"use strict";
const EventEmitter  = require('events').EventEmitter;
const chip = require('./chip.js')
const config = require('../config')
const POLL = 500


module.exports = class Reader extends EventEmitter{
	constructor(){
		super();
		this.chip = chip
		this.type = "Reader"
		this.name = "NFC"
		this.emits = ['card']
		this.interval = null;
	}

	start(){
		console.log("Started listening for cards")
		let _this = this;
		this.interval && clearInterval(this.interval)
		this.interval = setInterval(()=>{
			const uid = _this.findCard()
			if(null!==uid){
				if(config.cards && config.cards[uid.join(":")]){
					console.log("Found",config.cards[uid.join(":")])
					_this.emit('card',config.cards[uid.join(":")],Date.now())
				} else {
					console.log("Unknown card",uid.join(":"))
				}
			}
		},POLL)
	}

	stop(){
		this.interval && clearInterval(this.interval);
		this.interval = null;
		console.log("Stopped listening for cards")
	}


	findCard(){
		this.chip.init();
		let response = this.chip.findCard();

		if (!response.status) {
			//No card
			return null;
    		}
		
		response = this.chip.getUid();
    
		if (!response.status) {
			//UID error
			return null;
    		}

		const uid = response.data;
		const memoryCapacity = this.chip.selectCard(uid);

		if (!this.chip.authenticate(8, config.key, uid)) {
			//Auth error
			console.log("RFID auth error")
			return null;
		}

		this.chip.stopCrypto()
			
		return uid
	}

}
