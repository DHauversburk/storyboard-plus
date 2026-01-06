"use client";

import React, { useEffect, useState } from 'react';
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDriveConfig } from "@/lib/googleDrive";

export default function Home() {
  const [isDriveConfigured, setIsDriveConfigured] = useState(false);

  useEffect(() => {
    // Check if keys exist in Env or LocalStorage
    const config = getDriveConfig();
    if (config.apiKey && config.clientId) {
      setIsDriveConfigured(true);
    }
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Welcome back.</h2>
          <p className="text-gray-400 mt-1">Ready to create?</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Project Placeholder - Clean State */}
          <Card className="border-dashed border-white/10 bg-black/20 text-center py-10">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full mx-auto flex items-center justify-center text-3xl">
                📚
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-300">No Active Project</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                  Select a project from the sidebar or start fresh.
                  {!isDriveConfigured && (
                    <span className="block mt-1 text-purple-400">Connect Google Drive in Settings to sync your work.</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1">
            <h3 className="text-sm font-medium text-gray-500 mb-4 px-1">Actions</h3>
            <QuickActions />
          </div>
        </div>

        {/* Right Column (Updates & Info) */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20">
            <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-gray-400">Daily Inspiration</CardTitle></CardHeader>
            <CardContent>
              <p className="italic text-lg text-gray-200 font-serif leading-relaxed">"The scariest moment is always just before you start."</p>
              <p className="text-right text-sm text-primary mt-4">- Stephen King</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
