import os
from sqlalchemy import text
from app.core.database import engine

async def reset_database():
    """Drops the public schema, recreates it, and runs 01_schema.sql"""
    print("Resetting database schema...")
    
    schema_path = "/database/01_schema.sql"
    if not os.path.exists(schema_path):

        schema_path = os.path.join(os.path.dirname(__file__), "../../database/01_schema.sql")
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema file not found at {schema_path}")
        
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
        
    async with engine.begin() as conn:

        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        


        raw_conn = await conn.get_raw_connection()
        await raw_conn.driver_connection.execute(schema_sql)
        
    print("Database reset successfully.")
