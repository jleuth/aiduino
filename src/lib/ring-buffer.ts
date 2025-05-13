export class RingBuffer<T> {
  private capacity: number;
  private buffer: T[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.tail = (this.tail + 1) % this.capacity;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.tail;
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[current]);
      current = (current + 1) % this.capacity;
    }
    return result;
  }

  get length(): number {
    return this.count;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }
}
