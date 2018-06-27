import $ from 'jquery';
import Web3 from 'web3';
import GBTokenContract from './GBToken.json' // fetch ABI (interface) for token contract

// Instantiate Web3 using personal Ganache blockchain.
const web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545"));

// If using "truffle develop" instead of Ganache, use the following
//const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));

const contract = require('truffle-contract');

const gbToken = contract(GBTokenContract)
gbToken.setProvider(web3.currentProvider)

let tokenInstance = null
let blockchainAccounts = [];

// We will use this function to show the status of the deployed token sale contract
const initContract = () => {
    web3.eth.getAccounts((error, accounts) => {
        if (error){
            console.log("Error fetching accounts");
            return;
        }

        gbToken.defaults({from: accounts[0]});
            
        // store accounts for later
        blockchainAccounts = accounts;

        gbToken.deployed()
        .catch((error) => {
            console.log('Error finding contract.'+error);
        })
        .then((instance) => {  
            // store contract instance for later
            tokenInstance = instance;
            console.log("contract Instance found!");
            renderAccountBalances();
        })
    })
};

const renderAccountBalances = () => {
    $('#num-accounts').html(blockchainAccounts.length);

    let accountsList = $('#accounts-list');
    let accountTemplate = $('#account-template');
    let indexCounter = 0;

    for (let addr of blockchainAccounts){

        accountTemplate.find('.account-address').text(addr);
        accountTemplate.find('.account-token-balance').text('0');
        accountTemplate.find('li').attr('account-index', indexCounter);
        accountTemplate.find('.send-tokens-button').attr('data-index', indexCounter);

        accountsList.append(accountTemplate.html());

        indexCounter++;
    }

    // hide the Send button on first row
    $("[data-index=0]").hide();
    bindButtonEvents();
    updateAllTokenBalances();
};

const bindButtonEvents = () => {

    $(document).on('click', '.send-tokens-button', handleSendClicked);
};

const updateAllTokenBalances = () => {
    for (let i in blockchainAccounts){
        updateBalanceForAccountIndex(i);
    }
};

const handleSendClicked = (event) => {
    event.preventDefault();

    let accountIndex = parseInt($(event.target).data('index'));
    $(event.target).html("...");
    $(event.target).prop('disabled', true);
    sendTokensToAccountIndex(accountIndex);
}

const sendTokensToAccountIndex = (accountIndex) => {
    let sendingAccount = blockchainAccounts[0];
    let receivingAccount = blockchainAccounts[accountIndex];
    let amountToSend = 10;

    console.log("Trying to send 10 GBT to: "+receivingAccount);

    return tokenInstance.sendTokens(receivingAccount, 10)
    .then((result) => {
        console.log(result);
        $("[data-index="+accountIndex+"]").html("+10 GBT");
        $("[data-index="+accountIndex+"]").prop('disabled', false);

        updateBalanceForAccountIndex(0);
        updateBalanceForAccountIndex(accountIndex);
    }).catch((error) => {
        console.error("Couldn't submit send-token transaction!");
        console.log(error);
    });
};

const updateBalanceForAccountIndex = (accountIndex) => {
    let accountToFetch = blockchainAccounts[accountIndex];
    let accountUIElement = $("[account-index="+accountIndex+"]");

    return tokenInstance.getBalance.call(accountToFetch)
    .then((data) => {
        //console.log("received balance for account "+accountIndex);
        accountUIElement.find('.account-token-balance').text(data.toNumber()+' GBToken');
    }).catch((error) => {
        console.error("Couldn't fetch balance for account "+accountIndex+"!");
        accountUIElement.find('.account-token-balance').text('ERROR');
    });
};

initContract();