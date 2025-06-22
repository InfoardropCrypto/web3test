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
const database = firebase.database();
const transactionsContainer = document.getElementById('transactionsContainer');
const searchInput = document.getElementById('searchInput');
const totalTransactionsElement = document.getElementById('totalTransactions');
const dailyTransactionsElement = document.getElementById('dailyTransactions');
const totalGasFeeElement = document.getElementById('totalGasFee');
const networkDetailsElement = document.getElementById('networkDetails');
function filterTransactions(query, transactions) {
    return Object.keys(transactions).filter(transactionId => {
        const transaction = transactions[transactionId];
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

function displayTransactions(transactions) {
    if (transactionsContainer) {
        transactionsContainer.innerHTML = ''; 
    }

    let totalTransactions = 0;
    let dailyTransactions = 0;
    let totalGasFee = 0;
    let networkTotals = {};

    if (transactions && Object.keys(transactions).length > 0) {
        const sortedTransactionIds = Object.keys(transactions).sort((a, b) => {
            return new Date(transactions[b].timestamp) - new Date(transactions[a].timestamp);
        });

        
        
        sortedTransactionIds.forEach(transactionId => {
    const transaction = transactions[transactionId];
    const explorerUrl = generateExplorerUrl(transaction.network, transaction.transactionHash);

    const sender = transaction.sender || 'anonym';
    const recipient = transaction.recipient || 'anonym';
    const memo = transaction.memo || 'encrypted';
    const gasFeeInSmallestUnit = (parseFloat(transaction.gasFee) || 0) * 1e18;

    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction';
    transactionElement.innerHTML = `
        <p><strong>Tx hash:</strong> <span class="long-text" id="tx-${transactionId}">${transactionId}</span> <button onclick="copyToClipboard('${transactionId}')">Copy</button></p>
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
                : transaction.type === 'vote'
                ? 'vote'
                : transaction.type === 'mining'
                ? 'mining'
                : 'send crypto'
        }</p>
        <p><strong>Sender:</strong> ${sender}</p>
        <p><strong>Recipient:</strong> ${recipient}</p>
         <p style="color:#7f7e7ecf;">################################</p>
        <p><strong>Balance Change</strong></p>
        <p><strong>Send:</strong> <font style="color:white;background-color:#cc4d4d;border-radius:100px;">⤴</font>${transaction.amount}</p>
        <p><strong>Received:</strong> <font style="color:white;background-color:#4dcc4d;border-radius:100px;">⤵</font>${transaction.amountReceived}</p>
        <p><strong>Source:</strong> ${transaction.network}</p>
        <p style="color:#7f7e7ecf;">################################</p>
        <p><strong>Memo:</strong> ${memo}</p>
        <p><strong>Gas fee:</strong> ${transaction.gasFee}</p>
        <p><strong>Gwei:</strong> 0.000000000000000001♦»<strong>ATOM:</strong> ${gasFeeInSmallestUnit.toFixed(0)}⚛</p>
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

            const network = transaction.network;
            if (!networkTotals[network]) {
                networkTotals[network] = 0;
            }
            networkTotals[network]++;
});

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

function setupRealtimeTransactions() {
    const transactionsRef = database.ref(`transactions/allnetwork`);

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

searchInput.addEventListener('input', () => {
    setupRealtimeTransactions(); 
});

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        setupRealtimeTransactions();
    } else {
        transactionsContainer.innerHTML = '<p>Please sign in to view transactions.</p>';
    }
});

function updateGasFeeETH() {
    var gasFeeRef = database.ref('gasprice/eth/gasFee');

    gasFeeRef.on('value', function(snapshot) {
        var gasFeecv2 = snapshot.val();

        if (gasFeecv2 !== null) {
            gasFeecv2 = parseFloat(gasFeecv2);

            var gasFeeInGwei = gasFeecv2 * 1e8;

            document.getElementById("gasFee").innerText = 
                gasFeeInGwei.toLocaleString() + " Gwei (~" + gasFeecv2.toFixed(18) + " ETH)";
        } else {
            document.getElementById("gasFee").innerText = "Not Found";
        }
    });
}

function updateGasFeeATOM() {
    var gasFeeRef = database.ref('gasprice/cosmos/gasFee');

    gasFeeRef.on('value', function(snapshot) {
        var gasFeecv2 = snapshot.val();

        if (gasFeecv2 !== null) {
            gasFeecv2 = parseFloat(gasFeecv2);

            var gasFeeInGwei = gasFeecv2 * 1e8;

            document.getElementById("gasFeeatom").innerText = 
                gasFeeInGwei.toLocaleString() + " ATOM (~" + gasFeecv2.toFixed(8) + " ATOM)";
        } else {
            document.getElementById("gasFee").innerText = "Not Found";
        }
    });
}

document.addEventListener("DOMContentLoaded", updateGasFeeETH);
document.addEventListener("DOMContentLoaded", updateGasFeeATOM);

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
    });
}
