/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateAdjustedImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';

// 模板类型定义
interface Template {
  name: {
    zh: string;
    en: string;
  };
  prompt: {
    zh: string;
    en: string;
  };
}

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

// 移除不需要的Tab类型定义

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // 模板相关状态
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // 裁剪相关状态
  const [showOriginalImage, setShowOriginalImage] = useState(true);
  const [crop, setCrop] = useState<Crop>({ aspect: 1 / 1 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setPrompt('');
    setSelectedTemplate('');
    // 上传图片后只显示当前图片，不显示原始图片
    setShowOriginalImage(false);
  }, []);

  // 加载模板数据
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const response = await fetch('/templates/template.json');
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Failed to load templates:', error);
        setError('Failed to load templates.');
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // 处理模板选择
  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = templates.find(t => t.name.en === templateName || t.name.zh === templateName);
    if (template) {
      // 使用中文提示词
      setPrompt(template.prompt.zh);
    }
  };

  // 处理生成按钮点击
  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('没有加载图片进行编辑。');
      return;
    }
    
    if (!prompt.trim()) {
      setError('请输入描述以生成头像。');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 使用generateAdjustedImage函数来实现整个图片的重绘
      const generatedImageUrl = await generateAdjustedImage(currentImage, prompt);
      const newImageFile = dataURLtoFile(generatedImageUrl, `generated-avatar-${Date.now()}.png`);
      addImageToHistory(newImageFile);
      // 生成图片后隐藏原图片
      setShowOriginalImage(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
      setError(`生成头像失败：${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, prompt, addImageToHistory]);
  
  // 1:1 裁剪功能
  const handleCrop1x1 = useCallback(() => {
    if (!currentImageUrl || !imgRef.current) return;
    
    const image = imgRef.current;
    
    // 获取图像的实际显示尺寸
    const displayRect = image.getBoundingClientRect();
    const displayWidth = displayRect.width;
    const displayHeight = displayRect.height;
    
    // 计算最大可能的1:1裁剪区域，居中显示
    const size = Math.min(displayWidth, displayHeight);
    const x = (displayWidth - size) / 2;
    const y = (displayHeight - size) / 2;
    
    // 设置固定的1:1裁剪框并进入裁剪模式，使用像素单位确保坐标一致
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x: x,
      y: y,
      aspect: 1
    });
    setIsCropping(true);
  }, [currentImage, currentImageUrl]);

  // 处理裁剪区域变化 - 保持1:1的固定比例
  const onCropChange = useCallback((newCrop: Crop | null) => {
    if (newCrop) {
      // 保持1:1的固定比例，确保裁剪框始终是正方形
      const size = Math.min(newCrop.width || 0, newCrop.height || 0);
      setCrop({
        ...newCrop,
        width: size,
        height: size,
        aspect: 1
      });
    }
  }, []);

  // 处理裁剪完成
  const onCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

  // 应用裁剪 - 修复比例和渲染问题
  const handleApplyCrop = useCallback(() => {
    if (!currentImage || !completedCrop || !imgRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const canvas = document.createElement('canvas');
      const image = imgRef.current;
      
      // 获取图像的实际显示区域（考虑object-fit: contain的影响）
      const displayRect = image.getBoundingClientRect();
      const containerWidth = displayRect.width;
      const containerHeight = displayRect.height;
      
      // 计算图像在object-contain模式下的实际显示区域
      const containerAspect = containerWidth / containerHeight;
      const imageAspect = image.naturalWidth / image.naturalHeight;
      
      let actualImageWidth, actualImageHeight, offsetX, offsetY;
      
      if (containerAspect > imageAspect) {
        // 容器更宽，图像高度填满容器
        actualImageHeight = containerHeight;
        actualImageWidth = actualImageHeight * imageAspect;
        offsetX = (containerWidth - actualImageWidth) / 2;
        offsetY = 0;
      } else {
        // 容器更高，图像宽度填满容器
        actualImageWidth = containerWidth;
        actualImageHeight = actualImageWidth / imageAspect;
        offsetX = 0;
        offsetY = (containerHeight - actualImageHeight) / 2;
      }
      
      // 正确计算缩放比例：实际图像尺寸 / 实际显示尺寸
      const scaleX = image.naturalWidth / actualImageWidth;
      const scaleY = image.naturalHeight / actualImageHeight;
      
      // 将裁剪坐标从容器坐标转换为实际图像显示区域坐标，再转换为原始图像尺寸
      const actualX = completedCrop.x - offsetX;
      const actualY = completedCrop.y - offsetY;
      
      // 确保裁剪坐标在有效范围内
      const validX = Math.max(0, Math.min(actualX, actualImageWidth));
      const validY = Math.max(0, Math.min(actualY, actualImageHeight));
      const validWidth = Math.min(completedCrop.width, actualImageWidth - validX);
      const validHeight = Math.min(completedCrop.height, actualImageHeight - validY);
      
      // 转换为原始图像尺寸
      const originalX = validX * scaleX;
      const originalY = validY * scaleY;
      const originalWidth = validWidth * scaleX;
      const originalHeight = validHeight * scaleY;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建画布上下文');
      }
      
      // 考虑设备像素比，提高图像质量
      const pixelRatio = window.devicePixelRatio || 1;
      
      // 确保裁剪后的图像保持1:1比例，添加白色背景以避免拉伸
      // 使用原始图像尺寸来计算裁剪尺寸，确保高质量
      const cropSize = Math.max(originalWidth, originalHeight);
      canvas.width = cropSize * pixelRatio;
      canvas.height = cropSize * pixelRatio;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      
      // 填充白色背景（留白）
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cropSize, cropSize);
      
      // 计算居中位置，确保图像在1:1画布中居中显示
      const targetOffsetX = (cropSize - originalWidth) / 2;
      const targetOffsetY = (cropSize - originalHeight) / 2;
      
      // 绘制裁剪区域，居中显示 - 使用转换后的原始图像坐标
      // 注意：drawImage参数顺序为：图像, 源x, 源y, 源宽, 源高, 目标x, 目标y, 目标宽, 目标高
      ctx.drawImage(
        image,
        originalX,        // 源x：原始图像中的裁剪起始x坐标
        originalY,        // 源y：原始图像中的裁剪起始y坐标
        originalWidth,    // 源宽：原始图像中的裁剪宽度
        originalHeight,   // 源高：原始图像中的裁剪高度
        targetOffsetX,    // 目标x：在画布中的x位置
        targetOffsetY,    // 目标y：在画布中的y位置
        originalWidth,   // 目标宽：在画布中的显示宽度（使用原始尺寸保持质量）
        originalHeight   // 目标高：在画布中的显示高度（使用原始尺寸保持质量）
      );
      
      // 转换为图像
      const croppedDataUrl = canvas.toDataURL('image/png');
      const croppedImageFile = dataURLtoFile(croppedDataUrl, `cropped-avatar-${Date.now()}.png`);
      
      // 更新历史记录
      addImageToHistory(croppedImageFile);
      
      // 完成后重置状态
      setIsCropping(false);
      setCompletedCrop(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`裁剪失败：${errorMessage}`);
      console.error('裁剪过程错误:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, completedCrop, addImageToHistory]);

  // 取消裁剪
  const handleCancelCrop = useCallback(() => {
    setIsCropping(false);
    setCompletedCrop(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setSelectedTemplate('');
      // 上传新图片时重新显示原图片
      setShowOriginalImage(true);
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  // 移除不需要的点击事件处理函数

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    const imageDisplay = (
      <div className="relative">
        {/* Base image is the original, only show if needed */}
        {showOriginalImage && originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
            />
        )}
        {/* 当前图片 - 修改样式以确保始终可见 */}
        {!isCropping ? (
          <img
              ref={imgRef}
              key={currentImageUrl}
              src={currentImageUrl}
              alt="Current"
              className={`w-full h-auto rounded-xl transition-opacity duration-200 ease-in-out ${isComparing && showOriginalImage ? 'opacity-0' : 'opacity-100'}`}
              style={{ maxHeight: '60vh', objectFit: 'contain' }}
          />
        ) : (
          <ReactCrop
            crop={crop}
            onChange={onCropChange}
            onComplete={onCropComplete}
            aspect={1}
            keepSelection
            className="w-full h-auto rounded-xl"
            ruleOfThirds
          >
            <img
              ref={imgRef}
              key={`crop-${currentImageUrl}`}
              src={currentImageUrl}
              alt="Crop this image"
              className="w-full h-auto rounded-xl"
              style={{ maxHeight: '60vh', objectFit: 'contain' }}
            />
          </ReactCrop>
        )}
      </div>
    );
    
    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl} 
        alt="Crop this image"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );


    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-black/20">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300">AI is working its magic...</p>
                </div>
            )}
            
            {imageDisplay}


        </div>
        
        {/* 移除标签按钮组，添加模板选择和提示词输入 */}
        <div className="w-full">
            <div className="w-full bg-gray-800/80 border border-gray-700/80 rounded-lg p-5 backdrop-blur-sm mb-6">
                <h3 className="text-xl font-bold mb-4">选择模板</h3>
                <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    disabled={isLoadingTemplates}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                >
                    <option value="">-- 选择模板 --</option>
                    {isLoadingTemplates ? (
                        <option>加载中...</option>
                    ) : (
                        templates.map((template, index) => (
                            <option key={index} value={template.name.zh}>
                                {template.name.zh}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <div className="w-full bg-gray-800/80 border border-gray-700/80 rounded-lg p-5 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">修改提示词</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col gap-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="请输入生成头像的描述"
                        className="flex-grow bg-gray-700 border border-gray-600 text-gray-200 rounded-lg p-4 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full min-h-[120px]"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit"
                        className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isLoading || !prompt.trim()}
                    >
                        {isLoading ? '生成中...' : '生成头像'}
                    </button>
                </form>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label="撤销上一步操作"
            >
                撤销
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label="重做上一步操作"
            >
                重做
            </button>
            
            <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block"></div>

            {currentImage && (
              <>
                {!isCropping ? (
                  <button 
                      onClick={handleCrop1x1}
                      disabled={isLoading}
                      className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                  >
                      1:1 裁剪
                  </button>
                ) : (
                  <>
                    <button 
                        onClick={handleApplyCrop}
                        disabled={isLoading || !completedCrop}
                        className="flex items-center justify-center text-center bg-green-600 border border-green-500 text-white font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-green-500 hover:border-green-400 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-green-800"
                    >
                        应用裁剪
                    </button>
                    <button 
                        onClick={handleCancelCrop}
                        disabled={isLoading}
                        className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                    >
                        取消裁剪
                    </button>
                  </>
                )}
              </>
            )}

            {canUndo && (
              <button 
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                  aria-label="按住查看原始图片"
              >
                  对比
              </button>
            )}

            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className="text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent"
              >
                重置
            </button>
            <button 
                onClick={handleUploadNew}
                className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
            >
                上传新图片
            </button>

            <button 
                onClick={handleDownload}
                className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
            >
                下载图片
            </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;