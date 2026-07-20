# Yggdrasil WebView (Android)

App Android mínima que envuelve la webapp de Yggdrasil (deployada en Vercel) en un WebView fullscreen. No es una app nativa "de verdad" — es un wrapper para poder instalarla como app en el celu.

## Requisitos

- JDK 17-21 (Gradle 8.7 no soporta JDK 22+; en esta máquina el JDK global es la 25, así que el build usa el JBR embebido de Android Studio — ver nota abajo)
- Android SDK instalado (variable `ANDROID_HOME` seteada, o un `local.properties` con `sdk.dir=...`)
- Gradle wrapper (generado en la fase 05: `gradlew.bat`/`gradlew` + `gradle/wrapper/`, apuntando a Gradle 8.7)

### Nota sobre el JDK (ajuste de la fase 05)

El JDK global de esta máquina es la versión 25, que Gradle 8.7 no soporta (máximo JDK 21). Se resolvió apuntando `JAVA_HOME` al JBR (JetBrains Runtime, JDK 21.0.8) que trae embebido Android Studio, sin instalar nada nuevo:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "C:\Program Files\Android\Android Studio\jbr\bin;$env:Path"
```

Si no tenés Android Studio instalado, usá cualquier JDK 17-21 (Temurin, Corretto, etc.) y apuntá `JAVA_HOME` ahí.

## Cómo buildear

Desde `android-webview/`, con el `JAVA_HOME` de la nota de arriba:

```
gradlew.bat assembleDebug
```

El APK queda en `app/build/outputs/apk/debug/`.

## Cómo instalar

Con el celu conectado por USB (debug habilitado) o un emulador corriendo:

```
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Dónde cambiar la URL

La URL de la webapp está hardcodeada en la constante `APP_URL`, en:

```
app/src/main/java/com/nahuel/yggdrasil/MainActivity.kt
```

Si la webapp se muda de dominio, cambiar ahí y volver a buildear.

## Nota sobre release

Este proyecto por ahora solo sirve para build **debug** (sin firma). Para armar un release firmado (para publicar o distribuir fuera de debug) hace falta generar un keystore y configurar `signingConfigs` en `app/build.gradle.kts` — ver la [documentación oficial de Android sobre firma de apps](https://developer.android.com/studio/publish/app-signing).
