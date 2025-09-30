/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-8 border-b border-gray-700 bg-gray-800/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-100">
            DrawingAvatar
          </h1>
      </div>
    </header>
  );
};

export default Header;