# Bridge2AI-Voice Adult Dataset

**Source**: Bridge2AI-Voice Adult Dataset, PhysioNet v3.0.0
**Citation**: Goldberger et al. (2000), PhysioBank, PhysioToolkit, and PhysioNet.
**Access**: https://physionet.org/content/bridge2ai-voice/

---

## Overview

The Bridge2AI-Voice Adult dataset is the largest open-access voice biomarker dataset
paired with validated psychiatric questionnaires. It was collected to enable AI research
on voice as a health biomarker — specifically for conditions that alter speech, including
depression, anxiety, PTSD, and voice disorders.

| Property | Value |
|---|---|
| Total participants | 833 |
| Participants with PHQ-9 scores | 823 |
| Participants used in model training | 754 (inner join: PHQ-9 + voice features) |
| Total voice recordings | 32,249 |
| Acoustic features per recording | 132 (OpenSMILE eGeMAPS-based) |
| Voice tasks per participant | ~30 |

---

## Participant Demographics

| Attribute | Value |
|---|---|
| Age — mean (std) | 59.1 (17.7) years |
| Age — range | 19 – 87 years |
| Female | 59.5% (n=542) |
| Male | 40.5% (n=361) |

### Education Breakdown

| Level | n |
|---|---|
| Bachelor's degree | 246 |
| Graduate / professional degree | 170 |
| Some college | 135 |
| High school diploma | 103 |
| Associate's / technical degree | 84 |
| Doctoral / post-graduate | 79 |
| Post-baccalaureate | 56 |
| Some high school | 21 |
| Other / prefer not to answer | 13 |

---

## Target Variable — PHQ-9 Score

The Patient Health Questionnaire-9 (PHQ-9) is the gold standard self-report screen
for depression in primary care. Scores range 0–27; PHQ-9 ≥ 10 indicates moderate
or worse depression and is the standard clinical referral threshold.

### PHQ-9 Total Score Distribution (N=823)

| Severity | Score Range | n | % |
|---|---|---|---|
| Minimal | 0 – 4 | 512 | 62.2% |
| Mild | 5 – 9 | 196 | 23.8% |
| Moderate | 10 – 14 | 76 | 9.2% |
| Moderately Severe | 15 – 19 | 30 | 3.6% |
| Severe | 20 – 27 | 9 | 1.1% |

**Class imbalance**: 13.8% positive (PHQ-9 ≥ 10) in the model training set of N=754.

> The distribution is heavily skewed toward healthy participants — a realistic reflection
> of primary care prevalence. This is why the model is calibrated and evaluated on AUC
> rather than accuracy.

### Mean PHQ-9 Item Scores

| Item | Mean (0–3) |
|---|---|
| No energy | **0.97** ← most common |
| Trouble sleeping | **0.84** |
| No interest | 0.50 |
| No appetite | 0.46 |
| Feeling depressed | 0.47 |
| Trouble concentrating | 0.39 |
| Feeling bad about self | 0.38 |
| Moving / speaking slowly | 0.33 |
| Thoughts of death | **0.06** ← rarest |

---

## Voice Tasks

The dataset includes **~30 structured voice tasks** per participant covering diverse
speech modalities. Tasks relevant to depression screening:

| Task | n Participants | Modality |
|---|---|---|
| `prolonged-vowel` | 830 | Phonation: sustained /a/ |
| `glides-low-to-high` | 827 | Pitch range / glide |
| `glides-high-to-low` | 823 | Pitch range / glide |
| `maximum-phonation-time-1/2/3` | 761 | Breath support |
| `free-speech-1/2/3` | 758 | Spontaneous speech |
| `rainbow-passage` | 756 | Standardised reading |
| `picture-description` | 756 | Narrative speech |
| `story-recall` | 755 | Memory + speech |
| `caterpillar-passage` | 382 | Alternate reading passage |
| `cape-v-sentences-1/2/3/4/5/6` | 362 | Clinical voice sentences |

### Tasks Used in This Model

**`rainbow-passage`** + **`free-speech-3`** (ablation study selected this combination)

- Rainbow passage: phonetically balanced standardised text; controls for content variation
- Free-speech-3: third trial of free speech; most natural, least task-effect contamination
- Features are extracted per clip and **median-aggregated** across both tasks

---

## Acoustic Features

132 acoustic features are extracted per recording using an OpenSMILE-compatible pipeline.
The model uses 55 features (selected by coverage across tasks).

### Feature Categories

| Category | Count | Examples |
|---|---|---|
| Prosody | 18 | speaking_rate, F0 pitch range, loudness, pause duration |
| Voice quality | 11 | HNR, jitter (local, RAP), shimmer, CPP |
| Spectral / MFCC | 17 | MFCC 1–4, spectral skewness/kurtosis, alpha ratio |
| Formants | 9 | F1, F2, F3 frequency + amplitude |

### Top Features Correlated with PHQ-9 Total (Spearman ρ, N=754)

All correlations significant at p < 0.01.

| Feature | ρ | Direction | Clinical Interpretation |
|---|---|---|---|
| `slopeUV500-1500_sma3nz_amean` | +0.185 | Higher → more depressed | Unvoiced spectral mid-band slope |
| `speaking_rate` | **−0.169** | Slower → more depressed | Psychomotor retardation slows speech |
| `loudness_sma3_percentile20.0` | −0.138 | Softer → more depressed | Reduced energy, lower amplitude floor |
| `loudness_sma3_amean` | −0.132 | Softer → more depressed | Overall vocal effort |
| `VoicedSegmentsPerSec` | −0.131 | Fewer voiced segments | Reduced speech fluency, more hesitation |
| `MeanUnvoicedSegmentLength` | +0.127 | Longer pauses | Cognitive slowing, low motivation |
| `spectralFlux_sma3_amean` | −0.127 | Less spectral change | Monotone, less animated speech |
| `phonation_ratio` | −0.118 | Less time voicing | More silence, reduced output |
| `mfcc1_sma3_amean` | −0.122 | Shifted spectral shape | Altered articulatory effort |
| `F0 pctlrange 0-2` | −0.110 | Narrowed pitch range | Flat affect, emotional blunting |

> Note: individual correlations are modest (max ρ ≈ 0.18). This is expected —
> depression is multi-factorial and voice provides partial signal. The model
> combines 67 features to achieve AUC = 0.744.

### Key Inter-Feature Correlations

| Feature Pair | ρ | Implication |
|---|---|---|
| loudness_amean × spectralFlux | +0.937 | Louder speech = more spectral change (co-linear) |
| slopeUV500-1500 × loudness | −0.694 | Louder speech has different spectral slope |
| VoicedSegmentsPerSec × MeanUnvoicedLength | −0.780 | More voiced = shorter pauses (by definition) |
| speaking_rate × phonation_ratio | +0.616 | Faster speech = more time voicing |
| speaking_rate × VoicedSegmentsPerSec | +0.581 | Faster = more syllable nuclei per second |

---

## Known Limitations

| Limitation | Impact |
|---|---|
| **Age skew** — mean age 59.1 years | May underperform in younger populations |
| **Education skew** — 60%+ college-educated | Less representative of lower-SES populations |
| **Geographic** — US-based, English only | May not generalise to other accents/languages |
| **Class imbalance** — 13.8% positive | Requires calibration; accuracy is misleading metric |
| **Pre-extracted features** — no raw audio | Cannot fine-tune speech foundation models |
| **Cross-sectional** — single visit | No longitudinal tracking or treatment response |

---

## Data Files Used

| File | Rows | Columns | Contents |
|---|---|---|---|
| `features/static_features.tsv` | 32,249 | 135 | Acoustic features per recording |
| `phenotype/questionnaire/phq9.tsv` | 891 | 11 | PHQ-9 item responses (text Likert) |
| `phenotype/demographics/demographics.tsv` | 833 | ~15 | Age, sex, education, race |
| `phenotype/enrollment/eligibility.tsv` | 833 | ~20 | Self-reported conditions |
| `phenotype/questionnaire/gad7_anxiety.tsv` | 889 | 9 | GAD-7 item responses |
