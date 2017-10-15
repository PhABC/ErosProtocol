'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Orders = require('./Orders.js');
var Whisper = require('./Whisper.js');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');

var web3 = new Web3('ws://localhost:8546');
var shh = web3.shh;

var Matcher = function () {
	function Matcher() {
		var _this = this;

		_classCallCheck(this, Matcher);

		this.orderPool = new Orders.OrderPool();

		Whisper.addOnReceivePayload(function (payload) {
			_this.receivedPayload(payload);
		});
	}

	_createClass(Matcher, [{
		key: 'receivedPayload',
		value: function receivedPayload(payload) {
			var order = Orders.orderFromPayload(payload);
			if (this.orderPool.addOrder(order)) this.newOrder(order);
		}
	}, {
		key: 'newOrder',
		value: function newOrder(order) {
			this.orderPool.prune();
			while (true) {
				var match = this.orderPool.findBestMatch(order);
				if (match == null) break;
				this.resolveMatch(makerOrder, takerOrder, makerOfferedAmount, takerOfferedAmount);
			}
		}
	}, {
		key: 'resolveMatch',
		value: function resolveMatch(makerOrder, takerOrder, makerOfferedAmount, takerOfferedAmount) {
			this.orderPool.removeOrder(makerOrder);
			this.orderPool.removeOrder(takerOrder);
			console.log('Found match');
			// TODO
		}
	}]);

	return Matcher;
}();

setTimeout(function () {
	Whisper.sendPayload(new Orders.Order('Alice', 'market', 'WETH', 'ZRX', new BigNumber(1), new BigNumber(10), new BigNumber(0.1), new BigNumber(0), new BigNumber(1), new BigNumber(Date.now() + 60 * 60 * 24), new BigNumber(2)));

	Whisper.sendPayload(new Orders.Order('Bob', 'market', 'ZRX', 'WETH', new BigNumber(1), new BigNumber(1), new BigNumber(10), new BigNumber(0), new BigNumber(10), new BigNumber(Date.now() + 60 * 60 * 24), new BigNumber(2)));
}, 500);

var matcher = new Matcher();