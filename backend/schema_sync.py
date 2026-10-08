"""Apply model changes to existing databases (add missing columns only)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.schema import CreateColumn
from sqlmodel import SQLModel


def sync_missing_columns(engine: Engine) -> None:
    """
    Add columns that exist in SQLModel metadata but not in the database.
    Does not drop/rename columns or change types — use Alembic for that.
    """
    insp = inspect(engine)
    dialect = engine.dialect

    with engine.begin() as conn:
        for table in SQLModel.metadata.sorted_tables:
            if not insp.has_table(table.name):
                continue
            existing = {c["name"] for c in insp.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing:
                    continue
                col_ddl = str(CreateColumn(column).compile(dialect=dialect))
                if dialect.name == "postgresql":
                    sql = f'ALTER TABLE "{table.name}" ADD COLUMN IF NOT EXISTS {col_ddl}'
                else:
                    sql = f'ALTER TABLE "{table.name}" ADD COLUMN {col_ddl}'
                try:
                    conn.execute(text(sql))
                    print(f"Schema sync: added {table.name}.{column.name}")
                except (OperationalError, ProgrammingError) as e:
                    if _is_duplicate_column_error(e):
                        continue
                    raise


def _is_duplicate_column_error(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return "duplicate column" in msg or "already exists" in msg
