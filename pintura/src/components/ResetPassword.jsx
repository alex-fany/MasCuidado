import { useState } from "react";

export default function ResetPassword({ token }) {

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {

    try {

      const res = await fetch(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token,
            newPassword: password
          })
        }
      );

      const data = await res.json();

      setMessage(data.message);

    } catch (error) {

      console.error(error);

      setMessage("Error al actualizar contraseña");
    }
  };

  return (
    <div className="animate-in fade-in duration-700">

      <div className="space-y-4">

        <h2 className="text-3xl font-black text-center">
          Nueva contraseña
        </h2>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-4 rounded-2xl"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-[#2d9b96] text-white p-4 rounded-2xl font-bold"
        >
          Guardar contraseña
        </button>

        {message && (
          <p className="text-center text-sm">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}