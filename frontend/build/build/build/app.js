const API_URL = 'https://k-point-evaluation-app-tunnel-724niz8c.devinapps.com';

const API_USERNAME = 'user';
const API_PASSWORD = '83f53df0a60aa5bb5de09afce2f7e7a8';

async function login(email, password) {
  try {
    const basicAuth = 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`);
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('ログインに失敗しました');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function getTransactions() {
  try {
    const token = localStorage.getItem('token');
    const basicAuth = 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`);
    
    const response = await fetch(`${API_URL}/api/transactions`, {
      headers: {
        'Authorization': basicAuth,
        'X-User-Token': token // Send JWT token as a custom header
      },
    });
    
    if (!response.ok) {
      throw new Error('取引履歴の取得に失敗しました');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get transactions error:', error);
    return [];
  }
}

async function sendTransaction(recipientId, amount, reason) {
  try {
    const token = localStorage.getItem('token');
    const basicAuth = 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`);
    
    const response = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth,
        'X-User-Token': token // Send JWT token as a custom header
      },
      body: JSON.stringify({ recipientId, amount, reason }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'トランザクションの送信に失敗しました');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Send transaction error:', error);
    throw error;
  }
}

function showTab(tabId) {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById(tabId).classList.add('active');
  
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent.toLowerCase().includes(tabId)) {
      tab.classList.add('active');
    }
  });
}

function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        await login(email, password);
        showTab('employee');
        showNotification('ログインに成功しました');
      } catch (error) {
        showNotification('ログインに失敗しました: ' + error.message, true);
      }
    });
  }
  
  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const recipient = document.getElementById('recipient').value;
      const amount = parseInt(document.getElementById('amount').value);
      const reason = document.getElementById('reason').value;
      
      if (!recipient || recipient === '同僚を選択') {
        showNotification('受取人を選択してください', true);
        return;
      }
      
      if (!reason || reason.length < 10 || reason.length > 200) {
        showNotification('理由は10〜200文字で入力してください', true);
        return;
      }
      
      try {
        await sendTransaction(recipient, amount, reason);
        document.getElementById('transfer-form').style.display = 'none';
        showNotification('Kポイントを送信しました');
        
      } catch (error) {
        showNotification('送信に失敗しました: ' + error.message, true);
      }
    });
  }
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    const userData = JSON.parse(user);
    if (userData.role === 'ADMIN') {
      showTab('admin');
    } else {
      showTab('employee');
    }
  }
});
