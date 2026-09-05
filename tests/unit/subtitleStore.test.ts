import { describe, it, expect } from 'vitest';
import { SubtitleDataStore } from '../../src/shared/subtitles/subtitleStore.js';
import { SubtitleEvent, WordTiming } from '../../src/shared/types/models.js';

describe('Subtitle Event Model and In-Memory Data Store', () => {
  it('performs sub-millisecond binary search lookups on 2,500+ subtitle events', () => {
    // Generate synthetic 2-hour movie dataset (2,500 events)
    const syntheticEvents: SubtitleEvent[] = [];
    let currentTime = 0;

    for (let i = 0; i < 2500; i++) {
      const duration = 2.0;
      const start = currentTime;
      const end = Number((start + duration).toFixed(3));
      syntheticEvents.push({
        id: `movie-sub-${i + 1}`,
        index: i + 1,
        startTime: start,
        endTime: end,
        text: `Subtitle line ${i + 1} of the synthetic feature film.`,
        words: [
          { id: `w-${i}-1`, word: 'Subtitle', startTime: start, endTime: start + 0.5, confidence: 0.9 },
          { id: `w-${i}-2`, word: 'line', startTime: start + 0.5, endTime: start + 1.0, confidence: 0.9 },
        ],
      });
      currentTime = Number((end + 0.1).toFixed(3)); // 100ms gap
    }

    const store = new SubtitleDataStore(syntheticEvents);
    expect(store.count).toBe(2500);

    // Verify correctness of lookups
    for (let i = 0; i < 20; i++) {
      const sampleTime = (i * 100.0) % currentTime;
      const event = store.getActiveEvent(sampleTime);
      if (event) {
        expect(sampleTime).toBeGreaterThanOrEqual(event.startTime);
        expect(sampleTime).toBeLessThanOrEqual(event.endTime);
      }
    }

    // Benchmark 1,000 lookups (pure execution time)
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      const sampleTime = (i * 5.0) % currentTime;
      store.getActiveEvent(sampleTime);
    }
    const t1 = performance.now();
    const timePerLookupMs = (t1 - t0) / 1000;

    // Requirement: sub-millisecond lookup (< 0.1ms per query)
    expect(timePerLookupMs).toBeLessThan(0.1);
  });

  it('proportionally scales child word timestamps upon event retiming', () => {
    const initialWords: WordTiming[] = [
      { id: 'w-1', word: 'Hello', startTime: 1.0, endTime: 1.5, confidence: 0.9 },
      { id: 'w-2', word: 'World', startTime: 1.5, endTime: 2.0, confidence: 0.9 },
    ];
    const initialEvent: SubtitleEvent = {
      id: 'sub-1',
      index: 1,
      startTime: 1.0,
      endTime: 2.0,
      text: 'Hello World',
      words: initialWords,
    };

    const store = new SubtitleDataStore([initialEvent]);

    // Retime event from [1.0, 2.0] (1.0s dur) to [2.0, 4.0] (2.0s dur -> 2x scaling)
    store.adjustEventTiming('sub-1', 2.0, 4.0);

    const updated = store.getEventById('sub-1');
    expect(updated).toBeDefined();
    expect(updated?.startTime).toBe(2.0);
    expect(updated?.endTime).toBe(4.0);

    const words = updated!.words;
    expect(words.length).toBe(2);
    // Word 1 was 0.0-0.5 relative -> now 2.0 to 3.0
    expect(words[0].startTime).toBeCloseTo(2.0, 2);
    expect(words[0].endTime).toBeCloseTo(3.0, 2);
    // Word 2 was 0.5-1.0 relative -> now 3.0 to 4.0
    expect(words[1].startTime).toBeCloseTo(3.0, 2);
    expect(words[1].endTime).toBeCloseTo(4.0, 2);
  });

  it('splits a subtitle event cleanly into two non-overlapping events', () => {
    const words: WordTiming[] = [
      { id: 'w-1', word: 'Part', startTime: 0.0, endTime: 0.5, confidence: 0.9 },
      { id: 'w-2', word: 'one', startTime: 0.5, endTime: 1.0, confidence: 0.9 },
      { id: 'w-3', word: 'part', startTime: 1.2, endTime: 1.7, confidence: 0.9 },
      { id: 'w-4', word: 'two', startTime: 1.7, endTime: 2.2, confidence: 0.9 },
    ];
    const event: SubtitleEvent = {
      id: 'sub-1',
      index: 1,
      startTime: 0.0,
      endTime: 2.2,
      text: 'Part one part two',
      words,
    };

    const store = new SubtitleDataStore([event]);
    // Split after word index 2 (after 'one')
    const success = store.splitEvent('sub-1', 2);
    expect(success).toBe(true);
    expect(store.count).toBe(2);

    const events = store.getEvents();
    expect(events[0].text).toBe('Part one');
    expect(events[0].startTime).toBe(0.0);
    expect(events[0].endTime).toBe(1.0);

    expect(events[1].text).toBe('part two');
    expect(events[1].startTime).toBe(1.2);
    expect(events[1].endTime).toBe(2.2);

    // Sequential indices
    expect(events[0].index).toBe(1);
    expect(events[1].index).toBe(2);
  });

  it('merges two adjacent subtitle events into one cohesive event', () => {
    const event1: SubtitleEvent = {
      id: 'sub-1',
      index: 1,
      startTime: 0.0,
      endTime: 1.5,
      text: 'First half',
      words: [
        { id: 'w-1', word: 'First', startTime: 0.0, endTime: 0.7, confidence: 0.9 },
        { id: 'w-2', word: 'half', startTime: 0.8, endTime: 1.5, confidence: 0.9 },
      ],
    };
    const event2: SubtitleEvent = {
      id: 'sub-2',
      index: 2,
      startTime: 1.6,
      endTime: 3.0,
      text: 'second half',
      words: [
        { id: 'w-3', word: 'second', startTime: 1.6, endTime: 2.2, confidence: 0.9 },
        { id: 'w-4', word: 'half', startTime: 2.3, endTime: 3.0, confidence: 0.9 },
      ],
    };

    const store = new SubtitleDataStore([event1, event2]);
    const success = store.mergeEvents('sub-1', 'sub-2');
    expect(success).toBe(true);
    expect(store.count).toBe(1);

    const merged = store.getEvents()[0];
    expect(merged.text).toBe('First half second half');
    expect(merged.startTime).toBe(0.0);
    expect(merged.endTime).toBe(3.0);
    expect(merged.words.length).toBe(4);
  });

  it('notifies reactive subscribers upon modifications', () => {
    const store = new SubtitleDataStore();
    let notificationCount = 0;

    const unsubscribe = store.subscribe(() => {
      notificationCount++;
    });

    store.setEvents([
      { id: 's1', index: 1, startTime: 0, endTime: 1, text: 'Test', words: [] },
    ]);
    expect(notificationCount).toBe(1);

    store.updateEventText('s1', 'Updated text');
    expect(notificationCount).toBe(2);

    unsubscribe();
    store.deleteEvent('s1');
    // Notification count should remain 2 after unsubscription
    expect(notificationCount).toBe(2);
  });
});
