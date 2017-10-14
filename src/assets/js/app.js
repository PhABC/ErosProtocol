$(document).foundation();


function submitBuy() {
    var obj = {
        amountBuy: $("amountBuy"),
        price: $("price"),
        ttl: $("ttl"),
        feeBuy: $("feeBuy"),
    }
}

function submitSell() {
    var obj = {
        amountSell: $("amountSell"),
        pricePay: $("pricePay"),
        ttl2: $("ttl2"),
        feeSell: $("feeSell"),
    }
}

function submit(type) {
    if(!web3) throw new Error("no web3");
    var obj = {test:"test2"}
    var jsonObj = JSON.stringify(obj);
    web3.util.toHex(JSON.stringify(obj));
}

function init() {
    document.getElementById('broadcastBuy').onsubmit = submitBuy;
    document.getElementById('broadcastSell').onsubmit = submitSell;
}

windows.onload = submitBuy;
windows.onload = submitSell;
