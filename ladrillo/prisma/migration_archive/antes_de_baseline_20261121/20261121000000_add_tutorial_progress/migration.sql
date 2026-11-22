-- Tabla nueva: no modifica los datos existentes de usuarios ni mascotas.
CREATE TABLE "tutorial_progress" (
    "id_usuario" TEXT NOT NULL,
    "id_tutorial" VARCHAR(30) NOT NULL,
    CONSTRAINT "tutorial_progress_pkey" PRIMARY KEY ("id_usuario", "id_tutorial"),
    CONSTRAINT "tutorial_progress_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE
);

-- El progreso se consulta mediante el backend autenticado, no desde la API pública.
ALTER TABLE "tutorial_progress" ENABLE ROW LEVEL SECURITY;
