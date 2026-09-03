import os
import glob
import re
import json
from fastapi import FastAPI, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

EXPOSE_SWAGGER = os.getenv("EXPOSE_SWAGGER", "true").lower() == "true"

app = FastAPI(
    title="Mock API Separa Altoke",
    description="Falso backend que lee dinámicamente de los archivos Markdown. Si cambias los .md, los endpoints y el Swagger se actualizan automáticamente.",
    docs_url="/api" if EXPOSE_SWAGGER else None,
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_markdown_files(directory="."):
    endpoints = []
    md_files = glob.glob(os.path.join(directory, "*.md"))
    for file_path in md_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        parts = content.split("### Endpoint:")
        for part in parts[1:]:
            route_match = re.search(r"\*\*Ruta de ejemplo:\*\*\s+`([^`]+)`", part)
            if not route_match:
                continue
            route = route_match.group(1)
            
            method_match = re.search(r"\*\*Método:\*\*\s+`?([A-Z]+)`?", part)
            method = method_match.group(1) if method_match else "GET"
            
            json_match = re.search(r"```json\s*(.*?)\s*```", part, re.DOTALL)
            response_json = {}
            if json_match:
                try:
                    response_json = json.loads(json_match.group(1))
                except Exception as e:
                    print(f"Error parseando JSON para {route}: {e}")
            
            desc_match = re.search(r"\*\*Lógica:\*\*\s+(.*)", part)
            description = desc_match.group(1).strip() if desc_match else ""
            
            endpoints.append({
                "route": route,
                "method": method,
                "response": response_json,
                "description": description,
                "file": os.path.basename(file_path)
            })
    return endpoints

endpoints = parse_markdown_files(os.path.dirname(__file__))

def get_latest_response(route):
    # Lee los archivos en tiempo real para obtener el JSON más actualizado
    latest_endpoints = parse_markdown_files(os.path.dirname(__file__))
    for ep in latest_endpoints:
        if ep["route"] == route:
            return ep["response"]
    return {"error": "No response found"}

def create_handler(route, method):
    if method in ["POST", "PUT", "PATCH"]:
        async def handler(request: Request, payload: dict = Body(default=None)):
            return get_latest_response(route)
        return handler
    else:
        async def handler(request: Request):
            return get_latest_response(route)
        return handler

for ep in endpoints:
    app.add_api_route(
        path=ep["route"],
        endpoint=create_handler(ep["route"], ep["method"]),
        methods=[ep["method"]],
        summary=f"{ep['method']} {ep['route']}",
        description=ep["description"],
        tags=[ep["file"].replace(".md", "")],
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=4261, reload=True, reload_includes=["*.md"])
