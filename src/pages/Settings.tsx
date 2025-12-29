import React from 'react';

const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-text">Settings</h1>
      
      <div className="space-y-6 max-w-2xl">
        <section className="bg-white rounded-xl shadow p-6 glass">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Theme</h2>
          <div className="flex gap-4">
             <button className="w-12 h-12 rounded-full bg-yellow-500 cursor-pointer ring-4 ring-offset-2 ring-yellow-500/30 transition-all hover:scale-105" title="Amber (Default)"></button>
             <button className="w-12 h-12 rounded-full bg-blue-500 cursor-pointer hover:ring-4 hover:ring-offset-2 hover:ring-blue-500/30 transition-all hover:scale-105" title="Blue"></button>
             <button className="w-12 h-12 rounded-full bg-emerald-500 cursor-pointer hover:ring-4 hover:ring-offset-2 hover:ring-emerald-500/30 transition-all hover:scale-105" title="Emerald"></button>
             <button className="w-12 h-12 rounded-full bg-purple-500 cursor-pointer hover:ring-4 hover:ring-offset-2 hover:ring-purple-500/30 transition-all hover:scale-105" title="Purple"></button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6 glass">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Account</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
              G
            </div>
            <div>
              <p className="font-medium text-gray-900">Guest User</p>
              <p className="text-sm text-gray-500">Not logged in</p>
            </div>
          </div>
          <button className="btn-primary glass-hover w-full sm:w-auto">
            Sign In / Register
          </button>
        </section>

        <section className="bg-white rounded-xl shadow p-6 glass">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Data & Sync</h2>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-700">Auto-sync</p>
              <p className="text-xs text-gray-500">Sync changes automatically when online</p>
            </div>
            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
           <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-700">Clear Local Data</p>
              <p className="text-xs text-gray-500">Remove all locally stored notes</p>
            </div>
            <button className="text-red-500 text-sm font-medium hover:text-red-600">Clear</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;