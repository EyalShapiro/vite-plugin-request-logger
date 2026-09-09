import type { Data } from "./+data";
import { createSignal, For, untrack } from "solid-js";
import { useData } from "vike-solid/useData";

export function TodoList() {
  const { todoItemsInitial } = useData<Data>();
  const [todoItems, setTodoItems] = createSignal<{ text: string }[]>(todoItemsInitial);
  const [newTodo, setNewTodo] = createSignal("");
  return (
    <>
      <ul>
        <For each={todoItems()}>{(todoItem) => <li>{todoItem.text}</li>}</For>
      </ul>
      <div>
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();

            const text = untrack(newTodo);
            setTodoItems((prev) => [...prev, { text }]);
            setNewTodo("");
          }}
        >
          <input type="text" onChange={(ev) => setNewTodo(ev.target.value)} value={newTodo()} />
          <button type="submit">Add to-do</button>
        </form>
      </div>
    </>
  );
}
