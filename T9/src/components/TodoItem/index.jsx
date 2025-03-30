import "./style.css";
import trashImage from "./trash.webp"
function TodoItem({ todo, deleteTodo, toggleTodo }) {
    // Complete me
    return (
        <div className="todo-item row">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span className={todo.completed ? "completed" : ""}>
            {todo.text}
          </span>
          <a onClick={() => deleteTodo(todo.id)}>
            <img src={trashImage} alt="Delete" />
          </a>
        </div>
      )

}

export default TodoItem;