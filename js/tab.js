/* ============================================================
   作者：魏子健
   建立时间：2026-11-04 14:20
   使用大模型：DeepSeek（DSH 桌面端 AI 助手）
   功能名称：选项卡切换逻辑（可复用）—— 监听事件、先清除所有选中态、再设置当前选中态
   说明：所有变量以 wzz_ 开头；选中态统一使用 wzz_active 类名
   ============================================================ */

/**
 * 功能：初始化一个选项卡组件（可复用 —— 传入任意带 data-wzz-tabs 的容器都能生效）
 * 作者：魏子健
 * @param {HTMLElement} wzz_root 选项卡组件的外层容器
 */
function wzz_initTabs(wzz_root) {
  if (!wzz_root) return;

  // 取出该容器内的所有选项卡与所有面板（限定在 root 内部，保证多个组件互不干扰）
  var wzz_tabs = wzz_root.querySelectorAll('.wzz_tab');
  var wzz_panels = wzz_root.querySelectorAll('.wzz_panel');
  if (!wzz_tabs.length || !wzz_panels.length) return;

  /**
   * 功能：切换选项卡 —— 第一步清除所有选项卡的选中状态，第二步再设置当前元素的选中状态
   * 作者：魏子健
   * @param {Number} wzz_index 目标选项卡的索引
   */
  function wzz_switchTab(wzz_index) {
    // 1) 先清除所有选项卡的选中状态（选项卡 + 对应面板一起清）
    for (var wzz_i = 0; wzz_i < wzz_tabs.length; wzz_i++) {
      wzz_tabs[wzz_i].classList.remove('wzz_active');
    }
    for (var wzz_j = 0; wzz_j < wzz_panels.length; wzz_j++) {
      wzz_panels[wzz_j].classList.remove('wzz_active');
    }

    // 2) 再设置当前元素的选中状态
    var wzz_currentTab = wzz_tabs[wzz_index];
    var wzz_currentPanel = wzz_panels[wzz_index];
    if (wzz_currentTab) wzz_currentTab.classList.add('wzz_active');
    if (wzz_currentPanel) wzz_currentPanel.classList.add('wzz_active');
  }

  /**
   * 功能：给选项卡统一绑定点击事件（事件委托，点在容器上也能捕获到子元素）
   * 作者：魏子健
   * @param {Event} wzz_event 浏览器事件对象
   */
  function wzz_onTabClick(wzz_event) {
    // 找到实际被点击的选项卡元素
    var wzz_target = wzz_event.target;
    while (wzz_target && wzz_target !== wzz_root && !wzz_target.classList.contains('wzz_tab')) {
      wzz_target = wzz_target.parentNode;
    }
    if (!wzz_target || !wzz_target.classList.contains('wzz_tab')) return;

    // 阻止默认跳转（<a href="javascript:;">）
    wzz_event.preventDefault();

    // 读取该选项卡的索引并切换
    var wzz_index = parseInt(wzz_target.getAttribute('data-wzz-tab'), 10);
    if (isNaN(wzz_index)) return;
    wzz_switchTab(wzz_index);
  }

  // 监听事件：统一绑在选项卡容器上（事件委托）
  var wzz_tabList = wzz_root.querySelector('.wzz_tabList');
  if (wzz_tabList) {
    wzz_tabList.addEventListener('click', wzz_onTabClick, false);
  }

  // 初始化：等价于「先清除所有选中态，再设置第 0 个为选中」，保证默认选项生效
  wzz_switchTab(0);
}

/**
 * 功能：页面加载完成后，自动初始化页面上所有选项卡组件（支持一个页面放多个 tab）
 * 作者：魏子健
 */
function wzz_initAllTabs() {
  var wzz_boxes = document.querySelectorAll('[data-wzz-tabs]');
  for (var wzz_k = 0; wzz_k < wzz_boxes.length; wzz_k++) {
    wzz_initTabs(wzz_boxes[wzz_k]);
  }
}

// DOM 解析完成即初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wzz_initAllTabs, false);
} else {
  wzz_initAllTabs();
}

// 暴露到全局，方便复用时手动调用
window.wzz_initTabs = wzz_initTabs;
