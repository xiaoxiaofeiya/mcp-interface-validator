#!/usr/bin/env node

/**
 * SQLite验证脚本
 * 用于验证SQLite数据库功能是否正常工作
 */

import path from 'path';
import fs from 'fs';

async function verifySQLite() {
  console.log('🔍 开始验证SQLite功能...');
  
  try {
    // 1. 检查sqlite3模块是否可以加载
    console.log('📦 检查sqlite3模块...');
    let sqlite3;
    try {
      sqlite3 = await import('sqlite3');
      sqlite3 = sqlite3.default || sqlite3;
      console.log('✅ sqlite3模块加载成功');
    } catch (error) {
      console.log('❌ sqlite3模块加载失败:', error.message);
      console.log('💡 请运行: npm install sqlite3');
      return false;
    }

    // 2. 创建内存数据库测试基本功能
    console.log('🧪 测试内存数据库创建...');
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.log('❌ 内存数据库创建失败:', err.message);
        return false;
      }
      console.log('✅ 内存数据库创建成功');
    });

    // 3. 测试表创建
    console.log('🏗️  测试表创建...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.log('❌ 表创建失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 表创建成功');
          resolve();
        }
      });
    });

    // 4. 测试数据插入
    console.log('📝 测试数据插入...');
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO test_table (name) VALUES (?)`, ['测试数据'], function(err) {
        if (err) {
          console.log('❌ 数据插入失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 数据插入成功, ID:', this.lastID);
          resolve();
        }
      });
    });

    // 5. 测试数据查询
    console.log('🔍 测试数据查询...');
    await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM test_table WHERE name = ?`, ['测试数据'], (err, row) => {
        if (err) {
          console.log('❌ 数据查询失败:', err.message);
          reject(err);
        } else if (row) {
          console.log('✅ 数据查询成功:', row);
          resolve();
        } else {
          console.log('❌ 未找到数据');
          reject(new Error('未找到数据'));
        }
      });
    });

    // 6. 测试数据更新
    console.log('✏️  测试数据更新...');
    await new Promise((resolve, reject) => {
      db.run(`UPDATE test_table SET name = ? WHERE name = ?`, ['更新后的数据', '测试数据'], function(err) {
        if (err) {
          console.log('❌ 数据更新失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 数据更新成功, 影响行数:', this.changes);
          resolve();
        }
      });
    });

    // 7. 测试数据删除
    console.log('🗑️  测试数据删除...');
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM test_table WHERE name = ?`, ['更新后的数据'], function(err) {
        if (err) {
          console.log('❌ 数据删除失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 数据删除成功, 影响行数:', this.changes);
          resolve();
        }
      });
    });

    // 8. 关闭数据库连接
    console.log('🔒 关闭数据库连接...');
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.log('❌ 数据库关闭失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 数据库关闭成功');
          resolve();
        }
      });
    });

    console.log('\n🎉 SQLite功能验证完成！所有测试都通过了。');
    console.log('✅ SQLite数据库功能正常，可以安全使用。');
    return true;

  } catch (error) {
    console.log('\n❌ SQLite验证失败:', error.message);
    console.log('🔧 建议检查sqlite3模块安装或系统环境配置');
    return false;
  }
}

// 运行验证
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySQLite().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('验证过程中发生错误:', error);
    process.exit(1);
  });
}

export { verifySQLite };
