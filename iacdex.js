const firebaseConfig = {
    apiKey: "AIzaSyCtvxvFSXOT0fkRpl84U6LTD8xg8rGWrV8",
    authDomain: "web3-iac-wallet.firebaseapp.com",
    databaseURL: "https://web3-iac-wallet-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web3-iac-wallet",
    storageBucket: "web3-iac-wallet.firebasestorage.app",
    messagingSenderId: "462702808978",
    appId: "1:462702808978:web:843402ceb14d9eb026bb4b",
    measurementId: "G-H8W6VMJJPH"
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

const tickerMap = {
    eth: 'ETH',
    lido: 'LDO',
    steth: 'stETH',
    weth: 'ETH',
    usdc_erc20: 'USDC',
    usdt_erc20: 'USDT',
    optimism_eth: 'ETH',
    optimism: 'OP',
};

const apiTokenMap = {
    eth: 'ethereum',
    lido: 'lido-dao',
    steth: 'staked-ether',
    weth: 'ethereum',
    usdc_erc20: 'usd-coin',
    usdt_erc20: 'tether',
    optimism_eth: 'ethereum',
    optimism: 'optimism',
};

async function fetchRealPrice(apiTokenId) {
    if (apiTokenId === '' || apiTokenId === '') { 
        return Promise.resolve(2.50);
    }

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${apiTokenId}&vs_currencies=usd`);
        if (!response.ok) {
            console.error(`CoinGecko API request failed for ${apiTokenId}: ${response.status}`);
            return 0; // Fallback jika API error
        }
        const data = await response.json();
        if (data[apiTokenId] && data[apiTokenId].usd) {
            return data[apiTokenId].usd;
        } else {
            console.warn(`Price not found for ${apiTokenId} in CoinGecko API response.`);
            return 0;
        }
    } catch (error) {
        console.error(`Error fetching price for ${apiTokenId} from CoinGecko:`, error);
        return 0;
    }
}

async function updatePrice() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork && toNetwork) {
        if (fromNetwork === toNetwork) {
           
            return;
        }

        const fromTokenApiId = apiTokenMap[fromNetwork];
        const toTokenApiId = apiTokenMap[toNetwork];

        let fromPriceUSD, toPriceUSD;
        try {
            // Fetch both prices in parallel
            [fromPriceUSD, toPriceUSD] = await Promise.all([
                fetchRealPrice(fromTokenApiId),
                fetchRealPrice(toTokenApiId)
            ]);
        } catch (error) {
            console.error("Error fetching one or more prices during updatePrice:", error);
            priceElement.textContent = `Price: Error fetching prices`;
            if (document.getElementById('estimatedAmount')) { // Check if element exists
                 document.getElementById('estimatedAmount').textContent = `Estimated: Error`;
            }
            return;
        }


        if (typeof fromPriceUSD === 'number' && typeof toPriceUSD === 'number' && toPriceUSD !== 0) {
            const conversionRate = (fromPriceUSD / toPriceUSD).toFixed(6);
            priceElement.textContent = `Price : 1 ${tickerMap[fromNetwork]} = ${conversionRate} ${tickerMap[toNetwork]}`;
            
            const priceRef = firebase.database().ref(`price/${fromNetwork}_to_${toNetwork}`);
            priceRef.set({
                fromPriceUSD: fromPriceUSD.toString(),
                toPriceUSD: toPriceUSD.toString(),
                conversionRate: conversionRate,
                timestamp: new Date().toISOString()
            });
            
            const amount = parseFloat(amountInput.value);
            if (!isNaN(amount) && amount > 0) {
                const estimatedAmount = (amount * parseFloat(conversionRate)).toFixed(10); // Use parseFloat for conversionRate
                if (document.getElementById('estimatedAmount')) {
                     document.getElementById('estimatedAmount').textContent = `Estimated: ${estimatedAmount} ${tickerMap[toNetwork]}`;
                }
            } else {
                 if (document.getElementById('estimatedAmount')) {
                    document.getElementById('estimatedAmount').textContent = `Estimated: 0.00`;
                 }
            }
        } else {
            priceElement.textContent = `Price: N/A (RPC Down)`;
            if (document.getElementById('estimatedAmount')) {
                document.getElementById('estimatedAmount').textContent = `Estimated: 0.00`;
            }
        }

        const now = new Date();
        const formattedTime = now.toLocaleTimeString();
        lastUpdateElement.textContent = `Last Updated: ${formattedTime}`;
    }
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
            fromBalanceElement.textContent = `You're Selling ${parseFloat(balance).toFixed(5)} ${tickerMap[fromNetwork]}`;
        });
    } else {
        fromBalanceElement.textContent = `You're Selling N/A`;
    }

    if (toNetwork && tickerMap[toNetwork]) {
        const toBalanceRef = database.ref(`wallets/${userId}/${toNetwork}/balance`);
        toBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            toBalanceElement.textContent = `You're Buying ${parseFloat(balance).toFixed(5)} ${tickerMap[toNetwork]}`;
        });
    } else {
        toBalanceElement.textContent = `You're Buying N/A`;
    }
}

let countdownTimer = 20;
function startCountdown() {
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = `Next price update in: ${countdownTimer}s`;
        countdownTimer--;
        if (countdownTimer < 0) {
            clearInterval(countdownInterval);
            updatePrice();
            updateGasFee();
            countdownTimer = 20;
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


amountInput.addEventListener('input', () => {
    updateEstimatedAmount();
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
    
const noRouter = (fromNetwork === 'optimism_eth' && (toNetwork === 'steth' || toNetwork === 'eth')) ||
                 (fromNetwork === 'eth' && (toNetwork === 'op' || toNetwork === 'optimism_eth'));

    let fromPriceForTx, toPriceForTx, conversionRateForTx;
    if (noRouter) {
        const proceed = confirm(`Router not available for ${tickerMap[fromNetwork]} → ${tickerMap[toNetwork]}. Price will be marked as "No Router". Do you want to continue to the bridge page?`);
        if (proceed) {
            const transactionHash = generateTransactionHash();
            const timestamp = new Date().toISOString();
            const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);
            const transactionData = {
                network: `${fromNetwork} to ${toNetwork}`,
                sender: currentUser.uid,
                recipient: currentUser.uid, // Assuming swap is to self, different address for bridge?
                amount: amount.toFixed(10),
                gasFee: "0", // No gas fee calculation for bridge path here
                priceDisplay: "No Router", // For display
                fromPriceUSD: "N/A",
                toPriceUSD: "N/A",
                conversionRate: "N/A",
                timestamp: timestamp,
                transactionHash: transactionHash,
                type: "bridge_redirect" // More specific type
            };
            transactionRef.set(transactionData).then(() => {
                // Consider passing parameters to the bridge page if needed
                window.location.href = "https://infoardropcrypto.github.io/web3test/iacbridge.html";
            }).catch(error => console.error("Firebase error on bridge transaction:", error));
        } else {
            alert('Swap canceled.');
        }
        return;
    }

    // If router exists, fetch current prices for the swap calculation
    const fromTokenApiId = apiTokenMap[fromNetwork];
    const toTokenApiId = apiTokenMap[toNetwork];

    try {
        [fromPriceForTx, toPriceForTx] = await Promise.all([
            fetchRealPrice(fromTokenApiId),
            fetchRealPrice(toTokenApiId)
        ]);
    } catch (error) {
        console.error("Error fetching prices for swap:", error);
        alert('Error fetching current prices for the swap. Please try again.');
        return;
    }

    if (typeof fromPriceForTx !== 'number' || typeof toPriceForTx !== 'number' || toPriceForTx === 0) {
        alert('Could not retrieve valid prices to perform the swap. Please try again.');
        return;
    }
    conversionRateForTx = fromPriceForTx / toPriceForTx;
    const amountInToNetwork = amount * conversionRateForTx;


    const fromBalanceRef = database.ref(`wallets/${currentUser.uid}/${fromNetwork}/balance`);
    const gasFeeRef = database.ref(`gasprice/${fromNetwork}/gasFee`); // Assumes gas is in 'fromNetwork' token

    // Use Promise.all to get gas fee and balance concurrently
    Promise.all([gasFeeRef.once('value'), fromBalanceRef.once('value')]).then(([gasSnapshot, balanceSnapshot]) => {
        const gasFee = parseFloat(gasSnapshot.val()) || 0;
        const fromBalance = parseFloat(balanceSnapshot.val()) || 0;

        if (fromBalance < (amount + gasFee)) {
            alert(`Insufficient ${tickerMap[fromNetwork]} balance to cover the swap amount and gas fee. Needed: ${(amount + gasFee).toFixed(5)}, Have: ${fromBalance.toFixed(5)}`);
            return;
        }

        const confirmMessage = `You are about to swap ${amount.toFixed(5)} ${tickerMap[fromNetwork]} for an estimated ${amountInToNetwork.toFixed(5)} ${tickerMap[toNetwork]}. \nGas fee: ${gasFee.toFixed(5)} ${tickerMap[fromNetwork]}. \n1 ${tickerMap[fromNetwork]} ≈ ${conversionRateForTx.toFixed(6)} ${tickerMap[toNetwork]}\nDo you want to proceed?`;
        if (!confirm(confirmMessage)) {
            alert('Swap canceled.');
            return;
        }

        const toBalanceRef = database.ref(`wallets/${currentUser.uid}/${toNetwork}/balance`);
        toBalanceRef.once('value').then(toSnapshot => {
            const toBalance = parseFloat(toSnapshot.val()) || 0;
            const newToBalance = toBalance + amountInToNetwork;
            const newFromBalance = fromBalance - amount - gasFee;

            // Perform Firebase updates
            const updates = {};
            updates[`wallets/${currentUser.uid}/${fromNetwork}/balance`] = newFromBalance;
            updates[`wallets/${currentUser.uid}/${toNetwork}/balance`] = newToBalance;

            database.ref().update(updates).then(() => {
                alert('Swap successful!');
                updateBalances(); // Refresh displayed balances

                const transactionHash = generateTransactionHash();
                const timestamp = new Date().toISOString();
                // Store transaction with detailed price info
                const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);
                const transactionData = {
    network: `${fromNetwork} to ${toNetwork}`,
    sender: currentUser.uid,
    recipient: currentUser.uid,
    
    // Duplikasikan ke format yang dikenali explorer.js
    amount: amount.toFixed(10), // total dikirim
    result: amountInToNetwork.toFixed(10), // hasil swap

    // Tetap simpan versi lengkap juga
    amountSent: amount.toFixed(10),
    amountReceived: amountInToNetwork.toFixed(10),

    gasFee: gasFee.toFixed(10),
    fromPriceUSD: fromPriceForTx.toFixed(6),
    toPriceUSD: toPriceForTx.toFixed(6),
    price: `1 ${tickerMap[fromNetwork]} = ${conversionRateForTx.toFixed(6)} ${tickerMap[toNetwork]}`,
    
    fromTokenPriceUSD: fromPriceForTx.toFixed(6),
    toTokenPriceUSD: toPriceForTx.toFixed(6),
    conversionRateUsed: conversionRateForTx.toFixed(8),
    priceDisplay: `1 ${tickerMap[fromNetwork]} = ${conversionRateForTx.toFixed(6)} ${tickerMap[toNetwork]}`,
    
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
});


function checkRouterAvailability() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const routerWarning = document.getElementById('routerWarning');

    // Simplified: if either is 'ac' or 'wac' and the other is 'eth' or 'optimism_eth', no direct router.
    // This definition should match the one in the swapButton logic.
    const noRouter = (fromNetwork === 'eth' && (toNetwork === 'ac' || toNetwork === 'wac' || toNetwork === 'optimism_eth')) ||
                     ((fromNetwork === 'wac' || fromNetwork === 'ac') && (toNetwork === 'eth' || toNetwork === 'optimism_eth'));


    if (routerWarning) {
      routerWarning.style.display = noRouter ? 'block' : 'none';
    }
}

// Initial calls on page load
if (document.getElementById('routerWarning')) { // Check if element exists
    checkRouterAvailability();
}
startCountdown();


async function updateEstimatedAmount() { // Made async
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);
    const estimatedAmountEl = document.getElementById('estimatedAmount');

    if (!estimatedAmountEl) return; // Element not found

    if (fromNetwork && toNetwork && !isNaN(amount) && amount > 0) {
        if (fromNetwork === toNetwork) {
            estimatedAmountEl.textContent = "Estimated: Invalid pair";
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
            estimatedAmountEl.textContent = "Estimated: Error fetching price";
            return;
        }

        if (typeof fromPriceUSD === 'number' && typeof toPriceUSD === 'number' && toPriceUSD > 0) {
            const conversionRate = fromPriceUSD / toPriceUSD;
            const estimatedOutput = (amount * conversionRate).toFixed(10); // Using 10 decimal places for estimation
            estimatedAmountEl.textContent = `Estimated: ${estimatedOutput} ${tickerMap[toNetwork]}`;
        } else {
            estimatedAmountEl.textContent = "Estimated: N/A (price unavailable)";
        }
    } else {
        estimatedAmountEl.textContent = "Estimated: 0.00";
    }
}


// Connect Wallet functionality
if (connectWalletButton) {
    connectWalletButton.addEventListener('click', () => {
        // Implement actual wallet connection logic if using Web3 providers like MetaMask
        // For Firebase auth, this would typically be firebase.auth().signInWithPopup(...) or similar
        // For this example, we assume Firebase auth handles user session.
        // If connectWallet is just to trigger UI changes for an already auth'd user:
        if (auth.currentUser) {
            connectWallet(); // Updates UI based on existing auth state
            connectWalletButton.style.display = 'none'; // Hide button after "connecting"
             if(walletStatus) walletStatus.style.display = 'block'; // Show status
             if(networkAddress) networkAddress.style.display = 'block'; // Show address
        } else {
            // Here you might trigger Firebase sign-in
            alert("Wallet connection via Firebase Auth would be triggered here. For now, assuming manual sign-in via Firebase console for testing backend logic.");
            // Example: auth.signInAnonymously().catch(error => console.error(error));
            // Or: auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(error => console.error(error));
        }
    });
}


// Update address and other info when networkSelect (main network for wallet view) changes
if (networkSelect) {
    networkSelect.addEventListener('change', () => {
        if (auth.currentUser) { // Only if user is connected
            connectWallet(); // Re-fetch/update wallet info for the new selected network
        }
    });
}


function updateGasFee() {
    const selectedFromNetwork = fromNetworkSelect.value; // Gas fee is based on the 'from' network for the swap
    const gasFeeElement = document.getElementById('gasFee');

    if (!gasFeeElement) return; // Element not found
    if (!selectedFromNetwork || !tickerMap[selectedFromNetwork]) {
        gasFeeElement.textContent = 'N/A';
        return;
    }

    const gasFeeRef = database.ref(`gasprice/${selectedFromNetwork}/gasFee`);
    gasFeeRef.once('value')
        .then(snapshot => {
            const gasFee = parseFloat(snapshot.val()) || 0;
            const ticker = tickerMap[selectedFromNetwork] || '';
            gasFeeElement.textContent = `${gasFee.toFixed(6)} ${ticker}`;
        })
        .catch(error => {
            console.error('Error fetching gas fee:', error);
            gasFeeElement.textContent = 'N/A';
        });
}

// Add event listeners for router availability check
fromNetworkSelect.addEventListener('change', checkRouterAvailability);
toNetworkSelect.addEventListener('change', checkRouterAvailability);

// Initial call to update gas fee when page loads
updateGasFee();

if (autoSwitchButton) {
    autoSwitchButton.addEventListener('click', () => {
        const fromNetwork = fromNetworkSelect.value;
        const toNetwork = toNetworkSelect.value;

        if (fromNetwork && toNetwork) {
            fromNetworkSelect.value = toNetwork;
            toNetworkSelect.value = fromNetwork;

            // Trigger change events to ensure all updates propagate
            fromNetworkSelect.dispatchEvent(new Event('change'));
            // toNetworkSelect.dispatchEvent(new Event('change')); // fromNetwork change will trigger toNetwork adjustment if they become same.
                                                            // Then its own change event will fire.
                                                            // Explicitly triggering both might be redundant or cause quick successive updates.
                                                            // Test which behavior is smoother.
                                                            // For safety, let's trigger both but be mindful of potential double updates.
            toNetworkSelect.dispatchEvent(new Event('change'));


            // Explicitly call updates after switching
            updateBalances();
            updatePrice(); // async
            updateEstimatedAmount(); // async
            updateGasFee();
            checkRouterAvailability();
        } else {
            alert('Please select both networks before switching.');
        }
    });
}
    
// This logic for 'networkSelect' influencing 'fromNetworkSelect' might be for a different UI section.
// If 'networkSelect' is the primary wallet network and 'fromNetworkSelect' is for swaps,
// their interaction needs to be clearly defined.
// Assuming 'allNetworks' was a global variable you had:
/*
const allNetworks = { // Example - this should be defined based on your available networks
    eth: "Ethereum",
    ac: "Ac Network",
    wac: "Wrapped AC",
    optimism_eth: "Optimism Network ETH",
    optimism: "Optimism OP",
    // ... other networks
};

if (networkSelect && fromNetworkSelect && typeof allNetworks !== 'undefined') {
    networkSelect.addEventListener('change', () => {
        const selectedNetwork = networkSelect.value;
        
        // Store current fromNetwork and toNetwork values if needed to preserve user's swap selection
        const currentFromSwap = fromNetworkSelect.value;
        const currentToSwap = toNetworkSelect.value;

        // Repopulate fromNetwork based on allNetworks (this seems to reset the swap From)
        // This might not be desired if 'networkSelect' is for general wallet view
        // and 'fromNetworkSelect' is specific to the swap interface.
        // Consider if this is the intended behavior.
        // fromNetworkSelect.innerHTML = ''; // Clear existing options
        // for (const [value, name] of Object.entries(allNetworks)) {
        //     const option = document.createElement('option');
        //     option.value = value;
        //     option.textContent = name;
        //     fromNetworkSelect.appendChild(option);
        // }

        // If the intention is to set the default "from" for a swap when main network changes:
        if (allNetworks[selectedNetwork]) { // Check if selectedNetwork is a valid key in allNetworks
             fromNetworkSelect.value = selectedNetwork; // This will trigger fromNetworkSelect's change event
        }
        // Potentially restore or adjust toNetwork here if needed
        // fromNetworkSelect.dispatchEvent(new Event('change')); // Ensure updates propagate
    });
}
*/
    
function generateTransactionHash() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'; // Corrected: 'x' and 'z'
    let hash = ''; // Often hashes are prefixed with 0x
    for (let i = 0; i < 64; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

// DOMContentLoaded listeners for network icons
document.addEventListener("DOMContentLoaded", function () {
    const selectElement = document.getElementById("fromNetwork");
    const networkIcon = document.getElementById("networkIcon");

    if (selectElement && networkIcon && selectElement.options.length > 0) { // Add checks
        const initialSelectedOption = selectElement.options[selectElement.selectedIndex];
        if (initialSelectedOption) { // Check if an option is indeed selected
            const initialImgSrc = initialSelectedOption.getAttribute('data-image');
            if (initialImgSrc) networkIcon.src = initialImgSrc;
        }


        selectElement.addEventListener('change', function () {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            if (selectedOption) { // Check again
                const imgSrc = selectedOption.getAttribute('data-image');
                if (imgSrc) {
                    networkIcon.src = imgSrc;
                }
            }
        });
    }

    const toSelectElement = document.getElementById("toNetwork");
    const toNetworkIcon = document.getElementById("networkIcon2");

    if (toSelectElement && toNetworkIcon && toSelectElement.options.length > 0) { // Add checks
         const initialToSelectedOption = toSelectElement.options[toSelectElement.selectedIndex];
        if (initialToSelectedOption) {
            const initialToImgSrc = initialToSelectedOption.getAttribute('data-image');
            if (initialToImgSrc) toNetworkIcon.src = initialToImgSrc;
        }

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
});
        
function setPercentage(percent) {
    const fromBalanceText = fromBalanceElement.innerText; // e.g., "You're Selling 123.45 AC"
    // Extract the numeric part more robustly
    const balanceMatch = fromBalanceText.match(/([\d.]+)\s+\w+/); 
    let balance = 0;
    if (balanceMatch && balanceMatch[1]) {
        balance = parseFloat(balanceMatch[1]);
    } else {
        // Fallback or secondary attempt if the regex fails or text format is different
        const numericPart = fromBalanceText.replace(/[^\d.]/g, "");
        balance = parseFloat(numericPart) || 0;
    }
    
    if (!isNaN(balance) && balance > 0) {
        amountInput.value = (balance * percent / 100).toFixed(5); // Set to 5 decimal places
        updateEstimatedAmount(); // Update the estimated "to" amount after setting "from" amount
    } else {
        amountInput.value = "0.00000";
        updateEstimatedAmount(); // Still update, likely to show 0 or N/A
    }
}

// Firebase Auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is signed in:", user.uid);
        connectWallet(); // Update UI for signed-in user
        if(connectWalletButton) connectWalletButton.style.display = 'none';
        if(walletStatus) walletStatus.style.display = 'block';
        if(networkAddress) networkAddress.style.display = 'block';

    } else {
        console.log("User is signed out.");
        connectWallet(); // Update UI for signed-out user (e.g., show "Not Connected")
        if(connectWalletButton) connectWalletButton.style.display = 'block';
        if(walletStatus) walletStatus.style.display = 'block'; // Or hide if only for connected state
        if(networkAddress) networkAddress.style.display = 'none';
        if (document.getElementById('swapSection')) {
            document.getElementById('swapSection').style.display = 'none';
        }
        // Clear sensitive UI elements
        fromBalanceElement.textContent = 'Sell: N/A';
        toBalanceElement.textContent = 'Buy: N/A';
        priceElement.textContent = 'Price: N/A';
        if(document.getElementById('estimatedAmount')) document.getElementById('estimatedAmount').textContent = 'Estimated: 0.00';
        if(document.getElementById('gasFee')) document.getElementById('gasFee').textContent = 'N/A';


    }
});
