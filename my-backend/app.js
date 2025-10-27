const express = require('express');
const cors = require('cors');
const jsonfile = require('jsonfile');
const path = require('path');

// 初始化 Express 应用
const app = express();
const port = 3000;

// 数据文件路径（确保 todos.json 在后端根目录）
const todoFilePath = path.join(__dirname, 'todos.json');

// 中间件配置（必须在接口之前）
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析 JSON 格式的请求体

// 1. 获取所有待办事项（GET）
app.get('/api/todos', (req, res) => {
  jsonfile.readFile(todoFilePath, (err, data) => {
    if (err) {
      console.error('读取数据失败：', err);
      return res.status(500).json({ message: '读取待办数据失败' });
    }
    res.status(200).json(data.todos);
  });
});

// 2. 添加新待办事项（POST）- 核心修改：新增 createTime 存储
app.post('/api/todos', (req, res) => {
  const { content, createTime } = req.body; // 接收前端传递的 createTime

  // 验证请求参数
  if (!content || content.trim() === '') {
    return res.status(400).json({ message: '待办内容不能为空' });
  }

  jsonfile.readFile(todoFilePath, (err, data) => {
    if (err) {
      console.error('读取数据失败：', err);
      return res.status(500).json({ message: '添加待办失败' });
    }

    // 生成唯一 ID，同时存储前端传递的 createTime（前端已确保是提交时间）
    const newTodo = {
      id: Date.now(),
      content: content.trim(),
      done: false,
      createTime: createTime || new Date().toISOString() // 兼容：无传递时用当前时间
    };

    // 添加到数据并写入文件
    data.todos.push(newTodo);
    jsonfile.writeFile(todoFilePath, data, { spaces: 2 }, (err) => {
      if (err) {
        console.error('写入数据失败：', err);
        return res.status(500).json({ message: '添加待办失败' });
      }
      res.status(201).json(newTodo); // 201 表示创建成功
    });
  });
});

// 3. 修改待办完成状态（PUT）
app.put('/api/todos/:id', (req, res) => {
  const todoId = Number(req.params.id);
  const { done } = req.body;

  // 验证参数
  if (typeof done !== 'boolean') {
    return res.status(400).json({ message: 'done 必须是布尔值' });
  }

  jsonfile.readFile(todoFilePath, (err, data) => {
    if (err) {
      console.error('读取数据失败：', err);
      return res.status(500).json({ message: '修改待办失败' });
    }

    // 查找待办
    const todo = data.todos.find(item => item.id === todoId);
    if (!todo) {
      return res.status(404).json({ message: '待办事项不存在' });
    }

    // 更新状态并写入文件
    todo.done = done;
    jsonfile.writeFile(todoFilePath, data, { spaces: 2 }, (err) => {
      if (err) {
        console.error('写入数据失败：', err);
        return res.status(500).json({ message: '修改待办失败' });
      }
      res.status(200).json(todo);
    });
  });
});

// 4. 删除单个待办事项（DELETE）
app.delete('/api/todos/:id', (req, res) => {
  const todoId = Number(req.params.id);

  jsonfile.readFile(todoFilePath, (err, data) => {
    if (err) {
      console.error('读取数据失败：', err);
      return res.status(500).json({ message: '删除待办失败' });
    }

    // 过滤掉要删除的待办
    const originalLength = data.todos.length;
    data.todos = data.todos.filter(item => item.id !== todoId);

    // 若没有找到要删除的待办
    if (data.todos.length === originalLength) {
      return res.status(404).json({ message: '待办事项不存在' });
    }

    // 写入文件
    jsonfile.writeFile(todoFilePath, data, { spaces: 2 }, (err) => {
      if (err) {
        console.error('写入数据失败：', err);
        return res.status(500).json({ message: '删除待办失败' });
      }
      res.status(200).json({ message: '删除成功' });
    });
  });
});

// 5. 清空所有已完成待办（DELETE）
app.delete('/api/todos', (req, res) => {
  jsonfile.readFile(todoFilePath, (err, data) => {
    if (err) {
      console.error('读取数据失败：', err);
      return res.status(500).json({ message: '清空待办失败' });
    }

    // 过滤未完成的待办（保留未完成的）
    data.todos = data.todos.filter(item => !item.done);

    // 写入文件
    jsonfile.writeFile(todoFilePath, data, { spaces: 2 }, (err) => {
      if (err) {
        console.error('写入数据失败：', err);
        return res.status(500).json({ message: '清空待办失败' });
      }
      res.status(200).json({ message: '清空已完成待办成功' });
    });
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`后端服务已启动：http://127.0.0.1:${port}`);
  console.log('接口列表：');
  console.log('GET    /api/todos       - 获取所有待办');
  console.log('POST   /api/todos       - 添加新待办');
  console.log('PUT    /api/todos/:id   - 修改待办状态');
  console.log('DELETE /api/todos/:id   - 删除单个待办');
  console.log('DELETE /api/todos       - 清空已完成待办');
});