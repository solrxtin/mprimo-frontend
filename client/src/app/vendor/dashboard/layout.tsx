"use client";
import React, { useState } from "react";
import Header from "./(components)/Header";
import Sidebar from "./(components)/Sidebar";
import { FaBars } from "react-icons/fa";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 overflow-auto">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
