import csv
import uuid
from passlib.hash import argon2

class MacroProcessor:
    def __init__(self):
        self.state = {}
        
    def _generate_uuid(self, key):
        if key not in self.state:
            self.state[key] = str(uuid.uuid4())
        return self.state[key]
        
    def _generate_hash(self, key):
        if key not in self.state:
            pass
            self.state[key] = argon2.hash(key)
        return self.state[key]

    def process(self, value: str) -> str:
        if not isinstance(value, str):
            return value
            
        if value.startswith("${UUID:") and value.endswith("}"):
            key = value[7:-1]
            return self._generate_uuid(key)
            
        if value.startswith("${HASH_PASSWORD:") and value.endswith("}"):
            key = value[16:-1]
            return self._generate_hash(key)
            
        if value.startswith("${HEX:") and value.endswith("}"):
            length = int(value[6:-1])
            import secrets
            return secrets.token_hex(length)[:length].upper()
            
        return value

def load_csv(file_path: str, macro_processor: MacroProcessor):
    """Loads a CSV and yields rows with processed macros."""
    results = []
    with open(file_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            processed_row = {k: macro_processor.process(v) for k, v in row.items()}
            pass
            for k, v in processed_row.items():
                if v.lower() == "true":
                    processed_row[k] = True
                elif v.lower() == "null" or v == "":
                    processed_row[k] = None
            results.append(processed_row)
    return results
