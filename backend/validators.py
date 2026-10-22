"""Validadores chicos y reutilizables para los datos de perfil, ficha médica y vacunas.

Cada función recibe el valor crudo del JSON y devuelve el valor limpio (o None si quedó vacío).
Si el dato no es válido lanzan ValidationError con un mensaje listo para mostrarle al usuario.
"""
import re
from datetime import date, datetime


class ValidationError(Exception):
    pass


def _empty(value):
    return value is None or (isinstance(value, str) and not value.strip())


def text(label, max_len, required=False):
    def check(value):
        if _empty(value):
            if required:
                raise ValidationError(f"{label} es obligatorio.")
            return None
        if not isinstance(value, str):
            raise ValidationError(f"{label} no es válido.")
        value = " ".join(value.split()) if "\n" not in value else value.strip()
        if len(value) > max_len:
            raise ValidationError(f"{label} no puede superar los {max_len} caracteres.")
        return value
    return check


def phone(label, required=False):
    def check(value):
        value = text(label, 25, required)(value)
        if value is None:
            return None
        digits = re.sub(r"\D", "", value)
        if not re.fullmatch(r"[0-9+\-()\s]+", value) or not (6 <= len(digits) <= 15):
            raise ValidationError(f"{label} no es un teléfono válido.")
        return value
    return check


def postal_code(label):
    def check(value):
        value = text(label, 10)(value)
        if value is not None and not re.fullmatch(r"[A-Za-z0-9 ]{3,10}", value):
            raise ValidationError(f"{label} no es válido.")
        return value
    return check


def choice(label, options, required=False):
    def check(value):
        if _empty(value):
            if required:
                raise ValidationError(f"{label} es obligatorio.")
            return None
        if value not in options:
            raise ValidationError(f"{label} no es una opción válida.")
        return value
    return check


def day(label, allow_future=False, min_year=1900, required=False):
    """Fecha en formato AAAA-MM-DD."""
    def check(value):
        if _empty(value):
            if required:
                raise ValidationError(f"{label} es obligatoria.")
            return None
        try:
            parsed = datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
        except ValueError:
            raise ValidationError(f"{label} no es una fecha válida.")
        if parsed.year < min_year:
            raise ValidationError(f"{label} no es una fecha válida.")
        if not allow_future and parsed > date.today():
            raise ValidationError(f"{label} no puede ser una fecha futura.")
        return parsed
    return check


def number(label, minimum, maximum, integer=False):
    def check(value):
        if _empty(value):
            return None
        try:
            parsed = float(str(value).replace(",", "."))
        except ValueError:
            raise ValidationError(f"{label} debe ser un número.")
        if not (minimum <= parsed <= maximum):
            raise ValidationError(f"{label} debe estar entre {minimum} y {maximum}.")
        return int(round(parsed)) if integer else round(parsed, 1)
    return check


def boolean(label):
    def check(value):
        if value is None or value == "":
            return None
        if isinstance(value, bool):
            return value
        raise ValidationError(f"{label} no es válido.")
    return check


def string_list(label, max_items=20, max_len=60):
    def check(value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValidationError(f"{label} no es válido.")
        clean = []
        for item in value:
            if not isinstance(item, str) or not item.strip():
                continue
            item = " ".join(item.split())
            if len(item) > max_len:
                raise ValidationError(f"Un elemento de {label} supera los {max_len} caracteres.")
            if item not in clean:
                clean.append(item)
        if len(clean) > max_items:
            raise ValidationError(f"{label} admite hasta {max_items} elementos.")
        return clean
    return check


def parse_fields(data, spec):
    """Limpia SOLO las claves que vinieron en `data` (así un PUT parcial no borra lo demás)."""
    cleaned = {}
    for key, check in spec.items():
        if key in data:
            cleaned[key] = check(data[key])
    return cleaned


def age_from(birth_date):
    if not birth_date:
        return None
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def iso(value):
    return value.isoformat() if value else None
