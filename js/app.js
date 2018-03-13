const App = {
    web3: null,
    web3Provider: null,
    etherscanLink: '',
    metamask: {
        installed: false,
        netId: null
    },
    contracts: {},

    init: function () {
        App.initWeb3(true);
    },

    initWeb3: function (checkWeb3) {
        App.etherscanLink = etherscanLink;
        if (checkWeb3 && typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            App.web3 = new Web3(App.web3Provider);
            App.metamask.installed = true;
            App.web3.version.getNetwork(function (err, netId) {
                App.metamask.netId = netId;
                if (netId !== networkId) {
                    App.initWeb3(false);
                }
            });
        } else {
            // set the provider you want from Web3.providers
            App.web3Provider = new Web3.providers.HttpProvider(web3Provider);
            App.web3 = new Web3(App.web3Provider);
        }
    },

    initToken: async function () {
        return $.getJSON(abiPath + 'ERC20Token.json', function (data) {
            App.contracts.ERC20Token = TruffleContract(data);
            App.contracts.ERC20Token.setProvider(App.web3Provider);
        });
    },

    home: async function () {
        App.init();

        Vue.use(VeeValidate);
        await App.initToken();

        new Vue({
            el: '#token-generator',
            data: {
                trxHash: '',
                makingTransaction: false,
                formDisabled: false,
                token: {}
            },
            created: function () {
                this.$validator.extend('eth_address', {
                    getMessage: field => 'Insert a valid Ethereum wallet address.',
                    validate: value => App.web3.isAddress(this.crowdsale.wallet)
                });
            },
            methods: {
                generateToken: function () {
                    if (!App.metamask.installed) {
                        alert("To create a Token please install the MetaMask extension!");
                        return;
                    } else {
                        if (App.metamask.netId !== networkId) {
                            alert("Your MetaMask extension in on the wrong network. Please switch on " + networkName + " and try again!");
                            return;
                        }
                    }

                    this.$validator.validateAll().then(async (result) => {
                        if (result) {
                            const name = this.token.name;
                            const symbol = this.token.symbol.toUpperCase();
                            const decimals = new App.web3.BigNumber(this.token.decimals);
                            const initialAmount = new App.web3.BigNumber(this.token.initialAmount);

                            try {
                                this.trxHash = '';
                                this.formDisabled = true;
                                this.makingTransaction = true;

                                const log = await App.contracts.ERC20Token.new(
                                    name,
                                    symbol,
                                    decimals,
                                    initialAmount
                                );

                                this.token.address = log.address;
                                this.trxHash = log.contract.transactionHash;
                                this.trxLink = App.etherscanLink + "/tx/" + this.trxHash;
                                this.token.link = App.etherscanLink + "/token/" + this.token.address;
                            } catch (e) {
                                this.makingTransaction = false;
                                this.formDisabled = false;
                                alert("Some error occurred. Maybe you rejected the transaction or you have MetaMask locked!");
                            }
                        } else {
                            console.log("some errors");
                        }
                    });
                }
            }
        });
    },
};

(function($) {
    "use strict";

    switch (page) {
        case "": //home
            App.home();
            break;
    }

})(jQuery); // End of use strict