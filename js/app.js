'use strict';

// ============================================================================
// StorageManager Module
// ============================================================================
const StorageManager = (function() {
  const STORAGE_PREFIX = 'dashboard_';
  
  function isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('Local Storage is not available:', e.message);
      return false;
    }
  }
  
  function getItem(key, defaultValue = null) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const value = localStorage.getItem(fullKey);
      return value === null ? defaultValue : value;
    } catch (e) {
      console.error(`Error getting item "${key}":`, e.message);
      return defaultValue;
    }
  }
  
  function setItem(key, value) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      localStorage.setItem(fullKey, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        alert('Storage full. Please delete some data to continue.');
      }
      console.error(`Error setting item "${key}":`, e.message);
      return false;
    }
  }
  
  function removeItem(key) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (e) {
      console.error(`Error removing item "${key}":`, e.message);
      return false;
    }
  }
  
  function getObject(key, defaultValue = null) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const json = localStorage.getItem(fullKey);
      if (json === null) return defaultValue;
      return JSON.parse(json);
    } catch (e) {
      console.error(`Error getting object "${key}":`, e.message);
      return defaultValue;
    }
  }
  
  function setObject(key, obj) {
    try {
      const json = JSON.stringify(obj);
      return setItem(key, json);
    } catch (e) {
      console.error(`Error serializing object for key "${key}":`, e.message);
      return false;
    }
  }
  
  return { isAvailable, getItem, setItem, removeItem, getObject, setObject };
})();

// ============================================================================
// GreetingController Module
// ============================================================================
const GreetingController = (function() {
  let userName = '';
  let clockInterval = null;
  let greetingTextElement = null;
  let greetingDateElement = null;
  let greetingTimeElement = null;
  let userNameInputElement = null;
  
  function init() {
    greetingTextElement = document.getElementById('greeting-text');
    greetingDateElement = document.getElementById('greeting-date');
    greetingTimeElement = document.getElementById('greeting-time');
    userNameInputElement = document.getElementById('user-name-input');
    
    userName = StorageManager.getItem('user_name', '');
    if (userNameInputElement && userName) {
      userNameInputElement.value = userName;
    }
    
    if (userNameInputElement) {
      userNameInputElement.addEventListener('input', handleNameInput);
      userNameInputElement.addEventListener('blur', handleNameBlur);
    }
    
    updateTime();
    updateGreeting();
    clockInterval = setInterval(updateTime, 1000);
  }
  
  function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    if (greetingTimeElement) {
      greetingTimeElement.textContent = timeString;
    }
    
    if (greetingDateElement) {
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      greetingDateElement.textContent = dateFormatter.format(now);
    }
    
    updateGreeting();
  }
  
  function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 11) greeting = 'Good Morning';
    else if (hour >= 11 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
    else greeting = 'Good Night';
    
    if (userName) greeting += ', ' + userName;
    
    if (greetingTextElement) {
      greetingTextElement.textContent = greeting;
    }
  }
  
  function handleNameInput(event) {
    userName = sanitizeInput(event.target.value);
    updateGreeting();
  }
  
  function handleNameBlur(event) {
    const sanitizedName = sanitizeInput(event.target.value);
    event.target.value = sanitizedName;
    setUserName(sanitizedName);
  }
  
  function sanitizeInput(input) {
    if (!input) return '';
    return input.trim().replace(/<[^>]*>/g, '').substring(0, 50);
  }
  
  function setUserName(name) {
    userName = sanitizeInput(name);
    StorageManager.setItem('user_name', userName);
    updateGreeting();
  }
  
  function destroy() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  }
  
  return { init, destroy };
})();

// ============================================================================
// TimerController Module
// ============================================================================
const TimerController = (function() {
  let durationMinutes = 25;
  let remainingSeconds = 1500;
  let isRunning = false;
  let intervalId = null;
  
  let timerDisplayElement = null;
  let startButtonElement = null;
  let stopButtonElement = null;
  let resetButtonElement = null;
  let durationInputElement = null;
  let setDurationButtonElement = null;
  let durationErrorElement = null;
  
  function init() {
    timerDisplayElement = document.getElementById('timer-display');
    startButtonElement = document.getElementById('timer-start');
    stopButtonElement = document.getElementById('timer-stop');
    resetButtonElement = document.getElementById('timer-reset');
    durationInputElement = document.getElementById('timer-duration-input');
    setDurationButtonElement = document.getElementById('timer-set-duration');
    durationErrorElement = document.getElementById('timer-duration-error');
    
    const savedDuration = StorageManager.getItem('timer_duration', '25');
    durationMinutes = parseInt(savedDuration, 10);
    remainingSeconds = durationMinutes * 60;
    
    if (startButtonElement) startButtonElement.addEventListener('click', start);
    if (stopButtonElement) stopButtonElement.addEventListener('click', stop);
    if (resetButtonElement) resetButtonElement.addEventListener('click', reset);
    if (setDurationButtonElement) setDurationButtonElement.addEventListener('click', setDuration);
    
    updateDisplay();
    requestNotificationPermission();
  }
  
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  function updateDisplay() {
    if (timerDisplayElement) {
      timerDisplayElement.textContent = formatTime(remainingSeconds);
    }
  }
  
  function updateButtonStates() {
    if (startButtonElement) startButtonElement.disabled = isRunning;
  }
  
  function start() {
    if (isRunning) return;
    if (remainingSeconds <= 0) reset();
    
    isRunning = true;
    updateButtonStates();
    intervalId = setInterval(tick, 1000);
  }
  
  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    updateButtonStates();
  }
  
  function reset() {
    stop();
    remainingSeconds = durationMinutes * 60;
    updateDisplay();
  }
  
  function tick() {
    remainingSeconds--;
    updateDisplay();
    
    if (remainingSeconds <= 0) {
      stop();
      showCompletionNotification();
    }
  }
  
  function setDuration() {
    const inputValue = durationInputElement.value.trim();
    if (durationErrorElement) durationErrorElement.textContent = '';
    
    if (!inputValue) {
      showError('Please enter a duration');
      return;
    }
    
    const duration = parseInt(inputValue, 10);
    if (isNaN(duration) || duration < 1 || duration > 120) {
      showError('Duration must be 1-120 minutes');
      return;
    }
    
    stop();
    durationMinutes = duration;
    StorageManager.setItem('timer_duration', String(duration));
    remainingSeconds = durationMinutes * 60;
    updateDisplay();
    durationInputElement.value = '';
  }
  
  function showError(message) {
    if (durationErrorElement) {
      durationErrorElement.textContent = message;
      setTimeout(() => { durationErrorElement.textContent = ''; }, 3000);
    }
  }
  
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  function showCompletionNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Timer Completed! ⏰', {
        body: 'Your focus session has ended. Time for a break!',
        requireInteraction: false,
        tag: 'timer-completion'
      });
      setTimeout(() => notification.close(), 5000);
    } else {
      alert('Timer completed! ⏰');
    }
  }
  
  return { init, start, stop, reset, setDuration };
})();

// ============================================================================
// ThemeController Module
// ============================================================================
const ThemeController = (function() {
  let currentTheme = 'light';
  let toggleButtonElement = null;
  let iconElement = null;
  
  function init() {
    toggleButtonElement = document.getElementById('theme-toggle');
    iconElement = document.querySelector('.theme-toggle__icon');
    
    currentTheme = StorageManager.getItem('theme', 'light');
    applyTheme(currentTheme);
    
    if (toggleButtonElement) {
      toggleButtonElement.addEventListener('click', toggle);
    }
  }
  
  function toggle() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    StorageManager.setItem('theme', currentTheme);
  }
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (iconElement) {
      iconElement.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }
  
  return { init, toggle };
})();

// ============================================================================
// TaskController Module
// ============================================================================
const TaskController = (function() {
  let tasks = [];
  let taskListElement = null;
  let taskFormElement = null;
  let taskInputElement = null;
  
  function init() {
    taskListElement = document.getElementById('task-list');
    taskFormElement = document.getElementById('task-form');
    taskInputElement = document.getElementById('task-input');
    
    tasks = StorageManager.getObject('tasks', []);
    
    if (taskFormElement) {
      taskFormElement.addEventListener('submit', handleSubmit);
    }
    
    renderTasks();
  }
  
  function handleSubmit(e) {
    e.preventDefault();
    const text = taskInputElement.value.trim();
    if (text) {
      addTask(text);
      taskInputElement.value = '';
    }
  }
  
  function addTask(text) {
    const task = {
      id: Date.now() + Math.random(),
      text: sanitizeInput(text),
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
    saveTasks();
    renderTasks();
  }
  
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    }
  }
  
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
  
  function saveTasks() {
    StorageManager.setObject('tasks', tasks);
  }
  
  function renderTasks() {
    if (!taskListElement) return;
    
    taskListElement.innerHTML = '';
    
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-item__checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => toggleTask(task.id));
      
      const span = document.createElement('span');
      span.className = 'task-item__text';
      span.textContent = task.text;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'button button--danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteTask(task.id));
      
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      taskListElement.appendChild(li);
    });
  }
  
  function sanitizeInput(input) {
    return input.replace(/<[^>]*>/g, '').substring(0, 500);
  }
  
  return { init };
})();

// ============================================================================
// LinkController Module
// ============================================================================
const LinkController = (function() {
  let links = [];
  let linkListElement = null;
  let linkFormElement = null;
  let linkNameInput = null;
  let linkUrlInput = null;
  
  function init() {
    linkListElement = document.getElementById('link-list');
    linkFormElement = document.getElementById('link-form');
    linkNameInput = document.getElementById('link-name-input');
    linkUrlInput = document.getElementById('link-url-input');
    
    links = StorageManager.getObject('links', []);
    
    if (linkFormElement) {
      linkFormElement.addEventListener('submit', handleSubmit);
    }
    
    renderLinks();
  }
  
  function handleSubmit(e) {
    e.preventDefault();
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();
    if (name && url) {
      addLink(name, url);
      linkNameInput.value = '';
      linkUrlInput.value = '';
    }
  }
  
  function addLink(name, url) {
    let fullUrl = url;
    if (!url.match(/^https?:\/\//)) {
      fullUrl = 'https://' + url;
    }
    
    const link = {
      id: Date.now() + Math.random(),
      name: sanitizeInput(name),
      url: fullUrl,
      createdAt: new Date().toISOString()
    };
    links.push(link);
    saveLinks();
    renderLinks();
  }
  
  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveLinks();
    renderLinks();
  }
  
  function saveLinks() {
    StorageManager.setObject('links', links);
  }
  
  function renderLinks() {
    if (!linkListElement) return;
    
    linkListElement.innerHTML = '';
    
    links.forEach(link => {
      const div = document.createElement('div');
      div.className = 'link-item';
      
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-item__button';
      a.textContent = link.name;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'link-item__delete button button--danger';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => deleteLink(link.id));
      
      div.appendChild(a);
      div.appendChild(deleteBtn);
      linkListElement.appendChild(div);
    });
  }
  
  function sanitizeInput(input) {
    return input.replace(/<[^>]*>/g, '').substring(0, 100);
  }
  
  return { init };
})();

// ============================================================================
// AppInitializer Module
// ============================================================================
const AppInitializer = (function() {
  function init() {
    if (!StorageManager.isAvailable()) {
      console.warn('Local Storage is not available. Data will not persist.');
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
      initializeApp();
    }
  }
  
  function initializeApp() {
    try {
      GreetingController.init();
      TimerController.init();
      ThemeController.init();
      TaskController.init();
      LinkController.init();
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      alert('Failed to initialize application. Please refresh the page.');
    }
  }
  
  return { init };
})();

// Bootstrap the application
AppInitializer.init();