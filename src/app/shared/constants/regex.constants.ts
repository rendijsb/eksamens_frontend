export class RegexPatterns {
  static readonly NAME_PATTERN = /^[A-Za-zĀāČčĒēĢģĪīĶķĻļŅņŠšŪūŽž]+ [A-Za-zĀāČčĒēĢģĪīĶķĻļŅņŠšŪūŽž]+$/;
  static readonly PHONE_PATTERN = /^\d{8,}$/;
  static readonly PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  static readonly ERROR_MESSAGES = {
    name: 'Vārds un uzvārds jāievada un ar atstarpi',
    phone: 'Tālrunim jābūt vismaz 8 cipariem',
    password: 'Parolei jāsatur vismaz 8 rakstzīmes, lielais burts, mazais burts, cipars un speciālā rakstzīme (@$!%*?&)',
    email: 'Lūdzu, ievadiet derīgu e-pasta adresi (piem., vards@domens.lv)',
    passwordMismatch: 'Paroles nesakrīt'
  } as const;
}
