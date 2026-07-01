# Only one router currently exists (handlers/start.py), included directly
# in main.py via `dp.include_router(start.router)`. No aggregating router
# is added here to avoid a premature abstraction for a single module — if a
# second router module is added, wire it up through this __init__.py.
