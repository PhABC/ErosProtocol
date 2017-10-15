"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BigNumber = require("bignumber.js");
var hash = require("object-hash");
var ZeroEx = require('0x.js').ZeroEx;

var NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

var orderFromPayload = exports.orderFromPayload = function orderFromPayload(payload) {
	return new Order(payload.maker, payload.taker, payload.feeRecipient, payload.makerTokenAddress, payload.takerTokenAddress, payload.exchangeContractAddress, new BigNumber(payload.salt), new BigNumber(payload.makerFee), new BigNumber(payload.takerFee), new BigNumber(payload.makerTokenAmount), new BigNumber(payload.takerTokenAmount), new BigNumber(payload.expirationUnixTimestampSec), payload.ecSignature);
};

var Order = exports.Order = function () {
	function Order(maker, taker, feeRecipient, makerTokenAddress, takerTokenAddress, exchangeContractAddress, salt, makerFee, takerFee, makerTokenAmount, takerTokenAmount, expirationUnixTimestampSec, ecSignature) {
		_classCallCheck(this, Order);

		this.maker = maker;
		this.taker = taker;
		this.feeRecipient = feeRecipient;
		this.makerTokenAddress = makerTokenAddress;
		this.takerTokenAddress = takerTokenAddress;
		this.exchangeContractAddress = exchangeContractAddress;
		this.salt = salt;
		this.makerFee = makerFee;
		this.takerFee = takerFee;
		this.makerTokenAmount = makerTokenAmount;
		this.takerTokenAmount = takerTokenAmount;
		this.expirationUnixTimestampSec = expirationUnixTimestampSec;
		this.ecSignature = ecSignature;
	}

	_createClass(Order, [{
		key: "toPayload",
		value: function toPayload() {
			return {
				maker: this.maker,
				taker: this.taker,
				feeRecipient: this.feeRecipient,
				makerTokenAddress: this.makerTokenAddress,
				takerTokenAddress: this.takerTokenAddress,
				exchangeContractAddress: this.exchangeContractAddress,
				salt: this.salt.toString(),
				makerFee: this.makerFee.toString(),
				takerFee: this.takerFee.toString(),
				makerTokenAmount: this.makerTokenAmount.toString(),
				takerTokenAmount: this.takerTokenAmount.toString(),
				expirationUnixTimestampSec: this.expirationUnixTimestampSec.toString(),
				ecSignature: this.ecSignature
			};
		}

		// Get a unique per-order identifier

	}, {
		key: "id",
		get: function get() {
			return hash(this.toPayload());
		}
	}]);

	return Order;
}();

var OrderPool = exports.OrderPool = function () {
	function OrderPool() {
		_classCallCheck(this, OrderPool);

		this.pool = [];
	}

	// Add an order to the pool. The pool is a set, so adding the same order subsequent times has no effect.


	_createClass(OrderPool, [{
		key: "addOrder",
		value: function addOrder(order) {
			var found = false;
			this.pool.forEach(function (o) {
				if (o.id == order.id) found = true;
			});
			if (!found) this.pool.push(order);
			return !found;
		}
	}, {
		key: "removeOrder",
		value: function removeOrder(order) {
			var orderId = order.id;
			for (var i = 0; i < this.pool.length; i++) {
				if (this.pool[i].id == orderId) {
					this.pool.splice(i, 1);
					return true;
				}
			}
			return false;
		}
	}, {
		key: "prune",
		value: function prune() {
			this.pool = this.pool.filter(function (element, index, array) {
				return element.expirationUnixTimestampSec > Date.now();
			});
		}

		// Find a single match for the specified order, or return null if no valid match exists.

	}, {
		key: "findBestMatch",
		value: function findBestMatch(order) {
			var matches = [];

			this.pool.forEach(function (o) {
				console.log('looping');
				// if (o.id == order.id)
				// 	return;
				// if (o.exchangeContractAddress != order.exchangeContractAddress)
				// 	return;
				// if (o.makerTokenAddress != order.takerTokenAddress)
				// 	return;
				// if (o.takerTokenAddress != order.makerTokenAddress)
				// 	return;
				// if (o.makerTokenAmount == 0 || o.takerTokenAmount == 0)
				// 	return;
				// if (order.makerTokenAmount == 0 || order.takerTokenAmount == 0)
				// 	return;
				// if (o.takerTokenAmount / o.makerTokenAmount < order.makerTokenAmount / order.takerTokenAmount)
				// 	return;
				matches.push({
					orderA: order,
					orderB: o,
					priority: [o.makerFee + o.takerFee + order.makerFee + order.takerFee, BigNumber.min(o.expirationUnixTimestampSec, order.expirationUnixTimestampSec)]
				});
			});

			// matches.sort((a, b) => {
			// 	if (a.priority == b.priority)
			// 		return 0;
			// 	return a.priority > b.priority ? 1 : -1;
			// })
			console.log(matches.length);
			if (matches.length == 0) {
				console.log('found match');
				return null;
			} else {
				var bestMatch = matches[matches.length - 1];
				return {
					orderA: bestMatch.orderA,
					orderB: bestMatch.orderB
				};
			}
		}
	}]);

	return OrderPool;
}();