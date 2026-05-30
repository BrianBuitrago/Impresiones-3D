import os
import sys
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# 1. Cargar variables de entorno desde el archivo .env
# Asegúrate de que el archivo .env esté en la misma carpeta que este script
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

# 2. Obtener credenciales
cloud_name = os.getenv("CLOUD_NAME")
api_key = os.getenv("API_KEY")
api_secret = os.getenv("API_SECRET")

# Validar que existan las credenciales
if not all([cloud_name, api_key, api_secret]):
    print("❌ ERROR: Faltan credenciales en el archivo .env")
    print(f"   CLOUD_NAME: {cloud_name}")
    print(f"   API_KEY: {api_key}")
    print(f"   API_SECRET: {'Presente' if api_secret else 'Faltante'}")
    sys.exit(1)

# 3. Configurar Cloudinary
try:
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    print(f"✅ Configuración de Cloudinary exitosa (Cloud: {cloud_name})")
except Exception as e:
    print(f"❌ Error al configurar Cloudinary: {e}")
    sys.exit(1)

# 4. Realizar prueba de subida
print("🚀 Iniciando prueba de subida...")
try:
    # Subimos una imagen de ejemplo desde una URL pública
    result = cloudinary.uploader.upload(
        "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
        public_id="prueba_conexion_backend_v2",
        overwrite=True
    )
    
    print("✅ ¡ÉXITO! La imagen se subió correctamente.")
    print(f"🔗 URL Pública: {result['secure_url']}")
    print(f"🆔 ID Público: {result['public_id']}")
    
except Exception as e:
    print(f"❌ ERROR durante la subida: {e}")
    print("💡 Verifica tu conexión a internet y que las credenciales sean correctas.")
    sys.exit(1)