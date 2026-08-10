def serialize_doc(data: dict) -> dict:
    """Normaliza fechas de Firestore (DatetimeWithNanoseconds → ISO string)."""
    for key, value in data.items():
        if hasattr(value, "isoformat"):
            data[key] = value.isoformat()
    return data
