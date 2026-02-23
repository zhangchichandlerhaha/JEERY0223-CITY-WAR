import { LanguageStrings } from "./types";

export const STRINGS: Record<'zh' | 'en', LanguageStrings> = {
  zh: {
    title: "JERRY 新星防御",
    start: "开始游戏",
    intro: "敌方火箭正在袭击我们的城市！作为指挥官，你的任务是利用三座导弹防御塔拦截所有威胁。保护城市，守卫家园！",
    score: "得分",
    ammo: "弹药",
    win: "任务成功！你成功守卫了新星之城。",
    loss: "任务失败！防御系统已崩溃。",
    restart: "再玩一次",
    instructions: "点击屏幕发射拦截导弹。预判火箭路径，利用爆炸范围摧毁它们。"
  },
  en: {
    title: "JERRY Nova Defense",
    start: "Start Game",
    intro: "Enemy rockets are attacking our cities! As commander, your mission is to intercept all threats using three missile defense towers. Protect the cities, guard our home!",
    score: "Score",
    ammo: "Ammo",
    win: "Mission Accomplished! You successfully guarded Nova City.",
    loss: "Mission Failed! The defense system has collapsed.",
    restart: "Play Again",
    instructions: "Click screen to fire interceptor missiles. Predict rocket paths and use explosion AOE to destroy them."
  }
};
