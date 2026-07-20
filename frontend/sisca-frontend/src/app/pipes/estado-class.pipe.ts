import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoClass',
  standalone: true
})
export class EstadoClassPipe implements PipeTransform {
  transform(estado: string): string {
    const mapa: Record<string, string> = {
      Reportado: 'badge-estado-reportado',
      'En revisión': 'badge-estado-en-revision',
      Aprobado: 'badge-estado-aprobado',
      Rechazado: 'badge-estado-rechazado',
      Devuelto: 'badge-estado-devuelto',
      'Con acciones': 'badge-estado-con-acciones',
      'En validación': 'badge-estado-en-validacion',
      Cerrado: 'badge-estado-cerrado'
    };

    return mapa[estado] || 'badge-estado-reportado';
  }
}
