import "./style.css";
import { useState } from "react"

function NewTodo({addTodo}) {
    // Complete me  
  const [inputValue, setInputValue] = useState("")

  function handleSubmit() {
    addTodo(inputValue)
    setInputValue("")
  }

  return (
    <div className="new-todo row">
      <input
        type="text"
        placeholder="Enter a new task"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
      />
      <button onClick={handleSubmit}>+</button>
    </div>
  )
}

export default NewTodo;
