'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var Web3 = require('web3');
var web3 = new Web3('ws://localhost:8546');
var ZeroEx = require('0x.js').ZeroEx;
var BigNumber = require("bignumber.js");
var DECIMALS = 16;
var NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
var ZRX_ADDRESS = "0x123";
var shh = web3.shh;
var activeModules = [web3.utils.asciiToHex('golem').slice(0, 10), web3.utils.asciiToHex('maker').slice(0, 10)];
console.log(activeModules);
var data = {};

//let data = "hello";


var setup1 = function setup1() {
	return shh.newKeyPair().then(function (id) {
		data.asymKeyId1 = id;
		return shh.getPublicKey(id).then(function (pubKey) {
			data.asymPubKey = pubKey;
			return shh.generateSymKeyFromPassword("eros");
		}).then(function (symKeyId) {
			data.symKeyId = symKeyId;
		}).catch(console.log);
	}).catch(console.log);
};

var setup2 = function setup2() {
	return shh.newKeyPair().then(function (id) {
		console.log('key2', id);
		data.asymKeyId2 = id;
		return Promise.all([shh.getPublicKey(id), shh.getPrivateKey(id)]).then(function (values) {
			data.pubKey2 = values[0];
			data.privKey2 = values[1];
		}).catch(console.log);
	}).catch(console.log);
};

var initListeners = function initListeners() {
	shh.subscribe('messages', {
		topics: [activeModules[0]],
		symKeyId: data.symKeyId
	}, function (err, obj) {
		if (err) throw new Error(err);
		onReceivePayload(JSON.parse(web3.utils.hexToAscii(obj.payload)));
	});
};

var sendPayload = exports.sendPayload = function sendPayload(payload) {
	setup1().then(setup2()).then(function () {
		initListeners();
		web3.eth.sign(JSON.stringify(payload), '0x316a4d5c86974a9E4C3D8Ed70f0A6630a11Db681').then(function (sig) {
			payload = _extends({}, payload, {
				sig: sig
			});
			shh.post({
				symKeyId: data.symKeyId,
				ttl: 7,
				topic: activeModules[0],
				powTarget: 2.01,
				powTime: 2,
				payload: web3.utils.toHex(payload),
				sig: data.asymKeyId2
			}, function (err, res) {
				if (err) return console.error(err);
				console.log(res);
			});
			console.log('sent');
		});
	});
};

var onReceivePayloadCallbacks = [];

var addOnReceivePayload = exports.addOnReceivePayload = function addOnReceivePayload(callback) {
	onReceivePayloadCallbacks.push(callback);
};

var onReceivePayload = function onReceivePayload(payload) {
	onReceivePayloadCallbacks.forEach(function (callback) {
		callback(payload);
	});
};

// sendPayload({
// 	maker: web3.eth.accounts[0],
// 	taker: NULL_ADDRESS,
// 	salt: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
// 	minRequestedTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
// 	maxRequestedTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
// 	requestedTokenAddress: '0x123',
// 	offeredTokenAddress: '0x1234',
// 	marketContractAddress: '0x125',
// 	offeredTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
// 	price: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
// 	expiryTime: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
// 	matcherFee: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS)
// });