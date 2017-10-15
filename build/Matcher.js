'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Orders = require('./Orders.js');
var Whisper = require('./Whisper.js');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var fs = require('fs');
var ZeroEx = require('0x.js').ZeroEx;

var zeroEx = new ZeroEx(new Web3.providers.HttpProvider('http://localhost:8545'));

var NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

var web3 = new Web3('http://localhost:8545');
var shh = web3.shh;

var EROS_CONTRACT_ABI = JSON.parse(fs.readFileSync('./build/ErosDiscoveryProtocol.json', 'utf8'));
//console.log(EROS_CONTRACT_ABI);
var EROS_CONTRACT_ADDRESS = '0x0123'; // TODO

var erosContract = new web3.eth.Contract(EROS_CONTRACT_ABI.abi);
// const EROS_CONTRACT_JSON = JSON.parse(fs.readFileSync('./build/ErosDiscoveryProtocol.json', 'utf8'));
// const EROS_CONTRACT_ABI = EROS_CONTRACT_JSON.abi;
// const EROS_CONTRACT_BYTECODE = EROS_CONTRACT_JSON.bytecode;

var accounts = void 0;

// zeroEx.getAvailableAddressesAsync().then((a) => {
// 	accounts = a;
// }).then(() => {
// 	new web3.eth.Contract(EROS_CONTRACT_ABI).deploy(
// 		{ data: EROS_CONTRACT_BYTECODE }
// 	).send(
// 		{ from: accounts[0], gas: 4712388 }
// 	).then((contract) => {
// 		erosContract = contract;
// 		EROS_CONTRACT_ADDRESS = erosContract.options.address;
// 	});
// });

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
			if (this.orderPool.addOrder(order)) {
				this.newOrder(order);
			}
		}
	}, {
		key: 'newOrder',
		value: function newOrder(order) {
			this.orderPool.prune();
			while (true) {

				var match = this.orderPool.findBestMatch(order);
				if (match == null) break;
				var orderA = match.orderA,
				    orderB = match.orderB;

				this.resolveMatch(orderA, orderB);
			}
		}
	}, {
		key: 'resolveMatch',
		value: function resolveMatch(orderA, orderB) {
			this.orderPool.removeOrder(orderA);
			this.orderPool.removeOrder(orderB);
			// erosContract.methods.settleMatchProposal(
			// 	[orderA.maker,
			// 	orderA.taker,
			// 	orderA.feeRecipient,
			// 	orderA.makerTokenAddress,
			// 	orderA.takerTokenAddress,
			// 	orderA.exchangeContractAddress],
			// 	[orderA.salt,
			// 	orderA.makerFee,
			// 	orderA.takerFee,
			// 	orderA.makerTokenAmount,
			// 	orderA.takerTokenAmount,
			// 	orderA.expirationUnixTimestampSec],
			// 	orderA.ecSignature.v,
			// 	orderA.ecSignature.r,
			// 	orderA.ecSignature.s,
			// 	[orderB.maker,
			// 	orderB.taker,
			// 	orderB.feeRecipient,
			// 	orderB.makerTokenAddress,
			// 	orderB.takerTokenAddress,
			// 	orderB.exchangeContractAddress],
			// 	[orderB.salt,
			// 	orderB.makerFee,
			// 	orderB.takerFee,
			// 	orderB.makerTokenAmount,
			// 	orderB.takerTokenAmount,
			// 	orderB.expirationUnixTimestampSec],
			// 	orderB.ecSignature.v,
			// 	orderB.ecSignature.r,
			// 	orderB.ecSignature.s
			// ).send({ from: accounts[0], gas: 4712388 })
		}
	}]);

	return Matcher;
}();

// {
// 	"maker": {
// 		"address": "0x61e247f70bcc861819a801120eaac6fed99e79a2",
// 		"token": {
// 			"name": "Ether Token",
// 			"symbol": "WETH",
// 			"decimals": 18,
// 			"address": "0x05d090b51c40b020eab3bfcb6a2dff130df22e9c"
// 		},
// 		"amount": "100000000000000000",
// 		"feeAmount": "0"
// 	},
// 	"taker": {
// 		"address": "",
// 		"token": {
// 			"name": "0x Protocol Token",
// 			"symbol": "ZRX",
// 			"decimals": 18,
// 			"address": "0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570"
// 		},
// 		"amount": "100000000000000000",
// 		"feeAmount": "0"
// 	},
// 	"expiration": "2524626000",
// 	"feeRecipient": "0x0000000000000000000000000000000000000000",
// 	"salt": "39589075312651349180760471522600091342093681980948679803390783021018056140589",
// 	"signature": {
// 		"v": 28,
// 		"r": "0xd0a10df781bf0a93cc096c7e9ff3f00d7721046502b6a0dfecfd7f4d52986932",
// 		"s": "0x08498b0b79fccd55cb562858350535eb6ca1c024f660a3cfecd8c0d75fc2a4fe",
// 		"hash": "0x5443c35bd6ea534796511d2aa51f028730317ccbbb27d32db9263fd699b94d45"
// 	},
// 	"exchangeContract": "0x90fe2af704b34e0224bf2299c838e04d4dcf1364",
// 	"networkId": 42
// }
//
// {
// 	"maker": {
// 		"address": "0x61e247f70bcc861819a801120eaac6fed99e79a2",
// 		"token": {
// 			"name": "0x Protocol Token",
// 			"symbol": "ZRX",
// 			"decimals": 18,
// 			"address": "0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570"
// 		},
// 		"amount": "100000000000000000",
// 		"feeAmount": "0"
// 	},
// 	"taker": {
// 		"address": "",
// 		"token": {
// 			"name": "Ether Token",
// 			"symbol": "WETH",
// 			"decimals": 18,
// 			"address": "0x05d090b51c40b020eab3bfcb6a2dff130df22e9c"
// 		},
// 		"amount": "100000000000000000",
// 		"feeAmount": "0"
// 	},
// 	"expiration": "2524626000",
// 	"feeRecipient": "0x0000000000000000000000000000000000000000",
// 	"salt": "43738917490084901392871299417845878250738351153054419227077950746415518229033",
// 	"signature": {
// 		"v": 28,
// 		"r": "0xb3e0def9372e2ee8e843e3196b677b9e6ba9ea17443473a22d4880b5ad5a13b1",
// 		"s": "0x003e4bea39ace64b3057c04599029e7d58f22d8e06bad87a0757327bff418e03",
// 		"hash": "0xf860303ef2600180849e3a3b51a5486a807ae84690399c2672343e8935526c17"
// 	},
// 	"exchangeContract": "0x90fe2af704b34e0224bf2299c838e04d4dcf1364",
// 	"networkId": 42
// }

setTimeout(function () {
	Whisper.sendPayload(new Orders.Order('0x61e247f70bcc861819a801120eaac6fed99e79a3', NULL_ADDRESS, NULL_ADDRESS, '0x05d090b51c40b020eab3bfcb6a2dff130df22e9c', '0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570', '0x90fe2af704b34e0224bf2299c838e04d4dcf1364', new BigNumber('39589075312651349180760471522600091342093681980948679803390783021018056140589'), new BigNumber(0), new BigNumber(0), new BigNumber(100000000000000000), new BigNumber(100000000000000000), new BigNumber(2524626000000000), {
		"r": "0xd0a10df781bf0a93cc096c7e9ff3f00d7721046502b6a0dfecfd7f4d52986932",
		"s": "0x08498b0b79fccd55cb562858350535eb6ca1c024f660a3cfecd8c0d75fc2a4fe",
		"v": 28
	}).toPayload());

	Whisper.sendPayload(new Orders.Order('0x61e247f70bcc861819a801120eaac6fed99e79a2', NULL_ADDRESS, NULL_ADDRESS, '0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570', '0x05d090b51c40b020eab3bfcb6a2dff130df22e9c', '0x90fe2af704b34e0224bf2299c838e04d4dcf1364', new BigNumber('43738917490084901392871299417845878250738351153054419227077950746415518229033'), new BigNumber(0), new BigNumber(0), new BigNumber(100000000000000000), new BigNumber(100000000000000000), new BigNumber(2524626000000000), {
		"r": "0xb3e0def9372e2ee8e843e3196b677b9e6ba9ea17443473a22d4880b5ad5a13b1",
		"s": "0x003e4bea39ace64b3057c04599029e7d58f22d8e06bad87a0757327bff418e03",
		"v": 28
	}).toPayload());
}, 500);

var matcher = new Matcher();

// setTimeout(() => {
// 	// Whisper.sendPayload(orderA.toPayload());
// 	// Whisper.sendPayload(orderB.toPayload());
// 	matcher.receivedPayload(orderA.toPayload());
// 	matcher.receivedPayload(orderB.toPayload());
// }, 500);