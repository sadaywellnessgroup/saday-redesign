/* ICD-11 chapter 06 (Mental, behavioural or neurodevelopmental disorders)
 * pick-list for the proforma's Diagnosis section (D-016). A seed of the
 * ~45 codes that cover almost every outpatient presentation — not the full
 * classification. Saday to confirm the list before launch; a fuller
 * catalogue would be loaded from a reference table in P2 rather than
 * hard-coded here. */

export interface Icd11Code {
  code: string;
  title: string;
  group: string;
}

export const ICD11_CODES: Icd11Code[] = [
  { code: '6A00', title: 'Disorders of intellectual development', group: 'Neurodevelopmental' },
  { code: '6A01', title: 'Developmental speech or language disorders', group: 'Neurodevelopmental' },
  { code: '6A02', title: 'Autism spectrum disorder', group: 'Neurodevelopmental' },
  { code: '6A03', title: 'Developmental learning disorder', group: 'Neurodevelopmental' },
  { code: '6A05', title: 'Attention deficit hyperactivity disorder', group: 'Neurodevelopmental' },
  { code: '6A06', title: 'Stereotyped movement disorder', group: 'Neurodevelopmental' },

  { code: '6A20', title: 'Schizophrenia', group: 'Psychotic' },
  { code: '6A21', title: 'Schizoaffective disorder', group: 'Psychotic' },
  { code: '6A22', title: 'Schizotypal disorder', group: 'Psychotic' },
  { code: '6A23', title: 'Acute and transient psychotic disorder', group: 'Psychotic' },
  { code: '6A24', title: 'Delusional disorder', group: 'Psychotic' },

  { code: '6A60', title: 'Bipolar type I disorder', group: 'Mood' },
  { code: '6A61', title: 'Bipolar type II disorder', group: 'Mood' },
  { code: '6A62', title: 'Cyclothymic disorder', group: 'Mood' },
  { code: '6A70', title: 'Single episode depressive disorder', group: 'Mood' },
  { code: '6A71', title: 'Recurrent depressive disorder', group: 'Mood' },
  { code: '6A72', title: 'Dysthymic disorder', group: 'Mood' },
  { code: '6A73', title: 'Mixed depressive and anxiety disorder', group: 'Mood' },

  { code: '6B00', title: 'Generalised anxiety disorder', group: 'Anxiety & fear-related' },
  { code: '6B01', title: 'Panic disorder', group: 'Anxiety & fear-related' },
  { code: '6B02', title: 'Agoraphobia', group: 'Anxiety & fear-related' },
  { code: '6B03', title: 'Specific phobia', group: 'Anxiety & fear-related' },
  { code: '6B04', title: 'Social anxiety disorder', group: 'Anxiety & fear-related' },
  { code: '6B05', title: 'Separation anxiety disorder', group: 'Anxiety & fear-related' },
  { code: '6B06', title: 'Selective mutism', group: 'Anxiety & fear-related' },

  { code: '6B20', title: 'Obsessive-compulsive disorder', group: 'Obsessive-compulsive' },
  { code: '6B21', title: 'Body dysmorphic disorder', group: 'Obsessive-compulsive' },
  { code: '6B24', title: 'Hoarding disorder', group: 'Obsessive-compulsive' },
  { code: '6B25', title: 'Body-focused repetitive behaviour disorders', group: 'Obsessive-compulsive' },

  { code: '6B40', title: 'Post-traumatic stress disorder', group: 'Stress-associated' },
  { code: '6B41', title: 'Complex post-traumatic stress disorder', group: 'Stress-associated' },
  { code: '6B42', title: 'Prolonged grief disorder', group: 'Stress-associated' },
  { code: '6B43', title: 'Adjustment disorder', group: 'Stress-associated' },

  { code: '6B60', title: 'Dissociative neurological symptom disorder', group: 'Dissociative' },
  { code: '6B64', title: 'Dissociative identity disorder', group: 'Dissociative' },

  { code: '6B80', title: 'Anorexia nervosa', group: 'Feeding & eating' },
  { code: '6B81', title: 'Bulimia nervosa', group: 'Feeding & eating' },
  { code: '6B82', title: 'Binge eating disorder', group: 'Feeding & eating' },

  { code: '6C20', title: 'Bodily distress disorder', group: 'Bodily distress' },

  { code: '6C40', title: 'Disorders due to use of alcohol', group: 'Substance use' },
  { code: '6C41', title: 'Disorders due to use of cannabis', group: 'Substance use' },
  { code: '6C43', title: 'Disorders due to use of opioids', group: 'Substance use' },
  { code: '6C44', title: 'Disorders due to use of sedatives, hypnotics or anxiolytics', group: 'Substance use' },
  { code: '6C46', title: 'Disorders due to use of stimulants including amphetamines', group: 'Substance use' },
  { code: '6C4A', title: 'Disorders due to use of nicotine', group: 'Substance use' },
  { code: '6C50', title: 'Gambling disorder', group: 'Impulse control & behaviour' },
  { code: '6C51', title: 'Gaming disorder', group: 'Impulse control & behaviour' },

  { code: '6D10', title: 'Personality disorder', group: 'Personality' },
  { code: '6D70', title: 'Delirium', group: 'Neurocognitive' },
  { code: '6D71', title: 'Mild neurocognitive disorder', group: 'Neurocognitive' },
  { code: '6D80', title: 'Dementia due to Alzheimer disease', group: 'Neurocognitive' },

  { code: '6E20', title: 'Mental or behavioural disorders associated with pregnancy or the puerperium', group: 'Other' },
  { code: '6E40', title: 'Psychological or behavioural factors affecting disorders classified elsewhere', group: 'Other' },
];

export function icd11Title(code: string): string {
  return ICD11_CODES.find((c) => c.code === code)?.title ?? code;
}

export function searchIcd11(query: string): Icd11Code[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICD11_CODES;
  return ICD11_CODES.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
}
