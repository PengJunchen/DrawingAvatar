/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';

// Embedded translation data to fix module loading issues
const en = {
  "lang.toggle": "中文",
  "startScreen.title.part1": "Create Amazing",
  "startScreen.title.part2": "Avatars",
  "startScreen.title.part3": " with AI",
  "startScreen.subtitle": "Generate unique, creative avatars from your photos using advanced AI technology. Upload an image and let the magic happen.",
  "startScreen.uploadBtn": "Upload a Photo",
  "startScreen.dragAndDrop": "or drag and drop a file",
  "startScreen.featureTitle": "Generate Creative Avatar",
  "startScreen.featureDesc": "Transform your photos into stunning avatars with our powerful AI generator. Get unique results every time.",
  "app.error.title": "An Error Occurred",
  "app.error.tryAgain": "Try Again",
  "app.error.noImage": "No image loaded for editing.",
  "app.error.noPrompt": "Please enter a description to generate the avatar.",
  "app.error.loadTemplates": "Failed to load templates.",
  "app.error.generationFailed": "Failed to generate avatar: {{message}}",
  "app.error.cropFailed": "Cropping failed: {{message}}",
  "app.loading.ai": "AI is working its magic...",
  "app.loading.templates": "Loading...",
  "app.templates.title": "Choose a Template",
  "app.templates.selectDefault": "-- Select a template --",
  "app.prompt.title": "Modify Prompt",
  "app.prompt.placeholder": "Enter a description to generate the avatar",
  "app.buttons.generating": "Generating...",
  "app.buttons.generate": "Generate Avatar",
  "app.buttons.undo": "Undo",
  "app.buttons.redo": "Redo",
  "app.buttons.crop1x1": "1:1 Crop",
  "app.buttons.applyCrop": "Apply Crop",
  "app.buttons.cancelCrop": "Cancel Crop",
  "app.buttons.compare": "Compare",
  "app.buttons.reset": "Reset",
  "app.buttons.uploadNew": "Upload New Image",
  "app.buttons.download": "Download Image",
  "gemini.error.invalidDataUrl": "Invalid data URL",
  "gemini.error.mimeParse": "Could not parse MIME type from data URL",
  "gemini.error.requestBlocked": "Request was blocked. Reason: {{reason}}. {{message}}",
  "gemini.error.generationStopped": "Image generation for {{context}} stopped unexpectedly. Reason: {{reason}}. This often relates to safety settings.",
  "gemini.error.noImageReturnedText": "The AI model did not return an image for {{context}}. The model responded with text: \"{{text}}\"",
  "gemini.error.noImageReturnedGeneric": "The AI model did not return an image for {{context}}. This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct."
};

const zh = {
  "lang.toggle": "EN",
  "startScreen.title.part1": "创作您的",
  "startScreen.title.part2": "国庆头像",
  "startScreen.title.part3": "，AI 助力",
  "startScreen.subtitle": "使用先进的 AI 技术，从您的照片中生成独特、富有创意的头像。上传一张图片，让魔法发生。",
  "startScreen.uploadBtn": "上传照片",
  "startScreen.dragAndDrop": "或拖放文件",
  "startScreen.featureTitle": "生成创意头像",
  "startScreen.featureDesc": "使用我们强大的 AI 生成器，将您的照片变成令人惊叹的头像。每次都能获得独特的结果。",
  "app.error.title": "发生错误",
  "app.error.tryAgain": "重试",
  "app.error.noImage": "没有加载图片进行编辑。",
  "app.error.noPrompt": "请输入描述以生成头像。",
  "app.error.loadTemplates": "加载模板失败。",
  "app.error.generationFailed": "生成头像失败：{{message}}",
  "app.error.cropFailed": "裁剪失败：{{message}}",
  "app.loading.ai": "AI 正在施展魔法...",
  "app.loading.templates": "加载中...",
  "app.templates.title": "选择模板",
  "app.templates.selectDefault": "-- 选择模板 --",
  "app.prompt.title": "修改提示词",
  "app.prompt.placeholder": "请输入生成头像的描述",
  "app.buttons.generating": "生成中...",
  "app.buttons.generate": "生成头像",
  "app.buttons.undo": "撤销",
  "app.buttons.redo": "重做",
  "app.buttons.crop1x1": "1:1 裁剪",
  "app.buttons.applyCrop": "应用裁剪",
  "app.buttons.cancelCrop": "取消裁剪",
  "app.buttons.compare": "对比",
  "app.buttons.reset": "重置",
  "app.buttons.uploadNew": "上传新图片",
  "app.buttons.download": "下载图片",
  "gemini.error.invalidDataUrl": "无效的数据URL",
  "gemini.error.mimeParse": "无法从数据URL解析MIME类型",
  "gemini.error.requestBlocked": "请求被阻止。原因: {{reason}}。{{message}}",
  "gemini.error.generationStopped": "{{context}}的图像生成意外停止。原因: {{reason}}。这通常与安全设置有关。",
  "gemini.error.noImageReturnedText": "AI模型没有为{{context}}返回图像。模型以文本回应: \"{{text}}\"",
  "gemini.error.noImageReturnedGeneric": "AI模型没有为{{context}}返回图像。这可能是由于安全过滤器或请求过于复杂。请尝试更直接地改写您的提示。"
};


type Language = 'en' | 'zh';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = { en, zh };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese

  const toggleLang = useCallback(() => {
    setLang(prevLang => prevLang === 'en' ? 'zh' : 'en');
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[lang]?.[key] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        text = text.replace(new RegExp(`{{${pKey}}}`, 'g'), String(params[pKey]));
      });
    }
    return text;
  }, [lang]);

  const contextValue = useMemo(() => ({
    lang,
    setLang,
    toggleLang,
    t
  }), [lang, setLang, toggleLang, t]);


  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
