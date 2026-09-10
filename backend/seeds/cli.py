import argparse
import asyncio
import os
import json
from sqlalchemy import MetaData, Table
from app.core.database import engine
from seeds.engine import reset_database
from seeds.loaders.csv_loader import MacroProcessor, load_csv
from seeds.generators.random_data import generate_random_data

meta = MetaData()

async def bulk_insert(conn, table_name, data):
    if not data:
        return

    table = await conn.run_sync(lambda sync_conn: Table(table_name, meta, autoload_with=sync_conn))
    

    for row in data:
        for col_name, value in row.items():
            if value is None or value == "":
                row[col_name] = None
                continue
            col = table.columns.get(col_name)
            if col is not None:
                try:
                    py_type = col.type.python_type
                    if py_type is int:
                        row[col_name] = int(value)
                    elif py_type is float:
                        row[col_name] = float(value)
                    elif py_type is bool:
                        if isinstance(value, str):
                            row[col_name] = (value.lower() == 'true')
                    elif py_type is dict or py_type is list:
                        if isinstance(value, str):
                            row[col_name] = json.loads(value)
                    elif py_type is str:
                        row[col_name] = str(value)
                    elif py_type is __import__('datetime').date and not isinstance(value, __import__('datetime').date):
                        row[col_name] = __import__('datetime').date.fromisoformat(value)
                    elif py_type is __import__('datetime').time and not isinstance(value, __import__('datetime').time):
                        row[col_name] = __import__('datetime').time.fromisoformat(value)
                    elif py_type is __import__('datetime').datetime and not isinstance(value, __import__('datetime').datetime):
                        row[col_name] = __import__('datetime').datetime.fromisoformat(value.replace('Z', '+00:00'))
                except Exception:
                    pass

    await conn.execute(table.insert(), data)

async def seed(env: str, reset: bool, fake_count: int):
    if reset:
        await reset_database()
        
    macro = MacroProcessor()
    

    master_dir = os.path.join(os.path.dirname(__file__), "data/master")
    master_files = [
        ("paises.csv", "_pais"),
        ("ubigeo_departamentos.csv", "_ubigeo_departamento"),
        ("ubigeo_provincias.csv", "_ubigeo_provincia"),
        ("ubigeo_distritos.csv", "_ubigeo_distrito"),
        ("deportes.csv", "_deporte"),
        ("servicios.csv", "_servicio"),
        ("planes_suscripcion.csv", "_plan_suscripcion"),
        ("sistema_configuracion.csv", "_sistema_configuracion")
    ]
    
    async with engine.begin() as conn:
        for file_name, table in master_files:
            file_path = os.path.join(master_dir, file_name)
            if os.path.exists(file_path):
                print(f"Loading {file_name} into {table}...")
                data = load_csv(file_path, macro)
                await bulk_insert(conn, table, data)
                

        if env == "dev":
            dev_dir = os.path.join(os.path.dirname(__file__), "data/dev")
            dev_files = [
                ("usuarios.csv", "usuario"),
                ("personas.csv", "persona"),
                ("empresas.csv", "empresa"),
                ("sedes.csv", "sede"),
                ("contratos.csv", "contrato"),
                ("canchas.csv", "cancha")
            ]
            for file_name, table in dev_files:
                file_path = os.path.join(dev_dir, file_name)
                if os.path.exists(file_path):
                    print(f"Loading {file_name} into {table}...")
                    data = load_csv(file_path, macro)
                    await bulk_insert(conn, table, data)
                    

            if fake_count > 0:
                print(f"Generating {fake_count} fake companies/users...")
                bank_path = os.path.join(os.path.dirname(__file__), "data/bank.json")
                with open(bank_path, "r", encoding="utf-8") as f:
                    bank = json.load(f)
                    
                fake_data = generate_random_data(bank, macro, fake_count)
                

                for table, data in fake_data.items():
                    print(f"Inserting {len(data)} generated rows into {table}...")
                    await bulk_insert(conn, table, data)
                    
    print("Seeding complete! Verifying inserted data...")
    
    all_tables = [t[1] for t in master_files]
    if env == "dev":
        all_tables.extend([t[1] for t in dev_files])
        if fake_count > 0:
            all_tables.extend(fake_data.keys())
            
    all_tables = list(dict.fromkeys(all_tables))
    
    from sqlalchemy import text
    engine.sync_engine.echo = False
    
    async with engine.begin() as conn:
        print("\n--- Final Table Counts ---")
        for table in all_tables:
            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"{table}: {count} rows")
        print("--------------------------\n")
def main():
    parser = argparse.ArgumentParser(description="Seed the Separa Altoke Database")
    parser.add_argument("command", choices=["seed", "reset"], help="Command to run")
    parser.add_argument("--env", choices=["prod", "dev"], default="dev", help="Environment profile")
    parser.add_argument("--fake-count", type=int, default=0, help="Number of fake records to generate in dev env")
    
    args = parser.parse_args()
    
    reset = args.command == "reset"
    
    asyncio.run(seed(args.env, reset, args.fake_count))

if __name__ == "__main__":
    main()
