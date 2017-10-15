const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8546');
//const Shh = require('web3-shh');
const shh = web3.shh;

let activeModules = [web3.utils.asciiToHex('golem').slice(0,10), web3.utils.asciiToHex('maker').slice(0,10)];
console.log(activeModules);
var data = {};

//let data = "hello";


const setup1 = () => {
	return shh.newKeyPair()
	.then(id => {
		data.asymKeyId1 = id;
		return shh.getPublicKey(id)
		.then(pubKey => {
			data.asymPubKey = pubKey;
			return shh.newSymKey()
		})
		.then(symKeyId => {
			data.symKeyId = symKeyId;
		}).catch(console.log)
	}).catch(console.log)
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
		}).catch(console.log)
	}).catch(console.log)
};

const initListeners = () => {
	shh.subscribe('messages', {
	    topics: [activeModules[0]],
			symKeyId: "c1496cd0731bab44a6c389ef146eb891b5df6e1708058b484966b484847a8fc6"
	}, (err, obj) => {
		if (err) throw new Error(err);
		onReceivePayload(JSON.parse(web3.utils.hexToAscii(obj.payload)));
	});
};

 const sendPayload = (payload) => {
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
			console.log(data);
			shh.post({
				symKeyId: "c1496cd0731bab44a6c389ef146eb891b5df6e1708058b484966b484847a8fc6",
				ttl: 7,
				topic: activeModules[0],
				powTarget: 2.01,
				powTime: 2,
				payload: web3.utils.toHex(payload),
				sig: data.asymKeyId2,
			}, function(err, res) {
				console.log(err);
			});
			console.log('sent')
		})

	});
};

const onReceivePayload = (payload) => {
	console.log(payload);
	console.log('est');
};


sendPayload('test');
