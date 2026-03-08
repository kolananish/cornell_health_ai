# VocalHealth AI — Pitch Deck & Business Plan

---

## The Problem

**1 in 5 adults** has a mental health condition. Most go undiagnosed.

Primary care physicians conduct **~80% of mental health diagnoses** in the US —
yet the average appointment is 15 minutes. PHQ-9 questionnaires are administered
to only **3.7% of eligible patients** during routine visits.

The gap is not willingness — it's time, workflow, and attention bandwidth.

> "By the time a patient is verbally asked about depression, the visit is over."
> — Primary care physician survey, JAMA 2022

---

## The Insight

**Depression changes how people sound — not just what they say.**

Acoustic biomarkers of depression are well-established in clinical literature:

| Biomarker | Signal |
|---|---|
| Speaking rate | Psychomotor retardation slows speech |
| Pitch range (F0) | Flat affect narrows pitch variation |
| Pause duration | Cognitive slowing increases pause length |
| Loudness variability | Reduced emotional expression flattens amplitude |
| Voice shimmer | Vocal tension elevates amplitude instability |
| Spectral tilt (MFCC-1) | Articulatory effort shifts spectral balance |

These signals are **passive, objective, and continuous** — no questionnaire required.

---

## The Product

**VocalHealth AI** is an ambient screening layer for telehealth and primary care.

A patient records a **90-second voice clip** during onboarding or at the start of
an appointment. Our AI extracts 55 acoustic biomarkers and outputs a calibrated
risk score to the clinician — flagging patients who may benefit from PHQ-9
evaluation before the conversation even begins.

### Product Flow

```
Patient speaks 90 seconds  →  AI extracts biomarkers  →  Clinician sees risk flag
  (Rainbow passage                (55 acoustic features,         (probability score,
   + mood description)             67 total with metadata)        PDF clinical report)
```

### What the Clinician Receives

- **Risk score**: P(PHQ-9 ≥ 10), calibrated [0–100%]
- **Flag**: Elevated / Low risk with configurable threshold
- **Key biomarkers**: top vocal signals driving the score (explainable)
- **PDF report**: downloadable, EHR-ready clinical summary
- **Recommendation**: actionable clinical next step

---

## Technology

### Model Architecture

**Huber + TabPFN Ordinal Ensemble with Isotonic Calibration**

- Two base regressors trained on continuous PHQ-9 total (0–27) — not a binary label
- Ordinal target preserves near-threshold gradient (PHQ=8 vs PHQ=2 differ)
- Scores min-max normalised, averaged, then calibrated via OOF isotonic regression
- Output: valid probability in [0, 1] with monotone rank preservation

### Performance (5-fold OOF, N=754, Bridge2AI-Voice)

| Metric | Value |
|---|---|
| AUC (calibrated) | **0.744** |
| AUC (raw ensemble) | **0.761** |
| vs questionnaire-only baseline | +0.010 |
| Target | PHQ-9 ≥ 10 (moderate depression) |
| Threshold (balanced) | 0.116 |
| Threshold (≥80% sensitivity) | 0.094 |

### Dataset

Bridge2AI-Voice Adult Dataset (PhysioNet v3.0.0)
- 754 participants with paired voice recordings + PHQ-9 scores
- 133 positive cases (17.6% prevalence, PHQ-9 ≥ 10)
- 30+ voice tasks; model uses Rainbow Passage + Free Speech (best signal)

### Infrastructure

- **Python / scikit-learn** — training pipeline
- **FastAPI** — REST API, OpenAPI docs
- **Streamlit** — clinician-facing UI
- **joblib** — model serialization
- Deployable on any cloud (AWS, GCP, Azure) or on-premise

---

## Market Opportunity

### Total Addressable Market

| Segment | Size |
|---|---|
| US primary care visits per year | 860M |
| Telehealth mental health visits | 68M |
| Patients screened for depression | ~32M (current) |
| Patients who should be screened | ~172M (gap) |

### Revenue Model

**B2B SaaS — API-first**

| Tier | Price | Target |
|---|---|---|
| Per-screening | $0.25–0.50 | Telehealth platforms integrating via API |
| Monthly seat license | $150–400/mo | Individual clinics, group practices |
| Enterprise | Custom | Health systems, EHR vendors |

**Year 1 target**: 10 telehealth platform partners → 500K screenings/mo → **$1.5M ARR**
**Year 3 target**: 50 platforms, 5M screenings/mo → **$15M ARR**

### Comparable exits

- Limbic (mental health AI triage) — £9M Series A, NHS partnership
- Ellipsis Health (voice depression screening) — acquired by Optum (UnitedHealth) 2023
- Spring Health (mental health navigation) — $3.3B valuation

---

## Competitive Landscape

| Company | Approach | Limitation |
|---|---|---|
| **VocalHealth AI** | Voice biomarkers, passive, 90s | **Early stage** |
| Ellipsis Health (Optum) | Voice biomarkers | Enterprise-only, closed API |
| Limbic | Conversational AI chatbot | Requires conversation, not passive |
| Spring Health | Navigation + therapist matching | Not a screener; needs diagnosis |
| PHQ-9 paper form | Gold standard | Requires patient effort, low completion |

**Our edge**: passive, 90 seconds, explainable biomarkers, API-first, open architecture.

---

## Clinical Validation Path

### Current (Hackathon Prototype)
- Validated on Bridge2AI-Voice v3.0.0, N=754, AUC=0.744
- IRB: covered under Bridge2AI dataset terms (PhysioNet)

### Next 6 Months — Prospective Pilot
- Partner with 2–3 telehealth platforms (Teladoc, MDLive, or federally qualified health centers)
- Prospective cohort: N=500, paired voice + PHQ-9 administered same day
- IRB approval for prospective data collection

### 12–18 Months — FDA Breakthrough Device Designation
- Category: Software as a Medical Device (SaMD), Class II
- Predicate: existing digital mental health screening tools
- Target: 510(k) clearance for "clinical decision support" (not diagnosis)

### 24 Months — Clinical Publication
- Powered prospective study: N=1,500, multi-site, diverse demographics
- Primary endpoint: AUC ≥ 0.80 vs PHQ-9 gold standard
- Secondary: sensitivity ≥ 80%, time-to-detection improvement

---

## Go-to-Market

### Phase 1 (0–6 months): API Launch
- Public REST API (FastAPI, hosted)
- Free tier: 100 screenings/month for research
- Target: digital health startups, telehealth platforms via dev outreach

### Phase 2 (6–18 months): Clinical Partnerships
- Integrate with major EHR platforms (Epic, Cerner) via FHIR connector
- White-label UI for telehealth workflows
- Target: group practices, behavioral health organizations

### Phase 3 (18–36 months): Expansion
- GAD-7 (anxiety) screening model
- Multi-condition panel: PTSD, ADHD, bipolar
- Longitudinal monitoring: track patients over repeated visits
- International: NHS (UK), private health systems (AU, DE)

---

## Team Needs

| Role | Why Critical |
|---|---|
| Clinical Research Lead | IRB, physician relationships, validation studies |
| ML Engineer | Model improvement, wav2vec2 fine-tuning, production scaling |
| Full-Stack Engineer | EHR integrations, HIPAA-compliant infrastructure |
| Medical Advisor | Regulatory strategy (FDA 510k path), clinical credibility |
| Head of Sales | Telehealth platform partnerships |

---

## Ask

**Seeking $1.5M Seed Round**

| Use of Funds | Amount |
|---|---|
| Prospective clinical study (N=500) | $400K |
| Engineering (API, EHR integration, HIPAA) | $500K |
| Regulatory (FDA pre-submission, IRB) | $200K |
| Clinical partnerships (BD, pilots) | $200K |
| Operations + runway (18 months) | $200K |

---

## The Vision

Mental health is the largest unmet need in healthcare — and the most stigmatized.
Passive screening removes the barrier. A patient doesn't need to report symptoms;
the voice does it for them.

**We are building the standard of care for passive mental health monitoring** —
starting with voice, expanding to longitudinal multimodal biomarkers.

> Every telehealth appointment should include a mental health screener.
> VocalHealth AI makes this effortless — for the clinician, and invisible for the patient.

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Regulatory: FDA SaMD scrutiny | Position as clinical decision support, not diagnostic device |
| Data: model trained on N=754 | Bridge2AI expansion + prospective study |
| Competition: Ellipsis Health (Optum) | Open API, developer-first, faster iteration |
| Reimbursement: payers don't cover | Sell to platforms as operational tool, not CPT-billed |
| Privacy: HIPAA voice data | On-premise deployment option, no audio storage by default |

---

## Appendix: Technical Details

### Feature Categories (67 total)

```
Prosody (18):     speaking_rate, F0 pitch range, loudness, pause duration, voiced segment rate
Voice Quality (11): HNR, jitter, shimmer, CPP
Spectral (17):    MFCC 1–4, spectral skewness/kurtosis, alpha ratio, Hammarberg index
Formants (9):     F1, F2, F3 frequency + amplitude
Demographics (3): age, sex, education
Psych History (9): depression, GAD, PTSD, insomnia, bipolar, panic, social anxiety, OCD
```

### Ablation Results

| Configuration | AUC |
|---|---|
| Voice only | 0.613 |
| + demographics | 0.611 (-0.002) |
| + psych history flags | 0.692 (+0.079) |
| Ordinal target (vs binary) | +0.025 improvement |
| Huber + TabPFN ensemble | +0.002 vs solo Huber |
| Final production model | **0.744** |

### API

```bash
# Screen a patient
curl -X POST http://api.vocalhealth.ai/api/v1/screen \
  -F "rainbow_audio=@rainbow.wav" \
  -F "speech_audio=@speech.wav" \
  -F 'metadata={"age": 34, "sex": "Female", "conditions": {"depression": true}}'

# Response
{
  "screening": {
    "phq_mod_plus": {
      "probability": 0.38,
      "threshold": 0.116,
      "flag": true,
      "auc": 0.744
    }
  },
  "suggested_action": "Elevated risk — administer PHQ-9...",
  "top_voice_indicators": [...]
}
```
