<template>
  <div>
    <h1>待办清单</h1>
    <input 
      v-model="newTodo" 
      placeholder="输入待办" 
      @keyup.enter="addTodo" 
    />
    <button @click="addTodo">添加</button>
    
    <ul>
      <li v-for="todo in todoList" :key="todo.id">
        <input 
          type="checkbox" 
          v-model="todo.done" 
          @change="updateTodoStatus(todo)" 
        />
        <span :class="{ done: todo.done }">{{ todo.content }}</span>
        <button @click="deleteTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <button 
      @click="clearCompleted" 
      v-if="todoList.some(t => t.done)"
    >
      清空已完成
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const newTodo = ref('');
const todoList = ref([]);
const apiBaseUrl = 'http://127.0.0.1:3000/api/todos';

onMounted(async () => {
  const res = await axios.get(apiBaseUrl);
  todoList.value = res.data;
});

const addTodo = async () => {
  if (!newTodo.value.trim()) return;
  const res = await axios.post(apiBaseUrl, { content: newTodo.value });
  todoList.value.push(res.data);
  newTodo.value = '';
};

const updateTodoStatus = async (todo) => {
  await axios.put(`${apiBaseUrl}/${todo.id}`, { done: todo.done });
};

const deleteTodo = async (id) => {
  await axios.delete(`${apiBaseUrl}/${id}`);
  todoList.value = todoList.value.filter(t => t.id !== id);
};

const clearCompleted = async () => {
  await axios.delete(apiBaseUrl);
  todoList.value = todoList.value.filter(t => !t.done);
};
</script>

<style>
.done { text-decoration: line-through; color: #999; }
</style>