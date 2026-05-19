import React, { useState } from 'react';

export default function ForgotPasswordModal({
  isOpen,
  onClose
}) {

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {

    const res = await fetch(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      }
    );

    const data = await res.json();

    setMessage(data.message);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">

      <div className="bg-white p-6 rounded-3xl w-full max-w-md">

        <h2 className="text-2xl font-black mb-4">
          Recuperar contraseña
        </h2>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-xl"
        />

        <button
          onClick={handleSubmit}
          className="w-full mt-4 p-3 bg-[#2d9b96] text-white rounded-xl"
        >
          Enviar instrucciones
        </button>

        {message && (
          <p className="mt-4 text-sm">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}