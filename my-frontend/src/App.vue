<template>
  <div class="todo-app">
    <!-- 顶部标题（极简风格） -->
    <header class="app-header">
      <h1>待办清单</h1>
    </header>

    <!-- 输入区域（参考 flomo 顶部常驻输入框） -->
    <div class="input-area">
      <textarea
        v-model="newTodo"
        placeholder="添加新的待办事项...（回车添加，Shift+回车换行）"
        @keydown.enter.exact="addTodo"
        @keydown.enter.shift.exact="() => newTodo += '\n'"
        class="todo-input"
        rows="1"
        :style="{ minHeight: inputHeight + 'px' }"
        @input="adjustInputHeight"
      />
      <button 
        @click="addTodo" 
        class="add-btn"
        :disabled="!newTodo.trim()"
      >
        添加
      </button>
    </div>

    <!-- 分栏容器：左未完成，右已完成 -->
    <div class="columns-container">
      <!-- 左侧：未完成待办 -->
      <div class="column">
        <h2>未完成 <span class="count">{{ activeCount }}</span></h2>
        <!-- 未完成空状态 -->
        <div class="empty-state" v-if="activeTodos.length === 0">
          <p>暂无未完成事项</p>
          <p class="hint">添加你的第一个任务吧</p>
        </div>
        <!-- 未完成列表（保留颜色错位） -->
        <ul class="todo-list" v-else>
          <li 
            v-for="(todo, index) in activeTodos" 
            :key="todo.id" 
            class="todo-item"
            :class="{ odd: index % 2 === 0, even: index % 2 === 1 }"
          >
            <input
              type="checkbox"
              v-model="todo.done"
              @change="updateTodoStatus(todo)"
              class="todo-checkbox"
            />
            <div class="todo-content" v-html="todo.content.replace(/\n/g, '<br>')"></div>
            <button @click="deleteTodo(todo.id)" class="delete-btn">删除</button>
          </li>
        </ul>
      </div>

      <!-- 右侧：已完成待办 -->
      <div class="column">
        <h2>已完成 <span class="count">{{ completedCount }}</span></h2>
        <!-- 已完成空状态 -->
        <div class="empty-state" v-if="completedTodos.length === 0">
          <p>暂无已完成事项</p>
          <p class="hint">完成任务后会显示在这里</p>
        </div>
        <!-- 已完成列表（保留颜色错位） -->
        <ul class="todo-list" v-else>
          <li 
            v-for="(todo, index) in completedTodos" 
            :key="todo.id" 
            class="todo-item"
            :class="{ odd: index % 2 === 0, even: index % 2 === 1 }"
          >
            <input
              type="checkbox"
              v-model="todo.done"
              @change="updateTodoStatus(todo)"
              class="todo-checkbox"
            />
            <div class="todo-content" v-html="todo.content.replace(/\n/g, '<br>')"></div>
            <button @click="deleteTodo(todo.id)" class="delete-btn">删除</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 底部清除按钮 -->
    <div class="footer" v-if="completedTodos.length > 0">
      <button @click="clearCompleted" class="clear-btn">清除已完成</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

// 响应式数据
const newTodo = ref('');
const todoList = ref([]);
const inputHeight = ref(40); // 输入框初始高度
const apiBaseUrl = 'http://127.0.0.1:3000/api/todos';

// 计算属性：分离未完成/已完成待办（核心分栏逻辑）
const activeTodos = computed(() => todoList.value.filter(todo => !todo.done));
const completedTodos = computed(() => todoList.value.filter(todo => todo.done));

// 统计数量
const activeCount = computed(() => activeTodos.value.length);
const completedCount = computed(() => completedTodos.value.length);

// 初始化加载数据
onMounted(async () => {
  try {
    const res = await axios.get(apiBaseUrl);
    todoList.value = res.data;
  } catch (err) {
    console.error('加载失败：', err);
  }
});

// 调整输入框高度（随内容自动伸缩）
const adjustInputHeight = (e) => {
  const textarea = e.target;
  textarea.style.height = 'auto'; // 重置高度
  inputHeight.value = Math.min(textarea.scrollHeight, 120); // 最大高度限制
};

// 添加待办（支持换行）
const addTodo = async () => {
  const content = newTodo.value.trim();
  if (!content) return;

  try {
    const res = await axios.post(apiBaseUrl, { content });
    todoList.value.push(res.data);
    newTodo.value = ''; // 清空输入框
    inputHeight.value = 40; // 重置高度
  } catch (err) {
    console.error('添加失败：', err);
  }
};

// 更新待办状态（勾选后自动切换列）
const updateTodoStatus = async (todo) => {
  try {
    await axios.put(`${apiBaseUrl}/${todo.id}`, { done: todo.done });
  } catch (err) {
    console.error('更新失败：', err);
    todo.done = !todo.done; // 失败回滚
  }
};

// 删除待办
const deleteTodo = async (id) => {
  try {
    await axios.delete(`${apiBaseUrl}/${id}`);
    todoList.value = todoList.value.filter(t => t.id !== id);
  } catch (err) {
    console.error('删除失败：', err);
  }
};

// 清空已完成
const clearCompleted = async () => {
  try {
    await axios.delete(apiBaseUrl);
    todoList.value = todoList.value.filter(t => !t.done);
  } catch (err) {
    console.error('清空失败：', err);
  }
};
</script>

<style scoped>
/* 全局样式：极简无装饰 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.todo-app {
  max-width: 1000px; /* 加宽容器适配两列 */
  margin: 2rem auto;
  padding: 0 1.5rem;
}

/* 标题：轻量无装饰 */
.app-header {
  margin-bottom: 2rem;
}

.app-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  letter-spacing: -0.02em;
}

/* 输入区域：参考 flomo 顶部输入框 */
.input-area {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 2rem;
  align-items: flex-end;
}

.todo-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.todo-input:focus {
  border-color: #6366f1; /* 淡紫色边框（flomo 常用柔和强调色） */
}

.add-btn {
  padding: 0.8rem 1.2rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.add-btn:hover {
  background-color: #4f46e5;
}

.add-btn:disabled {
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

/* 分栏核心样式：左右等宽 */
.columns-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem; /* 两列间距 */
  margin-bottom: 2rem;
}

/* 列样式：加轻微背景和圆角，区分两列 */
.column {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 列标题：带数量标签 */
.column h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 数量标签样式 */
.count {
  font-size: 0.9rem;
  font-weight: normal;
  background-color: #6366f1;
  color: white;
  padding: 0.1rem 0.6rem;
  border-radius: 12px;
}

/* 待办列表：无边框/分隔线，靠间距区分 */
.todo-list {
  list-style: none;
}

/* 待办项基础样式（保留你原本的内边距和圆角） */
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
}

/* 保留颜色错位：奇数行浅蓝，偶数行浅黄（按列内索引排序） */
.todo-item.odd {
  background-color: #f0f9ff; /* 浅蓝底色 */
}
.todo-item.even {
  background-color: #fef3c7; /* 浅黄底色 */
}

/* 鼠标悬停加深颜色 */
.todo-item.odd:hover {
  background-color: #e0f2fe;
}
.todo-item.even:hover {
  background-color: #fde68a;
}

/* 已完成项特殊样式（仅文字变化，保留颜色错位） */
.column:last-child .todo-content {
  color: #9ca3af;
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}
.column:last-child .todo-item {
  opacity: 0.8;
}

/* 复选框：极简样式 */
.todo-checkbox {
  margin-top: 0.3rem;
  width: 1.1rem;
  height: 1.1rem;
  accent-color: #6366f1;
  cursor: pointer;
}

/* 待办内容：明确左对齐 */
.todo-content {
  flex: 1;
  font-size: 1rem;
  color: #111827;
  line-height: 1.5;
  padding: 0.2rem 0;
  white-space: pre-wrap;
  text-align: left;
  margin-left: 0;
}

/* 删除按钮：默认隐藏，hover 显示 */
.delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 0.9rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  align-self: center;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #dc2626;
}

/* 空状态：调整为列内居中 */
.empty-state {
  padding: 3rem 0;
  text-align: center;
  color: #9ca3af;
}

.empty-state .hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #d1d5db;
}

/* 底部清除按钮 */
.footer {
  display: flex;
  justify-content: center; /* 居中显示 */
  margin-top: 1rem;
}

.clear-btn {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.clear-btn:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* 响应式：手机端自动堆叠为单列 */
@media (max-width: 768px) {
  .columns-container {
    grid-template-columns: 1fr; /* 单列显示 */
  }
}
</style>