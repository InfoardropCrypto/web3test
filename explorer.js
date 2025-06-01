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
const database = firebase.database();

// DOM elements
const transactionsContainer = document.getElementById('transactionsContainer');
const searchInput = document.getElementById('searchInput');
const totalTransactionsElement = document.getElementById('totalTransactions');
const dailyTransactionsElement = document.getElementById('dailyTransactions');
const totalGasFeeElement = document.getElementById('totalGasFee');
const networkDetailsElement = document.getElementById('networkDetails');

// Function to filter transactions based on search query
function filterTransactions(query, transactions) {
    return Object.keys(transactions).filter(transactionId => {
        const transaction = transactions[transactionId];
        
        // Convert values to string and then apply toLowerCase
        const transactionIdStr = transactionId.toLowerCase();
        const networkStr = (transaction.network || '').toLowerCase();
        const senderStr = (transaction.sender || '').toLowerCase();
        const recipientStr = (transaction.recipient || '').toLowerCase();
        const amountStr = (transaction.amount || '').toString().toLowerCase();
        const amountReceivedStr = (transaction.amountReceived || '').toString().toLowerCase();
        const memoStr = (transaction.memo || '').toString().toLowerCase();
        const gasFeeStr = (transaction.gasFee || '').toString().toLowerCase();
        const timestampStr = (transaction.timestamp || '').toLowerCase();
        
        return (
            transactionIdStr.includes(query) ||
            networkStr.includes(query) ||
            senderStr.includes(query) ||
            recipientStr.includes(query) ||
            amountStr.includes(query) ||
            amountReceivedStr.includes(query) ||
            memoStr.includes(query) ||
            gasFeeStr.includes(query) ||
            timestampStr.includes(query)
        );
    }).reduce((filtered, transactionId) => {
        filtered[transactionId] = transactions[transactionId];
        return filtered;
    }, {});
}

// Function to display transactions
function displayTransactions(transactions) {
    if (transactionsContainer) {
        transactionsContainer.innerHTML = ''; // Clear previous transactions
    }

    let totalTransactions = 0;
    let dailyTransactions = 0;
    let totalGasFee = 0;
    let networkTotals = {};

    if (transactions && Object.keys(transactions).length > 0) {
        // Sort transactions by timestamp in descending order
        const sortedTransactionIds = Object.keys(transactions).sort((a, b) => {
            return new Date(transactions[b].timestamp) - new Date(transactions[a].timestamp);
        });

        
        
        sortedTransactionIds.forEach(transactionId => {
    const transaction = transactions[transactionId];
    const explorerUrl = generateExplorerUrl(transaction.network, transaction.transactionHash);

    const sender = transaction.sender || 'anonym';
    const recipient = transaction.recipient || 'anonym';
    const memo = transaction.memo || 'encrypted';

    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction';
    transactionElement.innerHTML = `
        <p><strong>Tx hash:</strong> <span class="long-text">${transactionId}</span></p>
        <p><strong>Type:</strong> ${
            transaction.type === 'swap'
                ? 'swap'
                : transaction.type === 'bridge'
                ? 'bridge'
                : transaction.type === 'stake'
                ? 'stake'
                : transaction.type === 'unstake'
                ? 'unstake'
                : transaction.type === 'claim'
                ? 'claim'
                : transaction.type === 'lupypump'
                ? 'lupypump'
                : transaction.type === 'mining'
                ? 'mining'
                : 'send crypto'
        }</p>
        <p><strong>Source:</strong> ${transaction.network}</p>
        <p><strong>Sender:</strong> ${sender}</p>
        <p><strong>Recipient:</strong> ${recipient}</p>
        <p><strong>Send:</strong> ${transaction.amount}</p>
        <p><strong>Received:</strong> ${transaction.amountReceived}</p>
        <p><strong>Memo:</strong> ${memo}</p>
        <p><strong>Gas fee:</strong> ${transaction.gasFee}</p>
        <p><strong>Success : </strong><a style="color:green;font-family:monospace;">true</a></p>
        <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ${new Date(transaction.timestamp).toLocaleDateString('en-GB')}</p>
        <hr>
    `;
    transactionsContainer.appendChild(transactionElement);
    totalTransactions++;
            const transactionDate = new Date(transaction.timestamp).toDateString();
            const today = new Date().toDateString();
            if (transactionDate === today) {
                dailyTransactions++;
            }
            totalGasFee += parseFloat(transaction.gasFee) || 0;

            // Update network totals
            const network = transaction.network;
            if (!networkTotals[network]) {
                networkTotals[network] = 0;
            }
            networkTotals[network]++;
});

        // Update totals display
        if (totalTransactionsElement) {
            totalTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Network (Transactions) </summary>
                    <p>${totalTransactions}</p>
                </details>
            `;
        }
        if (dailyTransactionsElement) {
            dailyTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Transactions Today</summary>
                    <p>${dailyTransactions}</p>
                </details>
            `;
        }
        if (totalGasFeeElement) {
            totalGasFeeElement.innerHTML = `
                <details class="detailstx">
                    <summary>Total Gasfee Onchain</summary>
                    <p>${totalGasFee.toFixed(2)}</p>
                </details>
            `;
        }

        // Display network totals
        if (networkDetailsElement) {
            let networkDetailsHtml = '<details class="detailstx"><summary>Transaction Totals by Network</summary><div>';
            for (const [network, count] of Object.entries(networkTotals)) {
                networkDetailsHtml += `<p><strong>${network.toUpperCase()}:</strong> ${count} transactions</p>`;
            }
            networkDetailsHtml += '</div></details>';
            networkDetailsElement.innerHTML = networkDetailsHtml;
        }
    } else {
        if (transactionsContainer) {
            transactionsContainer.innerHTML = '<p>No transactions found. -_-</p>';
        }
        if (totalTransactionsElement) {
            totalTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Total Transactions</summary>
                    <p>Total Transactions: 0</p>
                </details>
            `;
        }
        if (dailyTransactionsElement) {
            dailyTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Transactions Today</summary>
                    <p>Transactions Today: 0</p>
                </details>
            `;
        }
        if (totalGasFeeElement) {
            totalGasFeeElement.innerHTML = `
                <details class="detailstx">
                    <summary>Total Gasfee Onchain</summary>
                    <p>Total Gas Fee: 0.00</p>
                </details>
            `;
        }
        if (networkDetailsElement) {
            networkDetailsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Transaction Totals by Network</summary>
                    <p>No network data available.</p>
                </details>
            `;
        }
    }
}

// Function to handle search input and real-time updates
function setupRealtimeTransactions() {
    const transactionsRef = database.ref(`transactions/allnetwork`);

    // Use 'on' for real-time updates
    transactionsRef.on('value', snapshot => {
        const transactions = snapshot.val();
        const query = searchInput.value.toLowerCase();
        const filteredTransactions = filterTransactions(query, transactions);
        displayTransactions(filteredTransactions);
    }, error => {
        transactionsContainer.innerHTML = `<p>Error fetching transactions: ${error.message}</p>`;
    });
}

function generateExplorerUrl(network, transactionHash) {
    let baseUrl;

    switch (network) {
        case 'btc':
            baseUrl = 'https://explorer.btc.com/tx/';
            break;
        default:
            baseUrl = '#';
    }

    return `${baseUrl}${transactionHash}`;
}

// Add event listener to search input
searchInput.addEventListener('input', () => {
    // When the search input changes, trigger the real-time update logic
    setupRealtimeTransactions(); 
});

// Call the function to set up real-time transaction updates
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        setupRealtimeTransactions(); // Setup real-time listener on load
    } else {
        transactionsContainer.innerHTML = '<p>Please sign in to view transactions.</p>';
    }
});

function updateGasFee() {
    var gasFeeRef = database.ref('gasprice/eth/gasFee');

    gasFeeRef.on('value', function(snapshot) {
        var gasFeeInEth = snapshot.val(); // Data dari Firebase dalam ETH

        if (gasFeeInEth !== null) {
            gasFeeInEth = parseFloat(gasFeeInEth); // Pastikan nilainya angka

            var gasFeeInGwei = gasFeeInEth * 1e8; // Konversi ETH ke Gwei

            document.getElementById("gasFee").innerText = 
                gasFeeInGwei.toLocaleString() + " Gwei (~" + gasFeeInEth.toFixed(5) + " ETH)";
        } else {
            document.getElementById("gasFee").innerText = "Not Found";
        }
    });
}

// Panggil fungsi updateGasFee saat halaman dimuat
document.addEventListener("DOMContentLoaded", updateGasFee);
