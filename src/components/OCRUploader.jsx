// src/components/OCRUploader.jsx

import React, { useState } from "react";
import { uploadOCR } from "../services/api.js";
import "../index.css"; // mantém consistência com outros componentes

export default function OCRUploader() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setStatus("Selecione um arquivo PDF ou imagem.");
    setStatus("Enviando...");
    const payload = { fileBase64: await toBase64(file) };
    try {
      const res = await uploadOCR(payload);
      if (res.success) setStatus("OCR concluído com sucesso!");
      else setStatus(`Erro: ${res.error}`);
    } catch (err) {
      setStatus(`Falha: ${err.message}`);
    }
  };

  const toBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });

  return (
    <div className="glass-card">
      <h2 className="title">Upload OCR (Google Vision)</h2>
      <form onSubmit={handleSubmit} className="flex-col">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files[0])}
          className="file-input"
        />
        <button type="submit" className="btn-primary">
          Enviar
        </button>
      </form>
      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}
