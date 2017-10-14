const BigNumber = require("bignumber.js");
const hash = require("object-hash")
const ZeroEx = require('0x.js').ZeroEx;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

function orderFromPayload(payload) {
	return new Order(
		payload.address,
		payload.marketContractAddress,
		payload.type,
		payload.baseTokenAddress,
		payload.quoteTokenAddress,
		new BigNumber(payload.salt),
		new BigNumber(payload.baseTokenAmount),
		new BigNumber(payload.price),
		new BigNumber(payload.minBaseTokenAmount),
		new BigNumber(payload.maxBaseTokenAmount),
		new BigNumber(payload.expiryTime),
		new BigNumber(payload.matcherFee)
	);
}

export class Order {
	constructor(address, // maker address
			marketContractAddress, // market contract address
			type, // "buy" or "sell"
			baseTokenAddress, // base token contract address
			quoteTokenAddress, // quote token contract address
			salt, // pseudo-random 256-bit number, as a BigNumber
			baseTokenAmount, // amount of base token being bought / sold, as a BigNumber
			price, // amount of quote token per base token, as a BigNumber
			minBaseTokenAmount, // minimum amount of base token that may be taken per order, as a BigNumber
			maxBaseTokenAmount, // maximum amount of base token that may be taken per order, as a BigNumber
			expiryTime, // UNIX timestamp, seconds, as a BigNumber
			matcherFee) { // in ETH, as a BigNumber
		this.address = address;
		this.marketContractAddress = marketContractAddress;
		this.type = type;
		this.baseTokenAddress = baseTokenAddress;
		this.quoteTokenAddress = quoteTokenAddress;
		this.salt = salt;
		this.baseTokenAmount = baseTokenAmount;
		this.price = price;
		this.minBaseTokenAmount = minBaseTokenAmount;
		this.maxBaseTokenAmount = maxBaseTokenAmount;
		this.expiryTime = expiryTime;
		this.matcherFee = matcherFee;
	}

	toPayload() {
		return {
			address: this.address,
			marketContractAddress: this.marketContractAddress,
			type: this.type,
			baseTokenAddress: this.baseTokenAddress,
			quoteTokenAddress: this.quoteTokenAddress,
			salt: this.salt.toString(),
			baseTokenAmount: this.baseTokenAmount.toString(),
			price: this.price.toString(),
			minBaseTokenAmount: this.minBaseTokenAmount.toString(),
			maxBaseTokenAmount: this.maxBaseTokenAmount.toString(),
			expiryTime: this.expiryTime.toString(),
			matcherFee: this.matcherFee.toString()
		};
	}

	// Get a unique per-order identifier
	get id() {
		return hash(this.toPayload());
	}

	// Get the 0x order object, with this order as the maker
	toZeroExOrder(baseTokenAmount, baseTokenDecimals, quoteTokenDecimals) {
		return {
			maker: this.address,
			taker: NULL_ADDRESS,
			feeRecipient: NULL_ADDRESS,
			makerTokenAddress: this.type == "buy" ? this.quoteTokenAddress : this.baseTokenAddress,
			takerTokenAddress: this.type == "buy" ? this.baseTokenAddress : this.quoteTokenAddress,
			exchangeContractAddress: this.marketContractAddress,
			salt: this.salt,
			makerFee: new BigNumber(0),
			takerFee: new BigNumber(0),
			makerTokenAmount: this.type == "buy" ?
					ZeroEx.toBaseUnitAmount(new BigNumber(baseTokenAmount * this.price), quoteTokenDecimals).round()
					: ZeroEx.toBaseUnitAmount(baseTokenAmount, baseTokenDecimals),
			takerTokenAmount: this.type == "buy" ?
					ZeroEx.toBaseUnitAmount(baseTokenAmount, baseTokenDecimals)
					: ZeroEx.toBaseUnitAmount(new BigNumber(baseTokenAmount * this.price), quoteTokenDecimals).round(),
			expirationUnixTimestampSec: new BigNumber(Date.now() + 3600000),
		};
	}
}

export class OrderPool {
	constructor() {
		this.pool = [];
	}

	// Add an order to the pool. The pool is a set, so adding the same order subsequent times has no effect.
	addOrder(order) {
		let found = false;
		this.pool.forEach((o) => {
			if (o.id == order.id)
				found = true;
		});
		if (!found)
			this.pool.push(order);
		return !found;
	}

	removeOrder(order) {
		let orderId = order.id;
		for (let i = 0; i < this.pool.length; i++) {
			if (this.pool[i].id == orderId) {
				this.pool.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	prune() {
		this.pool = this.pool.filter((element, index, array) => {
			return element.expiryTime > Date.now();
		});
	}

	// Find a single match for the specified order, or return null if no valid match exists.
	findBestMatch(order) {
		let matches = [];

		this.pool.forEach((o) => {
			if (o.id == order.id)
				return;
			if (o.marketContractAddress != order.marketContractAddress)
				return;
			if (o.type == order.type)
				return;
			if (o.baseTokenAddress != order.baseTokenAddress)
				return;
			if (o.quoteTokenAddress != order.quoteTokenAddress)
				return;
			if (o.type == "buy") {
				if (o.price < order.price)
					return;
			} else {
				if (o.price > order.price)
					return;
			}
			let amount = BigNumber.min(o.baseTokenAmount, order.baseTokenAmount);
			if (amount < o.minBaseTokenAmount || amount < order.minBaseTokenAmount)
				return;
			if (amount > o.maxBaseTokenAmount || amount > order.maxBaseTokenAmount)
				return;
			if (amount == new BigNumber(0))
				return;
			matches.push({
				makerOrder: order,
				takerOrder: o,
				amount: amount,
				priority: [o.matcherFee + order.matcherFee, BigNumber.min(o.expiryTime, order.expiryTime),
						Math.abs(o.price - order.price), amount],
			});
		});

		matches.sort((a, b) => {
			if (a.priority == b.priority)
				return 0;
			return a.priority > b.priority ? 1 : -1;
		})

		if (matches.length == 0) {
			return null;
		} else {
			let bestMatch = matches[matches.length - 1];
			return {
				makerOrder: bestMatch.makerOrder,
				takerOrder: bestMatch.takerOrder,
				amount: bestMatch.amount,
			};
		}
	}
}
