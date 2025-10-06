export class GradePercentage {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Grade percentage must be between 0 and 100');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}
