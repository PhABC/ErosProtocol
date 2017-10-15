const BigNumber = require("bignumber.js");
const hash = require("object-hash")
const ZeroEx = require('0x.js').ZeroEx;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

export let orderFromPayload = (payload) => {
	return new Order(
		payload.maker,
		payload.taker,
		payload.feeRecipient,
		payload.makerTokenAddress,
		payload.takerTokenAddress,
		payload.exchangeContractAddress,
		new BigNumber(payload.salt),
		new BigNumber(payload.makerFee),
		new BigNumber(payload.takerFee),
		new BigNumber(payload.makerTokenAmount),
		new BigNumber(payload.takerTokenAmount),
		new BigNumber(payload.expirationUnixTimestampSec),
		payload.ecSignature
	);
}

export class Order {
	constructor(maker,
			taker,
			feeRecipient,
			makerTokenAddress,
			takerTokenAddress,
			exchangeContractAddress,
			salt,
			makerFee,
			takerFee,
			makerTokenAmount,
			takerTokenAmount,
			expirationUnixTimestampSec,
			ecSignature) {
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

	toPayload() {
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
	get id() {
		return hash(this.toPayload());
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
			return element.expirationUnixTimestampSec > Date.now();
		});
	}

	// Find a single match for the specified order, or return null if no valid match exists.
	findBestMatch(order) {
		let matches = [];

		this.pool.forEach((o) => {
			if (o.id == order.id)
				return;
			if (o.exchangeContractAddress != order.exchangeContractAddress)
				return;
			if (o.makerTokenAddress != order.takerTokenAddress)
				return;
			if (o.takerTokenAddress != order.makerTokenAddress)
				return;
			if (o.makerTokenAmount == 0 || o.takerTokenAmount == 0)
				return;
			if (order.makerTokenAmount == 0 || order.takerTokenAmount == 0)
				return;
			if (o.takerTokenAmount / o.makerTokenAmount <= order.makerTokenAmount / order.takerTokenAmount)
				return;
			matches.push({
				orderA: order,
				orderB: o,
				priority: [o.makerFee + o.takerFee + order.makerFee + order.takerFee,
						BigNumber.min(o.expirationUnixTimestampSec, order.expirationUnixTimestampSec)],
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
				orderA: bestMatch.orderA,
				orderB: bestMatch.orderB,
			};
		}
	}
}
