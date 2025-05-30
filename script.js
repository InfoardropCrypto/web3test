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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM elements
const userIdElement = document.getElementById('userId');
const cryptoBalanceElement = document.getElementById('cryptoBalance');
const cryptoAddressElement = document.getElementById('cryptoAddress');
const sendCryptoButton = document.getElementById('sendCrypto');
const sendToAddressInput = document.getElementById('sendToAddress');
const sendAmountInput = document.getElementById('sendAmount');
const signInSubmit = document.getElementById('signInSubmit');
const signUpSubmit = document.getElementById('signUpSubmit');
const showSignUpForm = document.getElementById('showSignUpForm');
const showSignInForm = document.getElementById('showSignInForm');
const signInError = document.getElementById('signInError');
const signUpError = document.getElementById('signUpError');
const walletContainer = document.getElementById('walletContainer');
const authContainer = document.getElementById('authContainer');
const signOutButton = document.getElementById('signOutButton');
const networkSelect = document.getElementById('networkSelect');
const gasFeeElement = document.getElementById('gasFee');
const tickerElement = document.getElementById('ticker');
const memoInput = document.getElementById('memo');
const tokenBalanceElement = document.getElementById('tokenBalance');
document.getElementById('searchInput').addEventListener('input', function() {
            var filter = this.value.toLowerCase();
            var options = document.getElementById('networkSelect').options;
            var found = false;

            for (var i = 0; i < options.length; i++) {
                var optionText = options[i].text.toLowerCase();
                if (optionText.indexOf(filter) > -1) {
                    options[i].style.display = ""; 
                    if (!found && filter.length > 0) {
                        options[i].selected = true;
                        found = true;
                    }
                } else {
                    options[i].style.display = "none";
                }
            }
        });

        document.getElementById('searchInput').addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                var selectElement = document.getElementById('networkSelect');
                var selectedOption = selectElement.options[selectElement.selectedIndex];

                alert('Crypto selected: ' + selectedOption.text);
                selectElement.dispatchEvent(new Event('change'));
            }
        });

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        walletContainer.style.display = 'block';
        userIdElement.textContent = user.uid; 
        updateWallet();
        startGasFeeSync();
    } else {
        authContainer.style.display = 'block';
        walletContainer.style.display = 'none';
    }
});

function updateTokenBalance() {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;
    const balanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);

    balanceRef.on('value', snapshot => {
        const balance = snapshot.val() || 0;
        tokenBalanceElement.textContent = `Token Balance: ${balance}`;
    });
}

// Define ticker map
const tickerMap = {
    ac: 'AC',
    eth: 'ETH',
    usdt_erc20: 'USDT',
    usdc_erc20: 'USDC',
    weth: 'WETH',
    lido: 'LIDO',
    steth: 'sETH',
    optimism_eth: 'ETH',
    optimism: 'OP',
};

// Define gas fee range
const gasFeeRanges = {
    ac: [0.005, 0.001],
    eth: [0.000151836, 0.0000501735],
    lido: [0.01, 0.01],
    weth: [0.01, 0.01],
    steth: [0.01, 0.01],
    usdc_erc20: [0.01, 0.01],
    usdt_erc20: [0.01, 0.01],
    optimism_eth: [0.000005, 0.000002],
    optimism: [0.0005, 0.0001],
};

// Fungsi untuk mendapatkan gas fee acak dalam rentang yang ditentukan
function getRandomGasFee(network) {
    const [min, max] = gasFeeRanges[network];
    return (Math.random() * (max - min) + min).toFixed(7);
}

// Display wallet or authentication UI based on user state
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        walletContainer.style.display = 'block';
        updateWallet();
        startGasFeeSync();
    } else {
        authContainer.style.display = 'block';
        walletContainer.style.display = 'none';
    }
});

// Show sign up form
showSignUpForm.addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
});

// Show sign in form
showSignInForm.addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
});

// Sign Up
// Pastikan validasi untuk input email dan password
signUpSubmit.addEventListener('click', () => {
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    
    if (!validateEmail(email)) {
        signUpError.textContent = 'Invalid email address.';
        return;
    }
    
    if (password.length < 6) {
        signUpError.textContent = 'Password must be at least 6 characters long.';
        return;
    }
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            console.log('Sign up successful');
        })
        .catch(error => {
            signUpError.textContent = error.message;
        });
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}


// Sign In
signInSubmit.addEventListener('click', () => {
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log('Sign in successful');
        })
        .catch(error => {
            signInError.textContent = error.message;
        });
});

// Sign Out
signOutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        console.log('Sign out successful');
        stopGasFeeSync(); // Stop syncing when signed out
    }).catch(error => {
        console.error('Sign out error:', error);
    });
});

function updateWallet() {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;

    const addressRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/address`);
    const balanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);

    // Update Address
    addressRef.once('value').then(snapshot => {
        let address = snapshot.val();
        if (!address) {
            address = generateRandomAddress(selectedNetwork);
            addressRef.set(address);
        }
        cryptoAddressElement.textContent = address;
    });

// Update Balance
balanceRef.on('value', snapshot => {
    let balance = snapshot.val() || 0;
    
    // Ubah format balance menjadi 1 angka di belakang desimal dengan pemisah ribuan
    balance = parseFloat(balance).toLocaleString('en-US', { 
        minimumFractionDigits: 10, 
        maximumFractionDigits: 10, 
        useGrouping: true 
    });
    
    const ticker = tickerMap[selectedNetwork];
    cryptoBalanceElement.textContent = `Balance: ${balance} ${ticker}`;
    tokenBalanceElement.textContent = `Token Balance: ${balance}`;
});

    // Update Gas Fee
    gasFeeRef.on('value', snapshot => {
        const gasFee = snapshot.val() || getRandomGasFee(selectedNetwork);
        gasFeeRef.set(gasFee);
        gasFeeElement.textContent = `${gasFee} ${tickerMap[selectedNetwork]}`;
    });
}

function generateRandomAddress(network) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = '';
    
    if (network === 'btc') {
        address = '1' + generateRandomChars(34); // Bitcoin addresses start with 1
    } else if (network === 'sol' || network === 'jup' || network === 'usdc_sol' || network === 'usdt_sol') {
        if (!localStorage.getItem('solana')) {
            // Generate and store a new address if not already present
            address = '' + generateRandomChars(32); // Panjang 32 karakter
            localStorage.setItem('solana', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('solana');
        }
    }  else if (network === 'sui') {
        address = '0x' + generateRandomChars(64); // Example length for Sui
    } else if (network === 'ton' || network === 'dogs') {
        if (!localStorage.getItem('tonnetwork')) {
            // Generate and store a new address if not already present
            address = 'UQ' + generateRandomChars(46); // Panjang 46 karakter
            localStorage.setItem('tonnetwork', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('tonnetwork');
        }
    } else if (network === 'xrp' ) {
        if (!localStorage.getItem('xrpnetwork')) {
            // Generate and store a new address if not already present
            address = 'r' + generateRandomChars(35);
            localStorage.setItem('xrpnetwork', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('xrpnetwork');
        }
    } else if (network === 'celestia') {
        address = 'celestia' + generateRandomChars(39); // Example length for Celestia
    } else if (network === 'cardano') {
        address = 'addr1' + generateRandomChars(99); // Example length for Celestia
    } else if (network === 'tron' || network === 'usdt_trc20') {
        // Generate a common address for both TRON and USDT TRC20
        if (!localStorage.getItem('trc20')) {
            // Generate and store a new address if not already present
            address = 'TP' + generateRandomChars(34); // Panjang 34 karakter untuk TRON dan USDT TRC20
            localStorage.setItem('trc20', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('trc20');
        }
    } else {
        // Single address for all EVM networks
        address = localStorage.getItem('evmAddress');
        if (!address) {
            address = '0x' + generateRandomChars(40); // EVM addresses start with 0x
            localStorage.setItem('evmAddress', address);
        }
    }
    
    return address;
}

function generateRandomChars(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

sendCryptoButton.addEventListener('click', () => {
    // Konfirmasi transaksi menggunakan dialog confirm bawaan
    if (!confirm("Are you sure you want to send crypto?")) {
        showNotification("Transaction cancelled.", 2000);
        return;
    }
    
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;
    const recipientAddress = sendToAddressInput.value.trim();
    const amount = parseFloat(sendAmountInput.value);
    const amountReceived = parseFloat(sendAmountInput.value);
    const userAddress = cryptoAddressElement.textContent.trim();
    const memo = memoInput.value.trim();

    if (recipientAddress === userAddress) {
        showNotification("You cannot send crypto to yourself.", 2000);
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showNotification("Invalid amount.", 2000);
        return;
    }

    // Ambil saldo pengirim dan biaya gas
    const userBalanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFee = parseFloat(gasFeeElement.textContent.split(' ')[0]) || 0;
    const totalCost = amount + gasFee;

    // Dapatkan RPC yang dipilih untuk menentukan delay
    const selectedRpcUrl = document.getElementById("selectrpc").value;
    let delay = 0;
    if (selectedRpcUrl === "https://rpc-iaconchain.io") {
        delay = 8500, 9000;
    } else if (selectedRpcUrl === "https://rpc-ac-mainnet.com") {
        delay = 7900, 8500, 8900;
    } else if (selectedRpcUrl === " https://rpc.ankr.com") {
        delay = 8700, 8900, 9900;
    }

    userBalanceRef.once('value').then(snapshot => {
        const currentBalance = snapshot.val() || 0;

        if (currentBalance >= totalCost) {
            // Kurangi saldo pengirim
            userBalanceRef.set(currentBalance - totalCost).then(() => {
                // Tambah saldo penerima
                const recipientRef = firebase.database().ref(`wallets/${recipientAddress}/${selectedNetwork}/balance`);
                recipientRef.once('value').then(snapshot => {
                    const recipientBalance = snapshot.val() || 0;
                    recipientRef.set(recipientBalance + amount).then(() => {
                        // Simpan transaksi
                        const transactionHash = generateTransactionHash();
                        const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);

                        const transactionData = {
                            network: selectedNetwork,
                            sender: userId,
                            recipient: recipientAddress,
                            amount: amount,
                            amountReceived: amountReceived,
                            gasFee: gasFee,
                            memo: memo,
                            timestamp: new Date().toISOString()
                        };

                        transactionRef.set(transactionData).then(() => {
                            // Simulasikan delay pengiriman transaksi
                            setTimeout(() => {
                                const explorerUrl = generateExplorerUrl(selectedNetwork, transactionHash);
                                showNotification(`Crypto sent successfully! View: ${explorerUrl}`, 4000);
                            }, delay);
                        });
                    });
                });
            });
        } else {
            showNotification("Insufficient balance to cover the transaction and gas fee.", 2000);
        }
    }).catch(error => {
        console.error('Error fetching balance:', error);
        showNotification("Error processing transaction.", 2000);
    });
});

// Fungsi untuk membuat hash transaksi acak (untuk simulasi)
function generateTransactionHash() {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) { // Panjang hash 64 karakter (mirip dengan hash blockchain sebenarnya)
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

function generateExplorerUrl(network, transactionHash) {
    let baseUrl;

    switch (network) {
        case 'ac':
            baseUrl = 'https://iac-explorer.com/tx/';
            break;
        case 'eth':
            baseUrl = 'https://etherscan.io/tx/';
            break;
        
        default:
            baseUrl = 'https://iac-explorer.com/tx/';
    }

    return `${baseUrl}${transactionHash}`;
}

// Change network
networkSelect.addEventListener('change', () => {
    updateWallet();
});

// Track and update gas fee every 3 seconds
let gasFeeInterval;

function startGasFeeSync() {
    gasFeeInterval = setInterval(() => {
        const selectedNetwork = networkSelect.value;
        const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);
        gasFeeRef.set(getRandomGasFee(selectedNetwork));
    }, 10000); // Update every 10 seconds
}

function stopGasFeeSync() {
    clearInterval(gasFeeInterval);
}

document.addEventListener("DOMContentLoaded", function () {
            const selectElement = document.getElementById("networkSelect");
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
        // Function to toggle password visibility
        function togglePassword(id, button) {
            const passwordInput = document.getElementById(id);
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            button.innerHTML = type === 'password' ? '🙉' : '🙈';
        }

document.addEventListener("DOMContentLoaded", function () {
  const rpcSelect = document.getElementById("selectrpc");
  const rpcSpeedDisplay = document.getElementById("rpcSpeed");

  // Mapping rentang kecepatan berdasarkan URL RPC
  const customSpeedMapping = {
    "https://rpc-iaconchain.io": { min: 250, max: 800 },
    "https://rpc-ac-mainnet.com": { min: 300, max: 800 },
    "https://rpc.ankr.com": { min: 700, max: 800 }
  };

  // Fungsi untuk menghasilkan angka acak antara min dan max (inklusif)
  function getRandomSpeed(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Fungsi untuk memperbarui tampilan kecepatan secara acak
  function updateRpcSpeedDisplay() {
    const selectedRpc = rpcSelect.value;
    const speedRange = customSpeedMapping[selectedRpc];

    if (speedRange) {
      // Hasilkan nilai acak dalam rentang
      const randomSpeed = getRandomSpeed(speedRange.min, speedRange.max);
      rpcSpeedDisplay.textContent = `${randomSpeed} ms`;
    } else {
      rpcSpeedDisplay.textContent = "N/A";
    }
  }

  // Tampilkan kecepatan saat halaman dimuat
  updateRpcSpeedDisplay();

  // Perbarui tampilan setiap kali opsi RPC berubah
  rpcSelect.addEventListener("change", updateRpcSpeedDisplay);
});

function showNotification(message, duration = 10000) {
  const notification = document.getElementById('notification');
  if (!notification) {
    console.error("Notification element not found!");
    return;
  }
  notification.textContent = message;
  notification.classList.add('show');

  // Hapus notifikasi setelah durasi tertentu
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}


//Code By Mhsr