"use client";
import React, { useEffect, useState } from "react";
import Header from "./(components)/Header";
import Sidebar from "./(components)/Sidebar";
import { useUserStore } from "@/stores/useUserStore";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useUserStore();
  const router = useRouter()

  useEffect(() => {
    // Check if user store has been initialized
    if (useUserStore.persist.hasHydrated()) {
      setIsLoading(false);
    } else {
      const unsubscribe = useUserStore.persist.onHydrate(() => {
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    // Only redirect if we're not loading
    if (!isLoading) {
      if (!user) {
        window.location.href = "/login";
      } else if (user.role === "personal" && !user.canMakeSales) {
        toast.error("You don't have permission to access this page. Please upgrade your account");
        router.push("/");
      }
    }
  }, [user, isLoading]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // After loading, check permissions
  if (!user) {
    return null;
  }

  if (user && user.role === "personal" && !user.canMakeSales) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <NotificationProvider>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 overflow-auto">
            <Header onOpenSidebar={() => setSidebarOpen(true)} />
            <main>{children}</main>
          </div>
        </div>
      </NotificationProvider>
    </div>
  );
}
