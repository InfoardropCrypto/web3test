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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // If already initialized
}

const auth = firebase.auth();
const database = firebase.database();

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchSuggestion = document.getElementById('searchSuggestion');
const resultContainer = document.getElementById('resultContainer');

    const detailsElement = document.createElement('details');
    const summaryElement = document.createElement('summary');
    summaryElement.textContent = 'Search History';
    detailsElement.appendChild(summaryElement);

// Real-time search result display
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        searchFiles(query);  // Call the search function as user types
    }
});

function searchFiles(query) {
    const fileMappings = {
        iacdex: { file: 'iac.io', img: 'cryptologo/iac.png', url: 'iacdex.html' },
        iacfinance: { file: 'iac.icfinance.io', img: 'cryptologo/iac.png', url: 'staking.html' },
    };

    const results = Object.entries(fileMappings)
        .filter(([key, _]) => key.toLowerCase().includes(query))
        .map(([_, fileData]) => fileData);

    if (results.length > 0) {
        resultContainer.innerHTML = ''; // Clear previous results
        results.forEach(displayResult);
    } else {
        resultContainer.innerHTML = '<p>No results found.</p>';
    }
}

function displayResult({ file, img, url }) {
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('file-result');

    const imgElement = document.createElement('img');
    imgElement.src = img;
    imgElement.alt = 'Image';
    imgElement.style.width = '50px'; // Adjust as needed
    imgElement.style.margin = '10px';

    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.textContent = file.replace('.html', ''); // Display file name without .html
    linkElement.style.marginLeft = '10px';

    resultDiv.appendChild(imgElement);
    resultDiv.appendChild(linkElement);
    resultContainer.appendChild(resultDiv);
}