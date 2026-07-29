// =========================================
// 1. SELECT ELEMENTS FROM THE DOM
// We grab references once, at the top, so we
// don't have to re-query the DOM every time.
// =========================================
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyMessage = document.getElementById('emptyMessage');

// =========================================
// 2. STATE
// We keep tasks in a simple array. This isn't
// strictly required for this small app (the DOM
// itself holds the state), but it's good practice
// and makes features like "save to localStorage" easy later.
// =========================================
let tasks = []; // each task: { id, text, completed }

// =========================================
// 3. RENDER FUNCTION
// Instead of manually adding/removing single elements
// in many places, we re-draw the whole list from the
// `tasks` array every time something changes.
// This is the core idea behind frameworks like React,
// just done by hand here.
// =========================================
function render() {
  // Clear the current list
  taskList.innerHTML = '';

  // Show/hide the "no tasks" message
  emptyMessage.classList.toggle('hidden', tasks.length > 0);

  tasks.forEach((task) => {
    // Create the <li> row
    const li = document.createElement('li');
    li.className = 'task-item';

    // Task text (clicking toggles "completed")
    const span = document.createElement('span');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.textContent = task.text;
    // data-id lets us know which task this element belongs to
    span.dataset.id = task.id;
    span.dataset.action = 'toggle';

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.dataset.id = task.id;
    delBtn.dataset.action = 'delete';

    li.appendChild(span);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

// =========================================
// 4. ADD TASK
// =========================================
function addTask() {
  const text = taskInput.value.trim(); // trim() removes leading/trailing spaces

  if (text === '') return; // ignore empty input

  tasks.push({
    id: Date.now(),   // Date.now() gives a quick, unique-enough id
    text: text,
    completed: false
  });

  taskInput.value = ''; // clear the input box
  taskInput.focus();    // keep focus so user can keep typing
  render();
}

// "Add" button click
addBtn.addEventListener('click', addTask);

// Also allow pressing Enter inside the input field
taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // preventDefault stops the default browser behavior
    // (here, mostly relevant if this input were inside a <form>)
    event.preventDefault();
    addTask();
  }
});

// =========================================
// 5. TOGGLE COMPLETE / DELETE — via EVENT DELEGATION
//
// Instead of adding a click listener to every single
// task/button (which would need re-attaching every time
// we re-render), we add ONE listener to the parent <ul>.
// Clicks on any child "bubble up" to the <ul>, and we check
// event.target to see what was actually clicked.
// This is called "event delegation."
// =========================================
taskList.addEventListener('click', (event) => {
  const el = event.target;
  const id = Number(el.dataset.id);
  const action = el.dataset.action;

  if (!action) return; // click wasn't on something interactive

  if (action === 'toggle') {
    const task = tasks.find((t) => t.id === id);
    task.completed = !task.completed; // flip true/false
  }

  if (action === 'delete') {
    tasks = tasks.filter((t) => t.id !== id); // keep everything except this one
  }

  render();
});

// =========================================
// 6. INITIAL RENDER
// Draws the empty state when the page first loads.
// =========================================
render();