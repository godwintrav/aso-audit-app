import { Injectable } from "@nestjs/common";
import { Observable, ReplaySubject } from "rxjs";
import type { AuditProgressEvent } from "@aso/schemas";


@Injectable()
export class AuditEventsService {
  private readonly subjects = new Map<string, ReplaySubject<AuditProgressEvent>>();

  private subjectFor(auditId: string): ReplaySubject<AuditProgressEvent> {
    let subject = this.subjects.get(auditId);
    if (!subject) {
      subject = new ReplaySubject<AuditProgressEvent>(100);
      this.subjects.set(auditId, subject);
    }
    return subject;
  }

  publish(event: AuditProgressEvent): void {
    this.subjectFor(event.auditId).next(event);
  }

  complete(auditId: string): void {
    this.subjects.get(auditId)?.complete();
  }

  stream(auditId: string): Observable<AuditProgressEvent> {
    return this.subjectFor(auditId).asObservable();
  }
}
