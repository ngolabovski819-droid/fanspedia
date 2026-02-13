import py_compile, traceback, sys
path = r"c:\\Users\\nickg\\fanspedia\\scripts\\v2_id_scanner.py"
try:
    py_compile.compile(path, doraise=True)
    print("OK")
except Exception:
    traceback.print_exc()
    sys.exit(1)
