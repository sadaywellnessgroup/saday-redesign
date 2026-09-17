/* Hindi item text for the assessment runner's per-question EN/HI toggle
 * (route 11, ui-references §B "Assessment runner"). The fixture
 * `PsychometricTool` rows (D-024) are English-only in P1 — there is no
 * Hindi `PsychometricTool` row to source from — so this small, explicitly
 * separate translation layer supplies the toggle without inventing new
 * fixture rows. A Hindi speaker should proofread these (same caveat as
 * messages/hi.json — see app/README.md's i18n section). */

export const PHQ9_HI: Record<string, string> = {
  phq9_1: 'किसी काम में दिलचस्पी या आनंद कम महसूस होना',
  phq9_2: 'उदास, निराश या हताश महसूस करना',
  phq9_3: 'सोने में परेशानी, बार-बार नींद खुलना, या बहुत ज़्यादा सोना',
  phq9_4: 'थकान महसूस करना या ऊर्जा की कमी',
  phq9_5: 'भूख कम लगना या ज़्यादा खाना',
  phq9_6: 'खुद को लेकर बुरा महसूस करना — या यह लगना कि आप असफल हैं',
  phq9_7: 'किसी चीज़ पर ध्यान केंद्रित करने में परेशानी',
  phq9_8: 'इतना धीरे चलना/बोलना कि दूसरों ने ध्यान दिया हो, या बेचैन व अस्थिर रहना',
  phq9_9: 'यह महसूस होना कि मर जाना बेहतर होता, या खुद को नुकसान पहुंचाने के विचार आना',
};

export const GAD7_HI: Record<string, string> = {
  gad7_1: 'घबराहट, बेचैनी या तनाव महसूस करना',
  gad7_2: 'चिंता को रोक न पाना या नियंत्रित न कर पाना',
  gad7_3: 'अलग-अलग बातों को लेकर बहुत ज़्यादा चिंता करना',
  gad7_4: 'आराम करने में परेशानी',
  gad7_5: 'इतना बेचैन रहना कि शांत बैठना मुश्किल हो',
  gad7_6: 'आसानी से झुंझलाहट या चिड़चिड़ापन होना',
  gad7_7: 'ऐसा डर लगना जैसे कुछ बुरा होने वाला है',
};

export const SCALE_OPTIONS_HI: Record<string, string> = {
  'Not at all': 'बिल्कुल नहीं',
  'Several days': 'कुछ दिन',
  'More than half the days': 'आधे से ज़्यादा दिन',
  'Nearly every day': 'लगभग हर दिन',
};

const BY_TOOL_CODE: Record<string, Record<string, string>> = {
  PHQ9: PHQ9_HI,
  GAD7: GAD7_HI,
};

export function hiItemPrompt(toolCode: string, itemId: string, fallback: string): string {
  return BY_TOOL_CODE[toolCode]?.[itemId] ?? fallback;
}

export function hiOptionLabel(label: string): string {
  return SCALE_OPTIONS_HI[label] ?? label;
}
