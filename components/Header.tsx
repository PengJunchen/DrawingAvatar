/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useTranslation } from '../i18n';

const Header: React.FC = () => {
  const { t, toggleLang } = useTranslation();
  return (
    <header className="w-full py-4 px-8 border-b border-gray-700 bg-gray-800/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gray-100">
            DrawingAvatar
          </h1>
          <button
            onClick={toggleLang}
            className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
          >
            {t('lang.toggle')}
          </button>
      </div>
    </header>
  );
};

export default Header;
