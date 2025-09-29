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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
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
const confirmationModal = document.getElementById('confirmationModal');
const confirmSendButton = document.getElementById('confirmSend');
const cancelSendButton = document.getElementById('cancelSend');
const transactionHistoryList = document.getElementById('transactionHistoryList');
let lastKnownBalances = {};

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
        lastKnownBalances = {};
    }
});

const tickerMap = {
    eth: 'ETH', usdt_erc20: 'USDT', usdc_erc20: 'USDC', weth: 'WETH', lido: 'LIDO',
    steth: 'StETH', optimism_eth: 'ETH', optimism: 'OP', base_eth: 'ETH', sol: 'SOL',
    jup: 'JUP', cosmos: 'ATOM', sui: 'SUI', walrus: 'WAL', ika: 'IKA', haedal: 'HAEDAL',
    hasui: 'HASUI', deep: 'DEEP', cetus: 'CETUS', ns: 'NS',sca: 'SCA', blue: 'BLUE', usdc_sui: 'USDC',
    usdt_sui: 'USDT', navx: 'NAVX', pepe: 'PEPE', supra: 'SUPRA', xrp: 'XRP', bnb: 'BNB',
    usdt_bep20: 'USDT', succinct: 'PROVE', pengu: 'PENGU', near: 'NEAR',
};

const gasFeeRanges = {
    eth: [0.0000751836, 0.0003711735],
    lido: [0.01, 0.01],
    weth: [0.000035, 0.00034],
    steth: [0.00035, 0.000034],
    usdc_erc20: [0.5108375, 0.319875],
    usdt_erc20: [0.5108375, 0.319875],
    optimism_eth: [0.00000005, 0.0000002], 
    optimism: [0.0005, 0.0001],
    base_eth: [0.00000055, 0.00000025], 
    sol: [0.002, 0.0025], 
    jup: [0.00516, 0.00680],
    cosmos: [0.005, 0.003], 
    sui: [0.0105, 0.00025000], 
    walrus: [0.03, 0.041],
    ika: [0.0345, 0.0234],
    pepe: [0.02, 0.03], 
    supra: [0.002, 0.006],
    haedal: [0.006, 0.003],
    hasui: [0.00705, 0.00025000],
    deep: [0.03, 0.02],
    cetus: [0.04, 0.055], 
    ns: [0.021, 0.045],
    sca: [0.015, 0.035], 
    blue: [0.011, 0.033],
    navx: [0.012, 0.065], 
    usdc_sui: [0.023, 0.043],
    usdt_sui: [0.024, 0.045],
    xrp: [0.003123, 0.001321],
    bnb: [0.000054, 0.000036],
    usdt_bep20: [0.41234, 0.14321],
    succinct: [0.007111111,0.0081111111],
    pengu: [0.0040000,0.00555555],
    near: [0.0001, 0.0511],
};

function getRandomGasFee(network) {
    const [min, max] = gasFeeRanges[network];
    return (Math.random() * (max - min) + min).toFixed(18);
}

showSignUpForm.addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
});

showSignInForm.addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
});

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
        .then(() => console.log('Sign up successful'))
        .catch(error => { signUpError.textContent = error.message; });
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

signInSubmit.addEventListener('click', () => {
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => console.log('Sign in successful'))
        .catch(error => { signInError.textContent = error.message; });
});

signOutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        console.log('Sign out successful');
        stopGasFeeSync();
    }).catch(error => console.error('Sign out error:', error));
});


function updateWallet() {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;
    const addressRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/address`);
    const balanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);

    addressRef.once('value').then(snapshot => {
        let address = snapshot.val();
        if (!address) {
            address = generateRandomAddress(selectedNetwork);
            addressRef.set(address);
        }
        cryptoAddressElement.textContent = address;
        loadTransactionHistory();
    });

    balanceRef.on('value', snapshot => {
        const newBalance = parseFloat(snapshot.val() || 0);
        const ticker = tickerMap[selectedNetwork];
        if (lastKnownBalances[selectedNetwork] !== undefined && newBalance > lastKnownBalances[selectedNetwork]) {
            const amountReceived = newBalance - lastKnownBalances[selectedNetwork];
            const formattedAmount = amountReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
            showNotification(`Menerima: +${formattedAmount} ${ticker}`, 10000);
        }
        lastKnownBalances[selectedNetwork] = newBalance;
        let formattedBalance = newBalance.toLocaleString('en-US', { minimumFractionDigits: 10, maximumFractionDigits: 10, useGrouping: true });
        cryptoBalanceElement.textContent = `Balance: ${formattedBalance} ${ticker}`;
    });

    gasFeeRef.on('value', snapshot => {
        const gasFee = snapshot.val() || getRandomGasFee(selectedNetwork);
        gasFeeRef.set(gasFee);
        gasFeeElement.textContent = `${gasFee} ${tickerMap[selectedNetwork]}`;
    });
}

function loadTransactionHistory() {
    const userId = auth.currentUser.uid;
    const userAddress = cryptoAddressElement.textContent;
    const transactionsRef = database.ref('transactions/allnetwork');

    transactionsRef.orderByChild('timestamp').on('value', snapshot => {
        transactionHistoryList.innerHTML = '';
        let userTransactions = [];

        if (!snapshot.exists()) {
            transactionHistoryList.innerHTML = `<p class="info-text">No transaction history found.</p>`;
            return;
        }

        snapshot.forEach(childSnapshot => {
            const tx = childSnapshot.val();
            if (tx.sender === userId || tx.recipient === userAddress) {
                userTransactions.push(tx);
            }
        });

        userTransactions.reverse();

        if (userTransactions.length === 0) {
            transactionHistoryList.innerHTML = `<p class="info-text">No transaction history found.</p>`;
            return;
        }

        userTransactions.forEach(tx => {
            const isSent = tx.sender === userId;
            const type = isSent ? 'Sent' : 'Received';
            const amountClass = isSent ? 'sent' : 'received';
            const amountSign = isSent ? '-' : '+';
            const ticker = tickerMap[tx.network] || '...';
            const date = new Date(tx.timestamp).toLocaleString();

            const txItemHTML = `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <span class="transaction-type">${type} ${ticker}</span>
                        <span class="transaction-date">${date}</span>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}${tx.amount.toLocaleString()}
                    </div>
                </div>
            `;
            transactionHistoryList.innerHTML += txItemHTML;
        });
    });
}

function generateRandomAddress(network) {
    let address = '';
    if (network === 'sol' || network === 'jup' || network === 'usdc_sol' || network === 'usdt_sol') {
        if (!localStorage.getItem('solana')) {
            address = '' + generateRandomChars(32);
            localStorage.setItem('solana', address);
        } else {
            address = localStorage.getItem('solana');
        }
    } else if (network === 'sui') {
        address = '0x' + generateRandomChars(64);
    } else {
        address = localStorage.getItem('evmAddress');
        if (!address) {
            address = '0x' + generateRandomChars(40);
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
    const recipientAddress = sendToAddressInput.value.trim();
    const amount = parseFloat(sendAmountInput.value);
    const userAddress = cryptoAddressElement.textContent.trim();

    if (recipientAddress === userAddress) {
        showNotification("Anda tidak bisa mengirim kripto ke alamat sendiri.", 2000);
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showNotification("Jumlah tidak valid.", 2000);
        return;
    }
    
    confirmationModal.style.display = 'block';
});
cancelSendButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
    showNotification("Transaksi dibatalkan.", 2000);
});

confirmSendButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
    executeTransaction();
});

function executeTransaction() {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;
    const recipientAddress = sendToAddressInput.value.trim();
    const amount = parseFloat(sendAmountInput.value);
    const memo = memoInput.value.trim();
    const userBalanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFee = parseFloat(gasFeeElement.textContent.split(' ')[0]) || 0;
    const totalCost = amount + gasFee;
    const selectedRpcUrl = document.getElementById("selectrpc").value;
    let delay = 0;
    if (selectedRpcUrl === "https://rpc-iaconchain.io") {
        delay = 1000;
    } else if (selectedRpcUrl === "https://rpc-ac-mainnet.com") {
        delay = 1000;
    } else if (selectedRpcUrl === " https://rpc.ankr.com") {
        delay = 1000;
    }

userBalanceRef.once('value').then(snapshot => {
const currentBalance = snapshot.val() || 0;
if (currentBalance >= totalCost) {
userBalanceRef.set(currentBalance - totalCost).then(() => {
  const recipientRef = firebase.database().ref(`wallets/${recipientAddress}/${selectedNetwork}/balance`);
  recipientRef.once('value').then(snapshot => {
    const recipientBalance = snapshot.val() || 0;
    recipientRef.set(recipientBalance + amount).then(() => {
      const transactionHash = generateTransactionHash();
const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);
const transactionData = {
  network: selectedNetwork,
  sender: userId,
  recipient: recipientAddress,
  amount: amount,
  amountReceived: amount, 
  gasFee: gasFee, 
  memo: memo,
  timestamp: new Date().toISOString()
};
transactionRef.set(transactionData).then(() => {
  setTimeout(() => {
    const explorerUrl = generateExplorerUrl(selectedNetwork, transactionHash);
    const ticker = tickerMap[selectedNetwork] || selectedNetwork;
    const formattedAmount = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
        
        showNotification(`Berhasil mengirim ${formattedAmount} ${ticker}! Lihat: ${explorerUrl}`, 10000);

  }, delay);
   });
    });
  });
});
        } else {
            showNotification("Saldo tidak cukup untuk membayar transaksi dan biaya gas.", 5000);
        }
    }).catch(error => {
        console.error('Error fetching balance:', error);
        showNotification("Gagal memproses transaksi.", 2000);
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

function generateExplorerUrl(network, transactionHash) {
    let baseUrl;
    switch (network) {
        case 'z': baseUrl = 'https://iac-explorer.com/tx/'; break;
        case 'eth': baseUrl = 'https://etherscan.io/tx/'; break;
        case 'sui': baseUrl = 'https://suiscan.xyz/mainnet/tx/'; break;
        default: baseUrl = 'https://infoardropcrypto.github.io/web3test/explorer.html#';
    }
    return `${baseUrl}${transactionHash}`;
}

networkSelect.addEventListener('change', () => {
    updateWallet();
});

let gasFeeInterval;

function startGasFeeSync() {
    gasFeeInterval = setInterval(() => {
        const selectedNetwork = networkSelect.value;
        const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);
        gasFeeRef.set(getRandomGasFee(selectedNetwork));
    }, 60000);
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
        if (imgSrc) { networkIcon.src = imgSrc; }
    });
});

function togglePassword(id, button) {
    const passwordInput = document.getElementById(id);
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    button.innerHTML = type === 'password' ? '🙉' : '🙈';
}

document.addEventListener("DOMContentLoaded", function () {
    const rpcSelect = document.getElementById("selectrpc");
    const rpcSpeedDisplay = document.getElementById("rpcSpeed");
    const customSpeedMapping = {
        "https://rpc-iaconchain.io": { min: 250, max: 800 },
        "https://rpc-ac-mainnet.com": { min: 300, max: 800 },
        "https://rpc.ankr.com": { min: 700, max: 800 }
    };
    function getRandomSpeed(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function updateRpcSpeedDisplay() {
        const selectedRpc = rpcSelect.value;
        const speedRange = customSpeedMapping[selectedRpc];
        if (speedRange) {
            const randomSpeed = getRandomSpeed(speedRange.min, speedRange.max);
            rpcSpeedDisplay.textContent = `${randomSpeed} ms`;
        } else {
            rpcSpeedDisplay.textContent = "N/A";
        }
    }
    updateRpcSpeedDisplay();
    rpcSelect.addEventListener("change", updateRpcSpeedDisplay);
});

function showNotification(message, duration = 10000) {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error("Elemen notifikasi tidak ditemukan!");
        return;
    }
    console.log("Menampilkan notifikasi:", message);
    notification.textContent = message;
    notification.classList.add('show');

    clearTimeout(notification.hideTimeout);
    notification.hideTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}
