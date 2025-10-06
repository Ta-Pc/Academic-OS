export class ModuleCode {
  private readonly _value: string;

  constructor(value: string) {
    // Adjusted regex to allow optional space between letters and numbers
    if (!/^[A-Z]{2,4}\s?\d{3,4}$/.test(value)) {
      throw new Error('Module code must be in format like ABCD123 or ABC 123');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
