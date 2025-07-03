#!/usr/bin/env node

/**
 * 简单的SQLite测试脚本
 */

console.log('🔍 开始SQLite基础功能测试...');

try {
  // 1. 尝试加载sqlite3模块
  console.log('📦 加载sqlite3模块...');
  const sqlite3 = require('sqlite3').verbose();
  console.log('✅ sqlite3模块加载成功');

  // 2. 创建内存数据库
  console.log('🧪 创建内存数据库...');
  const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('❌ 内存数据库创建失败:', err.message);
      process.exit(1);
    }
    console.log('✅ 内存数据库创建成功');
    
    // 3. 创建测试表
    console.log('🏗️  创建测试表...');
    db.run(`CREATE TABLE test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('❌ 表创建失败:', err.message);
        process.exit(1);
      }
      console.log('✅ 测试表创建成功');
      
      // 4. 插入测试数据
      console.log('📝 插入测试数据...');
      db.run(`INSERT INTO test (name) VALUES (?)`, ['测试数据'], function(err) {
        if (err) {
          console.error('❌ 数据插入失败:', err.message);
          process.exit(1);
        }
        console.log('✅ 数据插入成功, ID:', this.lastID);
        
        // 5. 查询测试数据
        console.log('🔍 查询测试数据...');
        db.get(`SELECT * FROM test WHERE id = ?`, [this.lastID], (err, row) => {
          if (err) {
            console.error('❌ 数据查询失败:', err.message);
            process.exit(1);
          }
          if (row) {
            console.log('✅ 数据查询成功:', row);
          } else {
            console.error('❌ 未找到数据');
            process.exit(1);
          }
          
          // 6. 关闭数据库
          console.log('🔒 关闭数据库...');
          db.close((err) => {
            if (err) {
              console.error('❌ 数据库关闭失败:', err.message);
              process.exit(1);
            }
            console.log('✅ 数据库关闭成功');
            console.log('\n🎉 SQLite基础功能测试完成！');
            console.log('✅ SQLite数据库功能正常，可以安全使用。');
            process.exit(0);
          });
        });
      });
    });
  });

} catch (error) {
  console.error('❌ SQLite测试失败:', error.message);
  console.error('🔧 请检查sqlite3模块安装: npm install sqlite3');
  process.exit(1);
}
