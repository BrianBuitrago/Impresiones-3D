from slowapi import Limiter
from slowapi.util import get_remote_address

# Limitador en memoria por IP. En un despliegue serverless (Vercel) el estado no persiste
# entre invocaciones frías, así que esto es una mitigación de "mejor esfuerzo" contra ráfagas
# de abuso, no una defensa completa contra bots — el complemento robusto es un CAPTCHA
# (reCAPTCHA/Turnstile) en los formularios públicos, que requiere crear una site key propia.
limiter = Limiter(key_func=get_remote_address)
