/* ============================================================
   作者：魏子健
   建立时间：2026-11-18 14:50
   使用大模型：DeepSeek（DSH 桌面端 AI 助手）
   功能名称：移动端触摸事件四关任务逻辑（标签切换 / 事件探针 / 手势卡片 / 图片查看器 / 摇一摇）
   说明：变量一律 wzz_ 前缀
   ============================================================ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     公共部分：四个任务之间切换
     ═══════════════════════════════════════════ */

  var wzz_tabs = document.querySelectorAll('.wzz_tab');

  wzz_tabs.forEach(function (wzz_tab) {
    wzz_tab.addEventListener('click', function () {
      // 先清除所有标签的选中态
      wzz_tabs.forEach(function (wzz_t) {
        wzz_t.classList.remove('wzz_on');
      });
      // 再设置当前标签的选中态
      wzz_tab.classList.add('wzz_on');

      // 面板同理：先全部隐藏，再显示目标面板
      document.querySelectorAll('.wzz_panel').forEach(function (wzz_p) {
        wzz_p.classList.remove('wzz_on');
      });
      document.getElementById(wzz_tab.dataset.wzzTarget).classList.add('wzz_on');
    });
  });

  /* ═══════════════════════════════════════════
     任务一：事件侦探
     ═══════════════════════════════════════════ */

  var wzz_probe = document.getElementById('wzz_probe');
  var wzz_logBox = document.getElementById('wzz_log');
  var wzz_stat = { touchstart: 0, touchmove: 0, touchend: 0, touchcancel: 0, click: 0 };

  /**
   * 功能：数字补两位，便于对齐
   * 作者：魏子健
   */
  function wzz_pad2(wzz_n) {
    return wzz_n < 10 ? '0' + wzz_n : '' + wzz_n;
  }

  /**
   * 功能：生成 分:秒.毫秒 的时间戳，用来观察事件先后顺序
   * 作者：魏子健
   */
  function wzz_stamp() {
    var wzz_d = new Date();
    var wzz_ms = wzz_d.getMilliseconds();
    return wzz_pad2(wzz_d.getMinutes()) + ':' + wzz_pad2(wzz_d.getSeconds()) + '.' +
      (wzz_ms < 100 ? '0' + wzz_ms : '' + wzz_ms);
  }

  /**
   * 功能：向日志区追加一行，超过 80 行删掉最早的，避免无限增长
   * 作者：魏子健
   */
  function wzz_writeLog(wzz_text) {
    var wzz_line = document.createElement('div');
    wzz_line.textContent = wzz_stamp() + '  ' + wzz_text;
    wzz_logBox.appendChild(wzz_line);
    wzz_logBox.scrollTop = wzz_logBox.scrollHeight;
    if (wzz_logBox.children.length > 80) {
      wzz_logBox.removeChild(wzz_logBox.firstChild);
    }
  }

  /**
   * 功能：把内存里的计数同步到页面上的五个数字块
   * 作者：魏子健
   */
  function wzz_refreshStat() {
    document.getElementById('wzz_c_start').textContent = wzz_stat.touchstart;
    document.getElementById('wzz_c_move').textContent = wzz_stat.touchmove;
    document.getElementById('wzz_c_end').textContent = wzz_stat.touchend;
    document.getElementById('wzz_c_cancel').textContent = wzz_stat.touchcancel;
    document.getElementById('wzz_c_click').textContent = wzz_stat.click;
  }

  // 给探针区挂上五个监听，统一记录顺序
  ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'click'].forEach(function (wzz_type) {
    wzz_probe.addEventListener(wzz_type, function (wzz_e) {
      wzz_stat[wzz_type]++;

      var wzz_extra = '';
      if (wzz_type === 'touchstart' || wzz_type === 'touchmove') {
        wzz_extra = '  手指 ' + wzz_e.touches.length + ' 根  clientX=' + Math.round(wzz_e.touches[0].clientX);
      } else if (wzz_type === 'touchend') {
        // 抬手时那根手指已从 touches 移除，必须用 changedTouches
        wzz_extra = '  剩余 ' + wzz_e.touches.length + ' 根  changedX=' + Math.round(wzz_e.changedTouches[0].clientX);
      }

      wzz_writeLog('▲ ' + wzz_type + wzz_extra);
      wzz_refreshStat();
    }, { passive: true });
  });

  // 清空日志并重置计数
  document.getElementById('wzz_clearLog').addEventListener('click', function () {
    wzz_logBox.innerHTML = '已清空，继续触摸试试……';
    wzz_stat = { touchstart: 0, touchmove: 0, touchend: 0, touchcancel: 0, click: 0 };
    wzz_refreshStat();
  });

  /* ═══════════════════════════════════════════
     任务二：手势卡片（记起点 → 算差值 → 判方向）
     ═══════════════════════════════════════════ */

  var wzz_foods = [
    { name: '重庆火锅', desc: '牛油红汤翻滚，毛肚七上八下', bg: 'linear-gradient(135deg, #e11d48, #f97316)' },
    { name: '兰州拉面', desc: '一清二白三红四绿，汤清面劲', bg: 'linear-gradient(135deg, #0ea5e9, #10b981)' },
    { name: '广式虾饺', desc: '澄面皮薄如纸，虾仁弹牙', bg: 'linear-gradient(135deg, #7c3aed, #ec4899)' },
    { name: '冰糖葫芦', desc: '山楂裹糖脆而不粘牙', bg: 'linear-gradient(135deg, #f59e0b, #dc2626)' }
  ];

  var wzz_foodIdx = 0;
  var wzz_swipeBox = document.getElementById('wzz_swipeBox');
  var wzz_foodCard = document.getElementById('wzz_foodCard');
  var wzz_tipEl = document.getElementById('wzz_swipeTip');
  var wzz_startX = 0;
  var wzz_startY = 0;
  var wzz_cooling = false;
  var wzz_swapping = false;
  var wzz_tipTimer = null;

  /**
   * 功能：短暂显示提示文字（如"已经是第一张"）
   * 作者：魏子健
   */
  function wzz_showTip(wzz_msg) {
    wzz_tipEl.textContent = wzz_msg;
    wzz_tipEl.classList.add('wzz_show');
    clearTimeout(wzz_tipTimer);
    wzz_tipTimer = setTimeout(function () {
      wzz_tipEl.classList.remove('wzz_show');
    }, 1200);
  }

  /**
   * 功能：带过渡动画把卡片换成当前索引那道菜（旧卡滑出 → 换内容 → 新卡滑入）
   * 作者：魏子健
   */
  function wzz_paintFood(wzz_dir) {
    wzz_swapping = true;

    wzz_foodCard.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
    wzz_foodCard.style.transform = 'translateX(' + (wzz_dir > 0 ? -60 : 60) + 'px)';
    wzz_foodCard.style.opacity = '0';

    setTimeout(function () {
      var wzz_f = wzz_foods[wzz_foodIdx];
      wzz_foodCard.style.background = wzz_f.bg;
      document.getElementById('wzz_foodName').textContent = wzz_f.name;
      document.getElementById('wzz_foodDesc').textContent = wzz_f.desc;
      document.getElementById('wzz_foodCount').textContent =
        '第 ' + (wzz_foodIdx + 1) + ' / ' + wzz_foods.length + ' 张';
      wzz_refreshDots();

      wzz_foodCard.style.transition = 'none';
      wzz_foodCard.style.transform = 'translateX(' + (wzz_dir > 0 ? 60 : -60) + 'px)';

      requestAnimationFrame(function () {
        wzz_foodCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        wzz_foodCard.style.transform = 'translateX(0)';
        wzz_foodCard.style.opacity = '1';
        wzz_swapping = false;
      });
    }, 150);
  }

  /**
   * 功能：切换到上一张/下一张，处理边界；传 wzz_jump 时直接跳到指定下标
   * 作者：魏子健
   */
  function wzz_switchCard(wzz_dir, wzz_jump) {
    if (wzz_swapping) return;

    if (typeof wzz_jump === 'number') {
      wzz_foodIdx = wzz_jump;
      wzz_paintFood(wzz_dir);
      return;
    }

    if (wzz_dir > 0) {
      if (wzz_foodIdx >= wzz_foods.length - 1) { wzz_showTip('已经是最后一张'); return; }
      wzz_foodIdx++;
    } else {
      if (wzz_foodIdx <= 0) { wzz_showTip('已经是第一张'); return; }
      wzz_foodIdx--;
    }
    wzz_paintFood(wzz_dir);
  }

  /**
   * 功能：判断位移是否够成滑动（阈值 40px、横大于纵），带 300ms 冷却
   * 作者：魏子健
   */
  function wzz_swipeTo(wzz_dx, wzz_dy) {
    if (Math.abs(wzz_dx) < 40 || Math.abs(wzz_dx) <= Math.abs(wzz_dy)) return;
    if (wzz_cooling || wzz_swapping) return;

    wzz_cooling = true;
    setTimeout(function () { wzz_cooling = false; }, 300);

    wzz_switchCard(wzz_dx < 0 ? 1 : -1);
  }

  wzz_swipeBox.addEventListener('touchstart', function (wzz_e) {
    wzz_startX = wzz_e.touches[0].clientX;
    wzz_startY = wzz_e.touches[0].clientY;
  }, { passive: true });

  wzz_swipeBox.addEventListener('touchend', function (wzz_e) {
    wzz_swipeTo(
      wzz_e.changedTouches[0].clientX - wzz_startX,
      wzz_e.changedTouches[0].clientY - wzz_startY
    );
  });

  // 电脑端兜底：鼠标拖拽复用同一套逻辑
  var wzz_mouseDown = false;
  var wzz_mouseX = 0;
  var wzz_mouseY = 0;

  wzz_swipeBox.addEventListener('mousedown', function (wzz_e) {
    wzz_mouseDown = true;
    wzz_mouseX = wzz_e.clientX;
    wzz_mouseY = wzz_e.clientY;
    wzz_swipeBox.style.cursor = 'grabbing';
  });

  wzz_swipeBox.addEventListener('mouseup', function (wzz_e) {
    if (!wzz_mouseDown) return;
    wzz_mouseDown = false;
    wzz_swipeBox.style.cursor = 'grab';
    wzz_swipeTo(wzz_e.clientX - wzz_mouseX, wzz_e.clientY - wzz_mouseY);
  });

  wzz_swipeBox.addEventListener('mouseleave', function () {
    wzz_mouseDown = false;
    wzz_swipeBox.style.cursor = 'grab';
  });

  // 圆点导航
  var wzz_dots = document.getElementById('wzz_dots');
  wzz_foods.forEach(function (wzz_item, wzz_i) {
    var wzz_dot = document.createElement('span');
    wzz_dot.className = 'wzz_dot';
    wzz_dot.title = wzz_item.name;
    wzz_dot.addEventListener('click', function () {
      if (wzz_i === wzz_foodIdx || wzz_swapping) return;
      wzz_switchCard(wzz_i > wzz_foodIdx ? 1 : -1, wzz_i);
    });
    wzz_dots.appendChild(wzz_dot);
  });

  /**
   * 功能：把圆点选中态同步成当前这张
   * 作者：魏子健
   */
  function wzz_refreshDots() {
    for (var wzz_i = 0; wzz_i < wzz_dots.children.length; wzz_i++) {
      wzz_dots.children[wzz_i].className = 'wzz_dot' + (wzz_i === wzz_foodIdx ? ' wzz_on' : '');
    }
  }

  wzz_refreshDots();

  /* ═══════════════════════════════════════════
     任务三：图片查看器（双指缩放 + 双击 + 拖动）
     缩放不跳的关键：以两指中点做基准，同步修正平移
     ═══════════════════════════════════════════ */

  var wzz_viewer = document.getElementById('wzz_viewer');
  var wzz_zoomImg = document.getElementById('wzz_zoomImg');

  var wzz_scale = 1;
  var wzz_tx = 0;
  var wzz_ty = 0;
  var wzz_baseScale = 1;
  var wzz_baseTx = 0;
  var wzz_baseTy = 0;
  var wzz_lastDist = 0;
  var wzz_ptrX = 0;
  var wzz_ptrY = 0;
  var wzz_lastTap = 0;
  var wzz_moved = false;

  /**
   * 功能：算两根手指之间的直线距离
   * 作者：魏子健
   */
  function wzz_dist(wzz_t1, wzz_t2) {
    return Math.hypot(wzz_t2.clientX - wzz_t1.clientX, wzz_t2.clientY - wzz_t1.clientY);
  }

  /**
   * 功能：把当前缩放与平移写进 transform，并更新倍数显示
   * 作者：魏子健
   */
  function wzz_applyTransform() {
    wzz_zoomImg.style.transform =
      'translate(' + wzz_tx + 'px, ' + wzz_ty + 'px) scale(' + wzz_scale + ')';
    document.getElementById('wzz_scaleText').textContent = wzz_scale.toFixed(2);
  }

  /**
   * 功能：把平移量限制在边界内，避免拖出容器露黑边
   * 作者：魏子健
   */
  function wzz_clampPan() {
    var wzz_r = wzz_viewer.getBoundingClientRect();
    var wzz_maxX = Math.max(0, (wzz_scale - 1) * wzz_r.width / 2);
    var wzz_maxY = Math.max(0, (wzz_scale - 1) * wzz_r.height / 2);
    wzz_tx = Math.max(-wzz_maxX, Math.min(wzz_maxX, wzz_tx));
    wzz_ty = Math.max(-wzz_maxY, Math.min(wzz_maxY, wzz_ty));
  }

  wzz_viewer.addEventListener('touchstart', function (wzz_e) {
    wzz_moved = false;
    wzz_zoomImg.style.transition = 'none';

    if (wzz_e.touches.length >= 2) {
      wzz_lastDist = wzz_dist(wzz_e.touches[0], wzz_e.touches[1]);
      wzz_baseScale = wzz_scale;
      wzz_baseTx = wzz_tx;
      wzz_baseTy = wzz_ty;
    } else {
      // 单指：清空上一轮距离，否则第一帧会拿残留数据比较导致跳一下
      wzz_lastDist = 0;
      wzz_ptrX = wzz_e.touches[0].clientX;
      wzz_ptrY = wzz_e.touches[0].clientY;
      wzz_baseTx = wzz_tx;
      wzz_baseTy = wzz_ty;
    }
  }, { passive: true });

  wzz_viewer.addEventListener('touchmove', function (wzz_e) {
    if (wzz_e.touches.length >= 2) {
      // 阻止浏览器把双指手势当成整页缩放
      wzz_e.preventDefault();

      var wzz_d = wzz_dist(wzz_e.touches[0], wzz_e.touches[1]);
      if (!wzz_lastDist) { wzz_lastDist = wzz_d; return; }

      var wzz_r = wzz_viewer.getBoundingClientRect();
      var wzz_mx = (wzz_e.touches[0].clientX + wzz_e.touches[1].clientX) / 2 - (wzz_r.left + wzz_r.width / 2);
      var wzz_my = (wzz_e.touches[0].clientY + wzz_e.touches[1].clientY) / 2 - (wzz_r.top + wzz_r.height / 2);

      var wzz_s = wzz_baseScale * (wzz_d / wzz_lastDist);
      wzz_s = Math.max(1, Math.min(4, wzz_s));

      // 以两指中点为基准修正平移，保证中点下的像素跟着手指走
      wzz_tx = wzz_baseTx + wzz_mx * (wzz_baseScale - wzz_s);
      wzz_ty = wzz_baseTy + wzz_my * (wzz_baseScale - wzz_s);

      if (wzz_s === 1) { wzz_tx = 0; wzz_ty = 0; }

      wzz_scale = wzz_s;
      wzz_moved = true;
      wzz_applyTransform();
    } else if (wzz_scale > 1) {
      // 已放大：单指拖动查看细节
      wzz_e.preventDefault();
      var wzz_dx = wzz_e.touches[0].clientX - wzz_ptrX;
      var wzz_dy = wzz_e.touches[0].clientY - wzz_ptrY;

      if (Math.abs(wzz_dx) > 6 || Math.abs(wzz_dy) > 6) wzz_moved = true;

      wzz_tx = wzz_baseTx + wzz_dx;
      wzz_ty = wzz_baseTy + wzz_dy;
      wzz_applyTransform();
    }
  }, { passive: false });

  wzz_viewer.addEventListener('touchend', function (wzz_e) {
    if (wzz_scale <= 1) { wzz_scale = 1; wzz_tx = 0; wzz_ty = 0; }

    wzz_clampPan();
    wzz_zoomImg.style.transition = 'transform 0.25s ease';
    wzz_applyTransform();

    // 双击：单指抬起、没有明显移动、间隔小于 300ms
    if (wzz_e.touches.length === 0 && wzz_e.changedTouches.length === 1 && !wzz_moved) {
      var wzz_now = Date.now();
      if (wzz_now - wzz_lastTap < 300) {
        wzz_lastTap = 0;
        wzz_scale = wzz_scale > 1.2 ? 1 : 2;
        wzz_tx = 0;
        wzz_ty = 0;
        wzz_applyTransform();
      } else {
        wzz_lastTap = wzz_now;
      }
    }
  });

  wzz_viewer.addEventListener('touchcancel', function () {
    wzz_moved = false;
    wzz_lastDist = 0;
    wzz_zoomImg.style.transition = 'transform 0.25s ease';
    wzz_applyTransform();
  });

  /* ═══════════════════════════════════════════
     任务四：摇一摇抽菜谱
     ═══════════════════════════════════════════ */

  var wzz_dishes = ['红烧狮子头', '西湖醋鱼', '宫保鸡丁', '东坡肉', '白切鸡', '酸菜鱼', '小笼包', '佛跳墙'];
  var wzz_shakeCooling = false;
  var wzz_gotMotion = false;
  var wzz_dishEl = document.getElementById('wzz_dish');
  var wzz_stateEl = document.getElementById('wzz_sensorState');

  /**
   * 功能：随机抽一道菜并播放弹出动画
   * 作者：魏子健
   */
  function wzz_pickDish() {
    var wzz_i = Math.floor(Math.random() * wzz_dishes.length);
    wzz_dishEl.textContent = wzz_dishes[wzz_i];
    wzz_dishEl.classList.remove('wzz_pop');
    void wzz_dishEl.offsetWidth;   // 强制重排，让动画可重复播放
    wzz_dishEl.classList.add('wzz_pop');
    wzz_stateEl.textContent = '今日菜谱已抽到！再摇一次试试';
  }

  /**
   * 功能：监听设备加速度，合成加速度超过阈值判定为摇动
   * 作者：魏子健
   */
  function wzz_onMotion(wzz_e) {
    var wzz_a = wzz_e.accelerationIncludingGravity;
    if (!wzz_a) return;

    var wzz_x = wzz_a.x || 0;
    var wzz_y = wzz_a.y || 0;
    var wzz_z = wzz_a.z || 0;

    // 没有传感器时浏览器会持续派发 0,0,0，这不算真的拿到数据
    if (wzz_x === 0 && wzz_y === 0 && wzz_z === 0) return;

    wzz_gotMotion = true;

    var wzz_mag = Math.sqrt(wzz_x * wzz_x + wzz_y * wzz_y + wzz_z * wzz_z);
    document.getElementById('wzz_mag').textContent = wzz_mag.toFixed(1);

    if (wzz_mag > 18 && !wzz_shakeCooling) {
      wzz_shakeCooling = true;
      setTimeout(function () { wzz_shakeCooling = false; }, 1500);
      wzz_pickDish();
    }
  }

  window.addEventListener('devicemotion', wzz_onMotion);

  // 3 秒内没收到数据 → 判定不支持
  setTimeout(function () {
    if (!wzz_gotMotion) {
      wzz_stateEl.textContent = '当前设备不支持加速度传感器，请用下方按钮抽一次';
    }
  }, 3000);

  // iOS 13+ 必须用户点击后才能申请权限
  document.getElementById('wzz_permBtn').addEventListener('click', function () {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(function (wzz_state) {
        wzz_stateEl.textContent = wzz_state === 'granted'
          ? '已授权，摇一摇试试'
          : '权限被拒绝，可用下方按钮抽取';
      }).catch(function () {
        wzz_stateEl.textContent = '权限申请失败，可用下方按钮抽取';
      });
    } else {
      wzz_stateEl.textContent = '当前浏览器无需授权，直接摇动手机即可';
    }
  });

  // 降级方案：任何设备都能点按钮抽一次
  document.getElementById('wzz_pickBtn').addEventListener('click', function () {
    wzz_pickDish();
  });
})();
