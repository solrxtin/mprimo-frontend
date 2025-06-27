import type { Metadata } from "next";
import { Poppins, Inter, Alexandria, Roboto } from "next/font/google";
import "./globals.css";
import TanstackProvider from "@/providers/TanstackProvider";
import { ToastContainer, Slide } from "react-toastify";
import Script from "next/script";
import { TokenRefresher } from "@/components/TokenRefresher";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SocketInitializer from "@/components/SocketInitializer";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: "400",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const alexandria = Alexandria({
  subsets: ["latin"],
  variable: "--font-alexandria",
});

export const metadata: Metadata = {
  title: "Mprimo",
  description: "A global marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} ${alexandria.variable} ${roboto.variable} font-[family-name:var(--font-alexandria)]`}
        suppressHydrationWarning
      >
        <TanstackProvider>
          <TokenRefresher />
          <NotificationProvider>
            <SocketInitializer />
            {children}
          </NotificationProvider>
          <ToastContainer transition={Slide} />
        </TanstackProvider>
        {/* Script to remove Grammarly attributes that cause hydration errors */}
        <Script id="remove-grammarly-attrs" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              const removeGrammarlyAttributes = () => {
                const body = document.querySelector('body');
                if (body) {
                  if (body.hasAttribute('data-new-gr-c-s-check-loaded')) {
                    body.removeAttribute('data-new-gr-c-s-check-loaded');
                  }
                  if (body.hasAttribute('data-gr-ext-installed')) {
                    body.removeAttribute('data-gr-ext-installed');
                  }
                }
              };
              
              // Run once on load
              removeGrammarlyAttributes();
              
              // Set up a mutation observer to handle future changes
              const observer = new MutationObserver(removeGrammarlyAttributes);
              observer.observe(document.body, { attributes: true });
            }
          `}
        </Script>
        {/* Register service worker for push notifications */}
        <Script id="register-service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js')
                  .then(function(registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                  })
                  .catch(function(error) {
                    console.error('Service Worker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
