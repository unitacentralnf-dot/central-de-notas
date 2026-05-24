// src/components/UploadDDA.jsx
import React, { useState } from "react";
import { uploadDDA } from "../services/api.js";
import "../index.css";

export default function UploadDDA() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setStatus("Selecione um arquivo PDF.");
    setStatus("Enviando...");
    const payload = { fileName: file.name, fileBase64: await toBase64(file) };
    try {
      const res = await uploadDDA(payload);
      if (res.success) setStatus("Upload DDA concluído com sucesso!");
      else setStatus(`Erro: ${res.error}`);
    } catch (err) {
      setStatus(`Falha: ${err.message}`);
    }
  };

  const toBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });

  return (
    <div className="glass-card">
      <h2 className="title">Upload de DDA</h2>
      <form onSubmit={handleSubmit} className="flex-col">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="file-input"
        />
        <button type="submit" className="btn-primary">Enviar</button>
      </form>
      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}
