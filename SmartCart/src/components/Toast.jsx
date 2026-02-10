import React, { useState, useEffect, createContext, useContext, useCallback } from "react";

// Toast Context
const ToastContext = createContext(null);

// Toast types with styling
const TOAST_TYPES = {
  success: {
    bg: "#e8f5e9",
    border: "#4caf50",
    color: "#2e7d32",
    icon: "✓"
  },
  error: {
    bg: "#ffebee",
    border: "#f44336",
    color: "#c62828",
    icon: "✕"
  },
  warning: {
    bg: "#fff3e0",
    border: "#ff9800",
    color: "#e65100",
    icon: "⚠"
  },
  info: {
    bg: "#e3f2fd",
    border: "#2196f3",
    color: "#1565c0",
    icon: "ℹ"
  }
};

// Individual Toast Component
const ToastItem = ({ id, message, type, onClose }) => {
  const style = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        marginBottom: 10,
        animation: "slideIn 0.3s ease",
        maxWidth: 400,
        wordBreak: "break-word"
      }}
    >
      <span style={{ 
        fontSize: 18, 
        fontWeight: 700, 
        color: style.color,
        flexShrink: 0
      }}>
        {style.icon}
      </span>
      <span style={{ 
        flex: 1, 
        color: style.color, 
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.4
      }}>
        {message}
      </span>
      <button
        onClick={() => onClose(id)}
        style={{
          background: "none",
          border: "none",
          color: style.color,
          cursor: "pointer",
          fontSize: 18,
          padding: 0,
          opacity: 0.7,
          flexShrink: 0
        }}
      >
        ×
      </button>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end"
        }}
      >
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info: (msg) => addToast(msg, "info"),
    show: addToast
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if not in provider - use alert
    return {
      success: (msg) => console.log("✓", msg),
      error: (msg) => console.error("✕", msg),
      warning: (msg) => console.warn("⚠", msg),
      info: (msg) => console.info("ℹ", msg),
      show: (msg) => console.log(msg)
    };
  }
  return context;
};

export default ToastProvider;
