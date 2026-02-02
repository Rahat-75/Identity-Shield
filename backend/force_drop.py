from django.db import connection

with connection.cursor() as cursor:
    print("Dropping alias_identifiers table...")
    cursor.execute('DROP TABLE IF EXISTS "alias_identifiers" CASCADE;')
    print("Dropped.")
