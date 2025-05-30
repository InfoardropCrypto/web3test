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

const tickerMap = {
    ac: 'AC',
    wac: 'WAC',
    eth: 'ETH',
    lido: 'LDO',
    steth: 'stETH',
    weth: 'ETH',
    usdc_erc20: 'USDC',
    usdt_erc20: 'USDT',
    optimism_eth: 'ETH',
};

const priceRanges = {
    eth: [1510, 1620],
    ac: [1, 1.2, 1.4],
    wac: [1, 1.2, 1.4],
    lido: [0.8, 0.5],
    steth: [1800, 1900, 2000],
    weth: [1500, 1600, 1620],
    usdc_erc20: [1, 1],
    usdt_erc20: [0.9999, 1],
    optimism_eth: [1500, 1620],
};

function getRandomPrice(token) {
    const [min, max] = priceRanges[token];
    return (Math.random() * (max - min) + min).toFixed(15);
}

// Fungsi untuk mengambil harga dari Firebase jika diperlukan
function fetchPrices() {
    Object.keys(priceRanges).forEach(token => {
        const priceRef = firebase.database().ref(`price/${fromNetwork}_to_${toNetwork}`);
        priceRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log(`Price for ${toNetwork}: $${data.price}`);
            } else {
                console.log(`No price data for ${token}`);
            }
        });
    });
}

function updatePrice() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork && toNetwork) {
        if (fromNetwork === toNetwork) {
            alert('Cannot swap between the same network.');
            return;
        }

        const fromPrice = getRandomPrice(fromNetwork);
        const toPrice = getRandomPrice(toNetwork);

        if (toPrice !== '0') {
            const conversionRate = (fromPrice / toPrice).toFixed(6);
            priceElement.textContent = `Price : 1 ${tickerMap[fromNetwork]} =  ${conversionRate} ${tickerMap[toNetwork]}`;
            
            const priceRef = firebase.database().ref(`price/${fromNetwork}_to_${toNetwork}`);
            priceRef.set({
                fromPrice: fromPrice,
                toPrice: toPrice,
                conversionRate: conversionRate,
                timestamp: new Date().toISOString()
            })
            const amount = parseFloat(amountInput.value);
            if (!isNaN(amount) && amount > 0) {
                const estimatedAmount = (amount * conversionRate).toFixed(10);
                // Tampilkan estimasi di elemen yang sesuai
                document.getElementById('estimatedAmount').textContent = `Estimated: ${estimatedAmount} ${tickerMap[toNetwork]}`;
            } else {
                document.getElementById('estimatedAmount').textContent = `Estimated: 0.00`;
            }
        } else {
            priceElement.textContent = `Price: 0.00`;
        }

        const now = new Date();
        const formattedTime = now.toLocaleTimeString();
        lastUpdateElement.textContent = `Last Updated: ${formattedTime}`;
    }
}

// Function to update balances
function updateBalances() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    if (!userId) {
        fromBalanceElement.textContent = 'Sell: N/A';
        toBalanceElement.textContent = 'Buy: N/A';
        return; 
    }

    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork) {
        const fromBalanceRef = database.ref(`wallets/${userId}/${fromNetwork}/balance`);
        fromBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            fromBalanceElement.textContent = `You're Selling ${balance} ${tickerMap[fromNetwork]}`;
        });
    }

    if (toNetwork) {
        const toBalanceRef = database.ref(`wallets/${userId}/${toNetwork}/balance`);
        toBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            toBalanceElement.textContent = `You're Buying ${balance} ${tickerMap[toNetwork]}`;
        });
    }
}

let countdown = 10;
function startCountdown() {
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = `Next price update in: ${countdown}s`;
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
            updatePrice();
            updateGasFee();
            countdown = 10;
            startCountdown();
        }
    }, 1000);
}

fromNetworkSelect.addEventListener('change', () => {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork === toNetwork) {

        for (let option of toNetworkSelect.options) {
            if (option.value !== fromNetwork) {
                toNetworkSelect.value = option.value;
                break;
            }
        }
    }

    updateBalances();
    updatePrice();
    updateEstimatedAmount();
});

toNetworkSelect.addEventListener('change', () => {
    const toNetwork = toNetworkSelect.value;
    const fromNetwork = fromNetworkSelect.value;

    if (toNetwork === fromNetwork) {
        
        for (let option of toNetworkSelect.options) {
            if (option.value !== toNetwork) {
                fromNetworkSelect.value = option.value;
                break;
            }
        }
    }

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
        const selectedNetwork = networkSelect.value;

        const addressRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/address`);

        addressRef.once('value').then(snapshot => {
            const address = snapshot.val() || 'Tidak ditemukan';
            networkAddress.textContent = `Network Address: ${address}`;
        });

        walletStatus.textContent = 'Connected';
        walletStatus.style.color = 'green';

        document.getElementById('swapSection').style.display = 'block';
        
        alert('Wallet Connected');
        updateBalances();
        updatePrice();
    } else {
        walletStatus.textContent = 'Not Connected';
        walletStatus.style.color = 'red';
        networkAddress.textContent = 'Network Address: N/A';

        document.getElementById('swapSection').style.display = 'none';
    }
}

swapButton.addEventListener('click', () => {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount.');
        return;
    }

    if (fromNetwork === toNetwork) {
        alert('Cannot swap between the same network.');
        return;
    }

    const fromBalanceRef = database.ref(`wallets/${auth.currentUser.uid}/${fromNetwork}/balance`);
    const gasFeeRef = database.ref(`gasprice/${fromNetwork}/gasFee`);

    gasFeeRef.once('value').then(gasSnapshot => {
        const gasFee = parseFloat(gasSnapshot.val()) || 0;

        fromBalanceRef.once('value').then(snapshot => {
            const fromBalance = snapshot.val() || 0;

            // Pengecekan saldo sebelum konfirmasi
            if (fromBalance < amount + gasFee) {
                alert('Insufficient balance to cover the swap and gas fee.');
                return; // Batalkan jika saldo tidak cukup
            }

            // Alert untuk konfirmasi swap
            const confirmMessage = `You will bridge ${amount} $${tickerMap[fromNetwork]} with a ⛽gasfee of ${gasFee} $${tickerMap[fromNetwork]}. Do you want to proceed?`;
            if (!confirm(confirmMessage)) {
                alert('Bridge canceled.');
                return; // Batalkan jika pengguna memilih tidak
            }

            const fromPrice = parseFloat(getRandomPrice(fromNetwork));
            const toPrice = parseFloat(getRandomPrice(toNetwork));
            const amountInToNetwork = amount * (fromPrice / toPrice);
            const toBalanceRef = database.ref(`wallets/${auth.currentUser.uid}/${toNetwork}/balance`);

            toBalanceRef.once('value').then(toSnapshot => {
                const toBalance = toSnapshot.val() || 0;
                const newToBalance = toBalance + amountInToNetwork;
                const newFromBalance = fromBalance - amount - gasFee;

                // Update balances
                fromBalanceRef.set(newFromBalance).then(() => {
                    toBalanceRef.set(newToBalance).then(() => {
                        alert('Swap successful!');
                        updateBalances();
                        const transactionHash = generateTransactionHash();
                        const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);
                        const timestamp = new Date().toISOString();
                        const transactionData = {
                          
                            network: `${fromNetwork} to ${toNetwork}`,
                            sender: auth.currentUser.uid,
                            recipient: auth.currentUser.uid,
                            amount: amount.toFixed(10),
                            gasFee: gasFee.toFixed(10),
                            price: fromPrice.toFixed(10),
                            timestamp: timestamp,
                            transactionHash: transactionHash,
                            type: 'bridge'
                        };
                        const updates = {};
                        updates[`/transactions/allnetwork/${transactionHash}`] = transactionData;
                        database.ref().update(updates);
                    }).catch(error => {
                        console.error('Error updating to balance:', error);
                    });
                }).catch(error => {
                    console.error('Error updating from balance:', error);
                });
            }).catch(error => {
                console.error('Error fetching to balance:', error);
            });
        }).catch(error => {
            console.error('Error fetching from balance:', error);
        });
    }).catch(error => {
        console.error('Error fetching gas fee:', error);
    });
});

startCountdown();

function updateEstimatedAmount() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);

    if (fromNetwork && toNetwork && !isNaN(amount) && amount > 0) {
        const fromPrice = parseFloat(getRandomPrice(fromNetwork));
        const toPrice = parseFloat(getRandomPrice(toNetwork));

        if (toPrice > 0) {
            const estimatedAmount = (amount * (fromPrice / toPrice)).toFixed(15);
            document.getElementById('estimatedAmount').textContent = `Estimated: ${estimatedAmount} ${tickerMap[toNetwork]}`;
        } else {
            document.getElementById('estimatedAmount').textContent = "Estimated: 0.00";
        }
    } else {
        document.getElementById('estimatedAmount').textContent = "Estimated: 0.00";
    }
}

amountInput.addEventListener('input', updateEstimatedAmount);


// Connect Wallet functionality
connectWalletButton.addEventListener('click', () => {
    connectWallet();
    
    connectWalletButton.style.display = 'none';
    
});

// Update address when network changes
networkSelect.addEventListener('change', () => {
    connectWallet(); // Update wallet info on network change
});

// Function to update gas fee with ticker
function updateGasFee() {
    const selectedNetwork = fromNetworkSelect.value; // Mengambil network yang dipilih untuk swap

    // Referensi ke path gas fee di Firebase berdasarkan network yang dipilih
    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);

    gasFeeRef.once('value')
        .then(snapshot => {
            const gasFee = parseFloat(snapshot.val()) || 0; // Mengambil gas fee dari Firebase
            const ticker = tickerMap[selectedNetwork] || ''; // Mendapatkan ticker berdasarkan network

            // Tampilkan gas fee dengan ticker
            document.getElementById('gasFee').textContent = `${gasFee.toFixed(6)} ${ticker}`;
        })
        .catch(error => {
            console.error('Error fetching gas fee:', error);
            document.getElementById('gasFee').textContent = 'N/A'; // Jika error, tampilkan N/A
        });
}

// Event listener untuk update gas fee ketika network berubah
fromNetworkSelect.addEventListener('change', updateGasFee);
toNetworkSelect.addEventListener('change', updateGasFee);

// Panggil updateGasFee pertama kali saat halaman dimuat
updateGasFee();

autoSwitchButton.addEventListener('click', () => {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    // Cek jika dariNetwork dan toNetwork ada
    if (fromNetwork && toNetwork) {
        // Tukar pilihan jaringan
        fromNetworkSelect.value = toNetwork;
        toNetworkSelect.value = fromNetwork;

        // Perbarui saldo setelah mengganti jaringan
        updateBalances();
        updateGasFee();
    } else {
        alert('Please select both networks before switching.');
    }
});

    networkSelect.addEventListener('change', () => {
        const selectedNetwork = networkSelect.value;

        // Reset options
        fromNetworkSelect.innerHTML = '';

        // Menambahkan opsi berdasarkan pilihan jaringan yang dipilih
        for (const [value, name] of Object.entries(allNetworks)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            fromNetworkSelect.appendChild(option);
        }

        // Set nilai fromNetwork ke yang dipilih di networkSelect
        fromNetworkSelect.value = selectedNetwork;
    });
    
function generateTransactionHash() {
    const chars = 'abcdefghijklmnopqrstuvwxz0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) { // Panjang hash 64 karakter (mirip dengan hash blockchain sebenarnya)
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

document.addEventListener("DOMContentLoaded", function () {
            const selectElement = document.getElementById("fromNetwork");
            const networkIcon = document.getElementById("networkIcon");

            networkIcon.src = selectElement.options[selectElement.selectedIndex].getAttribute('data-image');

            selectElement.addEventListener('change', function () {
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const imgSrc = selectedOption.getAttribute('data-image');
                
                if (imgSrc) {
                    networkIcon.src = imgSrc;
                }
            });
        });
        
document.addEventListener("DOMContentLoaded", function () {
            const selectElement = document.getElementById("toNetwork");
            const networkIcon = document.getElementById("networkIcon2");

            networkIcon.src = selectElement.options[selectElement.selectedIndex].getAttribute('data-image');

            selectElement.addEventListener('change', function () {
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const imgSrc = selectedOption.getAttribute('data-image');
                
                if (imgSrc) {
                    networkIcon.src = imgSrc;
                }
            });
        });
        
function setPercentage(percent) {
        let balanceText = document.getElementById("fromBalance").innerText;
        let balance = parseFloat(balanceText.replace(/[^\d.]/g, "")) || 0; 
        
        let amountInput = document.getElementById("amount");
        amountInput.value = (balance * percent / 100).toFixed(5);
    }