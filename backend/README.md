# Backend — Deploy en Termux (Android)

Guía para correr el backend de Yggdrasilv2 en un dispositivo Android con
[Termux](https://termux.dev/), reemplazando el hosting en Render (evita los
cold starts de 30-50s del free tier).

## 1. Prerequisitos

- Termux instalado desde **F-Droid** (no la versión de Play Store, que está
  desactualizada y no recibe updates).
- Dispositivo con acceso a internet (wifi o datos).

## 2. Instalación de paquetes del sistema

```bash
pkg update -y && pkg upgrade -y
pkg install -y python rust clang golang git cloudflared termux-api
```

`rust`, `clang` y `golang` son necesarios porque `neonize` (WhatsApp) y
algunas dependencias de `uvicorn[standard]` pueden requerir compilar desde
source en Termux (no es glibc estándar, no siempre hay wheels precompiladas).

## 3. Clonar/copiar el proyecto

Si el repo tiene remoto en GitHub:

```bash
git clone <url-del-remoto> ~/yggdrasilv2
cd ~/yggdrasilv2/backend
```

Si no hay remoto, se copia con `adb push` desde la PC (ver fase de deploy del
brief `infra-android-wol` para el detalle del comando).

## 4. Entorno virtual e instalación de dependencias

```bash
pip install -r requirements.txt
```

## 5. Configurar `.env`

Copiar `.env.example` a `.env` y completar:

- `SUPABASE_URL`, `SUPABASE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`
- `WOL_TARGET_MAC`, `WOL_BROADCAST_IP`
- `WHATSAPP_ENABLED`

## 6. Dar permisos y arrancar

```bash
chmod +x start.sh
./start.sh
```

## 7. Verificar

Desde otra sesión de Termux:

```bash
curl localhost:8000/health
```

Tiene que devolver 200.

## 8. Autostart con Termux:Boot

Ver fase de deploy del brief `infra-android-wol` para el setup de autostart
(`Termux:Boot`) y Cloudflare Tunnel.

## 9. Nota sobre WhatsApp

Si `WHATSAPP_ENABLED=true`, la primera vez va a mostrar un QR en la terminal
para vincular el dispositivo. Ver el gotcha `neonize-whatsapp-qr` en la wiki
del proyecto si no vincula.

## Notas adicionales

- Termux trae Python 3.12/3.13 por defecto vía `pkg install python`, mientras
  que el `Dockerfile` de Render pinnea Python 3.11. No es un problema — FastAPI
  y Pydantic 2.x no requieren una versión exacta — es solo una diferencia
  conocida entre ambos entornos.
- Este `start.sh` es específico de Termux. No reemplaza al `Dockerfile` ni al
  `Procfile`, que siguen existiendo por si se vuelve a usar Render como
  fallback.
