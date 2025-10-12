const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",
  authDomain: "dvizh-eacfa.firebaseapp.com",
  projectId: "dvizh-eacfa",
  storageBucket: "dvizh-eacfa.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function clearEvents() {
  try {
    console.log('Вызываю функцию очистки мероприятий...');
    
    const clearAllEvents = httpsCallable(functions, 'clearAllEvents');
    const result = await clearAllEvents();
    
    console.log('Результат:', result.data);
    
    if (result.data.success) {
      console.log(`✅ ${result.data.message}`);
    } else {
      console.log(`❌ Ошибка: ${result.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при вызове функции:', error);
  }
}

clearEvents();


