let db;
const request = indexedDB.open('budget_money', 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore('new_payment', { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadPayment();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['new_payment'], 'readwrite');
  const paymentObjectStore = transaction.objectStore('new_payment');
  paymentObjectStore.add(record);
}

function uploadPayment() {
  const transaction1 = db.transaction(['new_payment'], 'readwrite');
  const paymentObjectStore = transaction1.objectStore('new_payment');
  const getAll = paymentObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_payment'], 'readwrite');
          const paymentObjectStore = transaction.objectStore('new_payment');
          paymentObjectStore.clear();
          const notification = document.getElementById('notification')
          notification.style="display:block"
          // alert('Your offline transactions have been synced to your account');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}
window.addEventListener('online', uploadPayment);