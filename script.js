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

const tickerMap = {
    eth: 'ETH',
    usdt_erc20: 'USDT',
    usdc_erc20: 'USDC',
    weth: 'WETH',
    lido: 'LIDO',
    steth: 'StETH',
    optimism_eth: 'ETH',
    optimism: 'OP',
    sol: 'SOL',
    cosmos: 'ATOM',
};

const gasFeeRanges = {
    eth: [0.000151836, 0.0000501735],
    lido: [0.01, 0.01],
    weth: [0.00035, 0.00034],
    steth: [0.0035, 0.00034],
    usdc_erc20: [0.01, 0.01],
    usdt_erc20: [0.01, 0.01],
    optimism_eth: [0.0000005, 0.0000002],
    optimism: [0.0005, 0.0001],
    sol: [0.002, 0.0025],
    cosmos: [0.005,0.003]
};

function getRandomGasFee(network) {
    const [min, max] = gasFeeRanges[network];
    return (Math.random() * (max - min) + min).toFixed(7);
}

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

signOutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        console.log('Sign out successful');
        stopGasFeeSync();
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

    addressRef.once('value').then(snapshot => {
        let address = snapshot.val();
        if (!address) {
            address = generateRandomAddress(selectedNetwork);
            addressRef.set(address);
        }
        cryptoAddressElement.textContent = address;
    });

balanceRef.on('value', snapshot => {
    let balance = snapshot.val() || 0;
    
    balance = parseFloat(balance).toLocaleString('en-US', { 
        minimumFractionDigits: 10, 
        maximumFractionDigits: 10, 
        useGrouping: true 
    });
    
    const ticker = tickerMap[selectedNetwork];
    cryptoBalanceElement.textContent = `Balance: ${balance} ${ticker}`;
    tokenBalanceElement.textContent = `Token Balance: ${balance}`;
});

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
        address = '1' + generateRandomChars(34);
    } else if (network === 'sol' || network === 'jup' || network === 'usdc_sol' || network === 'usdt_sol') {
        if (!localStorage.getItem('solana')) {
            address = '' + generateRandomChars(32);
            localStorage.setItem('solana', address);
        } else {
            address = localStorage.getItem('solana');
        }
    }  else if (network === 'sui') {
        address = '0x' + generateRandomChars(64);
    } else if (network === 'ton' || network === 'dogs') {
        if (!localStorage.getItem('tonnetwork')) {
            address = 'UQ' + generateRandomChars(46);
            localStorage.setItem('tonnetwork', address);
        } else {
            
            address = localStorage.getItem('tonnetwork');
        }
    } else if (network === 'xrp' ) {
        if (!localStorage.getItem('xrpnetwork')) {

            address = 'r' + generateRandomChars(35);
            localStorage.setItem('xrpnetwork', address);
        } else {
            address = localStorage.getItem('xrpnetwork');
        }
    } else if (network === 'celestia') {
        address = 'celestia' + generateRandomChars(39);
    } else if (network === 'cardano') {
        address = 'addr1' + generateRandomChars(99);
    } else if (network === 'tron' || network === 'usdt_trc20') {
        if (!localStorage.getItem('trc20')) {
            address = 'TP' + generateRandomChars(34);
            localStorage.setItem('trc20', address);
        } else {
            address = localStorage.getItem('trc20');
        }
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

    const userBalanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFee = parseFloat(gasFeeElement.textContent.split(' ')[0]) || 0;
    const totalCost = amount + gasFee;

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
                            amountReceived: amountReceived,
                            gasFee: gasFee,
                            memo: memo,
                            timestamp: new Date().toISOString()
                        };

                        transactionRef.set(transactionData).then(() => {
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

function generateTransactionHash() {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
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

networkSelect.addEventListener('change', () => {
    updateWallet();
});

let gasFeeInterval;

function startGasFeeSync() {
    gasFeeInterval = setInterval(() => {
        const selectedNetwork = networkSelect.value;
        const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);
        gasFeeRef.set(getRandomGasFee(selectedNetwork));
    }, 10000);
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
    console.error("Notification element not found!");
    return;
  }
  notification.textContent = message;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}


//Code By Mhsr
