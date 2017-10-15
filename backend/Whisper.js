const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8546');
const ZeroEx = require('0x.js').ZeroEx;
const BigNumber = require("bignumber.js");
const DECIMALS = 16;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZRX_ADDRESS = "0x123";
const shh = web3.shh;
let activeModules = [web3.utils.asciiToHex('golem').slice(0,10), web3.utils.asciiToHex('maker').slice(0,10)];
var data = {};

//let data = "hello";


const setup1 = () => {
	return shh.newKeyPair()
	.then(id => {
		data.asymKeyId1 = id;
		return shh.getPublicKey(id)
		.then(pubKey => {
			data.asymPubKey = pubKey;
			return shh.generateSymKeyFromPassword("eros");
		})
		.then(symKeyId => {
			data.symKeyId = symKeyId;
		}).catch(console.log);
	}).catch(console.log);
};

const setup2 = () => {
	return shh.newKeyPair()
	.then(id => {
		console.log('key2', id);
		data.asymKeyId2 = id;
		return Promise.all([shh.getPublicKey(id), shh.getPrivateKey(id)])
		.then(values => {
			data.pubKey2 = values[0];
			data.privKey2 = values[1];
		}).catch(console.log);
	}).catch(console.log);
};

const initListeners = () => {
	shh.subscribe('messages', {
		topics: [activeModules[0]],
			symKeyId: data.symKeyId
	}, (err, obj) => {
		if (err) throw new Error(err);
		onReceivePayload(JSON.parse(web3.utils.hexToAscii(obj.payload)));
	});
};

 export const sendPayload = (payload) => {
	setup1()
	.then(setup2())
	.then(() => {
		initListeners();
		web3.eth.sign(JSON.stringify(payload), '0x316a4d5c86974a9E4C3D8Ed70f0A6630a11Db681')
		.then(sig => {
			payload = {
				...payload,
				sig
			};
			shh.post({
				symKeyId: data.symKeyId,
				ttl: 7,
				topic: activeModules[0],
				powTarget: 2.01,
				powTime: 2,
				payload: web3.utils.toHex(payload),
				sig: data.asymKeyId2,
			}, function(err, res) {
				if(err) return console.error(err);
				console.log(res);
			});
			console.log('sent')
		})

	});
};

const onReceivePayloadCallbacks = [];

export const addOnReceivePayload = (callback) => {
	onReceivePayloadCallbacks.push(callback);
};

const onReceivePayload = (payload) => {
	onReceivePayloadCallbacks.forEach((callback) => { callback(payload); })
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
