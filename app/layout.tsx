import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from "@/contexts/AppContext"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FINANCE-VM",
  description: "Sistema de Gestão Financeira USTM",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <head>
        <style>
          {`
            @media print {
              nav.bg-red-700 {
                display: none !important;
              }
            }
          `}
        </style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Bloquear todos os alertas e pop-ups
              (function() {
                // Sobrescrever window.alert
                window.alert = function() { return true; };
                
                // Bloquear pop-ups de domínios específicos
                window.addEventListener('message', function(event) {
                  if (event.origin.includes('vusercontent.net') || 
                      event.origin.includes('vercel') ||
                      event.origin.includes('lite.')) {
                    event.stopPropagation();
                    return false;
                  }
                }, true);
                
                // Bloquear criação de iframes
                const originalCreateElement = document.createElement;
                document.createElement = function(tagName) {
                  const element = originalCreateElement.call(document, tagName);
                  if (tagName.toLowerCase() === 'iframe') {
                    // Impedir que o iframe seja adicionado ao DOM
                    element.setAttribute('style', 'display:none !important');
                    setTimeout(() => {
                      if (element.parentNode) {
                        element.parentNode.removeChild(element);
                      }
                    }, 0);
                  }
                  return element;
                };
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AppProvider>
          {children}
          <Footer />
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}



import './globals.css'