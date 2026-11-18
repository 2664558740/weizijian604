/* ============================================================
   作者：魏子健
   建立时间：2026-11-18 14:10
   使用大模型：DeepSeek（DSH 桌面端 AI 助手）
   功能名称：移动端手势卡片逻辑 —— 监听 touchstart/touchend，算位移判方向，阈值 40px，边界提示，300ms 冷却防连滑跳张
   说明：变量一律 wzz_ 前缀
   ============================================================ */

(function () {
  'use strict';

  var wzz_stage = document.getElementById('wzz_stage');
  var wzz_cards = document.querySelectorAll('.wzz_card');
  var wzz_counter = document.getElementById('wzz_counter');
  var wzz_tip = document.getElementById('wzz_tip');

  if (!wzz_stage || !wzz_cards.length) return;

  var wzz_index = 0;      // 当前第几张（0 开始）
  var wzz_startX = 0;     // 起点坐标
  var wzz_startY = 0;
  var wzz_locked = false; // 冷却锁，防止快速连滑一次跳两张
  var wzz_LINE = 40;      // 滑动阈值（px）
  var wzz_COOL = 300;     // 冷却时间（ms）

  /**
   * 功能：把当前索引对应的卡片设为选中（先清掉所有，再设当前）
   * 作者：魏子健
   */
  function wzz_render() {
    for (var i = 0; i < wzz_cards.length; i++) {
      wzz_cards[i].classList.remove('wzz_active');
    }
    wzz_cards[wzz_index].classList.add('wzz_active');
    wzz_counter.innerHTML = '第 <b>' + (wzz_index + 1) + '</b>/' + wzz_cards.length + ' 张';
  }

  /**
   * 功能：显示提示文字（boundary=true 时用红色高亮）
   * 作者：魏子健
   */
  function wzz_say(text, boundary) {
    wzz_tip.textContent = text;
    if (boundary) {
      wzz_tip.classList.add('wzz_warn');
    } else {
      wzz_tip.classList.remove('wzz_warn');
    }
  }

  /**
   * 功能：进入冷却，避免快速连续滑动一次跳两张
   * 作者：魏子健
   */
  function wzz_cool() {
    wzz_locked = true;
    setTimeout(function () {
      wzz_locked = false;
    }, wzz_COOL);
  }

  // 记录起点：touchstart 时取第一根手指的坐标
  wzz_stage.addEventListener('touchstart', function (e) {
    var wzz_t = e.touches[0];
    wzz_startX = wzz_t.clientX;
    wzz_startY = wzz_t.clientY;
  }, { passive: true });

  // 判断方向：touchend 时用 changedTouches（抬手时 touches 里已经没有这根手指）
  wzz_stage.addEventListener('touchend', function (e) {
    var wzz_t = e.changedTouches[0];
    var wzz_dx = wzz_t.clientX - wzz_startX;
    var wzz_dy = wzz_t.clientY - wzz_startY;

    // 位移太小：算点击，不切换
    if (Math.abs(wzz_dx) < wzz_LINE || Math.abs(wzz_dx) < Math.abs(wzz_dy)) {
      wzz_say('位移太小，判定为点击');
      return;
    }

    // 冷却中：直接忽略
    if (wzz_locked) return;

    if (wzz_dx < 0) {
      // 左滑 → 下一张
      if (wzz_index >= wzz_cards.length - 1) {
        wzz_say('已经是最后一张了');
      } else {
        wzz_index++;
        wzz_render();
        wzz_say('左滑：下一道');
        wzz_cool();
      }
    } else {
      // 右滑 → 上一张
      if (wzz_index <= 0) {
        wzz_say('已经是第一张了');
      } else {
        wzz_index--;
        wzz_render();
        wzz_say('右滑：上一道');
        wzz_cool();
      }
    }
  });

  // 被系统打断（来电、通知）时不做切换，只提示，避免状态卡住
  wzz_stage.addEventListener('touchcancel', function () {
    wzz_say('触摸被系统打断，请重新滑动');
  });

  // 初始化：先清除所有选中，再设第一张
  wzz_render();
})();
