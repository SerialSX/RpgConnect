import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

// Estilos da Overlay (Fundo escuro) com animação
const overlayStyle = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .modal-overlay {
    background-color: rgba(0, 0, 0, 0.75);
    position: fixed;
    inset: 0;
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
  }
`;

// Estilos do Conteúdo com animação de escala
const contentStyle = `
  @keyframes contentShow {
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .modal-content {
    background-color: #1e1e1e;
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    position: fixed;
    top: "50%";
    left: "50%";
    width: 90vw;
    max-width: 400px;
    padding: 24px;
    z-index: 10000;
    border: 1px solid #333;
    animation: contentShow 0.3s ease-out forwards;
  }
`;

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export const AlertDialogContent = ({ children }) => (
  <AlertDialogPrimitive.Portal>
    <style>{overlayStyle + contentStyle}</style>
    <AlertDialogPrimitive.Overlay className="modal-overlay" />
    <AlertDialogPrimitive.Content 
      className="modal-content"
      style={{ top: '50%', left: '50%' }} // Mantém o centralizamento manual
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
);

export const AlertDialogHeader = ({ children }) => (
  <div style={{ marginBottom: "16px" }}>{children}</div>
);

export const AlertDialogTitle = ({ children }) => (
  <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", fontFamily: "inherit" }}>{children}</h2>
);

export const AlertDialogDescription = ({ children }) => (
  <p style={{ marginTop: "12px", color: "#ccc", fontSize: "0.95rem", lineHeight: "1.4" }}>{children}</p>
);

export const AlertDialogFooter = ({ children }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
    {children}
  </div>
);

export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;