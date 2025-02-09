const API_KEY = 'a9368cc05f4145069af922c2e751e8a4'; 
let expenses = JSON.parse(localStorage.getItem('data')) || {}; 
let chart = null;
let defaultCurrency = 'INR'; 
let selectedMonth = localStorage.getItem('selectedMonth') || getCurrentMonthYear(); 

function getCurrentMonthYear() {
    const date = new Date();
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}


async function initCurrencies() {
    const currencySelect = document.getElementById('expenseCurrency');
    currencySelect.innerHTML = ''; 

    try {
        const response = await fetch(`https://openexchangerates.org/api/currencies.json?app_id=${API_KEY}`);
        const currencies = await response.json();

        for (const currencyCode in currencies) {
            const option = document.createElement('option');
            option.value = currencyCode;
            option.textContent = `${currencyCode} - ${currencies[currencyCode]}`;
            currencySelect.appendChild(option);
        }

        document.getElementById('expenseCurrency').value = defaultCurrency; 
    } catch (error) {
        console.error('Error fetching currencies:', error);
    }
}

// Convert the currency
async function convertCurrency(amount, from, to) {
    if (from === to) return amount;  

    try {
        const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${API_KEY}`);
        const data = await response.json();

        const fromRate = data.rates[from];
        const toRate = data.rates[to];

        if (!fromRate || !toRate) {
            console.error('Currency rate not found');
            return amount; 
        }

        const amountInINR = amount / fromRate;  
        return amountInINR * toRate; 
    } catch (error) {
        console.error('Error converting currency:', error);
        return amount;  
    }
}


function saveExpenses() {
    localStorage.setItem('data', JSON.stringify(expenses));
    localStorage.setItem('selectedMonth', selectedMonth);
    renderExpenses();
    updateChart();
    updateTotalExpense();
    renderMonthSidebar();
}


function renderExpenses() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '';

    const monthExpenses = expenses[selectedMonth] || [];
    monthExpenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = ` 
            <div>
                <h3>${expense.name}</h3>
                <small>${new Date(expense.date).toLocaleDateString()}</small>
            </div>
            <div>
                <span class="amount">${expense.amount.toFixed(2)} ₹</span>
                <span class="category">${expense.category}</span>
                <button class="delete-expense" data-index="${index}">Delete</button>
            </div>
        `;
        list.appendChild(li);
    });

   
    document.querySelectorAll('.delete-expense').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            expenses[selectedMonth].splice(index, 1);
            saveExpenses();
        });
    });
}


function updateChart() {
    if (chart) chart.destroy();
    const categories = [...new Set(expenses[selectedMonth]?.map(e => e.category) || [])];
    const data = categories.map(category => 
        expenses[selectedMonth].filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
    );

    chart = new Chart(document.getElementById('chart').getContext('2d'), {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data,
                backgroundColor: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b']
            }]
        }
    });
}


function updateTotalExpense() {
    const totalAmount = (expenses[selectedMonth] || []).reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('totalAmount').textContent = `${totalAmount.toFixed(2)} ₹`;
    document.getElementById('currentMonth').textContent = selectedMonth;
}


function renderMonthSidebar() {
    const sidebar = document.getElementById('monthList');
    sidebar.innerHTML = '';

    Object.keys(expenses).reverse().forEach(month => {
        const button = document.createElement('div');
        button.className = 'sidebar-month-button';
        button.textContent = month;
        button.addEventListener('click', () => {
            selectedMonth = month;
            document.getElementById('currentMonth').textContent = selectedMonth;
            document.getElementById('sidebar').classList.remove('open');
            saveExpenses();
            renderExpenses();
            updateChart();
            updateTotalExpense();
        });
        sidebar.appendChild(button);
    });
}


function showSidebar() {
    document.getElementById('sidebar').classList.add('open');
}

function hideSidebar() {
    document.getElementById('sidebar').classList.remove('open');
}


document.getElementById('previousMonthBtn').addEventListener('click', showSidebar);
document.getElementById('closeSidebar').addEventListener('click', hideSidebar);


document.getElementById('expenseForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const expenseName = document.getElementById('expenseName').value;
    const expenseAmount = parseFloat(document.getElementById('expenseAmount').value);
    const expenseCategory = document.getElementById('expenseCategory').value;
    const expenseCurrency = document.getElementById('expenseCurrency').value;

    const convertedAmount = await convertCurrency(expenseAmount, expenseCurrency, defaultCurrency); // Convert to INR

    if (!expenses[selectedMonth]) {
        expenses[selectedMonth] = [];
    }

    expenses[selectedMonth].push({
        name: expenseName,
        amount: convertedAmount,
        category: expenseCategory,
        date: new Date()
    });

    saveExpenses();
    document.getElementById('expenseForm').reset();
});


async function initialize() {
    await initCurrencies();  
    renderExpenses();
    updateChart();
    updateTotalExpense();
    renderMonthSidebar();
}

document.addEventListener('DOMContentLoaded', () => {
    initialize();
});
