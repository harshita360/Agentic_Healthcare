# Rail boundaries

Each rail owns its folder under `src/rails` and exports only through its `index.ts` file.

| Rail | Future responsibility |
| --- | --- |
| Gnani | Voice conversations and call status |
| Pine Labs | Payment requests and authorization |
| Delhivery | Delivery requests and tracking |

If a change affects more than one rail, put the shared type in `src/lib/rail-types.ts` rather than importing one rail from another.
