# Registro de Versiones (Changelog) - SISREQ

## [4.3.5] - 2026-11-18

### Auditoría, Rendimiento y Limpieza
- **Jurisdicción y Permisos:** Delimitación estricta de `canReceiveAndDerive` a Bandeja Central (`Recibido`), alineación de `canSupervise`, creación/edición habilitada para rol `ADMIN` y control estricto de área en Planificador para Jefaturas.
- **Concurrencia y Rendimiento:** Carga liviana de expedientes sin `logs` en listados (57.2% menos tráfico) con hidratación bajo demanda al abrir detalle, IDs deterministas con inserción idempotente en rutinas, fusión atómica de bitácora en servidor y code-splitting de producción.
- **Gobernanza y Calidad:** Corrección de falsos positivos de IDs legados, validación de integridad de vínculos de ID, preservación de vista activa, chequeo SQL de `scheduled_processes` y limpieza de código residual.

## [4.3.4] - 2026-09-23

### Consolidación Transaccional y Flujo
- **Operación y Transiciones:** Reasignación de analistas en `DERIVACION` y `EJECUCION`, botón explícito "Iniciar Ejecución", saneamiento en retornos, titularidad en cierre de analistas, reapertura Master, edición de área y filtros de Bandeja Central.

## [4.3.3] - 2026-09-23

### Mejoras e Implementaciones
- **Flujo de Ejecución:** Habilitada la reasignación de analistas en fase `EJECUCION`.
- **Botones de Acción:** Agregado botón explícito "INICIAR EJECUCIÓN" en el modal de detalle.
- **Persistencia:** Implementado guardado atómico en base de datos (`await db.saveRequest`) para `updateStatus`, `returnRequest`, `assignAnalyst`, `updateRequestDetails` y `addLog` para eliminar condiciones de carrera.
- **Auditoría:** Mejorada la trazabilidad en cambios de metadatos y reasignación de áreas.
- **Correcciones de Flujo:**
    - Reseteo de jefatura en retornos a central.
    - Validación de titularidad para analistas en cierre.
    - Reapertura "MASTER" para SuperAdmin en expedientes finalizados.
    - Corrección en filtros de área del tablero para Bandeja Central.
    - Edición habilitada para receptores centrales en fase de recepción.

## [4.3.2] - 2026-09-22
- Inicialización del sistema base y flujos operacionales.
