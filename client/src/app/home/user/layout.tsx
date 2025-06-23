"use client"


import Header from '@/components/Home/Header';
import { Sidebar } from '@/components/SideBar';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
   <div className="min-h-screen font-roboto bg-gray-50">

      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <main className="flex-1 p-6">
        {children}
      </main>

    </div>
    </div>
  );
}
