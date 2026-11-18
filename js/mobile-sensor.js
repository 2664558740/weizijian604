/* ============================================================
   作者：魏子健
   建立时间：2026-11-18 14:35
   使用大模型：DeepSeek（DSH 桌面端 AI 助手）
   功能名称：摇一摇抽菜谱逻辑 —— devicemotion 合成加速度、阈值 18、1.5 秒冷却、iOS 权限申请、无传感器降级
   说明：变量一律 wzz_ 前缀
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 数据 ---------- */
  var wzz_dishes = [
    { name: '重庆小面', emoji: '🍜', desc: '碱水面配红油辣子，麻辣鲜香，一碗下肚浑身发热。' },
    { name: '番茄炒蛋', emoji: '🍳', desc: '国民家常菜，酸甜下饭，十分钟就能搞定。' },
    { name: '黄焖鸡米饭', emoji: '🍗', desc: '鸡肉软烂入味，汤汁拌饭是精髓。' },
    { name: '酸菜鱼', emoji: '🐟', desc: '鱼片滑嫩，酸辣开胃，配米饭能吃两碗。' },
    { name: '小笼包', emoji: '🥟', desc: '皮薄馅大汤汁足，先开窗后喝汤。' },
    { name: '麻辣香锅', emoji: '🌶️', desc: '荤素自选，一锅炒香，越吃越上瘾。' },
    { name: '兰州拉面', emoji: '🍲', desc: '一清二白三红四绿，汤清面劲。' },
    { name: '煎饼果子', emoji: '🥞', desc: '薄脆加鸡蛋，刷酱撒葱，早餐首选。' }
  ];

  /* ---------- DOM ---------- */
  var wzz_dish = document.getElementById('wzz_dish');
  var wzz_emoji = document.getElementById('wzz_emoji');
  var wzz_desc = document.getElementById('wzz_desc');
  var wzz_status = document.getElementById('wzz_status');
  var wzz_box = document.getElementById('wzz_resultBox');
  var wzz_btn = document.getElementById('wzz_btn');
  var wzz_hint = document.getElementById('wzz_hint');

  /* ---------- 状态 ---------- */
  var wzz_LINE = 18;        // 合成加速度阈值
  var wzz_COOL = 1500;      // 冷却时间（ms）
  var wzz_locked = false;   // 冷却锁
  var wzz_gotData = false;  // 是否收到过传感器数据
  var wzz_lastIndex = -1;   // 上次抽到的菜，避免连续重复

  /**
   * 功能：显示状态提示（warn=true 时用红色）
   * 作者：魏子健
   */
  function wzz_say(text, warn) {
    wzz_status.textContent = text || '';
    if (warn) {
      wzz_status.classList.add('wzz_warn');
    } else {
      wzz_status.classList.remove('wzz_warn');
    }
  }

  /**
   * 功能：抽一道菜并显示（带弹出动画），同时进入 1.5 秒冷却
   * 作者：魏子健
   */
  function wzz_draw() {
    if (wzz_locked) return;

    // 随机抽，且尽量不和上一次重复
    var wzz_idx = Math.floor(Math.random() * wzz_dishes.length);
    if (wzz_idx === wzz_lastIndex) {
      wzz_idx = (wzz_idx + 1) % wzz_dishes.length;
    }
    wzz_lastIndex = wzz_idx;

    var wzz_item = wzz_dishes[wzz_idx];
    wzz_emoji.textContent = wzz_item.emoji;
    wzz_dish.textContent = wzz_item.name;
    wzz_desc.textContent = wzz_item.desc;

    // 重新触发动画：先移除 class，强制回流后再加
    wzz_box.classList.remove('wzz_pop');
    void wzz_box.offsetWidth;
    wzz_box.classList.add('wzz_pop');

    wzz_say('抽到啦！再摇一次换一道');

    // 进入冷却
    wzz_locked = true;
    setTimeout(function () {
      wzz_locked = false;
    }, wzz_COOL);
  }

  /**
   * 功能：监听设备运动 —— 用 accelerationIncludingGravity 计算合成加速度，超过阈值判定为摇动
   * 作者：魏子健
   */
  function wzz_onMotion(e) {
    // accelerationIncludingGravity 含重力，静止时约等于 9.8，摇动时会出现明显偏移
    var wzz_a = e.accelerationIncludingGravity || e.acceleration;
    if (!wzz_a) return;

    var wzz_x = wzz_a.x || 0;
    var wzz_y = wzz_a.y || 0;
    var wzz_z = wzz_a.z || 0;

    // 有些浏览器在没有传感器时也会持续派发 0,0,0 的事件，
    // 这不算"真的拿到数据"，否则降级提示永远不会出现
    if (wzz_x === 0 && wzz_y === 0 && wzz_z === 0) return;

    // 第一次收到数据：说明设备支持，切换提示
    if (!wzz_gotData) {
      wzz_gotData = true;
      wzz_say('已检测到传感器，用力摇一摇试试');
      wzz_hint.textContent = '摇一摇手机，抽今日菜谱';
    }

    // 合成加速度：勾股定理的三维版本
    var wzz_g = Math.sqrt(wzz_x * wzz_x + wzz_y * wzz_y + wzz_z * wzz_z);

    // 超过阈值且不在冷却中 → 抽一次
    if (wzz_g > wzz_LINE) {
      wzz_draw();
    }
  }

  /**
   * 功能：申请设备运动权限（iOS 13+ 必须由用户手势触发）
   * 作者：魏子健
   */
  function wzz_askPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(function (state) {
        if (state === 'granted') {
          window.addEventListener('devicemotion', wzz_onMotion, false);
          wzz_say('已授权，摇一摇试试');
        } else {
          wzz_say('未授权传感器，可以用下面的按钮抽', true);
        }
      }).catch(function () {
        wzz_say('授权失败，可以用下面的按钮抽', true);
      });
    } else {
      // 安卓 / 桌面：直接绑定监听
      window.addEventListener('devicemotion', wzz_onMotion, false);
      wzz_say('正在等待传感器数据…');
    }
  }

  /* ---------- 初始化 ---------- */
  // 按钮：既能抽菜，也兼任 iOS 权限申请入口
  wzz_btn.addEventListener('click', function () {
    wzz_askPermissionOnce();
    wzz_draw();
  });

  var wzz_asked = false;
  /**
   * 功能：只在第一次点击时申请权限，避免重复弹窗
   * 作者：魏子健
   */
  function wzz_askPermissionOnce() {
    if (wzz_asked) return;
    wzz_asked = true;
    try {
      wzz_askPermission();
    } catch (err) {
      /* 老浏览器没有该 API，忽略 */
    }
  }

  // 自动尝试绑定（不支持时页面会提示并靠按钮降级）
  try {
    wzz_askPermission();
  } catch (err) {
    /* ignore */
  }

  // 3 秒内没有任何传感器数据 → 判定为不支持
  setTimeout(function () {
    if (!wzz_gotData) {
      wzz_say('当前设备不支持摇一摇，请用手机打开，或点下面按钮抽取', true);
      wzz_hint.textContent = '这台设备没有传感器数据，用按钮吧';
    }
  }, 3000);
})();
