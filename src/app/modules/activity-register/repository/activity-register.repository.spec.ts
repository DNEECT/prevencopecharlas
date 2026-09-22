import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ActivityRegisterRepository, evidenceForKind } from './activity-register.repository';

describe('ActivityRegisterRepository', () => {
  let service: ActivityRegisterRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(ActivityRegisterRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

describe('evidenceForKind', () => {
  it('shows a missing historical reference without making it downloadable', () => {
    expect(evidenceForKind([], 'attendance-list', 'legacy/lista.pdf')).toEqual({
      path: null, unavailable: 'legacy/lista.pdf',
    });
  });

  it('uses an unavailable evidence record when no Storage object exists', () => {
    expect(evidenceForKind([
      { kind: 'photographic-record', object_path: null, legacy_reference: 'legacy/photo.jpg',
        original_name: 'photo.jpg', is_available: false },
    ], 'photographic-record', null)).toEqual({
      path: null, unavailable: 'photo.jpg',
    });
  });

  it('prefers a verified Storage object over an unavailable reference', () => {
    expect(evidenceForKind([
      { kind: 'attendance-list', object_path: null, legacy_reference: 'old.pdf',
        original_name: null, is_available: false },
      { kind: 'attendance-list', object_path: 'activity/attendance-list/new.pdf',
        legacy_reference: null, original_name: 'new.pdf', is_available: true },
    ], 'attendance-list', 'old.pdf')).toEqual({
      path: 'activity/attendance-list/new.pdf', unavailable: null,
    });
  });
});
