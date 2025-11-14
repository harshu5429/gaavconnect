"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure DOM is ready and IntersectionObserver is available
    const checkReady = () => {
      try {
        if (
          typeof window !== 'undefined' && 
          window.IntersectionObserver && 
          document.body &&
          document.readyState === 'complete'
        ) {
          // Test IntersectionObserver with a dummy element
          const testDiv = document.createElement('div');
          document.body.appendChild(testDiv);
          
          const observer = new IntersectionObserver(() => {});
          observer.observe(testDiv);
          observer.disconnect();
          document.body.removeChild(testDiv);
          
          setIsReady(true);
        } else {
          setTimeout(checkReady, 100);
        }
      } catch (error) {
        console.warn('IntersectionObserver not available, using fallback toast');
        setIsReady(true); // Still show toaster even if IntersectionObserver fails
      }
    };

    checkReady();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      closeButton
      richColors
      expand={false}
      visibleToasts={3}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1f2937",
          "--normal-border": "#e5e7eb",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
