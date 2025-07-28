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
const database = firebase.database();
const auth = firebase.auth();

const authContainer = document.getElementById('authContainer');
const mainContent = document.getElementById('mainContent');
const logoutButton = document.getElementById('logoutButton');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const authError = document.getElementById('authError');
const myBalanceDetails = document.getElementById('myBalanceDetails');
const transactionsContainer = document.getElementById('transactionsContainer');
const searchInput = document.getElementById('searchInput');
const totalTransactionsElement = document.getElementById('totalTransactions');
const dailyTransactionsElement = document.getElementById('dailyTransactions');
const totalGasFeeElement = document.getElementById('totalGasFee');
const networkDetailsElement = document.getElementById('networkDetails');
const paginationContainer = document.getElementById('pagination');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageInfo = document.getElementById('pageInfo');
const walletModal = document.getElementById('walletModal');
const modalWalletAddress = document.getElementById('modalWalletAddress');
const modalWalletBalances = document.getElementById('modalWalletBalances');
const closeButton = document.querySelector('.close-button');
const networkFilter = document.getElementById('networkFilter');
const TRANSACTIONS_PER_PAGE = 25;
let allTransactionKeys = [];
let currentPage = 1;
let totalPages = 1;
let allTransactionsCache = {};

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authError.textContent = '';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    authError.textContent = '';
});
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = registerEmail.value;
    const password = registerPassword.value;
    authError.textContent = '';

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            if (user) {
                const userWalletRef = database.ref('wallets/' + user.uid);
                userWalletRef.set({
                    eth: { balance: 0 },
                    cosmos: { balance: 0 },
                    optimism_eth: { balance: 0 },
                    base_eth: { balance: 0 },
                    sui: { balance: 0 }
                }).catch(dbError => {
                    console.error("Gagal membuat data dompet:", dbError);
                    authError.textContent = 'Gagal membuat data dompet: ' + dbError.message;
                });
            }
        })
        .catch(error => {
            handleAuthError(error);
        });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;
    authError.textContent = '';

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            handleAuthError(error);
        });
});

logoutButton.addEventListener('click', () => {
    auth.signOut();
});

function handleAuthError(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            authError.textContent = 'Email ini sudah terdaftar.';
            break;
        case 'auth/user-not-found':
            authError.textContent = 'Email tidak ditemukan.';
            break;
        case 'auth/wrong-password':
            authError.textContent = 'Password salah.';
            break;
        case 'auth/weak-password':
            authError.textContent = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
            break;
        case 'auth/invalid-email':
            authError.textContent = 'Format email tidak valid.';
            break;
        default:
            authError.textContent = 'Terjadi kesalahan. Coba lagi.';
            break;
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
        authError.textContent = '';
        loginForm.reset();
        registerForm.reset();
        displayMyBalance(user.uid);
        loadAndPaginate();
        listenForNewTransactions();
        updateGasFeeETH();
        updateGasFeeATOM();
    } else {
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        
        if (myBalanceDetails) myBalanceDetails.innerHTML = '';
        if (transactionsContainer) transactionsContainer.innerHTML = '<p>Silakan login untuk melihat transaksi.</p>';
        allTransactionsCache = {};
        allTransactionKeys = [];
    }
});

function displayMyBalance(userId) {
    if (!userId || !myBalanceDetails) return;
    
    const myWalletRef = database.ref('wallets/' + userId);

    myWalletRef.on('value', snapshot => {
        if (snapshot.exists()) {
            const networks = snapshot.val();
            let balancesHTML = '';
            for (const networkKey in networks) {
                const balance = networks[networkKey].balance || 0;
                const displayName = networkKey.toUpperCase().replace('', '');
                balancesHTML += `<p><strong>${displayName}:</strong> ${balance}</p>`;
            }
            myBalanceDetails.innerHTML = balancesHTML || '<p>Informasi saldo tidak ditemukan.</p>';
        } else {
            myBalanceDetails.innerHTML = '<p>Data dompet tidak ditemukan. Hubungi support jika ini adalah kesalahan.</p>';
        }
    }, error => {
         myBalanceDetails.innerHTML = `<p style="color:red;">Gagal memuat saldo: ${error.message}</p>`;
    });
}


networkFilter.addEventListener('change', () => {
  const query = searchInput.value;
  const network = networkFilter.value;
  const filtered = filterTransactions(query, allTransactionsCache, network);
  allTransactionKeys = Object.keys(filtered).sort((a, b) => {
    return new Date(filtered[b].timestamp) - new Date(filtered[a].timestamp);
  });
  totalPages = Math.ceil(allTransactionKeys.length / TRANSACTIONS_PER_PAGE);
  currentPage = 1;
  renderCurrentPage();
});

function filterTransactions(query, transactions, networkFilter = '') {
  if (!query && !networkFilter) return transactions;
  const lowerQuery = query.toLowerCase();
  return Object.entries(transactions).reduce((filtered, [txid, tx]) => {
    const matchesQuery = txid.toLowerCase().includes(lowerQuery);
    const matchesNetwork = !networkFilter || tx.network === networkFilter;
    if (matchesQuery && matchesNetwork) filtered[txid] = tx;
    return filtered;
  }, {});
}

function createTransactionElement(transactionId, transaction, isNew) {
    const sender = transaction.sender || 'anonym';
    const recipient = transaction.recipient || 'anonym';
    const memo = transaction.memo || 'encrypted';

    const senderLink = sender !== 'anonym' ? `<span class="wallet-link" onclick="showWalletDetails('${sender}')">${sender}</span>` : 'anonym';
    const recipientLink = recipient !== 'anonym' ? `<span class="wallet-link" onclick="showWalletDetails('${recipient}')">${recipient}</span>` : 'anonym';

    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction';

    if (isNew) {
        transactionElement.classList.add('new-tx');
    }

    transactionElement.innerHTML = `
        ${isNew ? '<div class="new-label">🆕 NEW TX</div>' : ''}
        <p><strong>Tx hash:</strong> <span class="long-text" id="tx-${transactionId}">${transactionId}</span> <button onclick="copyToClipboard('${transactionId}')">Copy</button></p>
        <p><strong>Type:</strong> ${transaction.type || 'send crypto'}</p>
        <p><strong>Sender:</strong> ${senderLink}</p>
        <p><strong>Recipient:</strong> ${recipientLink}</p>
        <p style="color:#7f7e7ecf;">################################</p>
        <p><strong>Balance Change</strong></p>
        <p><strong>Send:</strong> <font style="color:white;background-color:#cc4d4d;border-radius:100px;">⤴</font>${transaction.amount}</p>
        <p><strong>Received:</strong> <font style="color:white;background-color:#4dcc4d;border-radius:100px;">⤵</font>${transaction.amountReceived}</p>
        <p><strong>Source:</strong> ${transaction.network}</p>
        <p style="color:#7f7e7ecf;">################################</p>
        <p><strong>Memo:</strong> ${memo}</p>
        <p><strong>Gas fee:</strong> ${transaction.gasFee}</p>
        <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleString('en-GB')}</p>
        <hr>
    `;
    
    if (isNew) {
        setTimeout(() => {
            transactionElement.classList.remove('new-tx');
        }, 5000); 
    }
    
    return transactionElement;
}

function displayTransactions(transactions) {
    if (!transactionsContainer) return;
    transactionsContainer.innerHTML = ''; 
    
    if (transactions && Object.keys(transactions).length > 0) {
        const sortedTransactionIds = Object.keys(transactions).sort((a, b) => {
            return new Date(transactions[b].timestamp) - new Date(transactions[a].timestamp);
        });

        sortedTransactionIds.forEach(transactionId => {
            const transaction = transactions[transactionId];
            const isNew = (Date.now() - new Date(transaction.timestamp)) < 3 * 60 * 1000;
            const transactionElement = createTransactionElement(transactionId, transaction, isNew);
            transactionsContainer.appendChild(transactionElement);
        });

    } else {
        transactionsContainer.innerHTML = '<p>No transactions found. -_-</p>';
    }
}

function showWalletDetails(walletAddress) {
    if (!walletAddress || walletAddress === 'anonym') return;

    modalWalletAddress.textContent = walletAddress;
    modalWalletBalances.innerHTML = '<em>Loading balances...</em>';
    walletModal.style.display = 'block';

    const walletRef = database.ref('wallets/' + walletAddress);
    walletRef.once('value', snapshot => {
        if (snapshot.exists()) {
            const networks = snapshot.val();
            let balancesHTML = '';
            for (const networkKey in networks) {
                const balance = networks[networkKey].balance || 0;
                balancesHTML += `<p><strong>${networkKey.toUpperCase()}:</strong> ${balance}</p>`;
            }
            modalWalletBalances.innerHTML = balancesHTML || '<p>No balance information found.</p>';
        } else {
            modalWalletBalances.innerHTML = '<p>Wallet data not found on-chain.</p>';
        }
    }).catch(error => {
        modalWalletBalances.innerHTML = `<p style="color:red;">Error fetching wallet data: ${error.message}</p>`;
    });
}

closeButton.onclick = function() {
    walletModal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target == walletModal) {
        walletModal.style.display = "none";
    }
}

function updateSummary(transactions) {
    let totalTransactions = Object.keys(transactions).length;
    let dailyTransactions = 0;
    let totalGasFee = 0;
    let networkTotals = {};
    const today = new Date().toDateString();
    const latestTxElement = document.getElementById('latestTx');
    const latestTxId = Object.keys(transactions).sort((a, b) => 
      new Date(transactions[b].timestamp) - new Date(transactions[a].timestamp)
    )[0];
    if (latestTxId && latestTxElement) {
      const time = new Date(transactions[latestTxId].timestamp).toLocaleTimeString();
      latestTxElement.innerHTML = `🔄 Latest: ${latestTxId.slice(0, 10)}... at ${time}`;
    }

    Object.values(transactions).forEach(transaction => {
        const transactionDate = new Date(transaction.timestamp).toDateString();
        if (transactionDate === today) dailyTransactions++;
        totalGasFee += parseFloat(transaction.gasFee) || 0;
        const network = transaction.network;
        networkTotals[network] = (networkTotals[network] || 0) + 1;
    });
    
    if (totalTransactionsElement) totalTransactionsElement.innerHTML = `<details class="detailstx"><summary>Total Transactions</summary><p>${totalTransactions}</p></details>`;
    if (dailyTransactionsElement) dailyTransactionsElement.innerHTML = `<details class="detailstx"><summary>Transactions Today</summary><p>${dailyTransactions}</p></details>`;
    if (totalGasFeeElement) totalGasFeeElement.innerHTML = `<details class="detailstx"><summary>Total Gas Fee Onchain</summary><p>${totalGasFee.toFixed(6)}</p></details>`;

    if (networkDetailsElement) {
        let networkDetailsHtml = '<details class="detailstx"><summary>Transactions by Network</summary><div>';
        for (const [network, count] of Object.entries(networkTotals)) {
            networkDetailsHtml += `<p><strong>${network.toUpperCase()}:</strong> ${count}</p>`;
        }
        networkDetailsHtml += '</div></details>';
        networkDetailsElement.innerHTML = networkDetailsHtml;
    }
}

function loadAndPaginate(searchQuery = '') {
    const transactionsRef = database.ref('transactions/allnetwork');
    transactionsContainer.innerHTML = 'Loading transactions...';

    transactionsRef.once('value', snapshot => {
        allTransactionsCache = snapshot.val() || {};
        
        updateSummary(allTransactionsCache);

        const filteredTransactions = filterTransactions(searchQuery, allTransactionsCache);
        allTransactionKeys = Object.keys(filteredTransactions).sort((a, b) => {
            return new Date(filteredTransactions[b].timestamp) - new Date(filteredTransactions[a].timestamp);
        });
        
        totalPages = Math.ceil(allTransactionKeys.length / TRANSACTIONS_PER_PAGE);
        currentPage = 1;
        renderCurrentPage();

    }, error => {
        transactionsContainer.innerHTML = `<p>Error fetching transactions: ${error.message}</p>`;
    });
}

function renderCurrentPage() {
    const start = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    const end = start + TRANSACTIONS_PER_PAGE;
    const pageKeys = allTransactionKeys.slice(start, end);
    
    const pageTransactions = pageKeys.reduce((acc, key) => {
        acc[key] = allTransactionsCache[key];
        return acc;
    }, {});

    displayTransactions(pageTransactions);
    updatePaginationControls();
}

function updatePaginationControls() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages || totalPages === 0;
    paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
}

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderCurrentPage();
    }
});

nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        renderCurrentPage();
    }
});

searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    const network = networkFilter.value;
    const filteredTransactions = filterTransactions(query, allTransactionsCache, network);
    allTransactionKeys = Object.keys(filteredTransactions).sort((a, b) => {
        return new Date(filteredTransactions[b].timestamp) - new Date(filteredTransactions[a].timestamp);
    });
    
    totalPages = Math.ceil(allTransactionKeys.length / TRANSACTIONS_PER_PAGE);
    currentPage = 1;
    renderCurrentPage();
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
    });
}

function updateGasFeeETH() {
    var gasFeeRef = database.ref('gasprice/eth/gasFee');
    gasFeeRef.on('value', function(snapshot) {
        var gasFeecv2 = snapshot.val();
        if (gasFeecv2 !== null) {
            gasFeecv2 = parseFloat(gasFeecv2);
            var gasFeeInGwei = gasFeecv2 * 1e4;
            document.getElementById("gasFee").innerText = `ETH Gas: ${gasFeeInGwei.toFixed(2)} Gwei`;
        } else {
            document.getElementById("gasFee").innerText = "ETH Gas: Not Found";
        }
    });
}

function updateGasFeeATOM() {
    var gasFeeRef = database.ref('gasprice/cosmos/gasFee');
    gasFeeRef.on('value', function(snapshot) {
        var gasFeecv2 = snapshot.val();
        if (gasFeecv2 !== null) {
            document.getElementById("gasFeeatom").innerText = `ATOM Gas: ${parseFloat(gasFeecv2).toFixed(6)} ATOM`;
        } else {
            document.getElementById("gasFeeatom").innerText = "ATOM Gas: Not Found";
        }
    });
}

function listenForNewTransactions() {
    const transactionsRef = database.ref('transactions/allnetwork');
    const startTime = Date.now();

    transactionsRef.orderByChild('timestamp').startAt(startTime).on('child_added', (snapshot) => {
        const transactionId = snapshot.key;
        const transaction = snapshot.val();

        if (allTransactionsCache[transactionId]) {
            return;
        }

        allTransactionsCache[transactionId] = transaction;
        allTransactionKeys.unshift(transactionId);

        const transactionElement = createTransactionElement(transactionId, transaction, true);
        transactionsContainer.prepend(transactionElement);

        if (currentPage === 1 && transactionsContainer.children.length > TRANSACTIONS_PER_PAGE) {
            transactionsContainer.lastChild.remove();
        }

        updateSummary(allTransactionsCache);
        totalPages = Math.ceil(allTransactionKeys.length / TRANSACTIONS_PER_PAGE);
        updatePaginationControls();
    });
}
