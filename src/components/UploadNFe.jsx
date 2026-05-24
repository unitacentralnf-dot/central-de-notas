// src/components/UploadNFe.jsx
import React, { useState } from 'react';
import { uploadNFe } from '../services/api.js';

function UploadNFe({ obraId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage('Selecione um arquivo XML da NFe.');
    setLoading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    // Assuming the edge function expects base64 string of the XML
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const payload = { obraId, xmlBase64: base64 };
      const result = await uploadNFe(payload);
      if (result.success) {
        setMessage('NFe enviada com sucesso!');
      } else {
        setMessage(`Erro: ${result.error || 'Falha ao enviar'}`);
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="card glassmorphism p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Upload de Nota Fiscal Eletrônica</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="file"
          accept=".xml"
          onChange={(e) => setFile(e.target.files[0])}
          className="file-input file-input-primary w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-2"
        >
          {loading ? 'Enviando...' : 'Enviar NFe'}
        </button>
        {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      </form>
    </div>
  );
}

export default UploadNFe;
