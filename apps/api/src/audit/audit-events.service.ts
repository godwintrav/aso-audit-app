import { Injectable } from "@nestjs/common";
import { Observable, ReplaySubject } from "rxjs";
import type { AuditProgressEvent } from "@aso/schemas";

/**
 * Per-audit progress event bus. Uses a ReplaySubject so a client that connects
 * to the SSE stream slightly late still receives every event from the start of
 * the run, then continues to receive live updates.
 */
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

  /** Marks the stream complete so SSE clients disconnect cleanly. */
  complete(auditId: string): void {
    this.subjects.get(auditId)?.complete();
  }

  stream(auditId: string): Observable<AuditProgressEvent> {
    return this.subjectFor(auditId).asObservable();
  }
}
