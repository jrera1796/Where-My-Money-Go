let db;
// establish a connection to IndexedDB database
const request = indexedDB.open('budget_money', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database 
  const db = event.target.result;
  // create an object store (table)
  db.createObjectStore('new_payment', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online
  if (navigator.onLine) {
    uploadPayment();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions 
  const transaction = db.transaction(['new_payment'], 'readwrite');

  const paymentObjectStore = transaction.objectStore('new_payment');

  // add record to your store with add method
  paymentObjectStore.add(record);
}

function uploadPayment() {
  // open a transaction on your db
  const transaction1 = db.transaction(['new_payment'], 'readwrite');

  // access your object store
  const paymentObjectStore = transaction1.objectStore('new_payment');

  // get all records from store and set to a variable
  const getAll = paymentObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
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

          alert('All transactions uploaded!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}
// listen for app coming back online
window.addEventListener('online', uploadPayment);