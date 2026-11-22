-- Línea base verificada contra Supabase; las tablas existentes no se recrean al registrarla como aplicada.
-- Crear tabla
CREATE TABLE "catalogo_especie" (
    "id_especie" SERIAL NOT NULL,
    "nombre_especie" VARCHAR(50) NOT NULL,

    CONSTRAINT "catalogo_especie_pkey" PRIMARY KEY ("id_especie")
);

-- Crear tabla
CREATE TABLE "configuracion_nutricion" (
    "id_config_nutricion" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "meta_agua_diaria" INTEGER NOT NULL DEFAULT 4,
    "reinicio_agua_dias" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "porcion_diaria" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidad_medida" VARCHAR(10) NOT NULL DEFAULT 'g',

    CONSTRAINT "configuracion_nutricion_pkey" PRIMARY KEY ("id_config_nutricion")
);

-- Crear tabla
CREATE TABLE "inventario_alimento" (
    "id_inventario" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "marca" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costo" DECIMAL(10,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "cantidad_restante" DOUBLE PRECISION NOT NULL,
    "cantidad_total" DOUBLE PRECISION NOT NULL,
    "unidad_medida" VARCHAR(10) NOT NULL DEFAULT 'g',

    CONSTRAINT "inventario_alimento_pkey" PRIMARY KEY ("id_inventario")
);

-- Crear tabla
CREATE TABLE "compartir_alimento" (
    "id_compartir" TEXT NOT NULL,
    "id_inventario" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,

    CONSTRAINT "compartir_alimento_pkey" PRIMARY KEY ("id_compartir")
);

-- Crear tabla
CREATE TABLE "registro_hidratacion" (
    "id_registro_agua" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidad_tazones" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "registro_hidratacion_pkey" PRIMARY KEY ("id_registro_agua")
);

-- Crear tabla
CREATE TABLE "clinica_favorita" (
    "id_clinica_fav" TEXT NOT NULL,
    "google_place_id" VARCHAR(255) NOT NULL,
    "nombre_clinica" VARCHAR(150),
    "notas_usuario" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direccion" VARCHAR(255),
    "id_mascota" TEXT NOT NULL,

    CONSTRAINT "clinica_favorita_pkey" PRIMARY KEY ("id_clinica_fav")
);

-- Crear tabla
CREATE TABLE "historial_medico" (
    "id_evento" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "tipo_evento" VARCHAR(100),
    "fecha_evento" DATE NOT NULL,
    "descripcion" TEXT,
    "veterinario_clinica" VARCHAR(150),
    "peso_kg" DECIMAL(5,2),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_medico_pkey" PRIMARY KEY ("id_evento")
);

-- Crear tabla
CREATE TABLE "mascota" (
    "id_mascota" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "id_especie" INTEGER,
    "nombre" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE,
    "sexo" CHAR(1),
    "color" VARCHAR(100),
    "senas_particulares" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genero" TEXT,
    "peso" DOUBLE PRECISION,
    "tipo" VARCHAR(50),
    "edad" INTEGER,
    "imagen" TEXT,
    "raza" VARCHAR(100),
    "medicamentos" TEXT,
    "padecimientos" TEXT,
    "fotos_cartilla" JSONB,

    CONSTRAINT "mascota_pkey" PRIMARY KEY ("id_mascota")
);

-- Crear tabla
CREATE TABLE "recordatorio" (
    "id_recordatorio" SERIAL NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "fecha_hora" TIMESTAMP(6) NOT NULL,
    "id_evento_google" VARCHAR(255),
    "estado" BOOLEAN DEFAULT false,
    "descripcion" TEXT,
    "id_usuario" TEXT NOT NULL,

    CONSTRAINT "recordatorio_pkey" PRIMARY KEY ("id_recordatorio")
);

-- Crear tabla
CREATE TABLE "usuario" (
    "id_usuario" TEXT NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255),
    "google_id" VARCHAR(255),
    "google_refresh_token" TEXT,
    "telefono" VARCHAR(20),
    "fecha_registro" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "imagen" TEXT,
    "color_avatar" VARCHAR(7) DEFAULT '#2d9b96',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "reset_token" TEXT,
    "reset_token_exp" TIMESTAMP(3),
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verification_token_exp" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- Crear tabla
CREATE TABLE "user_settings" (
    "id_settings" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "language" VARCHAR(10) NOT NULL DEFAULT 'es',

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id_settings")
);

-- Crear tabla
CREATE TABLE "vacuna" (
    "id_vacuna" SERIAL NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "nombre_vacuna" VARCHAR(150) NOT NULL,
    "fecha_aplicacion" DATE NOT NULL,
    "proxima_dosis" DATE,
    "lote" VARCHAR(100),

    CONSTRAINT "vacuna_pkey" PRIMARY KEY ("id_vacuna")
);

-- Crear tabla
CREATE TABLE "tutorial_progress" (
    "id_usuario" TEXT NOT NULL,
    "id_tutorial" VARCHAR(30) NOT NULL,

    CONSTRAINT "tutorial_progress_pkey" PRIMARY KEY ("id_usuario","id_tutorial")
);

-- Crear índice
CREATE UNIQUE INDEX "catalogo_especie_nombre_especie_key" ON "catalogo_especie"("nombre_especie");

-- Crear índice
CREATE UNIQUE INDEX "configuracion_nutricion_id_mascota_key" ON "configuracion_nutricion"("id_mascota");

-- Crear índice
CREATE UNIQUE INDEX "compartir_alimento_id_inventario_id_mascota_key" ON "compartir_alimento"("id_inventario", "id_mascota");

-- Crear índice
CREATE INDEX "registro_hidratacion_id_mascota_fecha_hora_idx" ON "registro_hidratacion"("id_mascota", "fecha_hora");

-- Crear índice
CREATE INDEX "idx_historial_mascota" ON "historial_medico"("id_mascota");

-- Crear índice
CREATE INDEX "idx_mascota_usuario" ON "mascota"("id_usuario");

-- Crear índice
CREATE INDEX "idx_recordatorio_mascota" ON "recordatorio"("id_mascota");

-- Crear índice
CREATE INDEX "idx_recordatorio_usuario" ON "recordatorio"("id_usuario");

-- Crear índice
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- Crear índice
CREATE UNIQUE INDEX "usuario_google_id_key" ON "usuario"("google_id");

-- Crear índice
CREATE UNIQUE INDEX "user_settings_id_usuario_key" ON "user_settings"("id_usuario");

-- Crear índice
CREATE INDEX "idx_vacuna_mascota" ON "vacuna"("id_mascota");

-- Añadir clave foránea
ALTER TABLE "configuracion_nutricion" ADD CONSTRAINT "configuracion_nutricion_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "inventario_alimento" ADD CONSTRAINT "inventario_alimento_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "compartir_alimento" ADD CONSTRAINT "compartir_alimento_id_inventario_fkey" FOREIGN KEY ("id_inventario") REFERENCES "inventario_alimento"("id_inventario") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "compartir_alimento" ADD CONSTRAINT "compartir_alimento_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "registro_hidratacion" ADD CONSTRAINT "registro_hidratacion_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "clinica_favorita" ADD CONSTRAINT "clinica_favorita_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "historial_medico" ADD CONSTRAINT "historial_medico_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_id_especie_fkey" FOREIGN KEY ("id_especie") REFERENCES "catalogo_especie"("id_especie") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Añadir clave foránea
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- Añadir clave foránea
ALTER TABLE "tutorial_progress" ADD CONSTRAINT "tutorial_progress_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;


-- El progreso solo se consulta mediante el backend autenticado.
ALTER TABLE "tutorial_progress" ENABLE ROW LEVEL SECURITY;
