/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../i18n';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          {t('startScreen.title.part1')} <span className="text-blue-400">{t('startScreen.title.part2')}</span>{t('startScreen.title.part3')}
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t('startScreen.subtitle')}
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors">
                {t('startScreen.uploadBtn')}
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500">{t('startScreen.dragAndDrop')}</p>
        </div>

        <div className="mt-16 w-full">
            <div className="max-w-md mx-auto">
                <div className="bg-black/20 p-8 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <h3 className="text-2xl font-bold text-gray-100">{t('startScreen.featureTitle')}</h3>
                    <p className="mt-4 text-gray-400">{t('startScreen.featureDesc')}</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;
