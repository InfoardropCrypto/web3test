var firebaseConfig = {
  apiKey: "AIzaSyBtoafs5RAPyMYO4VwIWEMb98Ye_X0w-EA",
  authDomain: "web3-iac.firebaseapp.com",
  databaseURL: "https://web3-iac-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web3-iac",
  storageBucket: "web3-iac.firebasestorage.app",
  messagingSenderId: "177980099871",
  appId: "1:177980099871:web:9ecb0cc57ac00b757c342a",
  measurementId: "G-9VG2WXG47T"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

const fromBalanceElement = document.getElementById('fromBalance');
const toBalanceElement = document.getElementById('toBalance');
const priceElement = document.getElementById('price');
const lastUpdateElement = document.getElementById('lastUpdate');
const countdownElement = document.getElementById('countdown');
const fromNetworkSelect = document.getElementById('fromNetwork');
const toNetworkSelect = document.getElementById('toNetwork');
const swapButton = document.getElementById('swapButton');
const amountInput = document.getElementById('amount');
const connectWalletButton = document.getElementById('connectWalletButton');
const walletStatus = document.getElementById('walletStatus');
const networkSelect = document.getElementById('networkSelect');
const networkAddress = document.getElementById('networkAddress');
const autoSwitchButton = document.getElementById('autoSwitchButton');
const swapSection = document.getElementById('swapSection');

const swapConfirmationModal = document.getElementById('swapConfirmationModal');
const modalFromAmount = document.getElementById('modalFromAmount');
const modalToAmount = document.getElementById('modalToAmount');
const modalPrice = document.getElementById('modalPrice');
const modalGasFee = document.getElementById('modalGasFee');
const confirmSwapButton = document.getElementById('confirmSwapButton');
const rejectSwapButton = document.getElementById('rejectSwapButton');

document.addEventListener("DOMContentLoaded", function() {
    const tokenOptions = [
        { value: "eth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", text: "Ethereum" },
        { value: "optimism_eth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png", text: "Optimism Network" },
        { value: "base_eth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png", text: "Base Network" },
        { value: "optimism", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png", text: "Optimism" },
        { value: "lido", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/8000.png", text: "Lido Dao" },
        { value: "steth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/8085.png", text: "Lido Staked Ether" },
        { value: "usdc_erc20", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", text: "USDC_ERC20" },
        { value: "usdt_erc20", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", text: "USDT_ERC20" },
        { value: "weth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png", text: "WETH" },
        { value: "sol", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", text: "Solana" },
        { value: "jup", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png", text: "Jupiter" },
        { value: "cosmos", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3794.png", text: "Cosmos" },
        { value: "pepe", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png", text: "Pepe" },
        { value: "supra", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/34240.png", text: "Supra" },
        { value: "sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png", text: "Sui" },
        { value: "walrus", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36119.png", text: "Walrus" },
        { value: "ika", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/37454.png", text: "Ika" },
        { value: "haedal", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36369.png", text: "Haedal" },
        { value: "hasui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/29402.png", text: "Haedal Staked Sui" },
        { value: "deep", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/33391.png", text: "DeepBook" },
        { value: "ink", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36851.png", text: "INK" },
        { value: "pengu", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/34466.png", text: "PENGU" },
        { value: "xrp", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png", text: "XRP" },
        { value: "bsc", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png", text: "BSC Network" },
        { value: "usdt_bep20", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", text: "USDT_BEP20" },
        { value: "succinct", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/37593.png", text: "Succinct" },
        { value: "near", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/6535.png", text: "Near Network" },
        { value: "zerogravity", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/38337.png", text: "0G Network" },
        { value: "cetus", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/25114.png", text: "Cetus" },
        { value: "ns", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/32942.png", text: "Sui Name Service" },
        { value: "sca", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/29679.png", text: "Scallop" },
        { value: "blue", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/8724.png", text: "Bluefin" },
        { value: "navx", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/29296.png", text: "Navi Protocol" },
        { value: "usdt_sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", text: "USDT_SUI" },
        { value: "usdc_sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", text: "USDC_SUI" },
    ];

    const fromNetworkSelect = document.getElementById('fromNetwork');
    const toNetworkSelect = document.getElementById('toNetwork');

    function populateSelect(selectElement) {
        tokenOptions.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.setAttribute('data-image', optionData.image);
            option.textContent = optionData.text;
            selectElement.appendChild(option);
        });
    }

    populateSelect(fromNetworkSelect);
    populateSelect(toNetworkSelect);
    if (fromNetworkSelect.options.length > 0) {
        fromNetworkSelect.value = 'eth';
    }
    if (toNetworkSelect.options.length > 0) {
        toNetworkSelect.value = 'usdc_erc20';
    }
});

const tickerMap = {
    eth: 'ETH', 
    usdt_erc20: 'USDT', 
    usdc_erc20: 'USDC', 
    weth: 'WETH', 
    lido: 'LIDO',
    steth: 'StETH', 
    optimism_eth: 'ETH', 
    optimism: 'OP', 
    base_eth: 'ETH', 
    sol: 'SOL',
    jup: 'JUP', 
    cosmos: 'ATOM', 
    sui: 'SUI', 
    walrus: 'WAL', 
    ika: 'IKA', 
    haedal: 'HAEDAL',
    hasui: 'HASUI', 
    deep: 'DEEP', 
    cetus: 'CETUS', 
    ns: 'NS',
    sca: 'SCA', 
    blue: 'BLUE', 
    usdc_sui: 'USDC',
    usdt_sui: 'USDT', 
    navx: 'NAVX', 
    pepe: 'PEPE', 
    supra: 'SUPRA', 
    xrp: 'XRP', 
    bsc: 'BNB',
    usdt_bep20: 'USDT', 
    succinct: 'PROVE', 
    pengu: 'PENGU', 
    near: 'NEAR',
    zerogravity: '0G',
};

const keyBySymbol = {};
for (const key in tickerMap) {
    const symbol = tickerMap[key].toUpperCase();
    if (!keyBySymbol[symbol] || key.length < keyBySymbol[symbol].length) {
        keyBySymbol[symbol] = key;
    }
}


const apiTokenMap = {
    eth: 'ethereum',
    lido: 'lido-dao',
    steth: 'lido-staked-ether',
    weth: 'ethereum',
    usdc_erc20: 'usd-coin',
    usdt_erc20: 'tether',
    optimism_eth: 'ethereum',
    optimism: 'optimism',
    sol: 'solana',
    jup: 'jupiter-exchange-solana',
    cosmos: 'cosmos',
    pepe: 'pepe',
    supra: 'supra',
    sui: 'sui',
    walrus: 'walrus-2',
    ika: 'ika',
    usdc_sui: 'usd-coin',
    usdt_sui: 'tether',
    haedal: 'haedal',
    hasui: 'haedal-staked-sui',
    deep: 'deep',
    cetus: 'cetus-protocol', 
    ns: 'suins-token',
    sca: 'scallop-2', 
    blue: 'bluefin', 
    usdc_sui: 'usd-coin',
    usdt_sui: 'tether', 
    navx: 'navi',
    ink: 'ink-3',
    pengu: 'pudgy-penguins',
    bsc: 'binancecoin',
    succinct: 'succinct',
    usdt_bep20: 'tether',
    xrp: 'ripple',
    near: 'near',
    zerogravity: 'zero-gravity',
};

async function fetchRealPrice(apiTokenId) {
    if (!apiTokenId) {
        return null;
    }
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${apiTokenId}&vs_currencies=usd`);
        if (!response.ok) {
            console.error(`CoinGecko API request failed for ${apiTokenId}: ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (data[apiTokenId] && data[apiTokenId].usd) {
            return data[apiTokenId].usd;
        } else {
            console.warn(`Price not found for ${apiTokenId} in CoinGecko API response.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching price for ${apiTokenId} from CoinGecko:`, error);
        return null;
    }
}

async function getPriceWithFallback(assetKey) {
    const apiTokenId = apiTokenMap[assetKey];
    let price = await fetchRealPrice(apiTokenId);
    let fromCache = false;

    if (price === null) {
        console.warn(`API fetch failed for ${assetKey}. Attempting Firebase fallback.`);
        const priceRef = database.ref(`price/${assetKey}_to_usdc_erc20`);
        try {
            const snapshot = await priceRef.once('value');
            const data = snapshot.val();
            if (data && data.fromPriceUSD) {
                price = parseFloat(data.fromPriceUSD);
                fromCache = true;
                console.log(`Using Firebase fallback price for ${assetKey}: ${price}`);
            } else {
                const reversePriceRef = database.ref(`price/usdc_erc20_to_${assetKey}`);
                const reverseSnapshot = await reversePriceRef.once('value');
                const reverseData = reverseSnapshot.val();
                if (reverseData && reverseData.toPriceUSD) {
                    price = parseFloat(reverseData.toPriceUSD);
                    fromCache = true;
                    console.log(`Using Firebase fallback price for ${assetKey} (reverse pair): ${price}`);
                }
            }
        } catch (error) {
            console.error(`Firebase fallback for ${assetKey} failed:`, error);
            return { price: null, fromCache: false };
        }
    }
    return { price, fromCache };
}


async function updatePrice() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (!fromNetwork || !toNetwork || fromNetwork === toNetwork) {
        return;
    }

    const fromTokenApiId = apiTokenMap[fromNetwork];
    const toTokenApiId = apiTokenMap[toNetwork];
    const priceRef = database.ref(`price/${fromNetwork}_to_${toNetwork}`);

    let [fromPriceUSD, toPriceUSD] = await Promise.all([
        fetchRealPrice(fromTokenApiId),
        fetchRealPrice(toTokenApiId)
    ]);

    if (fromPriceUSD === null || toPriceUSD === null) {
        console.warn("RPC is down or price not available. Fetching last price.");
        priceRef.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.conversionRate) {
                priceElement.textContent = ` ${tickerMap[fromNetwork]} = ${data.conversionRate} ${tickerMap[toNetwork]}`;
                if (document.getElementById('estimatedAmount')) {
                    const amount = parseFloat(amountInput.value);
                    if (!isNaN(amount) && amount > 0) {
                        const estimatedAmount = (amount * parseFloat(data.conversionRate)).toFixed(18);
                        document.getElementById('estimatedAmount').textContent = `${estimatedAmount} ${tickerMap[toNetwork]}`;
                    }
                }
            } else {
                priceElement.textContent = `Search [Router]`;
            }
        });
        return;
    }


    if (typeof fromPriceUSD === 'number' && typeof toPriceUSD === 'number' && toPriceUSD !== 0) {
        const conversionRate = (fromPriceUSD / toPriceUSD).toFixed(18);
        priceElement.textContent = `Price : 1 ${tickerMap[fromNetwork]} = ${conversionRate} ${tickerMap[toNetwork]}`;

        priceRef.set({
            fromPriceUSD: fromPriceUSD.toString(),
            toPriceUSD: toPriceUSD.toString(),
            conversionRate: conversionRate,
            timestamp: new Date().toISOString()
        });
        
        const timestamp = new Date().getTime(); 
        const historicalRef = database.ref(`priceHistory/${fromNetwork}_to_${toNetwork}/${timestamp}`);
        await historicalRef.set({
            conversionRate: conversionRate,
            fromPriceUSD: fromPriceUSD.toString(),
            toPriceUSD: toPriceUSD.toString()
        });
        updatePriceChart();
        const amount = parseFloat(amountInput.value);
        if (!isNaN(amount) && amount > 0) {
            const estimatedAmount = (amount * parseFloat(conversionRate)).toFixed(18);
            if (document.getElementById('estimatedAmount')) {
                 document.getElementById('estimatedAmount').textContent = `${estimatedAmount} ${tickerMap[toNetwork]}`;
            }
        } else {
             if (document.getElementById('estimatedAmount')) {
                document.getElementById('estimatedAmount').textContent = `0`;
             }
        }
    } else {
        priceElement.textContent = `Price: N/A (Invalid Price Data)`;
        if (document.getElementById('estimatedAmount')) {
            document.getElementById('estimatedAmount').textContent = `0`;
        }
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    lastUpdateElement.textContent = `Last Updated: ${formattedTime}`;
}

function updateBalances() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    if (!userId) {
        fromBalanceElement.textContent = 'Sell: N/A';
        toBalanceElement.textContent = 'Buy: N/A';
        return;
    }

    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork && tickerMap[fromNetwork]) {
        const fromBalanceRef = database.ref(`wallets/${userId}/${fromNetwork}/balance`);
        fromBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            fromBalanceElement.textContent = `You're Selling ${parseFloat(balance).toFixed(18)} ${tickerMap[fromNetwork]}`;
        });
    } else {
        fromBalanceElement.textContent = `You're Selling N/A`;
    }

    if (toNetwork && tickerMap[toNetwork]) {
        const toBalanceRef = database.ref(`wallets/${userId}/${toNetwork}/balance`);
        toBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            toBalanceElement.textContent = `You're Buying ${parseFloat(balance).toFixed(18)} ${tickerMap[toNetwork]}`;
        });
    } else {
        toBalanceElement.textContent = `You're Buying N/A`;
    }
}

let countdownTimer = 2;
function startCountdown() {
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = `Next price update in: ${countdownTimer}s [1 minute]`;
        countdownTimer--;
        if (countdownTimer < 0) {
            clearInterval(countdownInterval);
            updatePrice();
            updateGasFee();
            countdownTimer = 60;
            startCountdown();
        }
    }, 1000);
}

fromNetworkSelect.addEventListener('change', () => {
    const fromNetwork = fromNetworkSelect.value;
    const currentToNetwork = toNetworkSelect.value;

    if (fromNetwork === currentToNetwork) {

        for (let option of toNetworkSelect.options) {
            if (option.value !== fromNetwork) {
                toNetworkSelect.value = option.value;
                break;
            }
        }
    }
    checkRouterAvailability();
    updateBalances();
    updatePrice();
    updateEstimatedAmount();
    updateGasFee();
});

toNetworkSelect.addEventListener('change', () => {
    const toNetwork = toNetworkSelect.value;
    const currentFromNetwork = fromNetworkSelect.value;

    if (toNetwork === currentFromNetwork) {
         for (let option of fromNetworkSelect.options) {
            if (option.value !== toNetwork) {
                fromNetworkSelect.value = option.value;
                break;
            }
        }
    }
    checkRouterAvailability();
    updateBalances();
    updatePrice();
    updateEstimatedAmount();
});

amountInput?.addEventListener('input', async () => {
    const warningId = 'amountWarning';
    const warning = document.getElementById(warningId) || document.createElement('div');

    const userId = auth.currentUser?.uid;
    const fromNetwork = fromNetworkSelect.value;
    const amount = parseFloat(amountInput.value);
    
    updateEstimatedAmount();

    if (!userId || !fromNetwork || isNaN(amount) || amount <= 0) {
        warning.remove?.();
        return;
    }

    try {
        const [balanceSnap, gasSnap] = await Promise.all([
            database.ref(`wallets/${userId}/${fromNetwork}/balance`).once('value'),
            database.ref(`gasprice/${fromNetwork}/gasFee`).once('value')
        ]);

        const balance = parseFloat(balanceSnap.val() || '0');
        const gas = parseFloat(gasSnap.val() || '0');
        const total = amount + gas;
        const afterBalanceEl = document.getElementById('afterBalance');
if (afterBalanceEl) {
    const remaining = balance - amount - gas;
    afterBalanceEl.textContent = remaining >= 0
        ? `Estimated balance change: ${remaining.toFixed(18)} ${tickerMap[fromNetwork]}`
        : '';
}


        if (total > balance) {
            warning.id = warningId;
            warning.textContent = `⚠ Insufficient balance. Required: ${total.toFixed(18)}, Available: ${balance.toFixed(18)}`;
            warning.style.color = 'orange';
            warning.style.fontSize = '12px';
            amountInput.insertAdjacentElement('afterend', warning);
        } else {
            warning.remove?.();
        }
    } catch (err) {
        console.error('Validation error:', err);
        warning.remove?.();
    }
});

function connectWallet() {
    const user = firebase.auth().currentUser;

    if (user) {
        const userId = user.uid;
        const selectedNetworkKey = networkSelect.value || Object.keys(apiTokenMap)[0];


        const addressRef = firebase.database().ref(`wallets/${userId}/${selectedNetworkKey}/address`);

        addressRef.once('value').then(snapshot => {
            const address = snapshot.val() || 'Tidak ditemukan';
            if (networkAddress) networkAddress.textContent = `Network Address: ${userId}`;
        });

        walletStatus.textContent = 'Connected';
        walletStatus.style.color = 'green';

        if (document.getElementById('swapSection')) {
            document.getElementById('swapSection').style.display = 'block';
        }

        updateBalances();
        updatePrice();
    } else {
        walletStatus.textContent = 'Not Connected';
        walletStatus.style.color = 'red';
        if (networkAddress) networkAddress.textContent = 'Network Address: N/A';

        if (document.getElementById('swapSection')) {
            document.getElementById('swapSection').style.display = 'none';
        }
    }
}

async function executeSwap() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);
    const currentUser = auth.currentUser;
    
    if (!currentUser || isNaN(amount) || amount <= 0 || fromNetwork === toNetwork) {
        alert("An error occurred. Please try again.");
        return;
    }

    const fromTokenApiId = apiTokenMap[fromNetwork];
    const toTokenApiId = apiTokenMap[toNetwork];
    let fromPriceForTx = null;
    let toPriceForTx = null;

    try {
        [fromPriceForTx, toPriceForTx] = await Promise.all([
            fetchRealPrice(fromTokenApiId),
            fetchRealPrice(toTokenApiId)
        ]);
    } catch (error) {
        console.error("Error fetching prices for swap:", error);
    }
    
    if (fromPriceForTx === null || toPriceForTx === null) {
         const priceRef = database.ref(`price/${fromNetwork}_to_${toNetwork}`);
        const snapshot = await priceRef.once('value');
        const cachedPrice = snapshot.val();
        if (cachedPrice && cachedPrice.fromPriceUSD && cachedPrice.toPriceUSD) {
             fromPriceForTx = parseFloat(cachedPrice.fromPriceUSD);
             toPriceForTx = parseFloat(cachedPrice.toPriceUSD);
        } else {
             alert('Router not found, please wait a moment [Search in progress]');
             return;
        }
    }

    const conversionRateForTx = fromPriceForTx / toPriceForTx;
    const amountInToNetwork = amount * conversionRateForTx;
    const fromBalanceRef = database.ref(`wallets/${currentUser.uid}/${fromNetwork}/balance`);
    const gasFeeRef = database.ref(`gasprice/${fromNetwork}/gasFee`);

    Promise.all([gasFeeRef.once('value'), fromBalanceRef.once('value')]).then(([gasSnapshot, balanceSnapshot]) => {
        const gasFee = parseFloat(gasSnapshot.val()) || 0;
        const fromBalance = parseFloat(balanceSnapshot.val()) || 0;

        if (fromBalance < (amount + gasFee)) {
            alert(`Insufficient ${tickerMap[fromNetwork]} balance.`);
            return;
        }

        const toBalanceRef = database.ref(`wallets/${currentUser.uid}/${toNetwork}/balance`);
        toBalanceRef.once('value').then(toSnapshot => {
            const toBalance = parseFloat(toSnapshot.val()) || 0;
            const newToBalance = toBalance + amountInToNetwork;
            const newFromBalance = fromBalance - amount - gasFee;

            const updates = {};
            updates[`wallets/${currentUser.uid}/${fromNetwork}/balance`] = newFromBalance;
            updates[`wallets/${currentUser.uid}/${toNetwork}/balance`] = newToBalance;

            database.ref().update(updates).then(() => {
                alert('Swap successful!');
                updateBalances();

                const transactionHash = generateTransactionHash();
                const timestamp = new Date().toISOString();
                const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);
                const transactionData = {
                    network: `${fromNetwork} to ${toNetwork}`,
                    sender: currentUser.uid,
                    recipient: currentUser.uid,
                    amount: amount.toFixed(18),
                    result: amountInToNetwork.toFixed(18),
                    amountSent: amount.toFixed(18),
                    memo: `Swap ${tickerMap[fromNetwork]} to ${tickerMap[toNetwork]} Convert rate [${conversionRateForTx.toFixed(18)}] Successful`,
                    amountReceived: amountInToNetwork.toFixed(18),
                    gasFee: gasFee.toFixed(18),
                    fromPriceUSD: fromPriceForTx.toFixed(18),
                    toPriceUSD: toPriceForTx.toFixed(18),
                    price: `1 ${tickerMap[fromNetwork]} = ${conversionRateForTx.toFixed(18)} ${tickerMap[toNetwork]}`,
                    fromTokenPriceUSD: fromPriceForTx.toFixed(18),
                    toTokenPriceUSD: toPriceForTx.toFixed(18),
                    conversionRateUsed: conversionRateForTx.toFixed(18),
                    priceDisplay: `1 ${tickerMap[fromNetwork]} = ${conversionRateForTx.toFixed(18)} ${tickerMap[toNetwork]}`,
                    timestamp: timestamp,
                    transactionHash: transactionHash,
                    type: "swap"
                };

                return transactionRef.set(transactionData);
            }).catch(error => {
                console.error('Firebase update error during swap:', error);
                alert('Swap failed due to a database error.');
            });
        }).catch(error => console.error("Firebase error reading toBalance:", error));
    }).catch(error => console.error("Firebase error reading gas/fromBalance:", error));
}

swapButton.addEventListener('click', async () => {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);
    const currentUser = auth.currentUser;

    if (!currentUser) {
        alert('Please connect your wallet first.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount.');
        return;
    }

    if (fromNetwork === toNetwork) {
        alert('Cannot swap between the same network.');
        return;
    }
    
    const fromBalanceRef = database.ref(`wallets/${currentUser.uid}/${fromNetwork}/balance`);
    const gasFeeRef = database.ref(`gasprice/${fromNetwork}/gasFee`);
    
    const [gasSnapshot, balanceSnapshot] = await Promise.all([gasFeeRef.once('value'), fromBalanceRef.once('value')]);
    const gasFee = parseFloat(gasSnapshot.val()) || 0;
    const fromBalance = parseFloat(balanceSnapshot.val()) || 0;

    if (fromBalance < (amount + gasFee)) {
        alert(`Insufficient ${tickerMap[fromNetwork]} balance to cover the swap amount and gas fee. Needed: ${(amount + gasFee).toFixed(18)}, Have: ${fromBalance.toFixed(18)}`);
        return;
    }
    
    const estimatedAmountText = document.getElementById('estimatedAmount').textContent;
    const priceText = document.getElementById('price').textContent;

    modalFromAmount.textContent = `${amount.toFixed(18)} ${tickerMap[fromNetwork]}`;
    modalToAmount.textContent = `${estimatedAmountText}`;
    modalPrice.textContent = priceText.replace('Price :', '');
    modalGasFee.textContent = `${gasFee.toFixed(18)} ${tickerMap[fromNetwork]}`;
    
    swapConfirmationModal.style.display = 'flex';
});

confirmSwapButton.addEventListener('click', () => {
    executeSwap();
    swapConfirmationModal.style.display = 'none';
});

rejectSwapButton.addEventListener('click', () => {
    swapConfirmationModal.style.display = 'none';
    alert('Swap canceled.');
});


function checkRouterAvailability() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const routerWarning = document.getElementById('routerWarning');

    const noRouter = (fromNetwork === 'eth' && (toNetwork === 'ac' || toNetwork === 'wac' || toNetwork === 'optimism_eth')) ||
                     ((fromNetwork === 'wac' || fromNetwork === 'ac') && (toNetwork === 'eth' || toNetwork === 'optimism_eth'));


    if (routerWarning) {
      routerWarning.style.display = noRouter ? 'block' : 'none';
    }
}

if (document.getElementById('routerWarning')) {
    checkRouterAvailability();
}
startCountdown();


async function updateEstimatedAmount() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);
    const estimatedAmountEl = document.getElementById('estimatedAmount');
if (estimatedAmountEl) {
    estimatedAmountEl.classList.add('highlight-flash');
    setTimeout(() => estimatedAmountEl.classList.remove('highlight-flash'), 500);
}
    if (!estimatedAmountEl) return;

    if (fromNetwork && toNetwork && !isNaN(amount) && amount > 0) {
        if (fromNetwork === toNetwork) {
            estimatedAmountEl.textContent = "Invalid pair";
            return;
        }
        const fromTokenApiId = apiTokenMap[fromNetwork];
        const toTokenApiId = apiTokenMap[toNetwork];

        let fromPriceUSD, toPriceUSD;
        try {
            [fromPriceUSD, toPriceUSD] = await Promise.all([
                fetchRealPrice(fromTokenApiId),
                fetchRealPrice(toTokenApiId)
            ]);
        } catch (error) {
            console.error("Error fetching prices for estimation:", error);
            estimatedAmountEl.textContent = "Error fetching price";
            return;
        }

        if (typeof fromPriceUSD === 'number' && typeof toPriceUSD === 'number' && toPriceUSD > 0) {
            const conversionRate = fromPriceUSD / toPriceUSD;
            const estimatedOutput = (amount * conversionRate).toFixed(18);
            estimatedAmountEl.textContent = `${estimatedOutput} ${tickerMap[toNetwork]}`;
        } else {
            estimatedAmountEl.textContent = "0";
        }
    } else {
        estimatedAmountEl.textContent = "0";
    }
}

if (connectWalletButton) {
    connectWalletButton.addEventListener('click', () => {
        
        if (auth.currentUser) {
            connectWallet();
            connectWalletButton.style.display = 'none';
             if(walletStatus) walletStatus.style.display = 'block';
             if(networkAddress) networkAddress.style.display = 'block';
        } else {

            alert("walletStatus: not Connected.");
            
        }
    });
}

if (networkSelect) {
    networkSelect.addEventListener('change', () => {
        if (auth.currentUser) {
        }
    });
}


function updateGasFee() {
    const selectedFromNetwork = fromNetworkSelect.value;
    const gasFeeElement = document.getElementById('gasFee');

    if (!gasFeeElement) return;
    if (!selectedFromNetwork || !tickerMap[selectedFromNetwork]) {
        gasFeeElement.textContent = 'N/A';
        return;
    }

    const gasFeeRef = database.ref(`gasprice/${selectedFromNetwork}/gasFee`);
    gasFeeRef.once('value')
        .then(snapshot => {
            const gasFee = parseFloat(snapshot.val()) || 0;
            const ticker = tickerMap[selectedFromNetwork] || '';
            gasFeeElement.textContent = `${gasFee.toFixed(18)} ${ticker}`;
        })
        .catch(error => {
            console.error('Error fetching gas fee:', error);
            gasFeeElement.textContent = 'N/A';
        });
}

fromNetworkSelect.addEventListener('change', checkRouterAvailability);
toNetworkSelect.addEventListener('change', checkRouterAvailability);

updateGasFee();

if (autoSwitchButton) {
    autoSwitchButton.addEventListener('click', () => {
        const fromNetwork = fromNetworkSelect.value;
        const toNetwork = toNetworkSelect.value;

        if (fromNetwork && toNetwork) {
            fromNetworkSelect.value = toNetwork;
            toNetworkSelect.value = fromNetwork;

            fromNetworkSelect.dispatchEvent(new Event('change'));
            toNetworkSelect.dispatchEvent(new Event('change'));

            updateBalances();
            updatePrice();
            updateEstimatedAmount();
            updateGasFee();
            checkRouterAvailability();
            amountInput?.dispatchEvent(new Event('input'));
        } else {
            alert('Please select both networks before switching.');
        }
    });
}

function generateTransactionHash() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

async function fetchTopGainers() {
    const topGainersList = document.getElementById('topGainersList');
    const topGainersCountSelect = document.getElementById('topGainersCountSelect');
    const count = parseInt(topGainersCountSelect.value, 10);

    if (topGainersList) {
        topGainersList.innerHTML = '<li>Loading...</li>';
    }

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        if (!response.ok) {
            console.error(`CoinGecko API request failed for markets: ${response.status}`);
            if (topGainersList) topGainersList.innerHTML = '<li>Error loading data.</li>';
            return;
        }
        
        let allCoins = await response.json();
        const tradeableCoins = allCoins.filter(coin => keyBySymbol[coin.symbol.toUpperCase()]);

        const gainersOnly = tradeableCoins.filter(coin => (coin.price_change_percentage_24h || 0) >= 0);

        gainersOnly.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));

        if (topGainersList) {
            topGainersList.innerHTML = '';
            const topGainers = gainersOnly.slice(0, count);
            
            if (topGainers.length === 0) {
                 topGainersList.innerHTML = '<li>No available gainers to display.</li>';
                 return;
            }

            topGainers.forEach(coin => {
                const priceChange = coin.price_change_percentage_24h || 0;
                const coinSymbol = coin.symbol.toUpperCase();
                const tokenKey = keyBySymbol[coinSymbol]; 

                const listItem = document.createElement('li');
                listItem.dataset.token = tokenKey;

                const tradeButtonHTML = '<button class="button trade-button">Trade</button>';

                listItem.innerHTML = `
                    <img src="${coin.image}" alt="${coin.name}" class="bundar">
                    <div class="listing-info">
                        <span class="token-name">${coin.name}</span>
                        <span class="token-ticker">${coinSymbol}</span>
                    </div>
                    <div class="list-item-details">
                        <span class="gainer-price-change">+${priceChange.toFixed(2)}%</span>
                        ${tradeButtonHTML}
                    </div>
                `;
                topGainersList.appendChild(listItem);
                amountInput.dispatchEvent(new Event('input'));
            });
        }
    } catch (error) {
        console.error('Error fetching top gainers:', error);
        if (topGainersList) topGainersList.innerHTML = '<li>Error loading data.</li>';
    }
}

async function fetchTopLosers() {
    const topLosersList = document.getElementById('topLosersList');
    const topLosersCountSelect = document.getElementById('topLosersCountSelect');
    const count = parseInt(topLosersCountSelect.value, 10);

    if (topLosersList) {
        topLosersList.innerHTML = '<li>Loading...</li>';
    }

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        if (!response.ok) {
            console.error(`CoinGecko API request failed for markets: ${response.status}`);
            if (topLosersList) topLosersList.innerHTML = '<li>Error loading data.</li>';
            return;
        }
        
        let allCoins = await response.json();
        const tradeableCoins = allCoins.filter(coin => keyBySymbol[coin.symbol.toUpperCase()]);

        const losersOnly = tradeableCoins.filter(coin => (coin.price_change_percentage_24h || 0) < 0);

        losersOnly.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));

        if (topLosersList) {
            topLosersList.innerHTML = '';
            const topLosers = losersOnly.slice(0, count);

            if (topLosers.length === 0) {
                 topLosersList.innerHTML = '<li>No available losers to display.</li>';
                 return;
            }

            topLosers.forEach(coin => {
                const priceChange = coin.price_change_percentage_24h || 0;
                const coinSymbol = coin.symbol.toUpperCase();
                const tokenKey = keyBySymbol[coinSymbol]; 

                const listItem = document.createElement('li');
                listItem.dataset.token = tokenKey;
                const tradeButtonHTML = '<button class="button trade-button">Trade</button>';

                listItem.innerHTML = `
                    <img src="${coin.image}" alt="${coin.name}" class="bundar">
                    <div class="listing-info">
                        <span class="token-name">${coin.name}</span>
                        <span class="token-ticker">${coinSymbol}</span>
                    </div>
                    <div class="list-item-details">
                        <span class="loser-price-change">${priceChange.toFixed(2)}%</span>
                        ${tradeButtonHTML}
                    </div>
                `;
                topLosersList.appendChild(listItem);
                amountInput.dispatchEvent(new Event('input'));
            });
        }
    } catch (error) {
        console.error('Error fetching top losers:', error);
        if (topLosersList) topLosersList.innerHTML = '<li>Error loading data.</li>';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const selectElement = document.getElementById("fromNetwork");
    const networkIcon = document.getElementById("networkIcon");

    if (selectElement && networkIcon && selectElement.options.length > 0) {
        const initialSelectedOption = selectElement.options[selectElement.selectedIndex];
        if (initialSelectedOption) {
            const initialImgSrc = initialSelectedOption.getAttribute('data-image');
            if (initialImgSrc) networkIcon.src = initialImgSrc;
        }


        selectElement.addEventListener('change', function () {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            if (selectedOption) {
                const imgSrc = selectedOption.getAttribute('data-image');
                if (imgSrc) {
                    networkIcon.src = imgSrc;
                }
            }
        });
    }

    const toSelectElement = document.getElementById("toNetwork");
    const toNetworkIcon = document.getElementById("networkIcon2");

    if (toSelectElement && toNetworkIcon && toSelectElement.options.length > 0) {
         const initialToSelectedOption = toSelectElement.options[toSelectElement.selectedIndex];
        if (initialToSelectedOption) {
            const initialToImgSrc = initialToSelectedOption.getAttribute('data-image');
            if (initialToImgSrc) toNetworkIcon.src = initialToImgSrc;
        }
        
        startPositionsCountdown();

        toSelectElement.addEventListener('change', function () {
            const selectedOption = toSelectElement.options[toSelectElement.selectedIndex]; 
             if (selectedOption) {
                const imgSrc = selectedOption.getAttribute('data-image');
                if (imgSrc) {
                    toNetworkIcon.src = imgSrc;
                }
            }
        });
    }

function highlightSelect(selectElement) {
    selectElement.style.boxShadow = '0 0 10px #00ffa2';
    setTimeout(() => {
        selectElement.style.boxShadow = '';
    }, 1500);
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('trade-button')) {
        const listItem = event.target.closest('li[data-token]');
        if (listItem) {
            const tokenValue = listItem.dataset.token;
            if (tokenValue) {
                toNetworkSelect.value = tokenValue;
                toNetworkSelect.dispatchEvent(new Event('change'));
                highlightSelect(toNetworkSelect);
                if (!fromNetworkSelect.value || fromNetworkSelect.value === tokenValue) {
                    fromNetworkSelect.value = Object.keys(tickerMap).find(t => t !== tokenValue);
                    fromNetworkSelect.dispatchEvent(new Event('change'));
                }
                swapSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
});

    const topGainersCountSelect = document.getElementById('topGainersCountSelect');
    if (topGainersCountSelect) {
        topGainersCountSelect.addEventListener('change', fetchTopGainers);
    }
    fetchTopGainers();

    const topLosersCountSelect = document.getElementById('topLosersCountSelect');
    if (topLosersCountSelect) {
        topLosersCountSelect.addEventListener('change', fetchTopLosers);
    }
    fetchTopLosers();
});

function setPercentage(percent) {
    const fromBalanceText = fromBalanceElement.innerText;
    const balanceMatch = fromBalanceText.match(/([\d.]+)\s+\w+/);
    let balance = 0;
    if (balanceMatch && balanceMatch[1]) {
        balance = parseFloat(balanceMatch[1]);
    } else {
        const numericPart = fromBalanceText.replace(/[^\d.]/g, "");
        balance = parseFloat(numericPart) || 0;
    }

    if (isNaN(balance) || balance <= 0) {
        amountInput.value = "0.00000";
        updateEstimatedAmount();
        return;
    }
    if (percent === 98.99999999999999) {
        const gasFeeElement = document.getElementById('gasFee');
        let gasFee = 0;

        if (gasFeeElement && gasFeeElement.textContent) {
            const gasFeeMatch = gasFeeElement.textContent.match(/[\d.]+/);
            if (gasFeeMatch && gasFeeMatch[0]) {
                gasFee = parseFloat(gasFeeMatch[0]);
            }
        }
        
        const amountAfterFee = balance - gasFee;
        
        amountInput.value = (amountAfterFee > 0 ? amountAfterFee : 0).toFixed(18);
    } else {
        amountInput.value = (balance * percent / 100).toFixed(18);
    }
    amountInput.dispatchEvent(new Event('input'));

    updateEstimatedAmount();
}
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is signed in:", user.uid);
        connectWallet();
        displayOpenPositions(); 
        updateCollateralBalanceDisplay();
        if(connectWalletButton) connectWalletButton.style.display = 'none';
        if(walletStatus) walletStatus.style.display = 'block';
        if(networkAddress) networkAddress.style.display = 'block';

    } else {
        console.log("User is signed out.");
        connectWallet();
        if(connectWalletButton) connectWalletButton.style.display = 'block';
        if(walletStatus) walletStatus.style.display = 'block';
        if(networkAddress) networkAddress.style.display = 'none';
        if (document.getElementById('swapSection')) {
            document.getElementById('swapSection').style.display = 'none';
        }
       
        fromBalanceElement.textContent = 'Sell: N/A';
        toBalanceElement.textContent = 'Buy: N/A';
        priceElement.textContent = 'Price: N/A';
        if(document.getElementById('estimatedAmount')) document.getElementById('estimatedAmount').textContent = '0';
        if(document.getElementById('gasFee')) document.getElementById('gasFee').textContent = 'N/A';
    }
});

let priceChart = null;
let chartTimeRange = '24h';

async function updatePriceChart() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    
    if (!fromNetwork || !toNetwork || fromNetwork === toNetwork) {
        if (priceChart) {
            priceChart.destroy();
            priceChart = null;
        }
        return;
    }

    try {
        const priceHistoryRef = database.ref(`priceHistory/${fromNetwork}_to_${toNetwork}`);
        const snapshot = await priceHistoryRef.once('value');
        const priceHistory = snapshot.val() || {};

        let labels = [];
        let data = [];
        
        const now = new Date();
        let timeBoundary = new Date();
        
        switch(chartTimeRange) {
            case '7d':
                timeBoundary.setDate(now.getDate() - 7);
                break;
            case '30d':
                timeBoundary.setDate(now.getDate() - 30);
                break;
            default:
                timeBoundary.setHours(now.getHours() - 28);
        }
        
        const filteredData = Object.entries(priceHistory)
            .filter(([timestamp]) => new Date(parseInt(timestamp)) >= timeBoundary)
            .sort(([timestampA], [timestampB]) => parseInt(timestampA) - parseInt(timestampB));
        
        filteredData.forEach(([timestamp, entry]) => {
            const date = new Date(parseInt(timestamp));
            
            let label;
            if (chartTimeRange === '24h') {
                label = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else {
                label = date.toLocaleDateString([], {month: 'short', day: 'numeric'});
            }
            
            labels.push(label);
            data.push(parseFloat(entry.conversionRate));
        });

        if (data.length === 0) {
            if (priceChart) {
                priceChart.destroy();
                priceChart = null;
            }
            document.getElementById('priceChart').innerHTML = '<p class="no-data-message">No historical price data available</p>';
            return;
        }

        const ctx = document.getElementById('priceChart').getContext('2d');
        
        if (priceChart) {
            priceChart.data.labels = labels;
            priceChart.data.datasets[0].data = data;
            priceChart.data.datasets[0].label = `${tickerMap[fromNetwork]} / ${tickerMap[toNetwork]}`;
            priceChart.update();
        } else {

            document.getElementById('priceChart').innerHTML = '';
            
            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${tickerMap[fromNetwork]} / ${tickerMap[toNetwork]}`,
                        data: data,
                        borderColor: '#00c6a2',
                        backgroundColor: 'rgba(0, 198, 162, 0.05)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#00c6a2',
                        pointHoverBackgroundColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#fff',
                                font: {
                                    size: 12
                                },
                                boxWidth: 12,
                                padding: 20
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#00c6a2',
                            bodyColor: '#fff',
                            borderColor: '#00c6a2',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return `1 ${tickerMap[fromNetwork]} ‚= ${context.parsed.y.toFixed(18)} ${tickerMap[toNetwork]}`;
                                },
                                title: function(context) {
                                    return context[0].label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#A0A0A0',
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: chartTimeRange === '24h' ? 8 : 10
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#A0A0A0',
                                callback: function(value) {
                                    return parseFloat(value).toFixed(18);
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error updating price chart:', error);
        if (priceChart) {
            priceChart.destroy();
            priceChart = null;
        }
        document.getElementById('priceChart').innerHTML = '<p class="error-message">Error loading chart data</p>';
    }
}

document.getElementById('dailyChart')?.addEventListener('click', () => {
    chartTimeRange = '24h';
    document.querySelectorAll('.chart-controls .button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('dailyChart').classList.add('active');
    updatePriceChart();
});
document.getElementById('weeklyChart')?.addEventListener('click', () => {
    chartTimeRange = '7d';
    document.querySelectorAll('.chart-controls .button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('weeklyChart').classList.add('active');
    updatePriceChart();
});
document.getElementById('monthlyChart')?.addEventListener('click', () => {
    chartTimeRange = '30d';
    document.querySelectorAll('.chart-controls .button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('monthlyChart').classList.add('active');
    updatePriceChart();
});

fromNetworkSelect.addEventListener('change', updatePriceChart);
toNetworkSelect.addEventListener('change', updatePriceChart);

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        updatePriceChart();
        document.getElementById('dailyChart')?.classList.add('active');
    }, 1000);
});

const originalSetPercentage = window.setPercentage;
window.setPercentage = function(percent) {
    const warning = document.getElementById('amountWarning');
    if (warning) {
        warning.remove();
    }
    if (typeof originalSetPercentage === 'function') {
        originalSetPercentage(percent);
    }
};

document.addEventListener("DOMContentLoaded", function() {
    const longButton = document.getElementById('longButton');
    const shortButton = document.getElementById('shortButton');
    const positionsList = document.getElementById('positionsList');

    if(longButton) {
        longButton.addEventListener('click', () => handleFuturesTrade('long'));
    }
    if(shortButton) {
        shortButton.addEventListener('click', () => handleFuturesTrade('short'));
    }
    
    document.getElementById('collateralSelect')?.addEventListener('change', updateCollateralBalanceDisplay);

    document.getElementById('confirmCloseButton')?.addEventListener('click', (e) => {
        const btn = e.target;
        const positionId = btn.dataset.positionId;
        const positionData = JSON.parse(btn.dataset.positionData);
        
        closePosition(positionId, positionData);
        
        document.getElementById('closePositionConfirmationModal').style.display = 'none';
    });

    document.getElementById('cancelCloseButton')?.addEventListener('click', () => {
        document.getElementById('closePositionConfirmationModal').style.display = 'none';
    });
    
    if (positionsList) {
        positionsList.addEventListener('click', (event) => {
            const closeButton = event.target.closest('.close-button');
            if (closeButton) {
                const positionItem = closeButton.closest('.position-item');
                const positionId = closeButton.dataset.positionId;
                const positionData = JSON.parse(positionItem.dataset.positionData);
                prepareCloseConfirmationModal(positionId, positionData);
            }
        });
    }
});

async function handleFuturesTrade(type) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Please connect your wallet first.");
        return;
    }

    const asset = document.getElementById('futuresAssetSelect').value;
    const collateralAsset = document.getElementById('collateralSelect').value;
    const leverage = parseInt(document.getElementById('leverageSelect').value, 10);
    const amount = parseFloat(document.getElementById('futuresAmount').value);
    const futuresResult = document.getElementById('futuresResult');

    const takeProfitInput = document.getElementById('takeProfit');
    const stopLossInput = document.getElementById('stopLoss');
    const takeProfit = parseFloat(takeProfitInput.value);
    const stopLoss = parseFloat(stopLossInput.value);

    if (isNaN(amount) || amount <= 0) {
        futuresResult.textContent = "Please enter a valid amount.";
        return;
    }

    const collateralBalanceRef = database.ref(`wallets/${currentUser.uid}/${collateralAsset}/balance`);
    const balanceSnapshot = await collateralBalanceRef.once('value');
    const balance = parseFloat(balanceSnapshot.val()) || 0;

    if (balance < amount) {
        futuresResult.textContent = `Insufficient ${tickerMap[collateralAsset]} balance.`;
        return;
    }
    
    const { price: entryPrice, fromCache } = await getPriceWithFallback(asset);
    
    if (entryPrice === null) {
        futuresResult.textContent = "Could not fetch entry price from API or cache.";
        return;
    }
    
    if(fromCache) {
        futuresResult.textContent = `Successfully opened a ${type} position on ${tickerMap[asset]} of size ${positionSize.toFixed(2)} USDC.`;
        futuresResult.style.color = "orange";
    } else {
         futuresResult.textContent = "";
    }


    if (type === 'long') {
        if (takeProfit && takeProfit <= entryPrice) {
            futuresResult.textContent = "Take Profit must be higher than the entry price for a long position.";
            return;
        }
        if (stopLoss && stopLoss >= entryPrice) {
            futuresResult.textContent = "Stop Loss must be lower than the entry price for a long position.";
            return;
        }
    } else { 
        if (takeProfit && takeProfit >= entryPrice) {
            futuresResult.textContent = "Take Profit must be lower than the entry price for a short position.";
            return;
        }
        if (stopLoss && stopLoss <= entryPrice) {
            futuresResult.textContent = "Stop Loss must be higher than the entry price for a short position.";
            return;
        }
    }

    const positionSize = amount * leverage;
    const newBalance = balance - amount;
    const positionId = `futures_${Date.now()}`;

    let liquidationPrice = 0;
    const marginRatioForLiquidation = 1.0; 
    if (type === 'long') {
        liquidationPrice = entryPrice * (1 - (marginRatioForLiquidation / leverage));
    } else {
        liquidationPrice = entryPrice * (1 + (marginRatioForLiquidation / leverage));
    }
    liquidationPrice = Math.max(0, liquidationPrice); 
    
    const tradeData = {
        userId: currentUser.uid,
        asset: asset,
        type: type,
        collateral: amount,
        collateralAsset: collateralAsset,
        leverage: leverage,
        positionSize: positionSize,
        entryPrice: entryPrice,
        status: 'open',
        takeProfit: !isNaN(takeProfit) ? takeProfit : null,
        stopLoss: !isNaN(stopLoss) ? stopLoss : null,
        liquidationPrice: liquidationPrice,
    };
    
    const updates = {};
    updates[`wallets/${currentUser.uid}/${collateralAsset}/balance`] = newBalance;
    updates[`futures_positions/${currentUser.uid}/${positionId}`] = tradeData;

    try {
        await database.ref().update(updates);
        if(!fromCache) futuresResult.textContent = `Successfully opened a ${type} position on ${tickerMap[asset]} of size ${positionSize.toFixed(2)} USDC.`;
        updateCollateralBalanceDisplay();
        
        document.getElementById('futuresAmount').value = '';
        takeProfitInput.value = '';
        stopLossInput.value = '';

        const transactionHash = generateTransactionHash();
        const timestamp = new Date().toISOString();
        
        let memo = `Opened ${leverage}x ${type.toUpperCase()} on ${tickerMap[asset]} @ ${entryPrice.toFixed(18)}`;
        if (!isNaN(takeProfit)) memo += ` | TP: ${takeProfit.toFixed(18)}`;
        if (!isNaN(stopLoss)) memo += ` | SL: ${stopLoss.toFixed(18)}`;

        const futuresTransactionData = {
            sender: currentUser.uid,
            recipient: 'hBig6CCUoqanYAIIVKuf1e2o2Ci1',
            network: 'usdc_erc20',
            amount: amount.toFixed(18),
            amountReceived: amount.toFixed(18),
            memo: memo,
            collateralAsset: collateralAsset,
            timestamp: timestamp,
            transactionHash: transactionHash,
            type: 'futures',
            status: 'open',
            asset: asset,
            positionType: type,
            leverage: leverage,
            positionSize: positionSize,
            entryPrice: entryPrice,
            gasFee: '0.00001',
        };
        const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
        await transactionRef.set(futuresTransactionData);

    } catch (error) {
        console.error("Futures trade error:", error);
        futuresResult.textContent = "Failed to open futures position.";
    }
}

function displayOpenPositions() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const positionsRef = database.ref(`futures_positions/${currentUser.uid}`);
    const positionsList = document.getElementById('positionsList');

    positionsRef.orderByChild('status').equalTo('open').on('value', (snapshot) => {
        if (!positionsList) return;

        if (!snapshot.exists()) {
            positionsList.innerHTML = '<li>No open positions.</li>';
            return;
        }

        positionsList.innerHTML = ''; 
        const positions = snapshot.val();

        for (const positionId in positions) {
            const pos = positions[positionId];

            const listItem = document.createElement('li');
            listItem.className = 'position-item';
            listItem.dataset.positionData = JSON.stringify(pos); 
            listItem.id = `position-${positionId}`;
            listItem.innerHTML = `
                <div class="position-details">
                    <p><strong>${tickerMap[pos.asset]} ${pos.type.toUpperCase()} ${pos.leverage}x</strong></p>
                    <p>Size: ${pos.positionSize.toFixed(5)} USD</p>
                    <p>Entry Price: ${pos.entryPrice.toFixed(8)}</p>
                    <p>Mark Price: <span class="current-price-value">Loading...</span></p>
                    <p class="liq-price-info">Liq. Price: <span class="liq-price-value">${pos.liquidationPrice ? pos.liquidationPrice.toFixed(8) : 'N/A'}</span></p>
                    <p class="tp-sl-info">
                        ${pos.takeProfit ? `TP: <span class="pnl-positive">${parseFloat(pos.takeProfit).toFixed(8)}</span>` : ''}
                        ${pos.stopLoss ? `SL: <span class="pnl-negative">${parseFloat(pos.stopLoss).toFixed(8)}</span>` : ''}
                    </p>
                    <p>PnL: <span class="pnl-value">Loading...</span></p>
                </div>
                <button class="close-button" data-position-id="${positionId}">Close</button>
            `;

            positionsList.appendChild(listItem);
        }

        refreshPnlDisplay(); 
    });
}

async function prepareCloseConfirmationModal(positionId, positionData) {
    const { price: currentPrice } = await getPriceWithFallback(positionData.asset);
    if (currentPrice === null) {
        alert("Could not fetch current price from API or cache. Cannot close position now.");
        return;
    }
    
    let pnl = 0;
    const positionValueAtEntry = positionData.positionSize;
    const currentPositionValue = (currentPrice / positionData.entryPrice) * positionValueAtEntry;

    if (positionData.type === 'long') {
        pnl = currentPositionValue - positionValueAtEntry;
    } else {
        pnl = positionValueAtEntry - currentPositionValue;
    }

    document.getElementById('modalCloseAsset').textContent = `${tickerMap[positionData.asset]}`;
    document.getElementById('modalCloseType').textContent = `${positionData.type.toUpperCase()} ${positionData.leverage}x`;
    document.getElementById('modalCloseEntryPrice').textContent = `${positionData.entryPrice.toFixed(18)}`;
    document.getElementById('modalCloseCurrentPrice').textContent = `${currentPrice.toFixed(18)}`;
    document.getElementById('modalClosePnl').textContent = `${pnl.toFixed(18)} ${tickerMap[positionData.collateralAsset]}`;

    const pnlElement = document.getElementById('modalClosePnl');
    pnlElement.className = 'modal-line-item'; 
    pnlElement.classList.add(pnl >= 0 ? 'pnl-positive' : 'pnl-negative');

    const confirmBtn = document.getElementById('confirmCloseButton');
    confirmBtn.dataset.positionId = positionId;
    confirmBtn.dataset.positionData = JSON.stringify(positionData);

    document.getElementById('closePositionConfirmationModal').style.display = 'flex';
}

async function closePosition(positionId, positionData, reason = null) {
    const currentUser = auth.currentUser;
    if (!currentUser || !positionData) return;

    const { price: closingPrice } = await getPriceWithFallback(positionData.asset);
    if (closingPrice === null) {
        alert("Failed to fetch closing price from API or cache. Please try again.");
        return;
    }

    let finalPnl = 0;
    
    if (reason && reason.startsWith('Liquidation:')) {
        finalPnl = -positionData.collateral;
    } else {
        const positionValueAtEntry = positionData.positionSize;
        const finalPositionValue = (closingPrice / positionData.entryPrice) * positionValueAtEntry;

        if (positionData.type === 'long') {
            finalPnl = finalPositionValue - positionValueAtEntry;
        } else {
            finalPnl = positionValueAtEntry - finalPositionValue;
        }
    }

    const amountToReturn = positionData.collateral + finalPnl;

    const collateralBalanceRef = database.ref(`wallets/${currentUser.uid}/${positionData.collateralAsset}/balance`);
    
    try {
        const snapshot = await collateralBalanceRef.once('value');
        const currentBalance = parseFloat(snapshot.val()) || 0;
        const newBalance = currentBalance + Math.max(0, amountToReturn);

        const updates = {};
        updates[`futures_positions/${currentUser.uid}/${positionId}/status`] = 'closed';
        updates[`futures_positions/${currentUser.uid}/${positionId}/closingPrice`] = closingPrice;
        updates[`futures_positions/${currentUser.uid}/${positionId}/pnl`] = finalPnl;
        updates[`wallets/${currentUser.uid}/${positionData.collateralAsset}/balance`] = newBalance;

        await database.ref().update(updates);
        
        if (!reason) { 
           alert(`Position closed!\nFinal PnL: ${finalPnl.toFixed(18)} ${tickerMap[positionData.collateralAsset]}`);
        }
        updateCollateralBalanceDisplay();
        
        const transactionHash = generateTransactionHash();
        const timestamp = new Date().toISOString();
        
        let memo = `Closed ${positionData.leverage}x ${positionData.type.toUpperCase()} on ${tickerMap[positionData.asset]} with PnL: ${finalPnl.toFixed(18)} ${tickerMap[positionData.collateralAsset]}`;
        if (reason) {
            memo = `AUTO-CLOSE: ${reason}. PnL: ${finalPnl.toFixed(18)} ${tickerMap[positionData.collateralAsset]}`;
        }

        const futuresCloseTransactionData = {
            sender: 'hBig6CCUoqanYAIIVKuf1e2o2Ci1',
            recipient: currentUser.uid,
            amount: Math.max(0, amountToReturn),
            amountReceived: `${Math.max(0, amountToReturn)}`,
            network: positionData.collateralAsset,
            memo: memo,
            collateralAsset: positionData.collateralAsset,
            timestamp: timestamp,
            transactionHash: transactionHash,
            type: 'futures',
            status: 'closed',
            positionId: positionId,
            pnl: finalPnl,
            closingPrice: closingPrice,
            gasFee: '0.00001',
        };
        const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
        await transactionRef.set(futuresCloseTransactionData);

    } catch (error) {
        console.error("Error closing position:", error);
        alert("An error occurred while closing the position.");
    }
}

let positionsCountdownTimer = 1;
let positionsRefreshInterval;

function startPositionsCountdown() {
    clearInterval(positionsRefreshInterval); 
    const countdownElement = document.getElementById('positionsCountdown');

    positionsRefreshInterval = setInterval(() => {
        if (auth.currentUser && countdownElement) {
            const positionItems = document.querySelectorAll('.position-item');
            if (positionItems.length > 0 && positionItems[0].dataset.positionData) {
                countdownElement.textContent = `countdown: ${positionsCountdownTimer}s`;
                positionsCountdownTimer--;

                if (positionsCountdownTimer < 0) {
                    refreshPnlDisplay();
                    positionsCountdownTimer = 1; 
                }
            } else {
                countdownElement.textContent = ''; 
            }
        } else if (countdownElement) {
            countdownElement.textContent = '';
        }
    }, 1000);
}

async function refreshPnlDisplay() {
    const positionItems = document.querySelectorAll('.position-item');
    if (positionItems.length === 0 || !positionItems[0].dataset.positionData) return;

    for (const item of positionItems) {
        if (item.classList.contains('closing')) continue; 

        const pos = JSON.parse(item.dataset.positionData);
        const positionId = item.id.replace('position-', '');
        
        const { price: currentPrice } = await getPriceWithFallback(pos.asset);
        if (currentPrice === null) continue;

        let pnl = 0;
        const positionValueAtEntry = pos.positionSize;
        const currentPositionValue = (currentPrice / pos.entryPrice) * positionValueAtEntry;

        if (pos.type === 'long') {
            pnl = currentPositionValue - positionValueAtEntry;
        } else {
            pnl = positionValueAtEntry - currentPositionValue;
        }

        const pnlClass = pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlValueSpan = item.querySelector('.pnl-value');
        const currentPriceSpan = item.querySelector('.current-price-value');

        if(currentPriceSpan) currentPriceSpan.textContent = currentPrice.toFixed(8);
        if(pnlValueSpan) {
            pnlValueSpan.textContent = `${pnl.toFixed(8)} ${tickerMap[pos.collateralAsset]}`;
            pnlValueSpan.className = `pnl-value ${pnlClass}`;
        }
        
        let triggerReason = null;
        if (pos.liquidationPrice) {
            if (pos.type === 'long' && currentPrice <= pos.liquidationPrice) {
                triggerReason = `Liquidation: Price hit ${pos.liquidationPrice.toFixed(8)}`;
            } else if (pos.type === 'short' && currentPrice >= pos.liquidationPrice) {
                triggerReason = `Liquidation: Price hit ${pos.liquidationPrice.toFixed(8)}`;
            }
        }
        
        if (!triggerReason) {
            if (pos.takeProfit && pos.type === 'long' && currentPrice >= pos.takeProfit) {
                triggerReason = `Take Profit hit at ${pos.takeProfit.toFixed(8)}`;
            } else if (pos.stopLoss && pos.type === 'long' && currentPrice <= pos.stopLoss) {
                triggerReason = `Stop Loss hit at ${pos.stopLoss.toFixed(8)}`;
            } else if (pos.takeProfit && pos.type === 'short' && currentPrice <= pos.takeProfit) {
                triggerReason = `Take Profit hit at ${pos.takeProfit.toFixed(8)}`;
            } else if (pos.stopLoss && pos.type === 'short' && currentPrice >= pos.stopLoss) {
                triggerReason = `Stop Loss hit at ${pos.stopLoss.toFixed(8)}`;
            }
        }

        if (triggerReason) {
            item.classList.add('closing'); 
            alert(`Position for ${tickerMap[pos.asset]} is being automatically closed. Reason: ${triggerReason}`);
            closePosition(positionId, pos, triggerReason); 
        }
    }
}

async function updateCollateralBalanceDisplay() {
    const currentUser = auth.currentUser;
    const displayElement = document.getElementById('collateralBalanceDisplay');
    if (!currentUser || !displayElement) {
        if (displayElement) displayElement.textContent = 'Balance: N/A';
        return;
    }

    const collateralAsset = document.getElementById('collateralSelect').value;
    const ticker = tickerMap[collateralAsset] || '';
    const balanceRef = database.ref(`wallets/${currentUser.uid}/${collateralAsset}/balance`);

    try {
        const snapshot = await balanceRef.once('value');
        const balance = parseFloat(snapshot.val()) || 0;
        displayElement.textContent = `Balance: ${balance.toFixed(18)} ${ticker}`;
    } catch (error) {
        console.error('Error fetching collateral balance:', error);
        displayElement.textContent = 'Balance: Error';
    }
}

function formatRelativeTime(isoString) {
    const dt = new Date(isoString);
    const now = new Date();
    let diffMs = now - dt;
    if (diffMs < 0) diffMs = 0;
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function obfuscateUserId(uid) {
    if (!uid) return 'unknown';
    return uid.slice(0, 6) + '...';
}

function renderTradeEntry(trade) {
    const container = document.createElement('div');
    container.style.borderBottom = '1px solid #333';
    container.style.padding = '8px 6px';
    container.style.display = 'flex';
    container.style.justifyContent = 'space-between';
    container.style.fontSize = '13px';
    container.style.gap = '10px';
    container.classList.add('live-trade-entry');
    const pair = trade.network || 'N/A';
    const fromAmount = trade.amount || '0';
    const toAmount = trade.amountReceived || trade.result || '0';
    const priceDisplay = trade.priceDisplay || trade.price || '';

    const left = document.createElement('div');
    left.innerHTML = `<strong>${pair}</strong>`;

    const middle = document.createElement('div');
    middle.innerHTML = `
        <div>From: ${parseFloat(fromAmount).toFixed(4)}</div>
        <div>To: ${parseFloat(toAmount).toFixed(4)}</div>
        <div style="font-size:11px; color:#aaa;">Rate: ${priceDisplay}</div>
    `;

    const right = document.createElement('div');
    right.style.textAlign = 'right';
    const user = obfuscateUserId(trade.sender || trade.recipient || 'anon');
    const timeAgo = formatRelativeTime(trade.timestamp || new Date().toISOString());
    right.innerHTML = `
        <div>Address: <span style="color:#00ffa2;">${user}</span></div>
        <div style="font-size:11px; color:#bbb;">${timeAgo}</div>
    `;

    container.appendChild(left);
    container.appendChild(middle);
    container.appendChild(right);

    return container;
}

const renderedTradeIds = new Set();
let liveTrades = [];
let filterDebounceTimer = null;

function initLiveTradeFeed() {
    const feedEl = document.getElementById('liveTradeFeed');
    const pairFilter = document.getElementById('liveTradePairFilter');
    const minAmountInput = document.getElementById('liveTradeMinAmount');

    if (!feedEl) return;

    const tradesRef = database.ref('transactions/allnetwork');

    function passesFilter(trade) {
        const selectedPair = pairFilter?.value || 'all';
        if (selectedPair !== 'all') {
            if (!trade.network || trade.network.toLowerCase() !== selectedPair.toLowerCase()) {
                return false;
            }
        }
        const minAmount = parseFloat(minAmountInput?.value) || 0;
        const amount = parseFloat(trade.amount) || 0;
        if (amount < minAmount) return false;
        return true;
    }

    function renderAll() {
        feedEl.innerHTML = '';
        renderedTradeIds.clear();
        const toShow = liveTrades.filter(({ trade }) => passesFilter(trade));
        toShow.forEach(({ key, trade }) => {
            const entry = renderTradeEntry(trade);
            entry.setAttribute('data-key', key);
            feedEl.appendChild(entry);
            renderedTradeIds.add(key);
        });
    }
    function insertTrade(key, trade) {
        if (liveTrades.some(item => item.key === key)) return;
        const ts = new Date(trade.timestamp).getTime();
        let inserted = false;
        for (let i = 0; i < liveTrades.length; i++) {
            const existingTs = new Date(liveTrades[i].trade.timestamp).getTime();
            if (ts > existingTs) {
                liveTrades.splice(i, 0, { key, trade });
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            liveTrades.push({ key, trade });
        }
        if (liveTrades.length > 300) liveTrades.pop();
    }

tradesRef.orderByChild('type').equalTo('swap').limitToLast(200).on('child_added', snapshot => {
    const key = snapshot.key;
    if (!key) return;
    const trade = snapshot.val();
    if (!trade) return;

const amount = parseFloat(trade.amount) || 0;
const network = trade.network || 'unknown';
let usdPerUnit = 0;
if (trade.fromPriceUSD) {
    usdPerUnit = parseFloat(trade.fromPriceUSD);
} else if (trade.toPriceUSD) {
    usdPerUnit = parseFloat(trade.toPriceUSD);
}
swapVolumeBuffer.push({
    timestamp: new Date(trade.timestamp).getTime(),
    amount,
    network,
    usdPerUnit
});

updateVolumeDisplay();

    insertTrade(key, trade);
    if (passesFilter(trade)) {
        const entry = renderTradeEntry(trade);
        entry.setAttribute('data-key', key);
        feedEl.prepend(entry);
        renderedTradeIds.add(key);
        entry.classList.add('new');
        setTimeout(() => entry.classList.remove('new'), 1200);
        while (feedEl.children.length > 200) {
            feedEl.removeChild(feedEl.lastChild);
        }
    }
});


    function scheduleRender() {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(() => {
        renderAll();
        updateVolumeDisplay();
    }, 200);
}


    if (pairFilter) pairFilter.addEventListener('change', scheduleRender);
    if (minAmountInput) minAmountInput.addEventListener('input', scheduleRender);

    tradesRef.orderByChild('type').equalTo('swap').limitToLast(200).once('value', snap => {
        liveTrades = [];
        snap.forEach(c => {
            const trade = c.val();
            if (!trade) return;
            liveTrades.push({ key: c.key, trade });
        });
        liveTrades.sort((a, b) => new Date(b.trade.timestamp) - new Date(a.trade.timestamp));
        renderAll();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLiveTradeFeed();
});

const VOLUME_WINDOWS = {
    '1m': 1 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
};

let swapVolumeBuffer = [];

function formatUSD(num) {
    if (isNaN(num) || num <= 0) return '$0.00';
    return '$' + Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeVolume(windowMs, pair = 'all') {
    const now = Date.now();
    return swapVolumeBuffer
        .filter(item => now - item.timestamp <= windowMs)
        .filter(item => {
            if (pair === 'all') return true;
            return item.network && item.network.toLowerCase() === pair.toLowerCase();
        })
        .reduce((sum, it) => sum + (it.amount * (it.usdPerUnit || 0)), 0);
}

function updateVolumeDisplay() {
    const selectedPair = document.getElementById('liveTradePairFilter')?.value || 'all';
    const maxWindow = VOLUME_WINDOWS['24h'];
    const now = Date.now();
    swapVolumeBuffer = swapVolumeBuffer.filter(item => now - item.timestamp <= maxWindow);
    const v1m = computeVolume(VOLUME_WINDOWS['1m'], 'all');
    const v5m = computeVolume(VOLUME_WINDOWS['5m'], 'all');
    const v1h = computeVolume(VOLUME_WINDOWS['1h'], 'all');
    const v24h = computeVolume(VOLUME_WINDOWS['24h'], 'all');
    const pair5m = computeVolume(VOLUME_WINDOWS['5m'], selectedPair !== 'all' ? selectedPair : 'all');

    const el1m = document.getElementById('volume_1m');
    const el5m = document.getElementById('volume_5m');
    const el1h = document.getElementById('volume_1h');
    const el24h = document.getElementById('volume_24h');
    const elPair = document.getElementById('volumePair');

    if (el1m) el1m.textContent = formatUSD(v1m);
    if (el5m) el5m.textContent = formatUSD(v5m);
    if (el1h) el1h.textContent = formatUSD(v1h);
    if (el24h) el24h.textContent = formatUSD(v24h);
    if (elPair) elPair.textContent = formatUSD(pair5m);
}


setInterval(updateVolumeDisplay, 10 * 1000);
