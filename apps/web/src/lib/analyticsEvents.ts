/**
 * PRD 5.2 埋点 ID 与前端封装（均经 track 输出；生产可接 GA4 / Mixpanel）。
 * EV001 页面访问 · EV002 功能点击 · EV003 EMF 开始 · EV004 EMF 结束
 * EV005 通讯触发 · EV006 录音开始 · EV007 录音结束 · EV008 支付点击
 * EV009 支付成功 · EV010 支付失败 · EV011 PWA 安装 · EV012 分享
 */
import { track } from './analytics';

export const ev = {
  ev001: (p?: Record<string, unknown>) => track('EV001', p),
  ev002: (p?: Record<string, unknown>) => track('EV002', p),
  ev003: (p?: Record<string, unknown>) => track('EV003', p),
  ev004: (p?: Record<string, unknown>) => track('EV004', p),
  ev005: (p?: Record<string, unknown>) => track('EV005', p),
  ev006: (p?: Record<string, unknown>) => track('EV006', p),
  ev007: (p?: Record<string, unknown>) => track('EV007', p),
  ev008: (p?: Record<string, unknown>) => track('EV008', p),
  ev009: (p?: Record<string, unknown>) => track('EV009', p),
  ev010: (p?: Record<string, unknown>) => track('EV010', p),
  ev011: (p?: Record<string, unknown>) => track('EV011', p),
  ev012: (p?: Record<string, unknown>) => track('EV012', p),
};
