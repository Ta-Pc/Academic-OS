export class Credits {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Credits must be a non-negative integer');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}
