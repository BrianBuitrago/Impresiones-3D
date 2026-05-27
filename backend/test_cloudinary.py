import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET"),
    secure=True
)

print(f"🔍 Conectando a Cloudinary (Cloud: {os.getenv('CLOUD_NAME')})...")

try:
    result = cloudinary.uploader.upload(
        "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
        public_id="prueba_conexion_backend"
    )
    print("✅ ¡ÉXITO! Imagen subida correctamente.")
    print(f"🔗 URL: {result['secure_url']}")
except Exception as e:
    print(f"❌ ERROR: {e}")