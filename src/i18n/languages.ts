export const allLanguages: { code: string; english: string }[] = [
  ['af','Afrikaans'],['sq','Albanian'],['am','Amharic'],['ar','Arabic'],['hy','Armenian'],['az','Azerbaijani'],
  ['eu','Basque'],['be','Belarusian'],['bn','Bengali'],['bs','Bosnian'],['bg','Bulgarian'],['ca','Catalan'],
  ['ceb','Cebuano'],['ny','Chichewa'],['zh-CN','Chinese (Simplified)'],['zh-TW','Chinese (Traditional)'],
  ['co','Corsican'],['hr','Croatian'],['cs','Czech'],['da','Danish'],['nl','Dutch'],['en','English'],
  ['eo','Esperanto'],['et','Estonian'],['tl','Filipino'],['fi','Finnish'],['fr','French'],['fy','Frisian'],
  ['gl','Galician'],['ka','Georgian'],['de','German'],['el','Greek'],['gu','Gujarati'],['ht','Haitian Creole'],
  ['ha','Hausa'],['haw','Hawaiian'],['iw','Hebrew'],['hi','Hindi'],['hmn','Hmong'],['hu','Hungarian'],
  ['is','Icelandic'],['ig','Igbo'],['id','Indonesian'],['ga','Irish'],['it','Italian'],['ja','Japanese'],
  ['jw','Javanese'],['kn','Kannada'],['kk','Kazakh'],['km','Khmer'],['ko','Korean'],['ku','Kurdish (Kurmanji)'],
  ['ky','Kyrgyz'],['lo','Lao'],['la','Latin'],['lv','Latvian'],['lt','Lithuanian'],['lb','Luxembourgish'],
  ['mk','Macedonian'],['mg','Malagasy'],['ms','Malay'],['ml','Malayalam'],['mt','Maltese'],['mi','Maori'],
  ['mr','Marathi'],['mn','Mongolian'],['my','Myanmar (Burmese)'],['ne','Nepali'],['no','Norwegian'],['ps','Pashto'],
  ['fa','Persian'],['pl','Polish'],['pt','Portuguese'],['pa','Punjabi'],['ro','Romanian'],['ru','Russian'],
  ['sm','Samoan'],['gd','Scottish Gaelic'],['sr','Serbian'],['st','Sesotho'],['sn','Shona'],['sd','Sindhi'],
  ['si','Sinhala'],['sk','Slovak'],['sl','Slovenian'],['so','Somali'],['es','Spanish'],['su','Sundanese'],
  ['sw','Swahili'],['sv','Swedish'],['tg','Tajik'],['ta','Tamil'],['te','Telugu'],['th','Thai'],['tr','Turkish'],
  ['uk','Ukrainian'],['ur','Urdu'],['uz','Uzbek'],['vi','Vietnamese'],['cy','Welsh'],['xh','Xhosa'],
  ['yi','Yiddish'],['yo','Yoruba'],['zu','Zulu'],
].map(([code, english]) => ({ code, english }));

const BCP47: Record<string, string> = { iw: 'he', jw: 'jv', 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', tl: 'fil' };

/** Language name written in its own script; falls back to the input code. */
export function nativeName(code: string): string {
  const tag = BCP47[code] ?? code;
  try {
    // fallback: 'none' makes ICU return undefined for unknown tags instead of "zz (UNKNOWN)".
    const name = new Intl.DisplayNames([tag], { type: 'language', fallback: 'none' }).of(tag);
    return name && name !== tag ? name : code;
  } catch {
    return code;
  }
}
