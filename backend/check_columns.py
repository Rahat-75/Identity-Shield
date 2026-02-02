from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'alias_identifiers'")
    columns = [row[0] for row in cursor.fetchall()]
    print(f"Columns in 'alias_identifiers': {columns}")
