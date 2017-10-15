"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.orderFromPayload = orderFromPayload;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BigNumber = require("bignumber.js");
var hash = require("object-hash");
var ZeroEx = require('0x.js').ZeroEx;

var NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

function orderFromPayload(payload) {
	console.log(payload);
	return new Order(payload.address, payload.marketContractAddress, payload.offeredTokenAddress, payload.requestedTokenAddress, new BigNumber(payload.salt), new BigNumber(payload.offeredTokenAmount), new BigNumber(payload.price), new BigNumber(payload.minRequestedTokenAmount), new BigNumber(payload.maxRequestedTokenAmount), new BigNumber(payload.expiryTime), new BigNumber(payload.matcherFee));
}

var Order = exports.Order = function () {
	function Order(address, // maker address
	marketContractAddress, // market contract address
	offeredTokenAddress, // offer token contract address
	requestedTokenAddress, // request token contract address
	salt, // pseudo-random 256-bit number, as a BigNumber
	offeredTokenAmount, // amount of token being offered, as a BigNumber
	price, // amount of request token per order token, as a BigNumber
	minRequestedTokenAmount, // minimum amount of request token that may be taken per order, as a BigNumber
	maxRequestedTokenAmount, // maximum amount of request token that may be taken per order, as a BigNumber
	expiryTime, // UNIX timestamp, seconds, as a BigNumber
	matcherFee) {
		_classCallCheck(this, Order);

		// in ETH, as a BigNumber
		this.address = address;
		this.marketContractAddress = marketContractAddress;
		this.offeredTokenAddress = offeredTokenAddress;
		this.requestedTokenAddress = requestedTokenAddress;
		this.salt = salt;
		this.offeredTokenAmount = offeredTokenAmount;
		this.price = price;
		this.minRequestedTokenAmount = minRequestedTokenAmount;
		this.maxRequestedTokenAmount = maxRequestedTokenAmount;
		this.expiryTime = expiryTime;
		this.matcherFee = matcherFee;
	}

	_createClass(Order, [{
		key: "toPayload",
		value: function toPayload() {
			return {
				address: this.address,
				marketContractAddress: this.marketContractAddress,
				offeredTokenAddress: this.offeredTokenAddress,
				requestedTokenAddress: this.requestedTokenAddress,
				salt: this.salt.toString(),
				offeredTokenAmount: this.offeredTokenAmount.toString(),
				price: this.price.toString(),
				minRequestedTokenAmount: this.minRequestedTokenAmount.toString(),
				maxRequestedTokenAmount: this.maxRequestedTokenAmount.toString(),
				expiryTime: this.expiryTime.toString(),
				matcherFee: this.matcherFee.toString()
			};
		}

		// Get a unique per-order identifier

	}, {
		key: "toZeroExOrder",


		// Get the 0x order object, with this order as the offerer
		value: function toZeroExOrder(offeredTokenAmount, offeredTokenDecimals, requestedTokenAddress) {
			return {
				maker: this.address,
				taker: NULL_ADDRESS,
				feeRecipient: NULL_ADDRESS,
				makerTokenAddress: this.offeredTokenAddress,
				takerTokenAddress: this.requestedTokenAddress,
				exchangeContractAddress: this.marketContractAddress,
				salt: this.salt,
				makerFee: new BigNumber(0),
				takerFee: new BigNumber(0),
				makerTokenAmount: ZeroEx.toBaseUnitAmount(offeredTokenAmount, offeredTokenDecimals),
				takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(offeredTokenAmount * this.price), requestedTokenAddress).round(),
				expirationUnixTimestampSec: new BigNumber(Date.now() + 3600000)
			};
		}
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
				return element.expiryTime > Date.now();
			});
		}

		// Find a single match for the specified order, or return null if no valid match exists.

	}, {
		key: "findBestMatch",
		value: function findBestMatch(order) {
			var matches = [];

			this.pool.forEach(function (o) {
				if (o.id == order.id) return;
				if (o.marketContractAddress != order.marketContractAddress) return;
				if (o.offeredTokenAddress != order.requestedTokenAddress) return;
				if (o.requestedTokenAddress != order.offeredTokenAddress) return;
				if (o.offeredTokenAmount == 0 || order.offeredTokenAmount == 0) return;
				if (o.price > new BigNumber(1) / order.price) return;
				var offeredAmount = BigNumber.min(o.offeredTokenAmount, new BigNumber(order.offeredTokenAmount * order.price));
				var requestedAmount = BigNumber.min(new BigNumber(o.offeredTokenAmount * o.price), order.offeredTokenAmount);
				if (requestedAmount < o.minRequestedTokenAmount || requestedAmount > o.maxRequestedTokenAmount) return;
				if (offeredAmount < order.minRequestedTokenAmount || offeredAmount > order.maxRequestedTokenAmount) return;
				matches.push({
					makerOrder: order,
					takerOrder: o,
					makerOfferedAmount: requestedAmount,
					takerOfferedAmount: offeredAmount,
					priority: [o.matcherFee + order.matcherFee, BigNumber.min(o.expiryTime, order.expiryTime), Math.abs(o.price - order.price), offeredAmount]
				});
			});

			matches.sort(function (a, b) {
				if (a.priority == b.priority) return 0;
				return a.priority > b.priority ? 1 : -1;
			});

			if (matches.length == 0) {
				return null;
			} else {
				var bestMatch = matches[matches.length - 1];
				return {
					makerOrder: bestMatch.makerOrder,
					takerOrder: bestMatch.takerOrder,
					makerOfferedAmount: bestMatch.makerOfferedAmount,
					takerOfferedAmount: bestMatch.takerOfferedAmount
				};
			}
		}
	}]);

	return OrderPool;
}();