# Registro de Versiones (Changelog) - SISREQ

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
