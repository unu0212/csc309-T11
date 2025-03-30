import "./App.css";
import { useState } from "react"
import NewTodo from "./components/NewTodo"
import TodoItem from "./components/TodoItem"
// You can use this to seed your TODO list
const seed = [
    { id: 0, text: "Submit assignment 2", completed: false },
    { id: 1, text: "Reschedule the dentist appointment", completed: false },
    { id: 2, text: "Prepare for CSC309 exam", completed: false },
    { id: 3, text: "Find term project partner", completed: true },
    { id: 4, text: "Learn React Hooks", completed: false },
];

function App() {
    // Complete me
    const [todos, setTodos] = useState(seed);

  function addTodo(newText) {
    if (!newText.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newText.trim(), completed: false }]);
  }

  function toggleTodo(id) {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }

  function deleteTodo(id) {
    setTodos(todos.filter(todo => todo.id !== id));
  }

  return (
    <div className="app">
      <h1>My ToDos</h1>
      <NewTodo addTodo={addTodo} />
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
        />
      ))}
    </div>
  );
}

export default App;
